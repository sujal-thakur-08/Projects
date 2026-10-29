"""
Victus Voice Assistant - Application Launcher
Scans the Windows Start Menu for EVERY installed application and builds a
searchable index, so voice commands like "open spotify" or "open chrome"
work for any installed app -- not just a hardcoded list.
"""

import os
import difflib
import platform
import subprocess

_INDEX = {}  # {lowercase app name: full path to launch}
_INDEXED = False


def build_index():
    """Scan common Start Menu locations and populate the app index."""
    global _INDEX, _INDEXED
    _INDEX = {}

    if platform.system().lower() == "windows":
        search_dirs = [
            os.path.join(os.environ.get("ProgramData", ""), "Microsoft", "Windows", "Start Menu", "Programs"),
            os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs"),
        ]
        for base in search_dirs:
            if not os.path.isdir(base):
                continue
            for root, _dirs, files in os.walk(base):
                for f in files:
                    if f.lower().endswith((".lnk", ".exe")):
                        name = os.path.splitext(f)[0].strip().lower()
                        full_path = os.path.join(root, f)
                        if name not in _INDEX:
                            _INDEX[name] = full_path

    elif platform.system().lower() == "darwin":
        for base in ["/Applications", os.path.expanduser("~/Applications")]:
            if not os.path.isdir(base):
                continue
            for f in os.listdir(base):
                if f.endswith(".app"):
                    name = f[:-4].strip().lower()
                    _INDEX[name] = os.path.join(base, f)

    elif platform.system().lower() == "linux":
        for base in ["/usr/share/applications", os.path.expanduser("~/.local/share/applications")]:
            if not os.path.isdir(base):
                continue
            for f in os.listdir(base):
                if f.endswith(".desktop"):
                    name = f[:-8].strip().lower()
                    _INDEX[name] = os.path.join(base, f)

    _INDEXED = True
    return _INDEX


def find_app(spoken_name):
    """
    Fuzzy-match a spoken app name against the indexed applications.
    Returns (display_name, path) or (None, None) if no good match.
    """
    if not _INDEXED:
        build_index()

    spoken_name = spoken_name.strip().lower()
    if not spoken_name:
        return None, None

    # 1. Exact match
    if spoken_name in _INDEX:
        return spoken_name, _INDEX[spoken_name]

    # 2. Substring match (either direction) — handles "open chrome" matching
    #    "google chrome", or "open office" matching "microsoft office word"
    candidates = [n for n in _INDEX if spoken_name in n or n in spoken_name]
    if candidates:
        best = min(candidates, key=len)  # shortest/closest match
        return best, _INDEX[best]

    # 3. Fuzzy match fallback (handles minor mishears)
    matches = difflib.get_close_matches(spoken_name, _INDEX.keys(), n=1, cutoff=0.6)
    if matches:
        best = matches[0]
        return best, _INDEX[best]

    return None, None


def launch(path):
    """Launch an application by its resolved path."""
    try:
        system = platform.system().lower()
        if system == "windows":
            os.startfile(path)  # handles both .lnk and .exe
        elif system == "darwin":
            subprocess.Popen(["open", path])
        elif system == "linux":
            subprocess.Popen(["gtk-launch", os.path.basename(path).replace(".desktop", "")])
        else:
            subprocess.Popen(path)
        return True
    except Exception:
        return False


def app_count():
    """Number of indexed applications (useful for status/debugging)."""
    if not _INDEXED:
        build_index()
    return len(_INDEX)
