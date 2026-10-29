"""
Victus Voice Assistant - Custom GUI Application
Built with CustomTkinter: a modern, lightweight, native desktop UI
(no Electron/browser overhead, so it stays lag-free). Also drives the
Apple-Siri-style floating popup, and registers a global hotkey so you can
activate Victus from anywhere on your PC.
"""

import threading

import customtkinter as ctk

import config
from voice_engine import VoiceEngine
from intent_router import route
from siri_popup import SiriPopup

try:
    import keyboard  # optional: enables the global hotkey
except ImportError:
    keyboard = None


ctk.set_appearance_mode(config.THEME_MODE)
ctk.set_default_color_theme(config.COLOR_THEME)


class VictusApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title(f"{config.ASSISTANT_NAME} // PERSONAL INTELLIGENCE")
        self.geometry(config.WINDOW_SIZE)
        self.minsize(420, 560)
        self.configure(fg_color="#080d16")
        self.protocol("WM_DELETE_WINDOW", self._close)
        try:
            self.iconbitmap("assets/icon.ico")
        except Exception:
            pass

        self.engine = VoiceEngine(on_text=self._on_recognized, on_status=self._on_status)
        self._listening = False

        self._build_ui()

        # The Siri-style floating popup — its own always-on-top window
        self.popup = SiriPopup(self, on_click=self._toggle_listening)
        self.popup.withdraw()

        # Load the voice engine off the main thread so the window
        # appears instantly — keeps startup lag-free.
        threading.Thread(target=self._load_engine, daemon=True).start()

        self._register_hotkey()

    # ---------- UI construction ----------

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        header.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            header, text="VICTUS", text_color="#64d8ff",
            font=ctk.CTkFont(size=28, weight="bold")
        ).grid(row=0, column=0, sticky="w")

        ctk.CTkLabel(
            header, text="PERSONAL INTELLIGENCE SYSTEM",
            font=ctk.CTkFont(size=10, weight="bold"), text_color="#58738d",
        ).grid(row=0, column=1, sticky="e")

        self.status_label = ctk.CTkLabel(
            header, text="● STANDBY", font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#718096"
        )
        self.status_label.grid(row=1, column=0, sticky="w")

        hotkey_hint = config.HOTKEY.upper() if config.HOTKEY else None
        if hotkey_hint:
            ctk.CTkLabel(
                header, text=f"ACTIVATION KEY  {hotkey_hint}",
                font=ctk.CTkFont(size=11), text_color="gray",
            ).grid(row=2, column=0, sticky="w")

        # Transcript area
        self.transcript = ctk.CTkTextbox(self, font=ctk.CTkFont(size=14), wrap="word")
        self.transcript.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        self.transcript.insert(
            "end",
            "SYSTEM ONLINE\n"
            "All core systems are standing by. Press the mic button or use the "
            "activation key to begin.\n\n",
        )
        self.transcript.configure(state="disabled")

        # Controls
        controls = ctk.CTkFrame(self, fg_color="transparent")
        controls.grid(row=2, column=0, padx=20, pady=(0, 20), sticky="ew")
        controls.grid_columnconfigure(0, weight=1)
        controls.grid_columnconfigure(1, weight=1)

        self.mic_button = ctk.CTkButton(
            controls, text="🎙  Start Listening", height=48,
            font=ctk.CTkFont(size=15, weight="bold"),
            command=self._toggle_listening,
        )
        self.mic_button.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 10))

        self.text_entry = ctk.CTkEntry(controls, placeholder_text="...or type a command")
        self.text_entry.grid(row=1, column=0, sticky="ew", padx=(0, 10))
        self.text_entry.bind("<Return>", lambda e: self._submit_typed())

        ctk.CTkButton(controls, text="Send", width=80, command=self._submit_typed).grid(
            row=1, column=1, sticky="ew"
        )

    # ---------- Engine lifecycle ----------

    def _load_engine(self):
        try:
            self.engine.load()
            self._log("system", "Voice engine loaded. Ready to go.")
        except Exception as e:
            self._log("system", f"Startup error: {e}")

    def _register_hotkey(self):
        """Registers a global hotkey (works even if Victus is minimized)."""
        if keyboard is None or not config.HOTKEY:
            return
        try:
            keyboard.add_hotkey(config.HOTKEY, lambda: self.after(0, self._toggle_listening))
        except Exception as e:
            self._log("system", f"Hotkey registration failed: {e}")

    def _toggle_listening(self):
        if self._listening:
            self.engine.stop_listening()
            self._listening = False
            self.mic_button.configure(text="🎙  Start Listening")
            self.popup.set_state("idle")
            self.after(500, self.popup.withdraw)
        else:
            if not self.engine.start_listening():
                return
            self._listening = True
            self.mic_button.configure(text="⏹  Stop Listening")
            self.popup.deiconify()
            self.popup.set_state("listening")

    # ---------- Input handling ----------

    def _submit_typed(self):
        text = self.text_entry.get().strip()
        if not text:
            return
        self.text_entry.delete(0, "end")
        self.after(0, self._process_command, text, False)

    def _on_recognized(self, text):
        # This may be called from a background thread — hop to the main
        # thread for all UI updates so nothing ever lags or races.
        self.after(0, self._process_command, text, True)

    def _process_command(self, text, speak_response=True):
        self._log("you", text)
        _intent, response = route(text)

        if response == "__STOP__":
            if self._listening:
                self._toggle_listening()
            response = "Okay, I've stopped listening."

        if response is None:
            response = (
                "I didn't catch a command for that. Try 'open spotify', "
                "'search for a topic', or 'what time is it'."
            )

        self._log("victus", response)
        if speak_response:
            self.popup.set_state("speaking")
            self.engine.speak(response)

    def _on_status(self, status):
        self.after(0, self._update_status, status)

    def _update_status(self, status):
        colors = {
            "listening (online)": ("● LISTENING // ONLINE", "#3ddc84"),
            "listening (offline)": ("● LISTENING // LOCAL", "#3ddc84"),
            "speaking": ("● RESPONDING", "#64d8ff"),
            "idle": ("● STANDBY", "#718096"),
        }
        text, color = colors.get(status, (f"● {status}", "orange"))
        self.status_label.configure(text=text, text_color=color)

        if status == "idle" and self._listening:
            self.popup.set_state("listening")
        elif status == "speaking":
            self.popup.set_state("speaking")

    # ---------- Transcript logging ----------

    def _log(self, who, text):
        self.transcript.configure(state="normal")
        prefix = {"you": "You: ", "victus": "Victus: ", "system": "[system] "}.get(who, "")
        self.transcript.insert("end", f"{prefix}{text}\n\n")
        self.transcript.see("end")
        self.transcript.configure(state="disabled")

    def _close(self):
        """Stop background hooks before destroying the Tk event loop."""
        self.engine.stop_listening()
        if keyboard is not None:
            keyboard.unhook_all()
        self.popup.close()
        self.destroy()


if __name__ == "__main__":
    app = VictusApp()
    app.mainloop()
