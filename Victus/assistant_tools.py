"""Small persistent tools for reminders, notes, timers, and safe workspace actions."""

import datetime
import json
import pathlib
import threading
import time
import webbrowser

_STATE_FILE = pathlib.Path("victus_tools.json")


def _load():
    try:
        return json.loads(_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"notes": [], "reminders": []}


def _save(state):
    _STATE_FILE.write_text(json.dumps(state, ensure_ascii=True, indent=2), encoding="utf-8")


def add_note(text):
    state = _load()
    state.setdefault("notes", []).append(
        {"text": text, "created": datetime.datetime.now().isoformat(timespec="seconds")}
    )
    _save(state)
    return f"Note saved: {text}"


def list_notes():
    notes = _load().get("notes", [])
    if not notes:
        return "You have no saved notes."
    return "Saved notes:\n" + "\n".join(f"{i + 1}. {item['text']}" for i, item in enumerate(notes))


def clear_notes():
    state = _load()
    state["notes"] = []
    _save(state)
    return "All notes cleared."


def add_reminder(text):
    state = _load()
    state.setdefault("reminders", []).append(
        {"text": text, "created": datetime.datetime.now().isoformat(timespec="seconds")}
    )
    _save(state)
    return f"Reminder saved: {text}"


def list_reminders():
    reminders = _load().get("reminders", [])
    if not reminders:
        return "You have no saved reminders."
    return "Saved reminders:\n" + "\n".join(
        f"{i + 1}. {item['text']}" for i, item in enumerate(reminders)
    )


def set_timer(seconds, label):
    if seconds <= 0:
        return "Timer duration must be positive."

    def _wait():
        time.sleep(seconds)
        webbrowser.open(
            "data:text/html,<title>Victus Timer</title>"
            f"<h1>Timer finished</h1><p>{label}</p>"
        )

    threading.Thread(target=_wait, daemon=True).start()
    return f"Timer set for {seconds} seconds: {label}"
