# Victus — Voice Assistant

A lightweight, **lag-free**, hybrid **online/offline** voice assistant with a custom native
desktop app and an Apple-Siri-style floating popup. Say "open" plus almost anything — any
installed application, or any website — and Victus opens it.

## Features

- 🎙 **Hybrid speech recognition** — uses fast, accurate online recognition when you have
  internet, and seamlessly falls back to a fully offline engine the instant the connection
  drops (or if you prefer to run 100% offline).
- 🔊 **Hybrid text-to-speech** — natural cloud voice online, instant local voice offline.
- 🪟 **Custom native GUI** — built with CustomTkinter, not a browser/Electron shell, so it
  starts instantly and stays responsive.
- 🔵 **Siri-style floating popup** — a small animated orb appears while Victus is listening
  or speaking, draggable, always-on-top, click it to toggle listening.
- ⌨️ **Global hotkey** (`Ctrl+Alt+V` by default) — trigger Victus from anywhere, even if the
  window is minimized.
- 📂 **Open ANY installed app by voice** — "open spotify", "open notepad", "open discord" —
  Victus scans your Start Menu and matches what you say, no hardcoded app list required.
- 🌐 **Open ANY webpage by voice** — "open youtube", "open github", "open some-site.com" —
  if it's not a matching app, Victus opens it as a website automatically.
- 🔎 **Smart "X on Y" search** — "open shinchan on youtube" or "play believer" correctly
  searches YouTube for the term, instead of guessing a broken domain like
  `openshinchanonyoutube.com`. Works for YouTube, Google, Spotify, GitHub, Amazon,
  Wikipedia, Reddit, Netflix, and more.
- 🤖 **Conversational AI** — unmatched questions use OpenAI, Claude, or a local fallback.
- 🎵 **Lyric/song discovery** — say "lyrics [phrase]" or "find this song [phrase]" to search
  YouTube and Apple Music.
- 📝 **Personal productivity** — save notes, reminders, and timers that persist between runs.
- 🔎 **Research mode** — "research [topic]" opens sources and asks the configured AI for a
  concise research brief.
- 🖥 **System control commands** — volume up/down/mute, take a screenshot, lock the PC,
  shutdown/restart (with "cancel shutdown"), and close a running app by name.
- 😄 **A few fun extras** — "tell me a joke", casual greetings, etc.
- 🧭 **Intent-first routing** — every speech or text request is classified as a PC
  action, productivity task, search request, or AI conversation before execution.
- 📦 **Real standalone application** — a build script packages everything into a single
  `Victus.exe` you can run without Python installed.
- 🧷 **A separate launcher app** — `tray_app.py` runs Victus quietly in the system tray, and
  `Run_Victus.bat` / `run_victus.pyw` let you double-click to start Victus with zero console
  window, completely independent from editing/running the source in VS Code.

## Why it's lag-free

- Offline STT/TTS keep working with zero network latency when you're offline.
- Online STT/TTS are used opportunistically for better accuracy, but a `RequestError` (lost
  connection) triggers an instant, automatic fallback to the offline engine mid-session.
- Listening, speaking, model loading, and app indexing all run on background threads — the
  GUI thread is never blocked.
- The popup runs its own lightweight ~30fps canvas animation loop, independent of the main
  window, so it never introduces stutter.

## Project structure

```
Victus/
├── main.py            # entry point — run this (full window)
├── run_victus.pyw       # SEPARATE silent runner — no console window
├── Run_Victus.bat         # SEPARATE double-click launcher (Windows)
├── tray_app.py             # SEPARATE system tray launcher/controller app
├── gui.py                   # the custom application window
├── siri_popup.py              # the Apple-Siri-style floating orb overlay
├── voice_engine.py             # hybrid online/offline STT + TTS engine (threaded)
├── intent_router.py            # command intent detector and local/AI dispatch boundary
├── app_launcher.py               # indexes & opens ANY installed application
├── system_utils.py                 # volume, screenshot, lock, shutdown/restart, close app
├── commands.py                       # voice command logic — add new commands here
├── config.py                  # all settings in one place (STT_MODE, TTS_MODE, hotkey, etc.)
├── setup_model.py               # one-time download of the offline speech model
├── generate_icon.py              # (re)generates the app icon
├── build.py                       # packages Victus into a standalone .exe
├── requirements.txt                # Python dependencies
├── assets/icon.ico                  # app icon
├── .vscode/                          # VS Code run/debug config
└── model/                             # (created by setup_model.py) offline speech model
```

## Setup (Windows, first time)

1. **Open the folder in VS Code** — `File → Open Folder... → select the Victus folder`

2. **Create a virtual environment** (Terminal in VS Code: `` Ctrl+` ``)
   ```
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```
   pip install -r requirements.txt
   ```
   > If `PyAudio` fails to install (common on Windows), run:
   > `pip install pipwin` then `pipwin install pyaudio`

4. **Download the offline speech model** (one time, ~40MB — needed for offline mode / fallback)
   ```
   python setup_model.py
   ```

5. **Run it**
   ```
   python main.py
   ```
   Or in VS Code, press **F5** to run with the debugger attached.

## Using Victus

- Click **🎙 Start Listening** (or press `Ctrl+Alt+V` anywhere, or click the floating orb)
  and just speak — no wake word needed.
- Or type a command in the text box and hit Enter/Send.
- Say "stop listening" (or click **⏹ Stop Listening**) to pause the mic.

### Request flow

Speech recognition and typed input use the same pipeline:

```
Input -> intent detector -> local tool (PC/productivity/search)
                       -> AI brain (memory, web, project files, conversation)
       -> final answer -> transcript and optional voice output
```

The detector is deterministic and runs locally. The AI gateway is used only for
conversation and requests that do not match a local tool; it can then use
conversation memory, web lookup, and project-file context through its existing
provider/tool integrations.

### Voice commands

- **"Open [anything]"** — the core command. Victus first checks if it matches an installed
  app (Spotify, Discord, Notepad, Chrome, VS Code, your entire Start Menu — anything). If
  not, it opens it as a website instead (youtube, github, or any-domain.com).
- **"Open/play/search [query] on [site]"** — e.g. "open shinchan on youtube", "play believer",
  "search for python tutorials on github" — searches that site directly for the query.
  Supported sites: YouTube, Google, Bing, Spotify, GitHub, Amazon, Wikipedia, Reddit,
  Netflix, Twitter/X.
- "Launch [x]" / "Start [x]" — same behavior as "open"
- "Close [x]" — closes a running application by name
- "Volume up" / "Volume down" / "Mute"
- "Take a screenshot"
- "Lock my PC"
- "Shutdown my PC" / "Restart my PC" / "Cancel shutdown"
- "Tell me a joke"
- "What time is it" / "What's the date"
- "Hello" / "Who are you" / "Thanks"

### Adding your own commands

Open `commands.py` and add a new `if` branch inside `handle_command()`. Return the sentence
you want Victus to speak back.

## Running Victus as a separate app (not from VS Code)

Three ways to run Victus independent of the source/IDE:

- **`python tray_app.py`** — a small SEPARATE application that sits in your system tray. It
  auto-launches the full Victus window once, and lets you reopen it or quit from the tray
  icon's right-click menu, without needing a terminal open.
- **`Run_Victus.bat`** (Windows) — double-click this file to start Victus silently, no
  console window at all. Great for pinning to your taskbar or Startup folder.
- **`run_victus.pyw`** — the underlying silent entry point `Run_Victus.bat` calls; you can
  also double-click it directly if `.pyw` files are associated with `pythonw.exe`.
- **`dist/Victus.exe`** — see "Building a standalone application" below for a version that
  needs no Python installed at all.

## Choosing online vs. offline mode

Edit `config.py`:

```python
STT_MODE = "auto"   # "offline" | "online" | "auto"  (speech recognition)
TTS_MODE = "auto"   # "offline" | "online" | "auto"  (voice output)
```

- `"auto"` (default, recommended) — uses online when you have internet for the best
  accuracy/naturalness, and falls back to fully offline the instant it's needed.
- `"offline"` — never touches the network. Fastest, fully private, works anywhere.
- `"online"` — always uses the cloud engines (still falls back automatically if the network
  drops mid-listen, as long as you've run `setup_model.py`).

## Building a standalone application (.exe)

Turn Victus into a real, double-click Windows app:

```
pip install pyinstaller
python setup_model.py      # if not already done
python build.py
```

This produces `dist/Victus.exe` — a single file you can copy anywhere, pin to your taskbar,
or share, without anyone needing Python installed.

## Troubleshooting

- **"Vosk model not found"** → run `python setup_model.py`, or set `STT_MODE = "online"`.
- **No microphone input / silence** → check Windows sound settings and make sure the correct
  input device is set as default.
- **Online mode not working** → make sure `PyAudio` installed correctly (see setup step 3)
  and that you have an internet connection; Victus will otherwise just use offline mode.
- **Global hotkey doesn't fire** → the `keyboard` library sometimes needs the terminal/VS
  Code to be run as Administrator on Windows for global hooks to register.
- **Popup doesn't look transparent** → per-pixel window transparency (`-transparentcolor`)
  is a Windows-only Tk feature; on macOS/Linux the popup falls back to a plain dark square.
- **Choppy/robotic offline voice** → try changing `TTS_VOICE_INDEX` in `config.py` to `1`.

## Notes

Online modes send audio/text to Google's public speech APIs for recognition/synthesis.
Offline mode keeps everything fully local. Choose whichever fits your privacy needs via
`STT_MODE` / `TTS_MODE` in `config.py`.

## Conversational AI providers

Set `AI_PROVIDER` in `config.py` to `"openai"`, `"claude"`, `"local"`, or `"auto"`.
For cloud providers, set the matching environment variable before launching:

```powershell
$env:OPENAI_API_KEY = "your-key"
# or
$env:ANTHROPIC_API_KEY = "your-key"
```

`"auto"` tries OpenAI, Claude, Gemini, GitHub Copilot, then local tools. Never put API keys
directly in source code. Supported environment variables are `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), and `GITHUB_TOKEN`.

You can also say `use gemini`, `use claude`, `use copilot`, `use openai`, or `use auto`
while Victus is running. Coding requests can use `list project files`, `read project file
<path>`, `review my code <question>`, and `analyze this project <question>`.

Productivity commands include `take a note ...`, `show my notes`, `remind me to ...`,
`show my reminders`, and `set a timer for 10 minutes to ...`.
