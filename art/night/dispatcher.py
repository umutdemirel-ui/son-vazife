"""The last platform keeper. A stopped clock under a railway cap, not a recoloured villager.
Three solids (uniform, clock, signalling arm), assembled at the same pivots in both tiers.
"""

import math

import numpy as np
from bake import OUT, Mesh, plate, save_glb
from PIL import Image, ImageDraw, ImageFont


def atlas():
    im = Image.new("RGB", (768, 768), "#282b29")

    def swatch(key, area, dst, tint):
        source = plate(key)
        x, y, u, v = area
        w, h = source.size
        crop = source.crop((int(w * x), int(h * y), int(w * u), int(h * v))).resize(
            (244, 244), Image.Resampling.LANCZOS
        )
        grey = np.mean(np.array(crop), axis=2)[:, :, None]
        data = np.clip(grey * np.array(tint)[None, None, :] + [7, 7, 6], 0, 255)
        im.paste(Image.fromarray(data.astype("uint8")), dst)

    swatch("karabasma-back", (0.40, 0.50, 0.62, 0.68), (5, 5), (0.73, 0.88, 1.04))
    swatch("sis-gozcusu-back", (0.38, 0.60, 0.57, 0.79), (259, 5), (0.67, 0.71, 0.62))
    swatch("santral", (0.25, 0.76, 0.53, 0.91), (514, 5), (1.54, 1.22, 0.79))
    # Weathered enamel dial: the two HANDS, not a text label, give the time 22:42.
    d = ImageDraw.Draw(im)
    rng = np.random.default_rng(2242)
    noise = rng.normal(0, 3, (476, 476, 1))
    dial = np.uint8(np.clip(np.array([202, 188, 158]) + noise, 0, 255))
    im.paste(Image.fromarray(dial), (6, 272))
    d = ImageDraw.Draw(im)
    x, y = 244, 510

    def polar(a, r):
        return (x + math.sin(a) * r, y - math.cos(a) * r)

    for r in [214, 208, 161]:
        d.ellipse((x - r, y - r, x + r, y + r), outline="#766750", width=2)
    for i in range(60):
        a = i * math.tau / 60
        d.line(
            [polar(a, 202), polar(a, 187 if i % 5 else 180)],
            fill="#302d28",
            width=4 if i % 5 == 0 else 2,
        )
    font = ImageFont.truetype("DejaVuSerif.ttf", 36)
    for i in range(12):
        d.text(
            polar(i * math.tau / 12, 142),
            str(i or 12),
            font=font,
            fill="#302f2c",
            anchor="mm",
        )
    d.text(
        (x, y - 66),
        "KUZDAĞ",
        font=ImageFont.truetype("DejaVuSerif.ttf", 20),
        fill="#70614e",
        anchor="mm",
    )
    d.text(
        (x, y + 77),
        "1973",
        font=ImageFont.truetype("DejaVuSansMono.ttf", 18),
        fill="#736550",
        anchor="mm",
    )
    for a, r, width in [
        ((10 + 42 / 60) * math.tau / 12, 102, 12),
        (42 * math.tau / 60, 174, 8),
    ]:
        d.line([polar(a, -29), polar(a, r)], fill="#242723", width=width)
    d.ellipse((x - 10, y - 10, x + 10, y + 10), fill="#9a7946")
    d.rectangle((518, 270, 760, 511), fill="#d4c5a8")
    d.ellipse((533, 285, 746, 498), fill="#93483f", outline="#ad6e54", width=4)
    d.text(
        (639, 389),
        "DUR",
        font=ImageFont.truetype("DejaVuSans-Bold.ttf", 52),
        fill="#dbc9a5",
        anchor="mm",
    )
    return im


def region(x, y, u, v):
    return np.array([x, y, u, v]) / 768


WOOL = region(9, 9, 244, 244)
LEATHER = region(264, 11, 495, 244)
METAL = region(522, 12, 751, 243)
DIAL = region(18, 284, 470, 736)
SIGNAL = region(519, 271, 759, 510)


def sections(m, profile, uv, n):
    angle = np.arange(n) * math.tau / n
    rings = []
    for y, x, z, w, d in profile:
        rings.append(
            np.array([x + w * np.sin(angle), np.full(n, y), z + d * np.cos(angle)]).T
        )
    m.skin(
        rings,
        lambda j, i: (
            uv[0] + (uv[2] - uv[0]) * i / n,
            uv[3] - (uv[3] - uv[1]) * j / (len(rings) - 1),
        ),
    )
    for j in [0, -1]:
        points = rings[j] if j == -1 else rings[j][::-1]
        m.polygon(
            points,
            [
                (
                    uv[0] + (uv[2] - uv[0]) * (0.5 + 0.48 * math.sin(i * math.tau / n)),
                    uv[1] + (uv[3] - uv[1]) * (0.5 + 0.48 * math.cos(i * math.tau / n)),
                )
                for i in range(n)
            ],
        )


def medallion(m, x, y, z, rx, ry, depth, face, rim, n):
    # +Z front (the dial keeps its numbers upright); bevel catches the practical lights.
    rings = []
    for dz, scale in [(-depth, 0.91), (-depth + 0.006, 1), (0, 1), (0.007, 0.94)]:
        rings.append(
            [
                (
                    x + math.cos(i * math.tau / n) * rx * scale,
                    y + math.sin(i * math.tau / n) * ry * scale,
                    z + dz,
                )
                for i in range(n)
            ]
        )
    m.skin(
        rings,
        lambda j, i: (
            rim[0] + (rim[2] - rim[0]) * i / n,
            rim[1] + (rim[3] - rim[1]) * j / 3,
        ),
    )
    for j, region in [(-1, face), (0, rim)]:
        order = list(range(n)) if j == -1 else list(reversed(range(n)))
        m.polygon(
            [rings[j][i] for i in order],
            [
                (
                    region[0]
                    + (region[2] - region[0])
                    * (0.5 + 0.497 * math.cos(i * math.tau / n)),
                    region[1]
                    + (region[3] - region[1])
                    * (0.5 - 0.497 * math.sin(i * math.tau / n)),
                )
                for i in order
            ],
        )


def build(small):
    body = Mesh("uniforma")
    clock = Mesh("saat")
    arm = Mesh("isaret")
    n = 12 if small else 24
    for s in [-1, 1]:
        sections(
            body,
            [
                (0.010, s * 0.118, 0.033, 0.09, 0.16),
                (0.042, s * 0.118, 0.032, 0.092, 0.161),
                (0.093, s * 0.118, 0.03, 0.079, 0.138),
                (0.164, s * 0.118, -0.012, 0.066, 0.083),
                (0.26, s * 0.12, -0.012, 0.068, 0.077),
            ],
            LEATHER,
            n,
        )
        sections(
            body,
            [
                (0.14, s * 0.119, -0.015, 0.083, 0.093),
                (0.22, s * 0.117, -0.015, 0.077, 0.09),
                (0.46, s * 0.12, 0.003, 0.087, 0.102),
                (0.55, s * 0.12, -0.012, 0.103, 0.101),
                (0.65, s * 0.117, -0.016, 0.096, 0.103),
                (0.93, s * 0.103, -0.005, 0.121, 0.129),
                (1.06, s * 0.095, -0.005, 0.116, 0.115),
            ],
            WOOL,
            n,
        )
    sections(
        body,
        [
            (0.83, 0, -0.005, 0.243, 0.153),
            (0.86, 0, -0.006, 0.243, 0.153),
            (0.99, 0, -0.01, 0.225, 0.149),
            (1.16, 0, -0.003, 0.193, 0.133),
            (1.23, 0, 0, 0.19, 0.128),
            (1.41, 0, 0, 0.233, 0.147),
            (1.54, 0, 0, 0.252, 0.135),
            (1.586, 0, 0, 0.211, 0.114),
            (1.62, 0, 0, 0.108, 0.091),
            (1.665, 0, 0, 0.091, 0.083),
        ],
        WOOL,
        n,
    )
    sections(
        body, [(1.143, 0, 0, 0.201, 0.137), (1.196, 0, 0, 0.198, 0.136)], LEATHER, n
    )
    body.box((0, 1.17, 0.138), (0.088, 0.043, 0.015), METAL)
    for s in [-1, 1]:
        body.polygon(
            [
                (s * 0.04, 1.61, 0.080),
                (s * 0.136, 1.558, 0.108),
                (s * 0.064, 1.429, 0.15),
            ],
            [(WOOL[0], WOOL[1]), (WOOL[2], WOOL[1]), (WOOL[0], WOOL[3])],
        )
        body.box((s * 0.15, 1.352, 0.119), (0.129, 0.032, 0.024), WOOL)
        for y, z in [(1.25, 0.129), (1.39, 0.138), (1.50, 0.13)]:
            medallion(body, s * 0.084, y, z, 0.012, 0.012, 0.009, METAL, METAL, 12)
    sleeve = [
        (-0.568, 0.089, 0.121, 0.052, 0.06),
        (-0.522, 0.086, 0.117, 0.061, 0.068),
        (-0.46, 0.081, 0.103, 0.066, 0.066),
        (-0.29, 0.068, 0.041, 0.077, 0.082),
        (-0.244, 0.062, 0.024, 0.077, 0.078),
        (-0.15, 0.051, 0.016, 0.086, 0.089),
        (-0.038, 0.012, 0, 0.095, 0.092),
        (0.015, 0, 0, 0.077, 0.083),
    ]
    for s, m in [(1, body), (-1, arm)]:
        # Moving arm is authored in shoulder-local space. The other sleeve is stitched into the body mesh.
        x, y = (0.215, 1.546) if s == 1 else (0, 0)
        sections(
            m, [(y + h, x + s * dx, z, w, d) for h, dx, z, w, d in sleeve], WOOL, n
        )
        sections(
            m,
            [
                (y - 0.541, x + s * 0.087, 0.119, 0.061, 0.067),
                (y - 0.524, x + s * 0.086, 0.117, 0.064, 0.070),
            ],
            METAL,
            n,
        )
        sections(
            m,
            [
                (y - 0.72, x + s * 0.097, 0.135, 0.027, 0.033),
                (y - 0.696, x + s * 0.096, 0.142, 0.049, 0.046),
                (y - 0.645, x + s * 0.095, 0.146, 0.048, 0.054),
                (y - 0.61, x + s * 0.091, 0.138, 0.052, 0.054),
                (y - 0.553, x + s * 0.089, 0.121, 0.040, 0.044),
            ],
            LEATHER,
            n,
        )
    # 1930s-style railway cap and the enamel clock housing replace the head entirely.
    sections(
        clock,
        [
            (-0.07, 0, -0.018, 0.063, 0.066),
            (-0.037, 0, -0.013, 0.085, 0.08),
            (0.01, 0, -0.01, 0.082, 0.084),
        ],
        LEATHER,
        n,
    )
    medallion(clock, 0, 0.063, 0.09, 0.124, 0.145, 0.172, DIAL, METAL, n * 2)
    sections(
        clock,
        [
            (0.156, 0, -0.001, 0.135, 0.116),
            (0.187, 0, 0, 0.136, 0.121),
            (0.212, 0, -0.003, 0.158, 0.143),
            (0.241, 0, -0.009, 0.144, 0.137),
            (0.253, 0, -0.013, 0.106, 0.095),
        ],
        WOOL,
        n,
    )
    sections(
        clock,
        [(0.161, 0, 0.002, 0.138, 0.117), (0.176, 0, 0.002, 0.139, 0.12)],
        METAL,
        n,
    )
    sections(
        clock,
        [(0.151, 0, 0.071, 0.137, 0.108), (0.159, 0, 0.069, 0.135, 0.106)],
        LEATHER,
        n,
    )
    medallion(clock, 0, 0.204, 0.137, 0.024, 0.018, 0.01, METAL, METAL, 12)
    sections(
        arm,
        [(-0.955, -0.096, 0.147, 0.017, 0.017), (-0.604, -0.095, 0.147, 0.018, 0.018)],
        LEATHER,
        8,
    )
    medallion(arm, -0.096, -1.048, 0.151, 0.131, 0.131, 0.026, SIGNAL, METAL, n * 2)
    return [body, clock, arm]


if __name__ == "__main__":
    texture = atlas()
    for small in [False, True]:
        save_glb(
            "peron-sefi",
            build(small),
            texture,
            (384, 384) if small else (768, 768),
            OUT / "compact" if small else OUT,
        )
