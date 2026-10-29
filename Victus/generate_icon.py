"""
Victus Voice Assistant - Icon Generator
Draws a simple glowing-orb app icon (matches the Siri-style popup) and
saves it as assets/icon.ico. Already generated for you — re-run only if
you want to tweak the colors.
"""

from PIL import Image, ImageDraw, ImageFilter
import os

SIZE = 256


def make_icon():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2
    layers = [
        (cx - 70, cy - 60, cx + 90, cy + 100, (52, 209, 255, 210)),   # blue
        (cx - 90, cy - 30, cx + 60, cy + 110, (124, 77, 255, 200)),   # purple
        (cx - 50, cy - 90, cx + 100, cy + 60, (0, 229, 160, 190)),    # green
    ]
    for box in layers:
        draw.ellipse(box[:4], fill=box[4])

    img = img.filter(ImageFilter.GaussianBlur(6))

    draw2 = ImageDraw.Draw(img)
    core_r = 34
    draw2.ellipse(
        (cx - core_r, cy - core_r, cx + core_r, cy + core_r),
        fill=(255, 255, 255, 235),
    )

    os.makedirs("assets", exist_ok=True)
    img.save("assets/icon.ico", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    print("Icon saved to assets/icon.ico")


if __name__ == "__main__":
    make_icon()
