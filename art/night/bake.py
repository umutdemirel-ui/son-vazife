"""Kuzdağ night workshop. Photo-fitted solids, metre units, +Z front / -X head.
Run: python art/night/bake.py (NumPy, SciPy and Pillow). No network or runtime photogrammetry.
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "environment"))
from meshkit import Mesh, rect_uv, save_glb

OUT = HERE.parents[1] / "public/assets/night"
TAU = 2 * math.pi


def plate(key):
    revised = HERE.parent / "survival/reference" / (key + ".jpg")
    if key in {
        "mektep",
        "istasyon",
        "karabasma",
        "karabasma-back",
        "sis-gozcusu",
        "sis-gozcusu-back",
    }:
        return Image.open(revised).convert("RGB")
    return Image.open(HERE / "reference" / (key + ".jpg")).convert("RGB")


def samples(profile, stride):
    p = np.array(profile, dtype=float)
    return np.r_[
        *[
            np.linspace(a, b, max(1, math.ceil((b - a) / stride)), endpoint=False)
            for a, b in zip(p[:-1, 0], p[1:, 0], strict=True)
        ],
        p[-1, 0],
    ]


def section(profile, y):
    p = np.asarray(profile)
    return [np.interp(y, p[:, 0], p[:, j]) for j in range(1, p.shape[1])]


def skin(m, rings, tex, panel=None):
    # Keep smooth normals across the front/rear atlas seam. Duplicate only the UV seam.
    r = np.array(rings)
    rows, cols = r.shape[:2]
    around = np.roll(r, -1, axis=1) - np.roll(r, 1, axis=1)
    normals = np.cross(around, np.gradient(r, axis=0))
    normals /= np.maximum(1e-10, np.linalg.norm(normals, axis=2, keepdims=True))
    for j in range(rows - 1):
        for k in range(cols):
            l = (k + 1) % cols
            ids = [(j, k), (j, l), (j + 1, l), (j + 1, k)]
            side = panel(k, cols) if panel else False
            m.polygon(
                [r[i] for i in ids],
                [tex(*i, side) for i in ids],
                [normals[i] for i in ids],
            )
    for j in [0, rows - 1]:
        mid = r[j].mean(axis=0)
        for k in range(cols):
            l = (k + 1) % cols
            side = panel(k, cols) if panel else False
            order = [l, k] if j == 0 else [k, l]
            uv = [tex(j, i, side) for i in order]
            m.polygon([r[j, i] for i in order] + [mid], uv + [np.mean(uv, axis=0)])


# (height down the 160x287 fitting plate, left edge, right edge, half-depth, depth offset).
WARDROBE = {
    "karabasma": {
        "height": 2.29,
        "top": 11,
        "sole": 277,
        "center": 80,
        "coat": [
            (62, 68, 92, 9, 0),
            (72, 56, 105, 13, 0),
            (84, 52, 108, 15, 0),
            (109, 60, 100, 14, 0),
            (122, 61, 99, 12, 0),
            (135, 59, 101, 13, 0),
            (166, 55, 105, 16, 0),
            (203, 47, 112, 19, -1),
            (231, 42, 119, 22, -2),
            (240, 46, 117, 20, -2),
        ],
        "hood": [
            (11, 78, 81, 2, -3),
            (21, 74, 86, 6, -1),
            (38, 67, 92, 12, 0),
            (51, 64, 96, 15, 1),
            (67, 62, 98, 16, 0),
            (79, 66, 94, 14, 3),
            (85, 72, 89, 10, 9),
        ],
        "sleeve": [
            (72, 56, 69, 6, 0),
            (85, 49, 65, 9, 0),
            (106, 43, 58, 8, 0),
            (124, 39, 52, 7, 0),
            (145, 34, 48, 6, 0),
            (156, 35, 46, 5, 1),
            (174, 35, 43, 4, 1),
            (180, 38, 42, 2, 1),
        ],
        "boot": [
            (190, 57, 77, 9, -1),
            (219, 54, 75, 9, 0),
            (244, 56, 72, 8, 0),
            (256, 57, 72, 7, 2),
            (267, 55, 72, 10, 5),
            (274, 52, 70, 13, 6),
            (277, 53, 67, 11, 6),
        ],
    },
    "sis-gozcusu": {
        "height": 2.15,
        "top": 19,
        "sole": 275,
        "center": 80,
        "coat": [
            (59, 71, 89, 9, 0),
            (66, 59, 101, 13, 0),
            (83, 53, 107, 16, 0),
            (104, 60, 100, 14, 0),
            (128, 61, 100, 13, -1),
            (161, 55, 105, 16, -2),
            (207, 49, 112, 19, -2),
            (227, 48, 113, 20, -2),
            (231, 51, 110, 19, -2),
        ],
        "cape": [
            (55, 69, 91, 11, 0),
            (64, 59, 101, 17, 0),
            (78, 45, 115, 21, 0),
            (97, 32, 128, 25, 0),
            (102, 39, 121, 23, 0),
        ],
        "hood": [
            (19, 78, 83, 4, -1),
            (23, 73, 88, 9, 0),
            (31, 68, 93, 12, 0),
            (42, 66, 95, 14, 0),
            (55, 66, 95, 14, 0),
            (65, 71, 90, 12, 0),
            (71, 77, 85, 8, 1),
        ],
        "sleeve": [
            (77, 48, 60, 7, -2),
            (101, 41, 56, 8, 0),
            (122, 37, 50, 7, 1),
            (142, 35, 48, 7, 0),
            (155, 36, 47, 5, 1),
            (168, 39, 46, 4, 1),
            (174, 42, 46, 2, 1),
        ],
        "boot": [
            (182, 59, 79, 10, -1),
            (222, 57, 77, 9, 0),
            (243, 58, 74, 7, 1),
            (259, 57, 73, 7, 2),
            (268, 54, 73, 10, 5),
            (274, 53, 70, 12, 6),
            (275, 54, 68, 10, 6),
        ],
    },
}


def bleed_costume(im, neutral=False):
    # These four fitting photos have neutral studio sweeps. Hand/hem gaps would otherwise
    # project strips of grey onto the closed geometry, especially as mip levels blend.
    rgb = np.asarray(im)
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    if neutral:
        # The cooler studio plate is nearly monochrome: saturation alone would
        # mistake the pale hood for background and replace it with brown cloth.
        a = rgb.astype(float)
        left = np.median(a[:, :40], axis=1)[:, None, :]
        right = np.median(a[:, -40:], axis=1)[:, None, :]
        t = np.linspace(0, 1, im.width)[None, :, None]
        background = left * (1 - t) + right * t
        cloth = ndimage.binary_fill_holes(np.linalg.norm(a - background, axis=2) > 23)
        cloth = ndimage.binary_opening(cloth, iterations=2)
    else:
        cloth = ndimage.binary_erosion((hi - lo > 10) | (hi < 96), iterations=2)
    dist, nearest = ndimage.distance_transform_edt(~cloth, return_indices=True)
    pixels = rgb[tuple(nearest)]
    return Image.fromarray(
        np.where((dist < 50)[:, :, None], pixels, [49, 44, 38]).astype("uint8")
    )


def watcher(key, small):
    cfg = WARDROBE[key]
    u = cfg["height"] / (cfg["sole"] - cfg["top"])
    c = cfg["center"]
    meshes = []
    front, back = plate(key), plate(key + "-back")
    atlas = Image.new("RGB", (1024, 1400))
    # Crop away the unoccupied sides so the entire texture budget goes to the costume.
    for i, im in enumerate((front, back)):
        atlas.paste(
            bleed_costume(im, key == "sis-gozcusu")
            .crop(
                (round(28 / 160 * im.width), 0, round(132 / 160 * im.width), im.height)
            )
            .resize((512, 1400)),
            (i * 512, 0),
        )
    for part, name, flip in [
        ("coat", "coat", False),
        ("hood", "hood", False),
        ("sleeve", "sleeveR", False),
        ("sleeve", "sleeveL", True),
        ("boot", "bootR", False),
        ("boot", "bootL", True),
    ] + ([("cape", "cape", False)] if "cape" in cfg else []):
        prof = cfg[part]
        m = Mesh(name)
        meshes.append(m)
        ringlist = []
        texcoords = []
        ys = samples(
            prof, (9 if small else 4) if part == "hood" else 20 if small else 9
        )[::-1]
        n = (
            (16 if small else 32)
            if part in ("coat", "hood", "cape")
            else 12
            if small
            else 20
        )
        for j, y in enumerate(ys):
            a, b, d, off = section(prof, y)
            a, b = (2 * c - b, 2 * c - a) if flip else (a, b)
            ring = []
            coords = []
            for k in range(n):
                th = TAU * k / n
                s, co = math.sin(th), math.cos(th)
                x = (a + b) / 2 + (b - a) * s / 2
                z = off + d * co
                h = y
                if part in ("coat", "cape"):
                    hem = max(0, (y - prof[0][0]) / (prof[-1][0] - prof[0][0]))
                    z += co * math.cos(th * 9 + 0.7) * 2 * hem
                    h -= hem**4 * (1.8 * math.cos(11 * th) + 1.4 * math.sin(th * 5))
                if part == "hood" and co > 0:
                    if key == "sis-gozcusu":
                        z += 4.3 * math.exp(
                            -(((x - c) / 2.5) ** 2) - ((y - 46) / 6) ** 2
                        ) - 2.2 * math.exp(
                            -(((abs(x - c) - 4) / 2.7) ** 2) - ((y - 38) / 2.7) ** 2
                        )
                    else:
                        z -= 4 * math.exp(-(((x - c) / 7) ** 2) - ((y - 54) / 8) ** 2)
                ring.append([(x - c) * u, (cfg["sole"] - h) * u, z * u])
                coords.append(
                    (x - 1.3 * s**5, np.clip(y, prof[0][0] + 0.9, prof[-1][0] - 0.9))
                )
            ringlist.append(ring)
            texcoords.append(coords)

        def uv(j, k, rear):
            x, y = texcoords[j][k]
            if rear:
                x = 2 * c - x
                y = cfg["top"] + ((y - cfg["top"]) / (cfg["sole"] - cfg["top"])) * (
                    277 - cfg["top"]
                )
            return ((x - 28) / 208 + 0.5 * rear, y / 287)

        skin(m, ringlist, uv, lambda k, n: math.cos(TAU * (k + 0.5) / n) < 0)
    return meshes, atlas, (512, 640) if small else (1024, 1280)


# Longitudinal stations: x, near/far cloth silhouette (pixels in 430x240), height in metres.
# Heads, boots and the folded arms are closed separate islands; not a textured rectangular cover.
HEAD_A = [
    (20, 118, 125, 0.11),
    (24, 108, 135, 0.16),
    (32, 101, 141, 0.20),
    (42, 99, 142, 0.22),
    (55, 99, 142, 0.205),
    (65, 102, 140, 0.19),
    (70, 105, 136, 0.16),
    (73, 110, 131, 0.13),
    (84, 106, 137, 0.13),
]
HEAD_M = [
    (22, 115, 124, 0.12),
    (26, 105, 132, 0.18),
    (35, 100, 139, 0.215),
    (46, 99, 140, 0.223),
    (57, 100, 139, 0.21),
    (67, 104, 137, 0.194),
    (75, 108, 132, 0.162),
    (83, 108, 132, 0.142),
    (96, 104, 139, 0.145),
]
ARIF = [
    (79, 105, 139, 0.13),
    (83, 90, 153, 0.194),
    (90, 76, 166, 0.227),
    (104, 65, 177, 0.267),
    (128, 55, 188, 0.29),
    (160, 52, 193, 0.302),
    (191, 55, 190, 0.265),
    (212, 56, 182, 0.244),
    (225, 66, 183, 0.22),
    (242, 75, 181, 0.216),
    (277, 69, 180, 0.224),
    (315, 66, 181, 0.213),
    (351, 65, 180, 0.179),
    (381, 69, 173, 0.153),
    (386, 75, 167, 0.163),
    (401, 82, 160, 0.176),
    (413, 94, 150, 0.169),
    (418, 111, 135, 0.119),
]
MAHMUT = [
    (77, 109, 131, 0.13),
    (86, 87, 151, 0.2),
    (99, 67, 169, 0.243),
    (118, 62, 178, 0.277),
    (149, 53, 188, 0.288),
    (175, 52, 186, 0.265),
    (207, 55, 183, 0.245),
    (239, 56, 184, 0.226),
    (277, 55, 184, 0.22),
    (323, 55, 185, 0.197),
    (362, 57, 184, 0.165),
    (376, 59, 183, 0.157),
    (384, 90, 157, 0.13),
]
YOLCU = [
    (15, 112, 127, 0.10),
    (20, 97, 142, 0.169),
    (30, 89, 150, 0.196),
    (46, 85, 154, 0.229),
    (63, 86, 153, 0.23),
    (78, 92, 146, 0.194),
    (85, 96, 142, 0.158),
    (93, 70, 162, 0.206),
    (103, 60, 173, 0.243),
    (132, 56, 181, 0.264),
    (158, 55, 183, 0.279),
    (184, 58, 181, 0.27),
    (211, 65, 174, 0.247),
    (221, 70, 169, 0.224),
    (239, 72, 166, 0.235),
    (267, 77, 164, 0.213),
    (295, 82, 159, 0.194),
    (317, 84, 154, 0.179),
    (337, 88, 151, 0.165),
    (357, 92, 145, 0.146),
    (365, 98, 140, 0.126),
    (376, 94, 147, 0.151),
    (397, 92, 147, 0.161),
    (409, 93, 141, 0.14),
    (415, 104, 133, 0.099),
]


def body(key, small):
    im = plate(key)
    m = Mesh(key)
    meshes = [m]
    u = 1.94 / 400
    cx = 216
    cy = 121

    def envelope(prof, kind, mesh=m):
        N = (24 if kind == "head" else 16) if small else (48 if kind == "head" else 32)
        xs = samples(prof, 3 if kind == "head" else 11 if small else 5)
        rings = []
        uvs = []
        for j, x in enumerate(xs):
            a, b, h = section(prof, x)
            mid = (a + b) / 2
            r = (b - a) / 2
            pts = []
            qs = []
            for k in range(N):
                th = TAU * k / N
                s, co = math.sin(th), math.cos(th)
                v = mid + s * r
                height = 0.003 + (co + 1) * h / 2
                if co > 0 and kind == "head":
                    nose = 55 if key == "arif" else 58
                    height += co * (
                        0.030
                        * math.exp(-(((x - nose) / 5.1) ** 2) - ((v - cy) / 5.0) ** 2)
                        - 0.013
                        * math.exp(
                            -(((x - nose + 8) / 2.8) ** 2)
                            - ((abs(v - cy) - 8) / 3.1) ** 2
                        )
                        + 0.011
                        * math.exp(
                            -(((x - nose - 8) / 2.4) ** 2) - ((v - cy) / 5.6) ** 2
                        )
                    )
                if kind in ("cloth", "towel"):
                    height += (
                        max(co, 0)
                        * 0.008
                        * (
                            math.sin(0.1 * x + 0.07 * v)
                            + 0.7 * math.sin(0.17 * v - 0.03 * x)
                        )
                    )
                    height -= (
                        max(co, 0)
                        * 0.022
                        * math.exp(-(((v - cy) / 10) ** 2))
                        * min(1, max(0, (x - 230) / 35))
                    )
                pts.append(((x - cx) * u, height, (v - cy) * u * 0.88))
                qs.append(
                    (
                        np.clip(x, prof[0][0] + 0.75, prof[-1][0] - 0.75),
                        (
                            v - 1.6 * s**5
                            if co >= 0
                            else mid + math.copysign(r - 1.6, s or 1)
                        ),
                    )
                )
            rings.append(pts)
            uvs.append(qs)

        def uv(j, k, _):
            x, v = uvs[j][k]
            if kind == "towel":
                return (
                    (323 + (x - prof[0][0]) / (prof[-1][0] - prof[0][0]) * 59) / 430,
                    (82 + (v - 45) * 0.62) / 240,
                )
            return (x / 430, v / 240)

        skin(mesh, rings, uv)

    if key != "yolcu":
        envelope(HEAD_A if key == "arif" else HEAD_M, "head")
    envelope({"arif": ARIF, "mahmut": MAHMUT, "yolcu": YOLCU}[key], "cloth")
    if key == "arif":
        # A heavier folded towel settles OVER the already modest base wrap during preparation.
        wrap = Mesh("pestemal")
        meshes.append(wrap)
        xs = [163, 166, 180, 200, 215, 230, 255, 279, 286]
        envelope(
            [
                (
                    x,
                    section(ARIF, x)[0] - 2.5,
                    section(ARIF, x)[1] + 2.5,
                    section(ARIF, x)[2] + 0.018,
                )
                for x in xs
            ],
            "towel",
            wrap,
        )
    if key == "mahmut":
        for sign in [-1, 1]:
            prof = [
                (370, 26, 10, 0.105),
                (381, 33, 12, 0.13),
                (390, 36, 12, 0.161),
                (400, 43, 11, 0.174),
                (408, 46, 9, 0.15),
                (412, 46, 4, 0.10),
            ]
            envelope(
                [(x, cy + sign * o - r, cy + sign * o + r, h) for x, o, r, h in prof],
                "boot",
            )
    if key == "yolcu":
        # Parcel tag lies flat by the foot knot, separately from the shroud that is used for Arif.
        tag = Mesh("etiket")
        meshes.append(tag)
        points = [(346, 176), (363, 181), (371, 151), (354, 147)]
        tag.polygon(
            [
                ((x - cx) * u, 0.012 + (181 - v) * 0.0006, (v - cy) * u * 0.88)
                for x, v in points
            ],
            [(x / 430, v / 240) for x, v in points],
        )
    return meshes, im, (576, 320) if small else (1280, 704)


# Two walk-in facades. The centre is a real opening, not a painted black doorway.
def building(key, small):
    im = plate(key)
    m = Mesh(key)
    sch = key == "mektep"
    w, d, h = (11.4, 5.9, 3.74) if sch else (8.9, 4.9, 3.35)
    # UV coordinates in the corresponding 400 x 224 plate.
    left, right, top, bottom = (24, 376, 74, 189) if sch else (32, 368, 67, 190)
    dl, dr, dt = (180, 220, 95) if sch else (177, 222, 94)

    def rect(a, b, c, e):
        return (a / 400, b / 224, c / 400, e / 224)

    def xx(a):
        return (a - left) / (right - left) * w - w / 2

    def yy(b):
        return (bottom - b) / (bottom - top) * h

    stone = rect(left + 1, bottom - 14, left + 22, bottom - 2)
    plaster = rect(138, top + 4, 160, bottom - 18)
    wood = rect(dl - 5, dt + 4, dl - 2, bottom - 6)
    tile = rect(112, 52 if sch else 42, 249, 65 if sch else 56)

    def piece(a, b, c, e, thick, depth):
        X, Y, W, H = (
            (xx(a) + xx(c)) / 2,
            (yy(b) + yy(e)) / 2,
            xx(c) - xx(a),
            yy(b) - yy(e),
        )
        m.box((X, Y, depth - thick / 2), (W, H, thick), plaster)
        m.polygon(
            [
                (xx(a), yy(e), depth + 0.005),
                (xx(c), yy(e), depth + 0.005),
                (xx(c), yy(b), depth + 0.005),
                (xx(a), yy(b), depth + 0.005),
            ],
            rect_uv(rect(a, b, c, e)),
        )

    piece(left, top, dl, bottom, 0.15, d / 2)
    piece(dr, top, right, bottom, 0.15, d / 2)
    piece(dl, top, dr, dt, 0.15, d / 2)
    for sign in [-1, 1]:
        m.box((sign * (w / 2 - 0.075), h / 2, 0), (0.15, h, d - 0.22), plaster)
    m.box((0, h / 2, -d / 2 + 0.07), (w, h, 0.14), plaster)
    m.box((0, 0.045, 0), (w, 0.09, d), stone)
    for sign in [-1, 1]:
        for z in [-d * 0.29, d * 0.09]:
            m.box(
                (sign * (w / 2 + 0.012), h * 0.54, z),
                (0.04, 1.55, 1.05),
                rect(53, 93 if sch else 96, 86, 149 if sch else 156),
            )
    # Windowsills, lintel, projecting eaves and brick chimney silhouette.
    for x in [71, 122, 280, 329] if sch else [115, 296]:
        m.box(
            (xx(x), yy(152 if sch else 159) - 0.035, d / 2 + 0.052),
            (0.98, 0.085, 0.18),
            stone,
        )
    for x in [dl - 1.3, dr + 1.3]:
        m.box((xx(x), yy(dt) / 2, d / 2 + 0.018), (0.085, yy(dt), 0.10), wood)
    m.box((0, yy(dt) + 0.10, d / 2 + 0.05), (xx(dr) - xx(dl) + 0.34, 0.105, 0.20), wood)
    m.box((0, h + 0.025, 0), (w + 0.55, 0.14, d + 0.65), wood)
    ex = w / 2 + 0.38
    ez = d / 2 + 0.38
    ridge = ex - 1.58
    y = h + 0.08
    hi = y + 1.02
    fl = (-ex, y, ez)
    fr = (ex, y, ez)
    bl = (-ex, y, -ez)
    br = (ex, y, -ez)
    a = (-ridge, hi, 0)
    b = (ridge, hi, 0)
    for vertices in [(fl, fr, b, a), (br, bl, a, b), (fr, br, b), (bl, fl, a)]:
        m.polygon(vertices, rect_uv(tile)[: len(vertices)])
    if sch:
        m.box((1.15, h + 1.18, -0.2), (0.28, 0.88, 0.33), stone)
        m.box((1.15, h + 1.65, -0.2), (0.34, 0.09, 0.39), stone)
    return [m], im, (640, 352) if small else (1280, 704)


def exchange(small):
    im = plate("santral")
    m = Mesh("santral")
    rect = (0.16, 0.08, 0.856, 0.929)
    side = (0.167, 0.60, 0.188, 0.83)
    m.box((0, 0.78, 0), (1.02, 1.56, 0.45), side)
    m.box((0, 1.58, 0), (1.07, 0.064, 0.49), side)
    m.polygon(
        [
            (-0.50, 0.012, 0.227),
            (0.50, 0.012, 0.227),
            (0.50, 1.55, 0.227),
            (-0.50, 1.55, 0.227),
        ],
        rect_uv(rect),
    )
    for x in [-0.476, 0.476]:
        m.box((x, 0.81, 0.232), (0.026, 1.46, 0.038), side)
    return [m], im, (320, 512) if small else (704, 1024)


if __name__ == "__main__":
    for small in [False, True]:
        for key in [
            "karabasma",
            "sis-gozcusu",
            "arif",
            "mahmut",
            "yolcu",
            "mektep",
            "istasyon",
            "santral",
        ]:
            meshes, im, size = (
                watcher(key, small)
                if key in WARDROBE
                else building(key, small)
                if key in ("mektep", "istasyon")
                else exchange(small)
                if key == "santral"
                else body(key, small)
            )
            save_glb(key, meshes, im, size, OUT / "compact" if small else OUT)
            print(
                key,
                "compact" if small else "full",
                sum(len(m.indices) // 3 for m in meshes),
            )
