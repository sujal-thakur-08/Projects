"""
Victus Voice Assistant - Command Handling

Local commands are handled deterministically first (apps, browser, system,
notes, timers, search, etc.). Anything that is not a local command is passed
to ai_assistant.ask(), which is the general-purpose AI gateway.

This separation is intentional:
    voice/text -> commands.py -> local tool OR AI gateway -> response
"""

import datetime
import random
import re
import urllib.parse
import webbrowser
from typing import Optional, Tuple

import ai_assistant
import app_launcher
import assistant_tools
import config
import system_utils


# Search-capable sites: "<query> on <site>" opens a real search on that site.
SITE_SEARCH_URLS = {
    "youtube": "https://www.youtube.com/results?search_query={q}",
    "google": "https://www.google.com/search?q={q}",
    "amazon": "https://www.amazon.com/s?k={q}",
    "spotify": "https://open.spotify.com/search/{q}",
    "apple": "https://music.apple.com/us/search?term={q}",
    "applemusic": "https://music.apple.com/us/search?term={q}",
    "netflix": "https://www.netflix.com/search?q={q}",
    "github": "https://github.com/search?q={q}",
    "wikipedia": "https://en.wikipedia.org/w/index.php?search={q}",
    "reddit": "https://www.reddit.com/search/?q={q}",
    "twitter": "https://twitter.com/search?q={q}",
    "x": "https://x.com/search?q={q}",
    "bing": "https://www.bing.com/search?q={q}",
}

# Shorthand aliases -> actual site domain, for plain "open <site>" (no "on")
SITE_ALIASES = {
    "youtube": "youtube.com",
    "google": "google.com",
    "gmail": "mail.google.com",
    "github": "github.com",
    "amazon": "amazon.com",
    "netflix": "netflix.com",
    "wikipedia": "wikipedia.org",
    "reddit": "reddit.com",
    "twitter": "twitter.com",
    "x": "x.com",
    "chatgpt": "chat.openai.com",
    "claude": "claude.ai",
    "spotify": "open.spotify.com",
    "apple": "music.apple.com",
    "applemusic": "music.apple.com",
}

JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "I told my computer I needed a break, and it said no problem, it'll go to sleep too.",
    "Why did the developer go broke? Because he used up all his cache.",
    "There are 10 types of people in the world: those who understand binary, and those who don't.",
    "Why do Java developers wear glasses? Because they don't see sharp.",
]

_ON_PATTERN = re.compile(r"^(.*\S)\s+on\s+([a-zA-Z][a-zA-Z0-9]*)$", re.IGNORECASE)
_pending_confirmation: Optional[Tuple[str, str]] = None


def _ask_confirmation(action: str, prompt: str) -> str:
    global _pending_confirmation
    _pending_confirmation = (action, prompt)
    return prompt


def _resolve_confirmation(text: str) -> Optional[str]:
    global _pending_confirmation
    if _pending_confirmation is None:
        return None

    if text in {"yes", "yeah", "yep", "confirm", "do it", "proceed"}:
        action, _ = _pending_confirmation
        _pending_confirmation = None
        if action == "shutdown":
            return system_utils.shutdown_pc()
        if action == "restart":
            return system_utils.restart_pc()
        if action == "lock":
            return system_utils.lock_pc()
        return system_utils.close_app(action.removeprefix("close:"))

    if text in {"no", "nope", "cancel", "never mind", "nevermind"}:
        _pending_confirmation = None
        return "Understood. Action cancelled."

    return "Please say yes to confirm or no to cancel."


def _search_on_site(query: str, site_key: str) -> str:
    url = SITE_SEARCH_URLS[site_key].format(q=urllib.parse.quote(query))
    webbrowser.open(url)
    return f"Searching for {query} on {site_key.title()}."


def _google_search(query: str) -> str:
    webbrowser.open(f"https://www.google.com/search?q={urllib.parse.quote(query)}")
    return f"Searching Google for {query}."


def _search(payload: str) -> str:
    """Handles explicit 'search'/'find'/'look up' commands. Always searches
    (never tries to launch an app), and understands the 'X on <site>' form."""
    match = _ON_PATTERN.match(payload)
    if match:
        query, site_key = match.group(1).strip(), match.group(2).strip().lower()
        if site_key in SITE_SEARCH_URLS:
            response = _search_on_site(query, site_key)
            if site_key in {"google", "bing"}:
                return response + "\n\n" + ai_assistant.web_search(query)
            return response
    webbrowser.open(f"https://www.google.com/search?q={urllib.parse.quote(payload)}")
    return ai_assistant.web_search(payload)


def _open_target(spoken_target: str) -> str:
    """
    Generic 'open/play/launch/start X' resolver:
      1. 'X on <site>' -> search that site directly (fixes the old bug where
         this used to get mashed into a single fake domain).
      2. Try to match & launch an installed application.
      3. Single word, no app match -> treat as a website.
      4. Multi-word, no app match, no recognized site -> Google search
         instead of guessing a nonsense domain.
    """
    target = spoken_target.strip()
    if not target:
        return "I didn't catch what to open."

    # 1. "<query> on <site>" — the fix for e.g. "shinchan on youtube"
    match = _ON_PATTERN.match(target)
    if match:
        query, site_key = match.group(1).strip(), match.group(2).strip().lower()
        if site_key in SITE_SEARCH_URLS:
            return _search_on_site(query, site_key)

    # 2. Try an installed application
    name, path = app_launcher.find_app(target)
    if path and app_launcher.launch(path):
        return f"Opening {(name or target).title()}."

    # 3. Single word -> treat as a website
    if " " not in target:
        site = SITE_ALIASES.get(target.lower(), target.lower())
        if "." not in site:
            site = site + ".com"
        webbrowser.open(f"https://{site}")
        return f"Opening {site} in your browser."

    # 4. Multi-word, nothing matched -> safe fallback: Google search
    return _google_search(target)


def handle_command(text: str):
    """
    Takes recognized speech (or typed) text, returns a spoken response string.
    Returns an AI response for natural-language requests, or "__STOP__"
    as a special stop signal. Desktop/system commands are handled locally
    before the request reaches the AI gateway.
    """
    t = text.lower().strip()
    if not t:
        return "I didn't hear a command."

    confirmation = _resolve_confirmation(t)
    if confirmation is not None:
        return confirmation

    for provider in ("openai", "chatgpt", "claude", "gemini", "copilot", "local", "auto"):
        if t in {f"use {provider}", f"switch to {provider}"}:
            config.AI_PROVIDER = provider
            return f"AI provider set to {provider}."

    # ---------- time / date ----------
    if any(p in t for p in ["what time is it", "current time", "tell me the time"]):
        return f"It's {datetime.datetime.now().strftime('%I:%M %p')}."

    if any(p in t for p in ["what's the date", "today's date", "what day is it"]):
        return f"Today is {datetime.datetime.now().strftime('%A, %B %d, %Y')}."

    # ---------- search (explicit) ----------
    for prefix in ["search for ", "search ", "find ", "look up "]:
        if t.startswith(prefix):
            return _search(t[len(prefix):].strip())

    if t.startswith(("calculate ", "what is ", "compute ")):
        expression = re.sub(r"^(calculate|what is|compute)\s+", "", text, flags=re.IGNORECASE).strip()
        if expression and re.fullmatch(r"[0-9+\-*/().%\s]+", expression):
            try:
                result = eval(expression, {"__builtins__": {}}, {})
                return f"The answer is {result}."
            except (ArithmeticError, SyntaxError, ValueError):
                pass

    # ---------- play (defaults to YouTube if no site is named) ----------
    if t.startswith("play "):
        payload = t[len("play "):].strip()
        if not _ON_PATTERN.match(payload):
            payload += " on youtube"
        return _open_target(payload)

    # ---------- lyrics / song discovery ----------
    for prefix in ["find this song ", "find the song ", "identify this song ", "lyrics "]:
        if t.startswith(prefix):
            query = text[len(prefix):].strip()
            if query:
                return ai_assistant.lyric_search(query)
            return "Tell me a lyric or song phrase and I will search YouTube and Apple Music."

    # ---------- unified AI workspace controls ----------
    if t in {"clear memory", "forget conversation", "reset conversation"}:
        return ai_assistant.clear_memory()

    if t.startswith("take a note ") or t.startswith("remember that "):
        prefix = "take a note " if t.startswith("take a note ") else "remember that "
        return assistant_tools.add_note(text[len(prefix):].strip())

    if t in {"show my notes", "list my notes", "read my notes"}:
        return assistant_tools.list_notes()

    if t in {"clear my notes", "delete my notes"}:
        return assistant_tools.clear_notes()

    if t.startswith("remind me to "):
        return assistant_tools.add_reminder(text[len("remind me to "):].strip())

    if t in {"show my reminders", "list my reminders"}:
        return assistant_tools.list_reminders()

    timer_match = re.match(r"^(?:set )?(?:a )?timer for (\d+)\s*(seconds?|minutes?|hours?)?(?: to (.+))?$", t)
    if timer_match:
        amount = int(timer_match.group(1))
        unit = timer_match.group(2) or "seconds"
        label = timer_match.group(3) or "Timer complete"
        multiplier = 3600 if unit.startswith("hour") else 60 if unit.startswith("minute") else 1
        return assistant_tools.set_timer(amount * multiplier, label)

    for prefix in ["research ", "research this ", "find sources for ", "summarize "]:
        if t.startswith(prefix):
            query = text[len(prefix):].strip()
            if query:
                webbrowser.open(
                    f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                )
                return ai_assistant.web_search(query)
            return "What should I research?"

    if t in {"list project files", "show project files", "what files are in this project"}:
        files = ai_assistant.repository_context()
        return f"Project files:\n{files}" if files else "No supported project files were found."

    if t.startswith("read project file "):
        path = text[len("read project file "):].strip()
        return ai_assistant.read_project_file(path)

    for prefix in ["review my code ", "understand this project ", "analyze this project "]:
        if t.startswith(prefix):
            request = text[len(prefix):].strip()
            context = ai_assistant.repository_context()
            return ai_assistant.ask(
                f"{request}\n\nRepository file context:\n{context}",
                config.AI_PROVIDER,
            )

    for prefix in ["generate code for ", "write code for ", "help me code "]:
        if t.startswith(prefix):
            request = text[len(prefix):].strip()
            context = ai_assistant.repository_context()
            return ai_assistant.ask(
                f"Create a production-ready implementation for: {request}\n"
                f"Use this repository context and include file paths plus tests:\n{context}",
                config.AI_PROVIDER,
            )

    # ---------- generic open / launch / start ----------
    for prefix in ["open ", "launch ", "start "]:
        if t.startswith(prefix):
            return _open_target(t[len(prefix):].strip())

    # ---------- close an app ----------
    if t.startswith("close "):
        app_name = t[len("close "):].strip()
        if not app_name:
            return "Which app should I close?"
        return _ask_confirmation(
            f"close:{app_name}",
            f"Closing {app_name} may discard unsaved work. Should I proceed?",
        )

    # ---------- system: volume ----------
    if any(p in t for p in ["volume up", "increase volume", "louder"]):
        return system_utils.volume_up()
    if any(p in t for p in ["volume down", "decrease volume", "lower volume", "quieter"]):
        return system_utils.volume_down()
    if any(p in t for p in ["mute", "unmute"]):
        return system_utils.mute()

    # ---------- system: screenshot ----------
    if any(p in t for p in ["take a screenshot", "screenshot", "capture my screen"]):
        return system_utils.take_screenshot()

    # ---------- system: lock / power ----------
    if any(p in t for p in ["lock my pc", "lock my computer", "lock the pc", "lock screen"]):
        return _ask_confirmation("lock", "This will lock your computer. Proceed?")

    if "cancel shutdown" in t or "cancel restart" in t:
        return system_utils.cancel_shutdown()

    if any(p in t for p in ["shutdown my pc", "shut down my pc", "shutdown the computer", "shut down the computer"]):
        return _ask_confirmation("shutdown", "This will shut down your computer in 30 seconds. Proceed?")

    if any(p in t for p in ["restart my pc", "restart the computer", "reboot my pc"]):
        return _ask_confirmation("restart", "This will restart your computer in 30 seconds. Proceed?")

    # ---------- fun ----------
    if any(p in t for p in ["tell me a joke", "make me laugh", "say a joke"]):
        return random.choice(JOKES)

    # ---------- conversation / identity ----------
    # Keep only operational commands local. Natural conversation is delegated
    # to the real AI gateway so Victus can answer freely instead of relying
    # on hard-coded phrases.
    if any(p in t for p in ["stop listening", "go to sleep"]):
        return "__STOP__"

    if t in {"who are you", "what's your name", "what is your name"}:
        return ai_assistant.ask(
            "Introduce yourself as Victus. Briefly explain what you can do "
            "on this computer and as a general-purpose AI assistant.",
            config.AI_PROVIDER,
        )

    if t in {"status report", "system status", "are you online"}:
        return ai_assistant.ask(
            "Give me a concise status-style response. Explain that you are "
            "Victus and distinguish your AI capabilities from local desktop "
            "controls. Do not claim a capability is online unless it is "
            "actually available.",
            config.AI_PROVIDER,
        )

    # ---------- final AI gateway ----------
    # Anything that is not a recognized local action becomes normal
    # conversation/question-answering. This is the key path that allows
    # Victus to behave like a general-purpose AI.
    return ai_assistant.ask(text, config.AI_PROVIDER)
