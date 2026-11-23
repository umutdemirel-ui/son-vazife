"""Shared atlas for the five objects the player actually handles in the outer wards.
The brass, leather and canvas swatches are cut from this project's own source plates.
No external font or asset request in the game. Run after bake.py.
"""

import math

import numpy as np
from bake import HERE, OUT, Mesh, plate, rect_uv, save_glb
from PIL import Image, ImageDraw, ImageFont


def build_atlas():
    im = Image.new("RGB", (1024, 1024), "#3e3934")
    rng = np.random.default_rng(73)
    yy, xx = np.indices((288, 1008))
    v = np.clip(
        41 + 5 * np.sin(xx * 0.017 + np.sin(0.022 * yy)) + rng.normal(0, 4, xx.shape),
        26,
        61,
    )
    slate = Image.fromarray(np.uint8(np.stack([v * 0.83, v * 1.1, v], axis=2)))
    im.paste(slate, (8, 8))
    d = ImageDraw.Draw(im)
    serif = ImageFont.truetype("DejaVuSerif.ttf", 33)
    mono = ImageFont.truetype("DejaVuSansMono.ttf", 18)
    d.text((52, 26), "16 Kasım, Cuma", font=serif, fill="#b5b5a1")
    d.line((53, 78, 402, 76), fill="#9b9c8e", width=2)
    d.text((56, 111), "SON YOKLAMA", font=mono, fill="#a9ad9c")
    d.text((57, 156), "Ders başı      ·", font=mono, fill="#9fa196")
    d.text((56, 200), "Yolcu          ·  —  ·", font=mono, fill="#b4b4a2")
    for j in range(3):
        line = [
            (
                492 + i * 5,
                175
                + j * 18
                - 32 * math.sin(i * 0.05 + j)
                - 21 * math.cos(i * 0.144 + j * 1.4),
            )
            for i in range(91)
        ]
        d.line(line, fill=["#69776b", "#627166", "#687469"][j], width=2)
    d.line(
        [(754, 201), (754, 165), (781, 146), (810, 166), (810, 201), (754, 201)],
        fill="#989f86",
        width=2,
    )
    d.line((762, 200, 762, 178, 775, 178, 775, 200), fill="#8d977f", width=2)
    d.text((712, 220), "Kuzdağ, 1973", font=mono, fill="#999f8e")

    def swatch(name, region, box, shade=1, env=False):
        pic = (
            Image.open(HERE.parent / "environment/reference" / (name + ".jpg"))
            if env
            else plate(name)
        )
        w, h = pic.size
        patch = pic.crop(
            tuple(int(c * (w if i % 2 == 0 else h)) for i, c in enumerate(region))
        ).resize((box[2] - box[0], box[3] - box[1]), Image.Resampling.LANCZOS)
        im.paste(
            Image.fromarray(np.uint8(np.clip(np.asarray(patch) * shade, 0, 255))), box
        )

    swatch("santral", (0.18, 0.76, 0.85, 0.87), (4, 308, 250, 557))
    swatch("karabasma-back", (0.37, 0.48, 0.51, 0.65), (260, 308, 506, 557), 0.86)
    swatch("sis-gozcusu-back", (0.33, 0.25, 0.64, 0.35), (516, 308, 761, 557), 0.88)
    swatch("ibrik", (0.39, 0.62, 0.57, 0.72), (771, 308, 1020, 557), 1, True)
    # Colour-shift the photographed wood/metal, don't paint a second instrument on its sides.
    base = Image.fromarray(
        np.uint8(
            np.clip(
                np.stack(
                    [np.asarray(im.crop((4, 308, 250, 557))).mean(axis=2) * 0.70 + 53]
                    * 3,
                    axis=2,
                ),
                0,
                255,
            )
        )
    )
    im.paste(base.resize((248, 222)), (4, 565))
    d = ImageDraw.Draw(im)
    d.rectangle((260, 565, 504, 785), fill="#ddd0ad")
    d.rectangle((271, 578, 492, 771), outline="#8c7250", width=2)
    d.text((280, 596), "KUZDAĞ", font=serif, fill="#433d30")
    d.text((281, 657), "KARAYOLU · II", font=mono, fill="#5d4b3b")
    d.text((281, 716), "16 XI 1973", font=mono, fill="#7f473a")
    d.line((274, 699, 490, 699), fill="#83725c", width=1)
    # Rotary dial: true circular metal rim surrounding the numbered finger holes.
    d.rectangle((517, 562, 768, 813), fill="#302e29")
    d.ellipse((525, 570, 761, 806), fill="#aa9e83", outline="#c9c1a9", width=5)
    d.ellipse((579, 624, 707, 752), fill="#e4d9bf", outline="#706853", width=4)
    d.text((614, 668), "06", font=serif, fill="#4c463a")
    nfont = ImageFont.truetype("DejaVuSans.ttf", 12)
    for i in range(10):
        a = (i * 27 + 40) * math.pi / 180
        u, v = 643 + 91 * math.cos(a), 688 + 91 * math.sin(a)
        d.ellipse(
            (u - 13, v - 13, u + 13, v + 13), fill="#2f302a", outline="#e5d7b6", width=2
        )
        d.text((u, v), str(i), font=nfont, fill="#e8dac0", anchor="mm")
    # Tape recorder face: VU scale, grid of speaker holes and two real turning spools on top.
    d.rectangle((775, 566, 1019, 812), fill="#938f82")
    d.rectangle((793, 714, 857, 753), fill="#dccca7", outline="#302e29", width=3)
    d.line((800, 737, 848, 731), fill="#6c5a45", width=1)
    d.line((826, 748, 838, 724), fill="#94392e", width=2)
    for j in range(6):
        for i in range(14):
            d.ellipse(
                (881 + i * 7, 716 + j * 6, 883 + i * 7, 718 + j * 6), fill="#403f39"
            )
    d.text((793, 774), "KUZDAĞ  /  02", font=nfont, fill="#353731")
    return im


def rect(x, y, r, b):
    return (x / 1024, y / 1024, r / 1024, b / 1024)


WOOD, BLACK, CANVAS, BRASS, STEEL, PAPER, DIAL, DECK = [
    rect(*v)
    for v in [
        (8, 315, 244, 550),
        (265, 315, 500, 550),
        (520, 314, 755, 549),
        (779, 316, 1011, 550),
        (12, 570, 245, 782),
        (264, 568, 499, 780),
        (521, 566, 765, 810),
        (776, 567, 1018, 811),
    ]
]


def disc(m, x, y, z, profile, uv, n=20, top=None):
    th = np.arange(n) * 2 * math.pi / n
    rings = np.array(
        [
            np.array([x + r * np.sin(th), np.full(n, y + h), z + r * np.cos(th)]).T
            for h, r in profile
        ]
    )
    m.skin(
        rings,
        lambda j, i: (
            uv[0] + (uv[2] - uv[0]) * i / n,
            uv[3] - (uv[3] - uv[1]) * j / (len(profile) - 1),
        ),
    )
    for row, es in [(0, list(reversed(range(n)))), (-1, list(range(n)))]:
        t = top or uv
        m.polygon(
            [rings[row, i] for i in es],
            [
                (
                    t[0] + (t[2] - t[0]) * (0.5 + 0.49 * math.sin(th[i])),
                    t[1] + (t[3] - t[1]) * (0.5 + 0.49 * math.cos(th[i])),
                )
                for i in es
            ],
        )


def props(small):
    n = 12 if small else 24
    board = Mesh("tahta")
    board.box((0, 0.66, 0), (4.05, 1.32, 0.08), WOOD)
    p = [
        (-1.966, 0.051, 0.043),
        (1.966, 0.051, 0.043),
        (1.966, 1.267, 0.043),
        (-1.966, 1.267, 0.043),
    ]
    board.polygon(p, rect_uv(rect(10, 10, 1012, 293)))
    board.box((0, 0.033, 0.036), (4.09, 0.057, 0.16), WOOD)
    bag = Mesh("heybe")
    # Soft gussets, shaped handles, a doubled flap, aged straps and a protruding railway ticket.
    N = 16 if small else 28
    th = np.arange(N) * 2 * math.pi / N
    rings = []
    for y, w, h in [
        (0.003, 0.216, 0.084),
        (0.026, 0.24, 0.102),
        (0.135, 0.252, 0.109),
        (0.213, 0.236, 0.091),
        (0.251, 0.185, 0.067),
    ]:
        rings.append(
            np.array(
                [
                    np.sign(np.sin(th)) * np.abs(np.sin(th)) ** 0.6 * w,
                    np.full(N, y),
                    np.sign(np.cos(th)) * np.abs(np.cos(th)) ** 0.6 * h,
                ]
            ).T
        )
    bag.skin(
        np.array(rings),
        lambda j, i: (
            CANVAS[0]
            + (CANVAS[2] - CANVAS[0]) * (0.5 + 0.49 * math.sin(i * math.tau / N)),
            CANVAS[3] - (CANVAS[3] - CANVAS[1]) * j / 4,
        ),
    )
    bag.box((0, 0.182, 0.093), (0.45, 0.12, 0.023), CANVAS, angle=-0.18)
    for sign in [-1, 1]:
        bag.box((sign * 0.138, 0.135, 0.112), (0.031, 0.157, 0.012), WOOD)
        bag.box((sign * 0.138, 0.123, 0.122), (0.039, 0.036, 0.012), BRASS)
        bag.box((sign * 0.078, 0.277, -0.031), (0.023, 0.080, 0.02), WOOD)
    bag.box((0, 0.313, -0.03), (0.166, 0.021, 0.025), WOOD)
    bag.box((0.07, 0.256, 0.03), (0.111, 0.087, 0.005), PAPER, angle=-0.25)
    reel = Mesh("makara", 0.64, 0.14)
    reel.box((0, 0.059, 0), (0.69, 0.118, 0.44), BLACK)
    reel.box((0, 0.123, 0), (0.658, 0.024, 0.419), STEEL, DECK)
    for side in [-1, 1]:
        x = side * 0.149
        z = -0.064
        disc(
            reel,
            x,
            0.135,
            z,
            [(0, 0.109), (0.012, 0.118), (0.028, 0.099), (0.043, 0.115)],
            STEEL,
            n,
        )
        disc(reel, x, 0.178, z, [(0, 0.020), (0.011, 0.018)], BRASS, n)
        for i in range(3):
            a = i * math.tau / 3 + 0.42
            disc(
                reel,
                x + math.cos(a) * 0.062,
                0.1784,
                z + math.sin(a) * 0.062,
                [(0, 0.028), (0.001, 0.027)],
                BLACK,
                10,
            )
    for i in range(5):
        reel.box(
            (-0.156 + i * 0.058, 0.146, 0.168),
            (0.051, 0.042, 0.069),
            PAPER if i != 4 else BLACK,
            angle=0.13,
        )
    phone = Mesh("telefon", 0.48, 0.10)
    phone.box((0, 0.045, 0), (0.284, 0.09, 0.23), BLACK)
    phone.box((0, 0.103, 0.006), (0.262, 0.063, 0.198), BLACK, angle=0.14)
    disc(phone, 0, 0.135, 0.028, [(0, 0.076), (0.009, 0.070)], BRASS, 32, DIAL)
    phone.box((0, 0.172, -0.076), (0.286, 0.041, 0.057), BLACK)
    for side in [-1, 1]:
        disc(
            phone,
            side * 0.139,
            0.119,
            -0.076,
            [(0, 0.049), (0.012, 0.051), (0.035, 0.04), (0.061, 0.028)],
            BLACK,
            n,
        )
    bell = Mesh("can", 0.53, 0.44)
    disc(
        bell,
        0,
        0,
        0,
        [
            (0, 0.143),
            (0.012, 0.147),
            (0.024, 0.138),
            (0.053, 0.117),
            (0.103, 0.098),
            (0.174, 0.082),
            (0.205, 0.059),
            (0.212, 0.026),
        ],
        BRASS,
        n,
    )
    disc(bell, 0, 0, 0, [(-0.032, 0.021), (0, 0.017)], BLACK, n)
    for key in range(2):
        bell.box((key * 0.022 - 0.011, 0.24, 0), (0.009, 0.052, 0.012), BLACK)
    return [board, bag, reel, phone, bell]


if __name__ == "__main__":
    im = build_atlas()
    for small in [True, False]:
        save_glb(
            "gece-esyasi",
            props(small),
            im,
            (512, 512) if small else (1024, 1024),
            OUT / "compact" if small else OUT,
        )
