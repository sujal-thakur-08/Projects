"""
Victus Voice Assistant - Silent Runner
A separate, minimal entry point for just RUNNING the app with no visible
console window (use the .pyw extension so Windows launches it via
pythonw.exe instead of python.exe). Double-click this file, or use
Run_Victus.bat, to start Victus without opening a terminal.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui import VictusApp

if __name__ == "__main__":
    app = VictusApp()
    app.mainloop()
