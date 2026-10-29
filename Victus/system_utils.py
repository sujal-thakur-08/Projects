"""
Victus Voice Assistant - System Utilities
Extra desktop-control features: volume control, screenshots, locking the PC,
shutdown/restart (with cancel), and closing running applications.
"""

import ctypes
import datetime
import os
import platform
import subprocess

try:
    import keyboard
except ImportError:
    keyboard = None

try:
    from PIL import ImageGrab
except ImportError:
    ImageGrab = None


def volume_up():
    if keyboard:
        for _ in range(3):
            keyboard.send("volume up")
        return "Volume up."
    return "Volume control isn't available right now."


def volume_down():
    if keyboard:
        for _ in range(3):
            keyboard.send("volume down")
        return "Volume down."
    return "Volume control isn't available right now."


def mute():
    if keyboard:
        keyboard.send("volume mute")
        return "Toggled mute."
    return "Volume control isn't available right now."


def take_screenshot():
    if ImageGrab is None:
        return "Screenshot isn't available right now."
    pictures_dir = os.path.join(os.path.expanduser("~"), "Pictures")
    os.makedirs(pictures_dir, exist_ok=True)
    filename = f"victus_screenshot_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(pictures_dir, filename)
    ImageGrab.grab().save(path)
    return f"Screenshot saved to Pictures as {filename}."


def lock_pc():
    system = platform.system().lower()
    if system == "windows":
        ctypes.windll.user32.LockWorkStation()
        return "Locking your PC."
    if system == "darwin":
        subprocess.run(["pmset", "displaysleepnow"])
        return "Locking your Mac."
    return "Locking isn't supported on this OS yet."


def shutdown_pc(delay_seconds=30):
    system = platform.system().lower()
    if system == "windows":
        subprocess.run(["shutdown", "/s", "/t", str(delay_seconds)])
        return f"Shutting down in {delay_seconds} seconds. Say 'cancel shutdown' to stop it."
    if system in ("linux", "darwin"):
        subprocess.run(["shutdown", "-h", f"+{max(1, delay_seconds // 60)}"])
        return "Shutting down shortly."
    return "Shutdown isn't supported on this OS yet."


def restart_pc(delay_seconds=30):
    system = platform.system().lower()
    if system == "windows":
        subprocess.run(["shutdown", "/r", "/t", str(delay_seconds)])
        return f"Restarting in {delay_seconds} seconds. Say 'cancel shutdown' to stop it."
    if system in ("linux", "darwin"):
        subprocess.run(["shutdown", "-r", "now"])
        return "Restarting shortly."
    return "Restart isn't supported on this OS yet."


def cancel_shutdown():
    system = platform.system().lower()
    if system == "windows":
        subprocess.run(["shutdown", "/a"])
        return "Shutdown cancelled."
    return "Nothing to cancel."


def close_app(name):
    """Best-effort close of a running application by name (Windows)."""
    system = platform.system().lower()
    guess = name.strip().lower().replace(" ", "")
    if not guess:
        return "Which app should I close?"
    if system == "windows":
        result = subprocess.run(
            ["taskkill", "/IM", f"{guess}.exe", "/F"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            return f"Closed {name}."
        return f"I couldn't find a running app called {name}."
    return "Closing apps by voice isn't supported on this OS yet."
