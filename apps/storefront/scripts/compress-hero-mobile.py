"""
Compress mobile hero to 828px width (iPhone Plus/Pro Max) with quality 82.
Target: ~50-70KB with good visual quality.
"""
from PIL import Image
import os

FONTS_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images")
INPUT = os.path.join(FONTS_DIR, "hero-main-wall-mobile.webp")
OUTPUT = INPUT  # overwrite

img = Image.open(INPUT)
original_w, original_h = img.size
print(f"Original: {original_w}x{original_h}, {os.path.getsize(INPUT)//1024}KB")

# Resize to 828px width (common iPhone viewport)
target_w = 828
target_h = int(original_h * (target_w / original_w))
img_resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Save with quality 82 (high but not excessive)
img_resized.save(OUTPUT, "webp", quality=82, method=6)
new_size = os.path.getsize(OUTPUT) // 1024
print(f"Compressed: {target_w}x{target_h}, {new_size}KB (quality=82)")
