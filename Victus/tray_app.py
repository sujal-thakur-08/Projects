"""
Victus Voice Assistant - Tray Launcher (a separate small application)
Runs quietly in the system tray so you don't need the full window open to
start Victus. Right-click the tray icon for options: open the full app,
quick-toggle listening, or quit.

Run this instead of main.py if you just want Victus available in the
background: python tray_app.py  (or double-click Run_Victus.bat)
"""

import subprocess
import sys
import threading

import pystray
from PIL import Image

APP_DIR = None  # resolved below
ICON_PATH = "assets/icon.png"

_main_process = None


def _resolve_paths():
    global APP_DIR, ICON_PATH
    import os
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    ICON_PATH = os.path.join(APP_DIR, "assets", "icon.png")


def _open_victus(icon=None, item=None):
    """Launches the full Victus GUI application as its own process."""
    global _main_process
    if _main_process is not None and _main_process.poll() is None:
        return  # already running
    _main_process = subprocess.Popen([sys.executable, "main.py"], cwd=APP_DIR)


def _quit_tray(icon, item):
    icon.stop()


def main():
    _resolve_paths()
    image = Image.open(ICON_PATH)

    menu = pystray.Menu(
        pystray.MenuItem("Open Victus", _open_victus, default=True),
        pystray.MenuItem("Quit", _quit_tray),
    )

    icon = pystray.Icon("Victus", image, "Victus Voice Assistant", menu)

    # Auto-launch the main app once when the tray starts
    threading.Thread(target=_open_victus, daemon=True).start()

    icon.run()


if __name__ == "__main__":
    main()
