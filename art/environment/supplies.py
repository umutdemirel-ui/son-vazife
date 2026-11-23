"""Metre-scale inventory still life: chased copper, bound paper, folded linen and olive soap."""

import math

import numpy as np
from meshkit import OUT, REF, Mesh, save_glb
from PIL import Image

atlas = Image.new("RGB", (1024, 1024))


def plate(name, x, y, thumb, box):
    im = Image.open(REF / (name + ".jpg")).convert("RGB")
    s = im.width / thumb
    im = im.crop(tuple(round(n * s) for n in box))
    atlas.paste(im.resize((512, 512), Image.Resampling.LANCZOS), (x, y))

    def uv(u, v):
        return ((x + 3 + 506 * u) / 1024, (y + 3 + 506 * v) / 1024)

    return uv


copper = plate("ibrik", 0, 0, 440, (85, 35, 379, 416))
cloth = plate("kefen", 512, 0, 500, (82, 54, 416, 285))
leather = plate("defter", 0, 512, 295, (36, 54, 263, 386))
soap = plate("tas-sabun", 512, 512, 500, (121, 40, 378, 236))


def cu(x, y):
    return copper((x - 85) / 294, (y - 35) / 381)


def turned(m, profile, xc=217, steps=36):
    rings = [
        [
            (r * math.sin(i * math.tau / steps), 412 - y, r * math.cos(i * math.tau / steps))
            for i in range(steps)
        ]
        for y, r in profile
    ]
    rings = np.array(rings) * 0.00117

    def uv(j, i):
        return cu(xc + profile[j][1] * 0.94 * math.sin(i * math.tau / steps), profile[j][0])

    m.skin(rings, uv)
    for j in [0, len(rings) - 1]:
        ind = list(range(steps)) if j == len(rings) - 1 else list(range(steps))[::-1]
        m.polygon([rings[j, i] for i in ind], [uv(j, i) for i in ind])


def build(compact):
    m = Mesh("ibrik", 0.47, 0.32)
    turned(
        m,
        [
            (411, 58),
            (408, 65),
            (403, 68),
            (398, 66),
            (394, 59),
            (385, 55),
            (379, 58),
            (372, 70),
            (360, 78),
            (342, 87),
            (324, 91),
            (301, 89),
            (281, 82),
            (260, 68),
            (235, 51),
            (214, 41),
            (187, 33),
            (179, 34),
            (176, 37),
            (173, 36),
            (171, 33),
            (146, 36),
            (121, 39),
            (101, 42),
            (96, 43),
            (91, 44),
            (88, 43),
        ],
        steps=18 if compact else 36,
    )
    turned(
        m,
        [
            (89, 45),
            (88, 48),
            (85, 48),
            (83, 43),
            (78, 41),
            (70, 36),
            (63, 28),
            (60, 19),
            (56, 8),
            (50, 5),
            (46, 9),
            (42, 8),
            (40, 3),
        ],
        steps=16 if compact else 32,
    )

    # Sweep non-circular handles and a tapered hollow pouring lip through the reference profile.
    def tube(points):
        a = np.array(points, dtype=float)
        rings = []
        cols = 8 if compact else 14
        for j, (x, y, r, rz) in enumerate(a):
            tangent = a[min(len(a) - 1, j + 1), :2] - a[max(0, j - 1), :2]
            tangent /= np.linalg.norm(tangent)
            rings.append(
                [
                    [
                        (x - 217 - tangent[1] * r * math.sin(i * math.tau / cols)) * 0.00117,
                        (412 - y - tangent[0] * r * math.sin(i * math.tau / cols)) * 0.00117,
                        rz * math.cos(i * math.tau / cols) * 0.00117,
                    ]
                    for i in range(cols)
                ]
            )
        m.skin(
            rings,
            lambda j, i: cu(
                np.clip(a[j, 0] + a[j, 2] * 0.55 * math.sin(i * math.tau / cols), 87, 370), a[j, 1]
            ),
        )

    tube(
        [
            (130, 323, 5, 6),
            (128, 306, 3.2, 4),
            (134, 284, 2.8, 4),
            (136, 256, 2.8, 4),
            (127, 229, 3, 4),
            (111, 201, 3.4, 4.5),
            (100, 177, 4.2, 5),
            (97, 152, 4.5, 5),
            (102, 131, 4, 5),
            (114, 116, 4, 5),
            (134, 103, 4, 5),
            (155, 98, 5, 6),
            (177, 97, 7, 6),
        ]
    )
    tube(
        [
            (287, 313, 14, 19),
            (303, 301, 16, 16),
            (320, 281, 15, 15),
            (324, 259, 13, 14),
            (322, 230, 10, 12),
            (319, 199, 9, 10),
            (316, 168, 8.5, 10),
            (317, 143, 8, 9),
            (323, 125, 8.5, 10),
            (335, 110, 9, 11),
            (349, 100, 10, 12),
            (361, 94, 9, 13),
            (361.5, 93.6, 6.2, 9),
            (355, 98, 5.5, 8),
        ]
    )

    # Each folded sheet and cover has side walls, bevel rings and a solid top and base.
    def cushion(m, w, d, rings, uv, n=32, exp=0.21, wrinkle=0, topwarp=None):
        n = max(12, n // 2) if compact else n
        cross = []
        for i in range(n):
            t = i * math.tau / n
            ss, cc = math.sin(t), math.cos(t)
            cross.append((math.copysign(abs(ss) ** exp, ss), math.copysign(abs(cc) ** exp, cc)))
        rr = []
        for j, (y, scale, dx, dz) in enumerate(rings):
            loop = []
            for i, (a, b) in enumerate(cross):
                amt = wrinkle * (math.sin(i * 2.57 + j * 0.8) + 0.3 * math.cos(i * 0.74))
                loop.append(
                    (
                        dx + a * (w * 0.5 * scale + amt),
                        y + wrinkle * 0.4 * math.sin(i * 2.01),
                        dz + b * d * 0.5 * scale,
                    )
                )
            rr.append(loop)
        m.skin(
            rr, lambda j, i: uv(0.50 + 0.485 * cross[i % n][0], 0.976 - j * 0.013 + 0.005 * cross[i % n][1])
        )

        def face(j, up):
            # Radial tessellation lets the cord pull the middle of the linen down without skewing the UVs.
            center = np.array([rings[j][2], rings[j][0], rings[j][3]])
            previous = None
            for f in [1, 0.56] if compact else [1, 0.78, 0.53, 0.27]:
                loop = [center + f * (np.asarray(p) - center) for p in rr[j]]
                uvs = [uv(0.5 + 0.49 * f * a, 0.5 + 0.49 * f * b) for a, b in cross]
                if topwarp and up:
                    for p in loop:
                        p[1] += topwarp(p[0], p[2]) * (1 - f * 0.55)
                if previous:
                    for i in range(n):
                        k = (i + 1) % n
                        points = [previous[0][i], previous[0][k], loop[k], loop[i]]
                        v = [previous[1][i], previous[1][k], uvs[k], uvs[i]]
                        m.polygon(points if up else points[::-1], v if up else v[::-1])
                previous = loop, uvs
            if up and topwarp:
                center[1] += topwarp(center[0], center[2])
            for i in range(n):
                k = (i + 1) % n
                p = [previous[0][i], previous[0][k], center]
                v = [previous[1][i], previous[1][k], uv(0.5, 0.5)]
                m.polygon(p if up else p[::-1], v if up else v[::-1])

        face(0, False)
        face(-1, True)

    def rect(f, a, b, c, d):
        return (*f(a, b), *f(c, d))

    book = Mesh("defter", 0.77)
    pageuv = rect(cloth, 0.05, 0.925, 0.43, 0.95)
    book.box((0.002, 0.023, 0.001), (0.262, 0.033, 0.342), pageuv)
    book.box((0, 0.003, 0), (0.278, 0.006, 0.36), rect(leather, 0.03, 0.60, 0.55, 0.82))
    book.box((-0.133, 0.024, 0), (0.014, 0.048, 0.356), rect(leather, 0.015, 0.01, 0.067, 0.98))
    cushion(
        book, 0.278, 0.36, [(0.039, 0.997, 0, 0), (0.044, 1, 0, 0), (0.047, 0.993, 0, 0)], leather, 24, 0.104
    )
    linen = Mesh("kefen", 0.99)
    for j, (w, d, dx, dz) in enumerate(
        [(0.46, 0.343, -0.002, 0), (0.452, 0.336, 0.004, -0.003), (0.447, 0.328, -0.003, -0.001)]
    ):
        y = 0.045 * j
        cushion(
            linen,
            w,
            d,
            [
                (y + 0.002, 0.96, dx, dz),
                (y + 0.009, 0.998, dx, dz),
                (y + 0.032, 1.008, dx, dz),
                (y + 0.047, 0.966, dx, dz),
            ],
            cloth,
            40,
            0.19,
            0.0016,
            lambda x, z: 0.009 * math.sin(23 * x + 8 * z) - 0.008 * math.exp(-abs(x) * 74),
        )
    # The knot and cord continue around the sides; the top strands are in the scan.
    linen.box((0, 0.065, 0.166), (0.008, 0.13, 0.006), rect(cloth, 0.496, 0.04, 0.502, 0.30))
    linen.box((0, 0.065, -0.166), (0.008, 0.13, 0.006), rect(cloth, 0.496, 0.04, 0.502, 0.30))
    bar = Mesh("sabun", 0.61)
    cushion(
        bar,
        0.234,
        0.171,
        [
            (0, 0.90, 0, 0),
            (0.008, 0.976, 0, 0),
            (0.041, 1, 0.001, 0),
            (0.048, 0.967, 0, 0),
            (0.052, 0.90, 0, 0),
        ],
        soap,
        32,
        0.24,
        0.0009,
    )
    meshes = [m, book, linen, bar]
    save_glb(
        "emanet", meshes, atlas, (512, 512) if compact else (1024, 1024), OUT / "compact" if compact else OUT
    )
    print("emanet:", sum(len(m.indices) // 3 for m in meshes), "triangles")


if __name__ == "__main__":
    for compact in (False, True):
        build(compact)
