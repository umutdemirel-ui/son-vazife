"""Build four-sided houses from measured elevations. Coordinates below are plate pixels,
not world units. Recessed lights, projecting bays and the hipped roofs are geometry."""

import math
from itertools import pairwise

import numpy as np
from meshkit import REF, Mesh, bake, rect_uv
from PIL import Image

# x extents, y stations (bottom -> eave), roof edge/ridge, chimney, joinery, flank crop ranges.
HOUSES = {
    "cumba": (
        (38, 462),
        [(375, 0), (284, 1.99), (229, 2.76), (112, 4.82)],
        (17, 482, 101, 182, 318, 40),
        (-1.82, -0.6),
        [(176, 112, 324, 231, 0.45), (198, 286, 251, 373, -0.12), (354, 336, 387, 371, -0.08)]
        + [(x, 128, x + 35, 197, 0.045) for x in (191, 233, 274)]
        + [(x, 133, x + 23, 193, -0.095) for x in (197, 239, 280)],
        [(39, 174), (326, 459)],
    ),
    "himis": (
        (65, 435),
        [(264, 0), (183, 2.08), (80, 4.23)],
        (42, 458, 69, 188, 314, 27),
        (-1.75, -0.52),
        [(184, 188, 227, 263, -0.115), (174, 173, 240, 187, 0.22), (319, 192, 368, 231, 0.075)]
        + [(x, 95, x + 33, 147, -0.095) for x in (121, 240, 355)]
        + [(x, 97, x + 11, 145, 0.085) for x in (108, 152, 228, 272, 343, 388)],
        [(66, 172), (287, 434)],
    ),
    "tas": (
        (73, 427),
        [(299, 0), (279, 0.24), (169, 2.32), (112, 3.34)],
        (50, 450, 102, 236, 290, 59),
        (-1.08, -0.35),
        [
            (283, 169, 338, 279, -0.15),
            (273, 158, 344, 168, 0.08),
            (151, 166, 201, 232, -0.12),
            (131, 169, 149, 228, 0.11),
            (202, 170, 220, 226, 0.13),
            (224, 115, 273, 137, -0.12),
        ],
        [(75, 263), (75, 220)],
    ),
}


def build(name, cfg):
    (L, R), stations, (rx, rr, ry, l, r, ty), (cx, cz), details, flanks = cfg
    photo = Image.open(REF.parents[1] / "survival/reference" / (("tas-ev" if name == "tas" else name) + ".jpg")).convert("RGB")
    H = photo.height * 500 / photo.width
    # Projection plate in the upper 3/4; separate timber, stone and roof samples in the apron.
    atlas = Image.new("RGB", (1024, 1024))
    atlas.paste(photo.resize((1024, 768), Image.Resampling.LANCZOS), (0, 0))

    def patch(box, x0, x1):
        p = photo.crop(tuple(round(v * photo.width / 500) for v in box))
        atlas.paste(p.resize((x1 - x0, 256)), (x0, 768))
        return ((x0 + 4) / 1024, 0.756, (x1 - 4) / 1024, 0.995)

    timber = patch(
        {"cumba": (199, 291, 247, 366), "himis": (192, 197, 222, 255), "tas": (139, 176, 147, 218)}[name],
        0,
        256,
    )
    # A clean run of aged oak for corbels/eaves; do not paint each soffit the door colour.
    boards = (
        Image.open(REF.parents[2] / "public/assets/village/aged-planks.webp")
        .crop((10, 42, 748, 145))
        .convert("RGB")
    )
    boards = Image.fromarray(np.uint8(np.asarray(boards, dtype=float) * [0.69, 0.64, 0.55]))
    atlas.paste(boards.resize((256, 256)), (0, 768))
    stone = patch(
        {"cumba": (44, 298, 183, 373), "himis": (68, 249, 167, 263), "tas": (78, 237, 266, 290)}[name],
        256,
        512,
    )
    tile = patch((l + 3, ty + 3, r - 3, ry - 5), 512, 1024)
    m = Mesh(name)
    top = stations[-1][0]
    bot = stations[0][0]
    eave = stations[-1][1]
    depth = 5

    def v(x, y):
        return (x / 500, y / H * 0.75)

    ys, hs = zip(*stations[::-1], strict=True)

    def h(y):
        return float(np.interp(y, ys, hs))

    def wall(face, x0, x1, a, b, features):
        """Rectilinear depth field: omit hidden back-faces and emit actual reveals between levels."""
        span = 6 if face % 2 == 0 else depth
        theta = face * math.pi / 2

        def point(x, y, z):
            u = -span / 2 + span * (a + (b - a) * (x - x0) / (x1 - x0))
            w = (depth if face % 2 == 0 else 6) / 2 + z
            return [
                math.cos(theta) * u + math.sin(theta) * w,
                h(y),
                -math.sin(theta) * u + math.cos(theta) * w,
            ]

        feats = [
            (max(x0, x), max(top, t), min(x1, r), min(bot, s), d)
            for x, t, r, s, d in features
            if r > x0 and x < x1 and s > top and t < bot
        ]
        xs = sorted({x0, x1, *[n for x, _, r, _, _ in feats for n in (x, r)]})
        yy = sorted({*ys, *[n for _, t, _, s, _ in feats for n in (t, s)]})
        dz = np.zeros((len(yy) - 1, len(xs) - 1))
        for j, (t, s) in enumerate(pairwise(yy)):
            for i, (x, r) in enumerate(pairwise(xs)):
                dz[j, i] = sum(
                    d for l, v, r2, b, d in feats if l <= (x + r) / 2 < r2 and v <= (t + s) / 2 < b
                )
        for j, (t, s) in enumerate(pairwise(yy)):
            i = 0
            while i < len(xs) - 1:
                k = i + 1
                z = dz[j, i]
                while k < len(xs) - 1 and dz[j, k] == z:
                    k += 1
                l, r = xs[i], xs[k]
                p = [(l, s), (r, s), (r, t), (l, t)]
                m.polygon([point(x, y, z) for x, y in p], [v(x, y) for x, y in p])
                i = k
            for i, (x, r) in enumerate(pairwise(xs)):
                z = dz[j, i]
                for jj, ii, seg in [
                    (j, i - 1, [(x, t), (x, s)]),
                    (j, i + 1, [(r, s), (r, t)]),
                    (j - 1, i, [(r, t), (x, t)]),
                    (j + 1, i, [(x, s), (r, s)]),
                ]:
                    adj = dz[jj, ii] if 0 <= ii < len(xs) - 1 and 0 <= jj < len(yy) - 1 else 0
                    if adj >= z:
                        continue
                    a1, a2 = seg
                    m.polygon(
                        [point(*a1, z), point(*a1, adj), point(*a2, adj), point(*a2, z)],
                        rect_uv((0.11, 0.26, 0.32, 0.39) if name == "cumba" and z - adj > 0.3 else timber),
                    )

    wall(0, L, R, 0, 1, details)
    for side in (1, 2, 3):
        for i, reg in enumerate(flanks if side % 2 else flanks[::-1]):
            wall(side, *reg, i / 2, (i + 1) / 2, details)
    if name == "cumba":
        # Side casements are set into independent thick window frames; there is no bay on the flank.
        for sign in [-1, 1]:
            for off in [-1.05, 1.1]:
                m.box((sign * 3.027, 3.80, off), (0.075, 1.16, 0.79), timber)
                x = sign * 3.074
                p = [
                    (x, 3.255, off + sign * 0.366),
                    (x, 3.255, off - sign * 0.366),
                    (x, 4.345, off - sign * 0.366),
                    (x, 4.345, off + sign * 0.366),
                ]
                m.polygon(p, [v(x, y) for x, y in rect_uv((191, 127, 226, 198))])
        for x in (-0.98, 0, 0.98):
            m.box((x, 2.50, 2.70), (0.105, 0.71, 0.13), timber, angle=0.66)
    door = {"cumba": 224, "himis": 206, "tas": 311}[name]
    m.box(((door - L) / (R - L) * 6 - 3, 0.065, 2.63), (1.18, 0.13, 0.51), stone)
    # Full four sloping roof faces, deep timber soffit, ridge cap and chimney lip.
    X, W = 3.34, 3.07 if name == "cumba" else 2.88
    rise = {"cumba": 1.25, "himis": 1.17, "tas": 0.98}[name]
    y = eave + 0.15
    ridge = 1.14
    m.box((0, eave + 0.018, 0), (X * 2, 0.22, W * 2), timber)
    for s in [-1, 1]:
        m.polygon(
            [(-s * X, y, s * W), (s * X, y, s * W), (s * ridge, y + rise, 0), (-s * ridge, y + rise, 0)],
            [v(x, u) for x, u in [(rx + 4, ry), (rr - 5, ry), (r - 2, ty + 2), (l + 2, ty + 2)]],
        )
        m.polygon(
            [(s * X, y, s * W), (s * X, y, -s * W), (s * ridge, y + rise, 0)],
            [(tile[0], tile[3]), (tile[2], tile[3]), ((tile[0] + tile[2]) / 2, tile[1])],
        )
    # Pantile lips break the ruler-straight silhouette at the two long eaves.
    for sign in (-1, 1):
        count = 34
        breadth = 2 * X / count
        for i in range(count):
            for j in range(4):
                pts = []
                for angle, dz in [
                    (j * math.pi / 4, 0),
                    (j * math.pi / 4, 0.16),
                    ((j + 1) * math.pi / 4, 0.16),
                    ((j + 1) * math.pi / 4, 0),
                ]:
                    pts.append(
                        (
                            sign * (-X + (i + 0.5) * breadth + math.cos(angle) * breadth * 0.45),
                            y + 0.008 + math.sin(angle) * 0.043 + dz * 0.26,
                            sign * (W + 0.045 - dz),
                        )
                    )
                m.polygon(pts, rect_uv(tile))
    m.box((0, y + rise, 0), (2 * ridge + 0.10, 0.10, 0.16), tile)
    cy = y + rise * (1 - abs(cz) / W)
    m.box((cx, cy + 0.09, cz), (0.38, 1.15, 0.44), stone)
    m.box((cx, cy + 0.68, cz), (0.49, 0.11, 0.55), stone)
    m.box((cx, cy + 0.744, cz), (0.24, 0.027, 0.27), timber)
    bake(name, [m], atlas)


if __name__ == "__main__":
    for name, cfg in HOUSES.items():
        build(name, cfg)
