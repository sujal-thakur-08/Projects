"""
Victus Voice Assistant - Model Setup
Downloads the small offline Vosk speech-recognition model (~40MB) into ./model
Run this ONCE before using the assistant:   python setup_model.py
"""

import os
import zipfile
import urllib.request

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
ZIP_NAME = "vosk-model.zip"
FOLDER_NAME = "vosk-model-small-en-us-0.15"
TARGET_DIR = "model"


def main():
    if os.path.isdir(TARGET_DIR):
        print(f"'{TARGET_DIR}' already exists — skipping download.")
        return

    print("Downloading Vosk speech recognition model (~40MB)...")
    urllib.request.urlretrieve(MODEL_URL, ZIP_NAME)

    print("Extracting...")
    with zipfile.ZipFile(ZIP_NAME, "r") as z:
        z.extractall(".")

    os.rename(FOLDER_NAME, TARGET_DIR)
    os.remove(ZIP_NAME)
    print(f"Done. Model ready at ./{TARGET_DIR}")


if __name__ == "__main__":
    main()
