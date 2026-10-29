"""Watermark artwork for the site.

Put full-size originals in /originals (kept off GitHub), then run:
    python3 watermark.py
Each image is resized for the web, stamped "© Brie Myers", and saved to /images.
Needs Pillow:  pip3 install pillow
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

TEXT = "© Brie Myers"
MAX_SIZE = 1200  # longest side, in pixels
FONT = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"

root = Path(__file__).parent
src_dir, out_dir = root / "originals", root / "images"

for src in sorted(src_dir.iterdir()):
    if src.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    img.thumbnail((MAX_SIZE, MAX_SIZE))

    w, h = img.size
    font = ImageFont.truetype(FONT, max(14, round(min(w, h) * 0.045)))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    left, top, right, bottom = draw.textbbox((0, 0), TEXT, font=font)
    margin = round(min(w, h) * 0.035)
    x, y = w - (right - left) - margin, h - (bottom - top) - margin - top
    draw.text((x + 1, y + 1), TEXT, font=font, fill=(0, 0, 0, 110))
    draw.text((x, y), TEXT, font=font, fill=(255, 255, 255, 170))
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

    exif = Image.Exif()
    exif[0x013B] = "Brie Myers"                                  # Artist
    exif[0x8298] = "© Brie Myers. All rights reserved."          # Copyright
    out = out_dir / (src.stem + ".jpeg")
    img.save(out, "JPEG", quality=85, exif=exif)
    print(f"{src.name} -> {out.relative_to(root)}")
