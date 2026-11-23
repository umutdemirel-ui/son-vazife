"""Produce bounded, repeatable game-ready colour/normal textures from the art plates."""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
REF = Path(__file__).parent / "reference"
OUT = ROOT / "public/assets/village"

for name, source in [
    ("mud-road", "muddy-road"),
    ("worn-plaster", "aged-plaster"),
    ("wet-flagstone", "wet-stone"),
]:
    image = (
        Image.open(REF / f"{source}.jpg")
        .convert("RGB")
        .resize((768, 768), Image.Resampling.LANCZOS)
    )
    image.save(OUT / f"{name}.webp", quality=84, method=6)
    image.resize((384, 384), Image.Resampling.LANCZOS).save(
        OUT / "compact" / f"{name}.webp", quality=79, method=6
    )
    # Subtle normal derived from luminance, calculated with wrapped borders for repeat sampling.
    h = (
        gaussian_filter(np.asarray(image.convert("L"), dtype=float), 1.4, mode="wrap")
        / 255
    )
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 1.1
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 1.1
    normal = np.stack([-dx, dy, np.ones_like(dx)], axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    Image.fromarray(np.uint8(np.clip((normal * 0.5 + 0.5) * 255, 0, 255))).resize(
        (512, 512), Image.Resampling.LANCZOS
    ).save(OUT / f"{name}-normal.webp", quality=83, method=6)
