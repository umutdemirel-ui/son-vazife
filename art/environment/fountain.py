"""Cut-stone hayrat: back wall, recessed tympanum, voussoirs, coping and a hollow trough."""

import math

from meshkit import REF, Mesh, bake, rect_uv
from PIL import Image, ImageDraw, ImageFilter

im = Image.open(REF / "hayrat.jpg")
w = 440 * im.width / im.height
# Remove the photographed tap and arch shadow before putting real projecting stones and a tap in front.
# Keep lime scale and the damp streak, not a second spout beneath the first.
sc = im.height / 440
reg = lambda b: tuple(round(n * sc) for n in b)
mask = Image.new("L", im.size)
ImageDraw.Draw(mask).ellipse(reg((109, 259, 135, 302)), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(3))
im.paste(im.transform(im.size, Image.Transform.AFFINE, (1, 0, round(22 * sc), 0, 1, 0)), (0, 0), mask)
m = Mesh("hayrat")


def uv(x, y):
    return (x / w, y / 440)


def sample(x, t, r, b):
    return (*uv(x, t), *uv(r, b))


side = sample(16, 106, 45, 178)
cap = sample(16, 31, 229, 43)
soil = sample(36, 359, 211, 391)


def ashlar(x, y, z, b, h, d, reg, top=side):
    # Map the dressed front face separately from cut sides and top bed.
    pts = [
        (x - b / 2, y, z + d / 2),
        (x + b / 2, y, z + d / 2),
        (x + b / 2, y + h, z + d / 2),
        (x - b / 2, y + h, z + d / 2),
    ]
    m.polygon(pts, rect_uv(reg))
    back = [(a, bt, c - d) for a, bt, c in pts]
    m.polygon(back[::-1], rect_uv(side))
    for i in range(4):
        k = (i + 1) % 4
        m.polygon([pts[i], back[i], back[k], pts[k]], rect_uv(top if i == 2 else side))


# Match the metric arch's spring and crown in the backing; no second outline underneath it.
for y, h, t, b in [(-0.03, 1.33, 186, 354), (1.30, 1.064, 83, 186), (2.364, 0.206, 48, 83)]:
    ashlar(0, y, -0.438, 2.37, h, 0.45, sample(15, t, 230, b))
ashlar(0, 2.54, -0.42, 2.48, 0.105, 0.65, cap)
ashlar(0, 2.645, -0.42, 2.56, 0.052, 0.70, cap)
# piers and radiating voussoirs are individual stones in a single primitive.
for s in (-1, 1):
    for j in range(3):
        ashlar(
            s * 0.985,
            0.020 + j * 0.40,
            -0.196,
            0.38,
            0.394,
            0.17,
            sample(17 if s < 0 else 194, 300 - j * 47, 50 if s < 0 else 230, 343 - j * 47),
        )
    ashlar(s * 0.995, 1.20, -0.185, 0.46, 0.105, 0.20, sample(15, 187, 56, 204))
for i in range(11):
    a = i * math.pi / 11 + 0.003
    b = (i + 1) * math.pi / 11 - 0.003
    key = i == 5

    def ring(rad, t):
        return (rad * math.cos(t), 1.30 + rad * math.sin(t))

    inn = 0.758
    outer = 1.035 + (0.046 if key else 0)
    pts = [ring(inn, a), ring(outer, a), ring(outer, b), ring(inn, b)]
    z = -0.101 + (0.022 if key else 0)
    m.polygon([(x, y, z) for x, y in pts], [uv(122 + x * 91, 186 - (y - 1.30) * 97) for x, y in pts])
    for j in range(4):
        k = (j + 1) % 4
        m.polygon([(*pts[j], z), (*pts[j], -0.222), (*pts[k], -0.222), (*pts[k], z)], rect_uv(side))
# Front coping top +.56, right soap ledge top +1.20, all in existing target coordinates.
ashlar(0, 0, 0.27, 2.04, 0.17, 0.99, soil)
ashlar(0, 0.16, 0.66, 2.04, 0.40, 0.24, soil)
ashlar(0, 0.51, 0.66, 2.10, 0.05, 0.265, sample(30, 353, 211, 361))
for s in (-1, 1):
    ashlar(s * 0.936, 0.16, 0.17, 0.168, 0.40, 0.79, soil)
ashlar(0.72, 1.105, 0.095, 0.48, 0.095, 0.48, side)
bake("hayrat", [m], im, (512, 1024), (256, 512))
