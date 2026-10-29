"""
Victus Voice Assistant - Build Script
Packages Victus into a single standalone .exe using PyInstaller, so it runs
as a real Windows application -- no Python installation required to use it.

Usage:
    pip install pyinstaller
    python setup_model.py     (if you haven't already -- bundles the offline model)
    python build.py

Output: dist/Victus.exe
"""

import os
import subprocess
import sys

SEP = ";" if sys.platform.startswith("win") else ":"


def main():
    args = [
        sys.executable, "-m", "PyInstaller",
        "--name=Victus",
        "--onefile",
        "--windowed",
        "--icon=assets/icon.ico",
    ]

    if os.path.isdir("model"):
        args.append(f"--add-data=model{SEP}model")
    else:
        print("Note: no ./model folder found -- the .exe will rely on online "
              "speech recognition only unless you run setup_model.py first.")

    args.append("main.py")

    print("Building Victus.exe ... this can take a minute or two.")
    subprocess.run(args, check=True)
    print("\nDone! Find your standalone app at dist/Victus.exe")
    print("You can copy that single file anywhere and double-click to run it.")


if __name__ == "__main__":
    main()
