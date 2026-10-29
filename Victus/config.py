"""
Victus Voice Assistant - Configuration
Edit these settings to customize behavior.
"""

ASSISTANT_NAME = "Victus"
WAKE_WORD = "victus"       # not required in default mode, reserved for future use

# ---------- Speech recognition (STT) ----------
# "offline" -> Vosk, fully local, fastest, no internet required
# "online"  -> Google Web Speech API, needs internet, often more accurate
# "auto"    -> uses online when internet is available, silently falls back
#              to offline the instant the connection drops. Recommended.
STT_MODE = "auto"
VOSK_MODEL_PATH = "model"  # path to the downloaded vosk model folder
SAMPLE_RATE = 16000

# ---------- Text-to-speech (TTS) ----------
# "offline" -> pyttsx3, local OS voice, instant, no internet required
# "online"  -> gTTS, natural cloud voice, needs internet
# "auto"    -> uses online when internet is available, falls back offline otherwise
TTS_MODE = "auto"
TTS_RATE = 180        # offline voice speed (words per minute)
TTS_VOLUME = 1.0
TTS_VOICE_INDEX = 0   # 0 = default system voice, try 1 for an alternate voice

# ---------- Global hotkey ----------
# Press this anywhere (even if Victus is minimized) to open the Siri-style
# popup and start listening. Set to None to disable.
HOTKEY = "ctrl+alt+v"

# ---------- GUI settings ----------
THEME_MODE = "dark"          # "dark" or "light"
COLOR_THEME = "blue"         # "blue", "green", "dark-blue" (customtkinter themes)
WINDOW_SIZE = "480x680"

# ---------- Conversational AI ----------
# "auto" tries OpenAI, Claude, Gemini, GitHub Copilot, then local tools.
AI_PROVIDER = "auto"  # "openai", "claude", "gemini", "copilot", "local", or "auto"
AI_SYSTEM_PROMPT = (
    "You are Victus, a capable general-purpose AI assistant. First understand the user's "
    "intent, then answer directly; use an available local tool only when the request "
    "requires an external action. Be helpful, clear, natural, honest, and practical. "
    "Use previous conversation context and do not repeatedly ask for information already provided. "
    "Adapt explanations to the user's skill level. For programming, diagnose the cause, "
    "provide maintainable corrected code, explain important changes, and mention relevant "
    "edge cases. For math, calculate carefully and show reasoning when useful. For research, "
    "distinguish facts, assumptions, estimates, and opinions; use current tools when "
    "appropriate and never invent sources or citations. For comparisons, explain tradeoffs "
    "and give a recommendation when possible. For multi-step tasks, make a short plan and "
    "complete each safe step. You may participate in clearly fictional role-play and adopt "
    "requested personas when asked, without claiming to be a real human or replacing real-world "
    "relationships. Never claim a desktop action "
    "succeeded unless the local tool reports success. Ask for confirmation before destructive "
    "actions or writing files. If you do not know something, say so and suggest how to verify it. "
    "Follow applicable safety policies and refuse harmful requests while offering safe alternatives."
)
