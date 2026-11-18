"""Offline color finishes for Kuzdağ, derived from the bundled CC0 scans only."""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

p = Path(__file__).resolve().parents[2] / "public/assets"
src = p / "cc0/textures"
out = p / "village"


def scan(name, size):
    return np.asarray(
        Image.open(src / name / "Diffuse.jpg").convert("RGB").resize((size, size), Image.Resampling.LANCZOS),
        dtype=float,
    )


def write(name, rgb):
    Image.fromarray(np.uint8(np.clip(rgb, 0, 255))).save(out / (name + ".webp"), quality=85, method=6)


def lum(a):
    return np.sum(a * [0.26, 0.59, 0.15], axis=-1)


# Closed, periodic noise fields keep the weathering continuous at UV repeats.
rng = np.random.default_rng(1993)
a = scan("clay_plaster", 768)
v = lum(a)
m = gaussian_filter(v, 8, mode="wrap")


def grain(sigma):
    noise = gaussian_filter(rng.normal(0, 1, v.shape), sigma, mode="wrap")
    return (noise - noise.mean()) / max(1e-5, noise.std())


weather = grain(31) * 0.58 + grain(9) * 0.26 + grain(2.3) * 0.14 + grain(0.45) * 0.06
chip = np.clip((weather - 0.86) * 3.2, 0, 1)
gain = 182 + (v - v.mean()) * 0.88 + (v - m) * 0.85 + weather * 6 - chip * 38 + grain(0.65) * 2.8
write("limewash", gain[..., None] * [1.04, 1.014, 0.962] + chip[..., None] * [6, 1, -4])
rock = np.asarray(
    Image.open(p / "cc0/models/rock_04/textures/rock_04_diff_1k.jpg")
    .convert("RGB")
    .resize((512, 512), Image.Resampling.LANCZOS),
    dtype=float,
)
cut = 169 + (lum(rock) - lum(rock).mean()) * 0.80
write("cut-limestone", cut[..., None] * [1.035, 1.018, 0.961])
a = scan("clay_roof_tiles_02", 768)
v = lum(a)[..., None]
write("pantile", 0.62 * a + 0.38 * v + [0, 12, 16])
a = scan("cobblestone_02", 1024)
v = lum(a)[..., None]
write("lane-cobble", a * 0.24 + v * 0.76 + [12, 10, 9])
a = scan("brown_mud_leaves_01", 1024)
v = lum(a)[..., None]
write("forest-floor", a * 0.55 + v * 0.45 + [8, 9, 9])
a = scan("brown_planks_04", 768)
v = lum(a)[..., None]
write("aged-planks", a * 0.48 + v * 0.52 + [5, 6, 4])
