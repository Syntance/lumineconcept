from fontTools.ttLib import TTFont
import os

FONTS_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")
FILES = [
    "Gilroy-Regular.ttf",
    "Gilroy-Medium.ttf",
    "Gilroy-Bold.ttf",
    "Binerka.otf",
    "ChronicleDisp-Roman.otf",
]

for name in FILES:
    src = os.path.join(FONTS_DIR, name)
    out = os.path.join(FONTS_DIR, os.path.splitext(name)[0] + ".woff2")
    font = TTFont(src)
    font.flavor = "woff2"
    font.save(out)
    print(f"{os.path.basename(out)}: {os.path.getsize(out)//1024} KB (was {os.path.getsize(src)//1024} KB)")
