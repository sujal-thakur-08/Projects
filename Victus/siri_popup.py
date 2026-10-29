"""
Victus Voice Assistant - Siri-style Floating Popup
A small, draggable, always-on-top animated HUD overlay. Reacts live to
listening/speaking state and mic volume.
Runs its own lightweight animation loop (~30fps) so it stays lag-free.
"""

import math
import tkinter as tk

SIZE = 190

COLORS = {
    "idle": ["#263449", "#425873"],
    "listening": ["#1bbcff", "#477dff", "#00e5a0"],
    "speaking": ["#64d8ff", "#477dff", "#b06cff"],
}


class SiriPopup(tk.Toplevel):
    def __init__(self, master, on_click=None):
        super().__init__(master)
        self.overrideredirect(True)          # borderless
        self.attributes("-topmost", True)    # always on top
        self.configure(bg="#03070d")
        try:
            # True per-pixel transparency on Windows — only the orb is visible
            self.attributes("-transparentcolor", "#03070d")
        except tk.TclError:
            pass  # falls back to a plain black square on platforms that don't support this

        self._on_click = on_click
        self._state = "idle"
        self._level = 0.0
        self._target_level = 0.0
        self._t = 0.0
        self._running = True

        self.geometry(f"{SIZE}x{SIZE}+{self._default_x()}+{self._default_y()}")

        self.canvas = tk.Canvas(
            self, width=SIZE, height=SIZE, bg="#03070d", highlightthickness=0
        )
        self.canvas.pack()

        self.canvas.bind("<ButtonPress-1>", self._start_drag)
        self.canvas.bind("<B1-Motion>", self._drag)
        self.canvas.bind("<ButtonRelease-1>", self._end_drag)

        self._drag_data = {"x": 0, "y": 0, "moved": False}
        self._animate()

    # ---------- positioning ----------

    def _default_x(self):
        return self.winfo_screenwidth() - SIZE - 40

    def _default_y(self):
        return self.winfo_screenheight() - SIZE - 120

    # ---------- dragging (click without drag = toggle listening) ----------

    def _start_drag(self, event):
        self._drag_data = {"x": event.x, "y": event.y, "moved": False}

    def _drag(self, event):
        self._drag_data["moved"] = True
        x = self.winfo_x() + (event.x - self._drag_data["x"])
        y = self.winfo_y() + (event.y - self._drag_data["y"])
        self.geometry(f"+{x}+{y}")

    def _end_drag(self, event):
        if not self._drag_data["moved"] and self._on_click:
            self._on_click()

    # ---------- state control (called from the main GUI) ----------

    def set_state(self, state):
        self._state = state if state in COLORS else "idle"

    def set_level(self, level):
        """0.0 - 1.0 microphone volume, drives the reactive pulse while listening."""
        self._target_level = max(0.0, min(1.0, level))

    # ---------- animation loop ----------

    def _animate(self):
        if not self._running:
            return
        self._t += 0.09
        self._level += (self._target_level - self._level) * 0.3
        self._draw()
        self.after(33, self._animate)  # ~30fps

    def _draw(self):
        c = self.canvas
        c.delete("all")
        cx = cy = SIZE / 2

        colors = COLORS[self._state]
        base_r = 30 if self._state == "idle" else 34
        pulse = math.sin(self._t) * 4

        if self._state == "listening":
            amp = self._level * 22
        elif self._state == "speaking":
            amp = abs(math.sin(self._t * 2.2)) * 12
        else:
            amp = 0

        for i, color in enumerate(colors):
            r = base_r + pulse + amp - i * 4 + math.sin(self._t * (1.3 + i * 0.4)) * 5
            ox = math.cos(self._t * (0.8 + i * 0.3)) * 6
            oy = math.sin(self._t * (0.9 + i * 0.3)) * 6
            c.create_oval(cx - r + ox, cy - r + oy, cx + r + ox, cy + r + oy, fill=color, outline="")

        # Fine rings give the orb a restrained sci-fi HUD appearance without
        # requiring image assets or platform-specific rendering.
        ring_r = base_r + 20 + math.sin(self._t * 0.7) * 3
        c.create_oval(
            cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r,
            outline=colors[0], width=1,
        )
        core_r = 13 + amp * 0.35
        c.create_oval(
            cx - core_r, cy - core_r, cx + core_r, cy + core_r,
            fill="#e8f8ff", outline="",
        )

    def close(self):
        self._running = False
        self.destroy()
