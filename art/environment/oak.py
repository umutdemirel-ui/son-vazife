"""Key the locally generated tree reference into compact game-ready WebP cutouts.

The reference is a fictional generated image, not a downloaded or third-party scan.
Requires Pillow; no work is performed in the browser.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
image = Image.open(root / 'art/environment/reference/autumn-oak.png').convert('RGB').crop((160, 0, 1250, 768))
rgba = []
for r, g, b in image.getdata():
    # Magenta spill is absent from the dark bark and leaves. Feather the key,
    # and remove the remaining coloured fringe from semi-transparent pixels.
    key = min(r, b) - g
    alpha = round(255 * max(0.0, min(1.0, (175 - key) / 140)))
    if alpha < 255 and alpha > 0:
        a = alpha / 255
        r = round(max(0, min(255, (r - (1-a)*255) / a)))
        g = round(max(0, min(255, (g - (1-a)*28) / a)))
        b = round(max(0, min(255, (b - (1-a)*255) / a)))
    # Remove key-colour spill without flattening the warm brown bark: magenta
    # needs *both* red and blue to exceed green, which the bark does not.
    spill = max(0, min(r - g, b - g) - 8)
    r = max(0, r - spill)
    b = max(0, b - spill)
    rgba.append((r, g, b, alpha))
cutout = Image.new('RGBA', image.size)
cutout.putdata(rgba)
for filename, width in [('public/assets/village/autumn-oak.webp', 1024), ('public/assets/village/compact/autumn-oak.webp', 512)]:
    height = round(cutout.height * width / cutout.width)
    cutout.resize((width, height), Image.Resampling.LANCZOS).save(root / filename, 'WEBP', quality=85, method=6)
