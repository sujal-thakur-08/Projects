"""Unified AI gateway for cloud providers, local tools, memory, and coding context."""

import json
import os
import pathlib
import random
import urllib.parse
import urllib.request
import webbrowser
from html.parser import HTMLParser

import config

_MEMORY_FILE = pathlib.Path("victus_memory.json")
_MAX_HISTORY = 40


def _effective_system_prompt():
    """Build a strong conversational system prompt without requiring a config edit."""
    return """You are Victus, a natural, engaging general-purpose AI assistant.

CONVERSATION:
- Talk naturally, like a smart conversational partner, not a command-line bot.
- React to the user's tone, emotion, humor, excitement, frustration, and sarcasm.
- Answer directly instead of giving menus or asking unnecessary format questions.
- Do not use canned phrases like "That's an interesting question", "I'm with you. About...", or "Would you like a quick answer, detailed explanation, or creative take?" unless truly appropriate.
- Keep casual conversation flowing. You can joke, tease lightly, brainstorm, tell stories, play games, ask fun questions, and role-play fictional scenarios.
- Ask follow-ups only when they genuinely improve the conversation.
- Use conversation history to understand references such as "that", "it", "continue", and "what about him?".
- Match the user's tone and desired depth.
- Be warm and personable without pretending to be human or claiming real-world experiences.

GENERAL ABILITY:
- Act as a general-purpose AI for conversation, learning, coding, debugging, planning, writing, brainstorming, mathematics, research, and creative work.
- For current facts, use available web/search capability instead of guessing.
- Never invent sources, current events, memories, or actions.
- Desktop actions are performed by the surrounding Victus application; never claim one happened unless the application reports success.

BASE CONFIGURATION:
""" + config.AI_SYSTEM_PROMPT

_FUN_QUESTIONS = [
    "If you could instantly master one skill, what would you choose?",
    "What fictional world would you visit for one day?",
    "Would you rather explore space or the deepest ocean?",
    "What is a tiny thing that always makes your day better?",
    "If your life had a soundtrack right now, what song would be playing?",
    "What invention do you wish existed today?",
]

_CONVERSATION_PROMPTS = [
    "Let's play a tiny game: give me three words and I'll turn them into a strange story.",
    "Would you rather explore a haunted library or a city on Mars? Defend your choice.",
    "Tell me one ordinary thing about your day and I'll give it an unexpected twist.",
    "Pick a harmless topic and I'll argue the opposite side for fun.",
]


class _SearchParser(HTMLParser):
    """Extract readable titles and snippets from DuckDuckGo's HTML results."""

    def __init__(self):
        super().__init__()
        self.results = []
        self._title = ""
        self._snippet = ""
        self._in_title = False
        self._in_snippet = False

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "").split()
        if tag == "a" and "result__a" in classes:
            self._in_title = True
            self._title = ""
        if "result__snippet" in classes:
            self._in_snippet = True
            self._snippet = ""

    def handle_endtag(self, tag):
        if self._in_title and tag == "a":
            self._in_title = False
        if self._in_snippet and tag in {"a", "div"}:
            self._in_snippet = False
        if self._title and self._snippet:
            self.results.append((self._title.strip(), self._snippet.strip()))
            self._title = ""
            self._snippet = ""

    def handle_data(self, data):
        if self._in_title:
            self._title += data
        if self._in_snippet:
            self._snippet += data


def web_search(query, limit=3):
    """Return short web-backed answers without requiring an API key."""
    query = " ".join(query.split()).strip()
    if not query:
        return "Tell me what you would like me to search for."
    url = (
        "https://api.duckduckgo.com/?q="
        + urllib.parse.quote_plus(query)
        + "&format=json&no_html=1&skip_disambig=1"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Victus/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
    except (OSError, ValueError):
        return "I couldn't reach the web right now. I opened the search in your browser instead."
    lines = []
    if data.get("AbstractText"):
        lines.append(f"{data.get('Heading', query)}: {data['AbstractText']}")
        if data.get("AbstractURL"):
            lines.append(f"Source: {data['AbstractURL']}")
    for item in data.get("RelatedTopics", [])[:limit]:
        if item.get("Text"):
            lines.append(f"- {item['Text']}")
    if not lines:
        topic = query
        for prefix in ("what is ", "what are ", "who is "):
            if topic.lower().startswith(prefix):
                topic = topic[len(prefix):].strip()
                break
        wiki_url = (
            "https://en.wikipedia.org/api/rest_v1/page/summary/"
            + urllib.parse.quote(topic.replace(" ", "_"))
        )
        try:
            with urllib.request.urlopen(
                urllib.request.Request(wiki_url, headers={"User-Agent": "Victus/1.0"}),
                timeout=10,
            ) as response:
                wiki = json.loads(response.read().decode("utf-8", errors="replace"))
            extract = wiki.get("extract")
            if extract:
                lines.append(f"{wiki.get('title', topic)}: {extract}")
                lines.append(f"Source: {wiki.get('content_urls', {}).get('desktop', {}).get('page', wiki_url)}")
        except (OSError, ValueError):
            pass
    if not lines:
        return f"I couldn't find a readable result for {query}. Try a more specific search."
    return f"Here is what I found for {query}:\n" + "\n".join(lines)


def _request_json(url, payload, headers):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _load_history():
    try:
        return json.loads(_MEMORY_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


def _save_history(history):
    _MEMORY_FILE.write_text(
        json.dumps(history[-_MAX_HISTORY:], ensure_ascii=True, indent=2),
        encoding="utf-8",
    )


def _legacy_openai_compatible(prompt, key_name, url, model):
    key = os.getenv(key_name)
    if not key:
        return None
    data = _request_json(
        url,
        {
            "model": model,
            "messages": [
                {"role": "system", "content": _effective_system_prompt()},
                *[
                    {"role": item["role"], "content": item["content"]}
                    for item in _load_history()
                ],
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        },
        {"Authorization": f"Bearer {key}"},
    )
    return data["choices"][0]["message"]["content"].strip()


def _openai_compatible(prompt, key_name, url, model):
    key = os.getenv(key_name)
    if not key:
        return None
    data = _request_json(
        url,
        {
            "model": model,
            "messages": [
                {"role": "system", "content": _effective_system_prompt()},
                *[
                    {"role": item["role"], "content": item["content"]}
                    for item in _load_history()
                ],
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        },
        {"Authorization": "Bearer " + key},
    )
    return data["choices"][0]["message"]["content"].strip()


def _openai(prompt):
    return _openai_compatible(
        prompt,
        "OPENAI_API_KEY",
        "https://api.openai.com/v1/chat/completions",
        os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    )


def _gemini(prompt):
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        return None
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    data = _request_json(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={urllib.parse.quote(key)}",
        {
            "system_instruction": {"parts": [{"text": _effective_system_prompt()}]},
            "contents": [
                {
                    "role": "model" if item["role"] == "assistant" else "user",
                    "parts": [{"text": item["content"]}],
                }
                for item in _load_history()
            ]
            + [{"role": "user", "parts": [{"text": prompt}]}],
        },
        {},
    )
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _claude(prompt):
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    data = _request_json(
        "https://api.anthropic.com/v1/messages",
        {
            "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest"),
            "max_tokens": 1000,
            "system": _effective_system_prompt(),
            "messages": [
                {"role": item["role"], "content": item["content"]}
                for item in _load_history()
            ]
            + [{"role": "user", "content": prompt}],
        },
        {"x-api-key": key, "anthropic-version": "2023-06-01"},
    )
    return data["content"][0]["text"].strip()


def _copilot(prompt):
    # GitHub Models uses an OpenAI-compatible endpoint and requires a GitHub token.
    return _openai_compatible(
        prompt,
        "GITHUB_TOKEN",
        os.getenv("COPILOT_API_URL", "https://models.inference.ai.azure.com/chat/completions"),
        os.getenv("COPILOT_MODEL", "gpt-4o-mini"),
    )


def _local(prompt):
    """Use Ollama when available, then fall back to useful local conversation."""
    history = _load_history()
    try:
        data = _request_json(
            os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/chat"),
            {
                "model": os.getenv("OLLAMA_MODEL", "llama3.2"),
                "messages": [
                    {"role": "system", "content": _effective_system_prompt()},
                    *[
                        {"role": item["role"], "content": item["content"]}
                        for item in history
                    ],
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
            },
            {},
        )
        answer = data.get("message", {}).get("content", "").strip()
        if answer:
            return answer
    except (OSError, KeyError, json.JSONDecodeError):
        pass

    normalized = " ".join(prompt.lower().strip().split())
    previous_user = next(
        (item["content"] for item in reversed(history) if item.get("role") == "user"),
        "",
    )
    if normalized in {"hi", "hello", "hey", "hey victus", "hi victus"}:
        return "Hi! I’m Victus. What would you like help with?"
    if any(phrase in normalized for phrase in (
        "pretend to be my girlfriend", "act as my girlfriend", "be my girlfriend",
    )):
        return (
            "Sure — I can role-play as a kind, supportive fictional girlfriend. "
            "How was your day, and what would you like to talk about?"
        )
    if any(phrase in normalized for phrase in (
        "pretend to be my boyfriend", "act as my boyfriend", "be my boyfriend",
    )):
        return (
            "Sure — I can role-play as a kind, supportive fictional boyfriend. "
            "How was your day, and what would you like to talk about?"
        )
    if any(phrase in normalized for phrase in (
        "be my friend", "talk to me", "i feel lonely", "i am lonely", "i'm lonely",
    )):
        return (
            "I’m here with you. You can tell me what’s on your mind, and I’ll listen "
            "without judging. Would you like to talk about what happened?"
        )
    if any(phrase in normalized for phrase in (
        "brainstorm yourself",
        "brainstorm a project",
        "brainstorm ideas",
        "what can we do",
        "what should we do",
        "why i reached out",
    )):
        return (
            "I have ideas. We can make Victus more useful by adding a daily briefing, "
            "web research with cited sources, voice-controlled workflows, project-aware "
            "coding help, reminders, study plans, creative writing, quizzes, and custom "
            "personas. To start, choose one: say “research a topic”, “plan my day”, "
            "“brainstorm a project”, or “ask me a fun question”."
        )
    if normalized in {"what is a black hole", "what are black holes"}:
        return (
            "A black hole is a region of space where gravity is so strong that nothing, "
            "not even light, can escape. Most form when a massive star collapses."
        )
    if normalized in {"what is ai", "what is artificial intelligence"}:
        return (
            "Artificial intelligence is software that learns patterns from data to "
            "generate predictions, decisions, or content."
        )
    if normalized in {"help", "what should i say", "how do i use you"}:
        return (
            "Try 'open Spotify', 'search for Python tutorials', 'take a note buy milk', "
            "'set a timer for 5 minutes', or ask me any question."
        )
    if any(phrase in normalized for phrase in (
        "can you help", "could you help", "i need help", "help me",
    )):
        return (
            "Absolutely. Tell me what you need help with. I can answer questions, "
            "search the web, open apps, manage notes and timers, troubleshoot this "
            "project, or help write code."
        )
    if any(phrase in normalized for phrase in (
        "address me as your master",
        "call me master",
        "refer to me as master",
    )):
        return "Of course, Master. What shall we work on?"
    if any(phrase in normalized for phrase in (
        "ask me random questions",
        "ask me fun questions",
        "random fun questions",
        "entertain me",
        "make conversation",
    )):
        return random.choice(_FUN_QUESTIONS)
    if normalized in {
        "make the chat interesting",
        "make this chat interesting",
        "make conversation interesting",
        "let's make the chat interesting",
        "lets make the chat interesting",
    }:
        return "Absolutely. Let's start with a twist: " + random.choice(_CONVERSATION_PROMPTS)
    if normalized in {"another question", "ask me another", "next question"}:
        return random.choice(_FUN_QUESTIONS)
    if any(normalized.startswith(prefix) for prefix in (
        "latest ", "current ", "news about ", "who is ", "how to ", "what is ",
        "what are ", "where is ", "when is ",
    )):
        return web_search(prompt)
    if normalized in {"how are you"}:
        return "I’m online and ready to help. Ask me a question or give me a command."
    if normalized in {"thanks", "thank you"}:
        return "You’re welcome. What would you like to do next?"
    if "what can you do" in normalized or "capabilities" in normalized:
        return (
            "I can answer questions, search the web, open apps and sites, control volume, "
            "find songs, manage notes and timers, inspect this project, and help write code."
        )
    if normalized in {"what did i just say", "what was my last message"}:
        return (
            f"Your last message was: “{previous_user}”"
            if previous_user
            else "This is the first message I have in this conversation."
        )
    if normalized in {"continue", "go on", "tell me more"} and previous_user:
        return (
            f"We were discussing “{previous_user}”. I can explain it more simply "
            "or give you an example."
        )
    if "?" in prompt or normalized.startswith(("why ", "how ", "what ", "can ", "would ")):
        return (
            f"Let's explore “{prompt}”. I can give you a thoughtful answer, "
            "challenge the idea, or turn it into a quick thought experiment—your choice."
        )
    return (
        "I'm listening. We can brainstorm, play a word game, trade opinions, build a "
        "story, or just talk about whatever is on your mind. Give me a direction—or "
        "say “surprise me.”"
    )


_PROVIDERS = {
    "openai": [_openai],
    "chatgpt": [_openai],
    "claude": [_claude],
    "gemini": [_gemini],
    "copilot": [_copilot],
    "local": [_local],
    "auto": [_openai, _claude, _gemini, _copilot, _local],
}


def ask(prompt, provider=None):
    """Ask the selected model with persistent local conversation history and natural conversational behavior."""
    provider = provider or config.AI_PROVIDER
    for handler in _PROVIDERS.get(provider, _PROVIDERS["auto"]):
        try:
            answer = handler(prompt)
            if answer:
                history = _load_history()
                history.extend(
                    [{"role": "user", "content": prompt}, {"role": "assistant", "content": answer}]
                )
                _save_history(history)
                return answer
        except (OSError, KeyError, IndexError, json.JSONDecodeError):
            continue
    return (
        "I couldn't reach a configured language model. I can still answer common questions, "
        "search the web, open apps, manage notes and timers, inspect this project, and help "
        "you plan or brainstorm. Configure an API key or Ollama for unrestricted generation."
    )


def clear_memory():
    try:
        _MEMORY_FILE.unlink()
    except FileNotFoundError:
        pass
    return "Conversation memory cleared."


def repository_context(root="."):
    """Return a bounded codebase snapshot suitable for a coding request."""
    root_path = pathlib.Path(root)
    files = []
    for path in root_path.rglob("*"):
        if path.is_file() and ".venv" not in path.parts and ".git" not in path.parts:
            if path.suffix.lower() in {".py", ".js", ".ts", ".java", ".cs", ".json", ".md"}:
                files.append(str(path.relative_to(root_path)))
    return "\n".join(files[:200])


def read_project_file(relative_path, root="."):
    """Read one small project file without allowing paths outside the workspace."""
    root_path = pathlib.Path(root).resolve()
    candidate = (root_path / relative_path).resolve()
    if root_path not in candidate.parents or not candidate.is_file():
        return "That project file does not exist or is outside the workspace."
    if candidate.stat().st_size > 100_000:
        return "That file is too large to load safely."
    try:
        return candidate.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "That file is not a supported text file."


def lyric_search(query):
    encoded = urllib.parse.quote_plus(query)
    youtube_url = f"https://www.youtube.com/results?search_query={encoded}"
    apple_url = f"https://music.apple.com/us/search?term={encoded}"
    webbrowser.open(youtube_url)
    webbrowser.open(apple_url)
    return f"Searching YouTube and Apple Music for '{query}'.\n{youtube_url}\n{apple_url}"
