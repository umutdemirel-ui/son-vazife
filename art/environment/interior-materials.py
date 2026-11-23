"""Bake project-generated reference surfaces into the two runtime texture sizes."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
for source, name in [('gasil-ceramic.png', 'mortuary-ceramic'), ('office-panel.png', 'office-panel')]:
    image = Image.open(root / 'art/environment/reference' / source).convert('RGB')
    for sub, size in [('', 1024), ('compact/', 512)]:
        image.resize((size, size), Image.Resampling.LANCZOS).save(
            root / f'public/assets/village/{sub}{name}.webp', quality=82, method=6)
