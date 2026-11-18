"""Shipping textures. Compact packs decode small; the client never resamples a full-size source."""

import numpy as np
from meshkit import REF, ROOT
from PIL import Image
from scipy.ndimage import gaussian_filter

v = ROOT / "public/assets/village"
sm = v / "compact"
sm.mkdir(exist_ok=True)
im = Image.open(REF / "gasil.jpg")
scale = im.width / 500
im.crop(tuple(round(a * scale) for a in (52, 90, 449, 247))).resize(
    (1024, 512), Image.Resampling.LANCZOS
).save(v / "gasil-siva.webp", quality=88)
tile = Image.open(REF / "cini.jpg").resize((768, 768), Image.Resampling.LANCZOS)
tile.save(v / "cini.webp", quality=85)
a = np.asarray(tile, dtype=float).mean(axis=-1)
a = gaussian_filter(a, 0.8, mode="wrap")
dx = (np.roll(a, -1, 1) - np.roll(a, 1, 1)) * 0.015
dy = (np.roll(a, -1, 0) - np.roll(a, 1, 0)) * 0.015
n = np.stack([-dx, dy, np.ones_like(dx)], axis=-1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
Image.fromarray(np.uint8((0.5 * n + 0.5) * 255)).save(v / "cini-normal.webp", quality=83)
# Fine burnishing and slip bands in fired earthenware; reflected ripples over a submerged stone bed.
rng = np.random.default_rng(1954)
y, x = np.mgrid[0:256, 0:256]
grain = rng.normal(0, 1, (256, 256))
clay = (
    194
    + 4 * np.sin(y * 0.45)
    + 7 * gaussian_filter(grain, 2)
    + grain * 3
    - 15 * np.exp(-(((y - 48) / 2) ** 2))
    - 9 * np.exp(-(((y - 54) / 1.5) ** 2))
)
Image.fromarray(np.uint8(np.clip(clay[..., None] * [1.04, 0.96, 0.86], 0, 255))).save(
    v / "testi.webp", quality=83
)
bottom = np.asarray(Image.open(v / "fieldstone.webp").convert("L").resize((384, 256)), dtype=float)
y, x = np.mgrid[0:256, 0:384]
dist = np.hypot((x - 190) * 0.73, y - 104)
ripple = np.sin(dist * 0.28 + np.sin(x * 0.04) * 0.40) * np.exp(-dist / 63) * 11
water = (
    88
    + gaussian_filter(bottom - bottom.mean(), 1.1) * 0.28
    + ripple
    + 2 * np.sin(y * 0.37 + x * 0.02)
    + 5 * np.sin(x * 0.036 + y * 0.041)
)
Image.fromarray(np.uint8(np.clip(water[..., None] * [0.86, 1.0, 0.96] + [4, 9, 7], 0, 255))).save(
    v / "yalak-su.webp", quality=85
)
board = np.asarray(Image.open(v / "aged-planks.webp").crop((7, 42, 759, 144)).resize((512, 128)), dtype=float)
Image.fromarray(np.uint8(np.clip((board - 120) * 1.7 + [141, 126, 109], 0, 255))).save(
    v / "mese.webp", quality=88
)
for p in sorted(v.glob("*.webp")):
    if "normal" in p.stem or "rough" in p.stem:
        continue
    im = Image.open(p)
    im.thumbnail((384, 384), Image.Resampling.LANCZOS)
    im.save(sm / p.name, quality=81, method=6)
# Resize normal/roughness data once offline, in linear space. Renormalize resized normals.
for name, folder in [
    ("lane-cobble", "cobblestone_02"),
    ("forest-floor", "brown_mud_leaves_01"),
    ("limewash", "clay_plaster"),
    ("pantile", "clay_roof_tiles_02"),
    ("aged-planks", "brown_planks_04"),
]:
    d = REF.parent / "cc0/textures" / folder
    a = (
        np.asarray(
            Image.open(d / "nor_gl.jpg").convert("RGB").resize((512, 512), Image.Resampling.LANCZOS),
            dtype=float,
        )
        / 127.5
        - 1
    )
    a /= np.maximum(0.001, np.linalg.norm(a, axis=-1, keepdims=True))
    Image.fromarray(np.uint8(np.clip(a * 127.5 + 127.5, 0, 255))).save(
        v / (name + "-normal.webp"), quality=85
    )
    if name in ("lane-cobble", "forest-floor"):
        Image.open(d / "Rough.jpg").convert("L").resize((384, 384), Image.Resampling.LANCZOS).save(
            v / (name + "-rough.webp"), quality=78
        )

# Single PBR-free atlas for the one-draw district shells. 4px of edge padding per 128px cell.
atlas = Image.new("RGB", (512, 512), "white")
for i, n in enumerate(
    [
        "limewash",
        "fieldstone",
        "pantile",
        "aged-planks",
        "cini",
        "cut-limestone",
        "plank-door",
        "sash",
        "gasil-siva",
        "testi",
        "yalak-su",
    ]
):
    a = np.asarray(Image.open(v / (n + ".webp")).convert("RGB").resize((120, 120), Image.Resampling.LANCZOS))
    atlas.paste(
        Image.fromarray(np.pad(a, ((4, 4), (4, 4), (0, 0)), mode="edge")), ((i % 4) * 128, (i // 4) * 128)
    )
atlas.save(sm / "dis-kabuk.webp", quality=84)
