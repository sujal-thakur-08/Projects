"""
Victus Voice Assistant - Voice Engine
Supports BOTH offline and online speech recognition + text-to-speech, with
automatic fallback so the assistant keeps working with or without internet.

STT (speech-to-text):
  - offline -> Vosk (local model, no internet, lowest latency)
  - online  -> Google Web Speech API via SpeechRecognition (needs internet,
               often more accurate)
TTS (text-to-speech):
  - offline -> pyttsx3 (local OS voice, instant, no internet)
  - online  -> gTTS (Google's cloud voice, needs internet, more natural)

config.STT_MODE / config.TTS_MODE = "offline" | "online" | "auto"
"auto" prefers online when internet is available and falls back to offline
instantly (mid-session, if needed) when it isn't.
"""

import json
import os
import queue
import socket
import tempfile
import threading

import pyttsx3
import sounddevice as sd
from vosk import Model, KaldiRecognizer

import config

try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    from gtts import gTTS
    import pygame
except ImportError:
    gTTS = None
    pygame = None


def is_online(timeout=1.0):
    """Quick, cheap check for an internet connection."""
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        return True
    except OSError:
        return False


class VoiceEngine:
    def __init__(self, on_text=None, on_status=None):
        """
        on_text:   callback(str) -> called with recognized speech text
        on_status: callback(str) -> called with status updates, e.g.
                   "listening (online)", "listening (offline)", "speaking", "idle"
        """
        self.on_text = on_text or (lambda t: None)
        self.on_status = on_status or (lambda s: None)

        self._audio_q = queue.Queue()
        self._listening = False
        self._listen_thread = None
        self._loaded = False

        self._tts_engine = None
        self._tts_lock = threading.Lock()

        self._vosk_model = None
        self._vosk_recognizer = None
        self._sr_recognizer = None
        self._sr_mic = None

        if pygame:
            pygame.mixer.init()

    # ---------- Setup ----------

    def load(self):
        """Load whichever engines are available/needed. Call once at startup."""
        # Offline STT is loaded whenever the model exists, so we can always
        # fall back to it -- even in "online" mode -- if the network drops.
        if os.path.isdir(config.VOSK_MODEL_PATH):
            self._vosk_model = Model(config.VOSK_MODEL_PATH)
            self._vosk_recognizer = KaldiRecognizer(self._vosk_model, config.SAMPLE_RATE)
        elif config.STT_MODE == "offline":
            raise FileNotFoundError(
                f"Vosk model not found at '{config.VOSK_MODEL_PATH}'. "
                f"Run setup_model.py, or set STT_MODE to 'online'/'auto' in config.py."
            )

        if sr is not None:
            self._sr_recognizer = sr.Recognizer()
            try:
                self._sr_mic = sr.Microphone(sample_rate=config.SAMPLE_RATE)
                with self._sr_mic as source:
                    self._sr_recognizer.adjust_for_ambient_noise(source, duration=0.5)
            except Exception:
                self._sr_mic = None  # PyAudio may not be installed -- online STT disabled

        # Offline TTS is always initialized so it's ready as an instant fallback.
        self._tts_engine = pyttsx3.init()
        self._tts_engine.setProperty("rate", config.TTS_RATE)
        self._tts_engine.setProperty("volume", config.TTS_VOLUME)
        voices = self._tts_engine.getProperty("voices")
        if voices and config.TTS_VOICE_INDEX < len(voices):
            self._tts_engine.setProperty("voice", voices[config.TTS_VOICE_INDEX].id)
        self._loaded = True

    def _use_online_stt(self):
        if sr is None or self._sr_mic is None:
            return False
        if config.STT_MODE == "online":
            return True
        if config.STT_MODE == "auto":
            return is_online()
        return False

    def _use_online_tts(self):
        if gTTS is None or pygame is None:
            return False
        if config.TTS_MODE == "online":
            return True
        if config.TTS_MODE == "auto":
            return is_online()
        return False

    # ---------- Speech recognition (listening) ----------

    def _audio_callback(self, indata, frames, time_info, status):
        self._audio_q.put(bytes(indata))

    def start_listening(self):
        if self._listening:
            return True
        if not self._loaded:
            self.on_status("error: voice engine is still loading")
            return False
        self._listening = True
        target = self._listen_loop_online if self._use_online_stt() else self._listen_loop_offline
        self._listen_thread = threading.Thread(target=target, daemon=True)
        self._listen_thread.start()
        return True

    def stop_listening(self):
        self._listening = False

    def _listen_loop_offline(self):
        if self._vosk_recognizer is None:
            self.on_status("error: no offline model and no internet available")
            self._listening = False
            return
        self.on_status("listening (offline)")
        try:
            with sd.RawInputStream(
                samplerate=config.SAMPLE_RATE,
                blocksize=8000,
                dtype="int16",
                channels=1,
                callback=self._audio_callback,
            ):
                while self._listening:
                    try:
                        data = self._audio_q.get(timeout=0.5)
                    except queue.Empty:
                        continue
                    if self._vosk_recognizer.AcceptWaveform(data):
                        result = json.loads(self._vosk_recognizer.Result())
                        text = result.get("text", "").strip()
                        if text:
                            self.on_text(text)
                final_result = json.loads(self._vosk_recognizer.FinalResult())
                final_text = final_result.get("text", "").strip()
                if final_text:
                    self.on_text(final_text)
        except Exception as e:
            self.on_status(f"error: {e}")
        finally:
            if self._listening:
                self.on_status("idle")

    def _listen_loop_online(self):
        self.on_status("listening (online)")
        try:
            with self._sr_mic as source:
                while self._listening:
                    try:
                        audio = self._sr_recognizer.listen(source, timeout=4, phrase_time_limit=8)
                    except sr.WaitTimeoutError:
                        continue
                    try:
                        text = self._sr_recognizer.recognize_google(audio)
                        if text:
                            self.on_text(text)
                    except sr.UnknownValueError:
                        continue
                    except sr.RequestError:
                        # Network dropped mid-session -- switch to offline seamlessly
                        if self._vosk_recognizer is not None:
                            self.on_status("network lost, switching to offline...")
                            self._listen_loop_offline()
                            return
                        self.on_status("error: no network and no offline model available")
                        self._listening = False
                        return
        except Exception as e:
            self.on_status(f"error: {e}")
        finally:
            if self._listening:
                self.on_status("idle")

    # ---------- Text-to-speech (speaking) ----------

    def speak(self, text):
        """Speak text on a background thread so the GUI never freezes."""
        threading.Thread(target=self._speak_worker, args=(text,), daemon=True).start()

    def _speak_worker(self, text):
        with self._tts_lock:
            self.on_status("speaking")
            if self._use_online_tts():
                try:
                    self._speak_online(text)
                    self.on_status("idle")
                    return
                except Exception:
                    pass  # fall through to the offline voice
            self._tts_engine.say(text)
            self._tts_engine.runAndWait()
            self.on_status("idle")

    def _speak_online(self, text):
        tts = gTTS(text=text, lang="en")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            tts.save(f.name)
            temp_path = f.name
        pygame.mixer.music.load(temp_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        os.remove(temp_path)
