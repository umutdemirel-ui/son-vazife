"""Bake four metre-scale, +Z-facing, skinned glTF 2.0 residents. Offline only.
Run from anywhere: python art/residents/bake.py (Pillow, numpy, scipy).
The shipped GLBs include the albedo, skin, sockets and both looping clips.
"""

import io
import itertools
import json
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image
from profiles import RESIDENTS
from scipy.interpolate import LinearNDInterpolator
from scipy.ndimage import binary_fill_holes, distance_transform_edt
from scipy.spatial import cKDTree

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "public/assets/residents"
REFERENCE = HERE.parent / "survival/reference"
FACES = json.loads((HERE / "face-relief.json").read_text())
# Crop in the coordinate system used by the tailoring profiles.
LEFT, TOP, PANEL_W, PANEL_H = 90, 25, 211, 540


def reference(name):
    return Image.open(REFERENCE / f"{name}.jpg").convert("RGB")


def patch_back(name, front, cfg):
    """Tailor the reverse of the two work jackets without mirroring a face or lapels.
    Reuse creases from Hasan's plain rear panel; sample each wearer's own cloth.
    """
    donor = np.asarray(reference("bekci-back").resize(front.size), dtype=float)
    own = np.asarray(front, dtype=float)
    h, w, _ = own.shape
    s = w / 390
    y, x = np.indices((h, w), dtype=float) / s

    def sample(a, u, v):
        return a[np.clip((v * s).astype(int), 0, h - 1), np.clip((u * s).astype(int), 0, w - 1)]

    def mirror_tile(v, period):
        return np.abs(np.mod(v, 2 * period) - period)

    clerk = name == "kenan"
    y1, y2 = (76, 107) if clerk else (87, 113)
    sy = np.interp(
        y,
        [cfg["head"][0][0], y1, y2, 140, 313, 326, 367, 425, 520, 561],
        [35, 76, 103, 140, 325, 345, 365, 421, 518, 561],
    )
    scale_x = np.interp(
        y,
        [64, 111, 144, 208, 308, 350, 425, 555],
        [1.03, 1.02, 1.08, 1.16, 1.22, 1.2, 1.15, 1.08]
        if clerk
        else [1.03, 1.04, 1.08, 1.12, 1.1, 1.08, 1.04, 1],
    )
    base = sample(donor, 197 + (x - cfg["center"]) * scale_x, sy)
    value = base.mean(axis=-1, keepdims=True)
    # Pixels outside the donor silhouette are UV padding, not light cloth.
    folds = np.where(value < 148, np.clip(0.48 + value / 96, 0.54, 1.48), 0.78)
    coat = (
        sample(
            own, (147 if clerk else 144) + mirror_tile(x, 16), (156 if clerk else 201) + mirror_tile(y, 27)
        )
        * folds
    )
    pants = sample(own, 152 + mirror_tile(x, 22), 373 + mirror_tile(y, 35)) * np.clip(
        0.42 + value / 85, 0.6, 1.22
    )
    hair = sample(
        own, (184 if clerk else 186) + mirror_tile(x, 15), (35 if clerk else 48) + mirror_tile(y, 5)
    )
    if clerk:  # dark, thinning hair around the nape instead of a cap brim
        hair = np.minimum(hair, [106, 100, 90])
    result = np.where((y < y1)[..., None], hair * np.clip(folds, 0.75, 1.2), base)
    result = np.where(((y >= y2) & (y < 326))[..., None], coat, result)
    result = np.where(((y >= 326) & (y < (528 if clerk else 490)))[..., None], pants, result)
    # Restrict the bare hand to the actual palm, not the coat or trouser seam.
    palm = (np.abs(x - cfg["center"]) > (54 if clerk else 59)) & (y >= 314) & (y < 351)
    result = np.where(palm[..., None], sample(own, 122 + mirror_tile(x, 9), 318 + mirror_tile(y, 12)), result)
    return Image.fromarray(np.uint8(np.clip(result, 0, 255)))


def pad_silhouette(image):
    """Extend cloth into the studio matte: mip levels and grazing views must not show a grey rim."""
    a = np.asarray(image, dtype=float)
    _h, w, _ = a.shape
    left = np.median(a[:, int(0.18 * w) : int(0.23 * w)], axis=1)[:, None, :]
    right = np.median(a[:, int(0.77 * w) : int(0.82 * w)], axis=1)[:, None, :]
    u = np.clip((np.arange(w) / w - 0.205) / 0.59, 0, 1)[None, :, None]
    bg = left * (1 - u) + right * u
    foreground = binary_fill_holes(np.linalg.norm(a - bg, axis=2) > 39)
    nearest = distance_transform_edt(~foreground, return_distances=False, return_indices=True)
    return Image.fromarray(a[nearest[0], nearest[1]].astype("uint8"))


def atlas(name, cfg):
    front = reference(name)
    rear_path = REFERENCE / f"{name}-back.jpg"
    rear = reference(name + "-back") if rear_path.exists() else patch_back(name, front, cfg)
    front = pad_silhouette(front)
    if rear_path.exists():
        rear = pad_silhouette(rear)
    plate = Image.new("RGB", (2 * PANEL_W * 2, PANEL_H * 2))
    for i, image in enumerate((front, rear)):
        s = image.width / 390
        rect = tuple(round(v * s) for v in (LEFT, TOP, LEFT + PANEL_W, TOP + PANEL_H))
        panel = image.crop(rect).resize((PANEL_W * 2, PANEL_H * 2), Image.Resampling.LANCZOS)
        plate.paste(panel, (i * PANEL_W * 2, 0))
    buf = io.BytesIO()
    plate.resize((1024, 1024), Image.Resampling.LANCZOS).save(buf, "JPEG", quality=88, optimize=True)
    return buf.getvalue()


def smooth(x):
    t = np.clip(x, 0, 1)
    return t * t * (3 - 2 * t)


class Resident:
    def __init__(self, name, cfg):
        self.name, self.cfg = name, cfg
        self.bottom = cfg["leg"][-1][0]
        self.unit = cfg["height"] / (self.bottom - cfg["head"][0][0])
        self.pos, self.uv, self.tri, self.joint_ids, self.weights, self.islands = [], [], [], [], [], []
        self.nodes, self.joints, self.origins = [], {}, []
        self.buffer, self.views, self.accessors, self.clips = bytearray(), [], [], []
        points = np.array(FACES[name])
        self.relief = LinearNDInterpolator(points[:, :2], points[:, 2])
        self.nearest, self.depths = cKDTree(points[:, :2]), points[:, 2]
        self.skeleton()

    def xyz(self, x, y, z):
        return np.array([(x - self.cfg["center"]) * self.unit, (self.bottom - y) * self.unit, z * self.unit])

    def bone(self, name, origin, parent=None):
        index = len(self.nodes)
        self.joints[name] = index
        self.origins.append(origin)
        local = origin if parent is None else origin - self.origins[self.joints[parent]]
        self.nodes.append({"name": name, "translation": local.tolist()})
        if parent:
            self.nodes[self.joints[parent]].setdefault("children", []).append(index)

    def skeleton(self):
        c = self.cfg
        center = c["center"]
        self.bone("Hips", self.xyz(center, c["hip"], 0))
        self.bone("Spine", self.xyz(center, c["hip"] - 42, 0), "Hips")
        self.bone("Head", self.xyz(center, c["head"][-2][0], 0), "Spine")
        for side, sign in [("R", -1), ("L", 1)]:
            for part, chain in [
                (
                    "arm",
                    [
                        ("UpperArm", "shoulder", "Spine"),
                        ("Forearm", "elbow", "UpperArm"),
                        ("Hand", "grip", "Forearm"),
                    ],
                ),
                ("leg", [("Thigh", "hip", "Hips"), ("Shin", "knee", "Thigh"), ("Foot", "ankle", "Shin")]),
            ]:
                prof = np.array([r[:3] for r in c[part]])
                for label, where, parent in chain:
                    y = c[where]
                    x = np.interp(y, prof[:, 0], prof[:, 1:].mean(axis=1))
                    self.bone(
                        label + side,
                        self.xyz(center + sign * (center - x), y, 2 if label == "Hand" else 0),
                        parent if parent in ("Spine", "Hips") else parent + side,
                    )

    def influences(self, part, side, y, x):
        c = self.cfg
        if part == "head":
            return [("Head", 1)]
        if part == "body":
            k = float(smooth((y - c["hip"] + 66) / 65))
            # The cardigan moves with the rib cage; only the loose skirt hem follows the steps.
            if self.name == "serife" and y > 343:
                hem = 0.53 * float(smooth((y - 343) / 147))
                left = float(smooth(0.5 + (x - c["center"]) / 50))
                return [("Hips", 1 - hem), ("ThighR", hem * (1 - left)), ("ThighL", hem * left)]
            return [("Spine", 1 - k), ("Hips", k)]
        if part == "arm":
            k = float(smooth((y - c["elbow"] + 15) / 30))
            if y < c["shoulder"] + 2:
                f = 0.72 + 0.28 * float(smooth((y - c["shoulder"] + 19) / 21))
                return [("Spine", 1 - f), ("UpperArm" + side, f)]
            hand = float(smooth((y - c["grip"] + 18) / 18))
            return [("UpperArm" + side, 1 - k), ("Forearm" + side, k * (1 - hand)), ("Hand" + side, k * hand)]
        thigh = float(smooth((y - c["hip"] + 16) / 35))
        knee = float(smooth((y - c["knee"] + 17) / 34))
        foot = float(smooth((y - c["ankle"] + 10) / 22))
        return [
            ("Hips", 1 - thigh),
            ("Thigh" + side, thigh * (1 - knee)),
            ("Shin" + side, knee * (1 - foot)),
            ("Foot" + side, knee * foot),
        ]

    def vertex(self, x, y, z, u, v, back, part, side):
        idx = len(self.pos)
        self.pos.append(self.xyz(x, y, z))
        self.uv.append(((u - LEFT + PANEL_W * int(back)) / (2 * PANEL_W), (v - TOP) / PANEL_H))
        self.islands.append(("body", "head", "legL", "legR", "armL", "armR").index(part + side))
        weights = [(j, w) for j, w in self.influences(part, side, y, x) if w > 1e-7]
        self.joint_ids.append(([self.joints[j] for j, _ in weights] + [0] * 4)[:4])
        self.weights.append(([w for _, w in weights] + [0] * 4)[:4])
        return idx

    def surface(self, part, side=""):
        profile = np.array([(*r, 0) if len(r) == 4 else r for r in self.cfg[part]], dtype=float)
        ys = profile[:, 0]
        head = part == "head"
        # Subdivide the fitted silhouette only where it contributes to a close-up or a bend.
        max_step = 2.8 if head else 26
        ys = np.r_[
            *[
                np.linspace(a, b, math.ceil((b - a) / max_step), endpoint=False)
                for a, b in itertools.pairwise(ys)
            ],
            ys[-1],
        ]
        c = self.cfg["center"]
        for back in (False, True):
            caps = [[], []]
            n = (14 if back else 24) if head else 14 if part == "body" else 10
            angles = np.linspace(-math.pi / 2, math.pi / 2, n + 1) + math.pi * back
            first = len(self.pos)
            for row, y in enumerate(ys):
                a, b, depth, offset = (np.interp(y, profile[:, 0], profile[:, i]) for i in range(1, 5))
                if side == "L":
                    a, b = 2 * c - b, 2 * c - a
                mid, rx = (a + b) / 2, (b - a) / 2
                x = mid + np.sin(angles) * rx
                z = offset + np.cos(angles) * depth
                if self.name == "serife" and part == "body":
                    z += np.cos(angles) * np.cos(angles * 17) * 2.5 * smooth((y - 310) / 90)
                if head and not back:
                    points = np.column_stack((x, np.full(n + 1, y)))
                    rel = self.relief(points)
                    d, point = self.nearest.query(points)
                    blend = np.where(np.isfinite(rel), 1, 1 - smooth(d / 8))
                    rel = np.where(np.isfinite(rel), rel, self.depths[point])
                    blend *= smooth((y - self.cfg["face_top"]) / 5) * smooth(np.cos(angles) / 0.43)
                    z = z * (1 - blend) + (23 + rel) * blend
                for i in range(n + 1):
                    # Inset the projection only near the outline to avoid sampling studio grey.
                    u = x[i] - np.sin(angles[i]) ** 5 * min(2.6, 0.17 * rx)
                    if back:
                        u = 2 * c - u
                    v = np.clip(y, ys[0] + 1, ys[-1] - 1.4)
                    vtx = self.vertex(x[i], y, z[i], u, v, back, part, side)
                    if row == 0:
                        caps[0].append(vtx)
                    if row == len(ys) - 1:
                        caps[1].append(vtx)
                    if row > 0 and i > 0:
                        k = first + (row - 1) * (n + 1) + i - 1
                        self.tri += [(k, k + n + 1, k + 1), (k + 1, k + n + 1, k + n + 2)]
            for bottom, loop in enumerate(caps):
                a, b, _, offset = profile[-1 if bottom else 0, 1:]
                mid = (a + b) / 2
                if side == "L":
                    mid = 2 * c - mid
                y = ys[-1 if bottom else 0]
                idx = self.vertex(
                    mid,
                    y,
                    offset,
                    2 * c - mid if back else mid,
                    y + (1 if not bottom else -1),
                    back,
                    part,
                    side,
                )
                for a, b in itertools.pairwise(loop):
                    self.tri.append((b, a, idx) if bottom else (a, b, idx))

    def view(self, data, target=None):
        self.buffer += b"\x00" * (-len(self.buffer) % 4)
        view = {"buffer": 0, "byteOffset": len(self.buffer), "byteLength": len(data)}
        if target:
            view["target"] = target
        self.views.append(view)
        self.buffer.extend(data)
        return len(self.views) - 1

    def acc(self, data, dtype, shape, target=None, bounds=False):
        a = np.asarray(data, dtype=dtype)
        component = {"<f4": 5126, "<u2": 5123, "u1": 5121}[dtype]
        accessor = {
            "bufferView": self.view(a.tobytes(), target),
            "componentType": component,
            "count": len(a),
            "type": shape,
        }
        if bounds:
            flat = a.reshape(len(a), -1)
            accessor.update(min=flat.min(axis=0).tolist(), max=flat.max(axis=0).tolist())
        self.accessors.append(accessor)
        return len(self.accessors) - 1

    def clip(self, walking):
        name, c = self.name, self.cfg
        sec = c["period"] if walking else {"serife": 4.8, "bekci": 4.2, "kenan": 3.8, "idris": 4.5}[name]
        phase = np.linspace(0, 2 * math.pi, 17)
        t = self.acc(phase * sec / (2 * math.pi), "<f4", "SCALAR", bounds=True)
        channels, samplers = [], []

        def channel(joint, prop, values):
            a = self.acc(values, "<f4", "VEC4" if prop == "rotation" else "VEC3")
            channels.append({"sampler": len(samplers), "target": {"node": self.joints[joint], "path": prop}})
            samplers.append({"input": t, "output": a, "interpolation": "LINEAR"})

        def rotate(joint, axis, angle):
            q = np.zeros((len(phase), 4))
            q[:, axis] = np.sin(angle / 2)
            q[:, 3] = np.cos(angle / 2)
            channel(joint, "rotation", q)

        swing = np.sin(phase)
        hips = np.tile(self.origins[0], (len(phase), 1))
        hips[:, 1] += 0.014 * (1 - np.cos(phase * 2)) / 2 if walking else 0.002 * swing
        channel("Hips", "translation", hips)
        rotate("Spine", 1 if walking else 0, (0.055 if walking else 0.014) * swing)
        rotate("Head", 1, (0.048 if walking else 0.065) * np.sin(phase + 0.65))
        for side, sign in [("R", 1), ("L", -1)]:
            step = phase + (0 if sign == 1 else math.pi)
            amp = 0.32 if name == "serife" else 0.50
            rotate("Thigh" + side, 0, -amp * np.sin(step) if walking else swing * 0.006 * sign)
            knee = 0.60 * np.maximum(0, np.cos(step)) if walking else 0 * swing
            rotate("Shin" + side, 0, knee)
            rotate("Foot" + side, 0, 0.58 * (amp * np.sin(step) - knee) if walking else 0 * swing)
            burden = side == "R" or name in ("kenan", "idris")
            rotate(
                "UpperArm" + side,
                0,
                (0.15 if burden else 0.31) * np.sin(step) if walking else -0.04 + 0.013 * np.sin(step),
            )
            rotate("Forearm" + side, 0, -0.12 - (0.08 if walking else 0.018) * np.cos(step))
        self.clips.append({"name": "Walk" if walking else "Idle", "channels": channels, "samplers": samplers})

    def bake(self):
        self.surface("body")
        self.surface("head")
        for part in ("leg", "arm"):
            for side in ("L", "R"):
                self.surface(part, side)
        p, tri = np.array(self.pos), np.array(self.tri)
        crosses = np.cross(p[tri[:, 1]] - p[tri[:, 0]], p[tri[:, 2]] - p[tri[:, 0]])
        good = np.linalg.norm(crosses, axis=1) > 1e-12
        crosses, tri = crosses[good], tri[good]
        # Smooth through UV seams, but retain separate front and rear projections.
        _, weld = np.unique(np.column_stack((self.islands, np.round(p, 6))), axis=0, return_inverse=True)
        normal = np.zeros((weld.max() + 1, 3))
        for col in range(3):
            np.add.at(normal, weld[tri[:, col]], crosses)
        normal[np.linalg.norm(normal, axis=1) < 1e-12] = (0, 1, 0)
        normal /= np.linalg.norm(normal, axis=1)[:, None]
        attrs = {
            "POSITION": self.acc(p, "<f4", "VEC3", 34962, True),
            "NORMAL": self.acc(normal[weld], "<f4", "VEC3", 34962),
            "TEXCOORD_0": self.acc(self.uv, "<f4", "VEC2", 34962),
            "JOINTS_0": self.acc(self.joint_ids, "u1", "VEC4", 34962),
            "WEIGHTS_0": self.acc(self.weights, "<f4", "VEC4", 34962),
        }
        primitive = {
            "attributes": attrs,
            "indices": self.acc(tri.ravel(), "<u2", "SCALAR", 34963),
            "material": 0,
        }
        inv = []
        for origin in self.origins:
            matrix = np.eye(4)
            matrix[:3, 3] = -origin
            inv.append(matrix.T.flatten())
        skin = {
            "joints": list(range(len(self.joints))),
            "skeleton": 0,
            "inverseBindMatrices": self.acc(inv, "<f4", "MAT4"),
        }
        mesh_node = len(self.nodes)
        self.nodes.append({"name": self.name + "-surface", "mesh": 0, "skin": 0})
        self.clip(False)
        self.clip(True)
        image_view = self.view(atlas(self.name, self.cfg))
        doc = {
            "asset": {"version": "2.0", "generator": "Son Vazife / resident workshop"},
            "scene": 0,
            "scenes": [{"nodes": [0, mesh_node]}],
            "nodes": self.nodes,
            "skins": [skin],
            "meshes": [{"primitives": [primitive]}],
            "images": [{"bufferView": image_view, "mimeType": "image/jpeg"}],
            "textures": [{"source": 0}],
            "materials": [
                {
                    "name": "Worn cloth and skin",
                    "pbrMetallicRoughness": {
                        "baseColorTexture": {"index": 0},
                        "metallicFactor": 0,
                        "roughnessFactor": 0.94,
                    },
                }
            ],
            "animations": self.clips,
            "buffers": [{"byteLength": len(self.buffer)}],
            "bufferViews": self.views,
            "accessors": self.accessors,
        }
        header = json.dumps(doc, separators=(",", ":")).encode()
        header += b" " * (-len(header) % 4)
        self.buffer += b"\x00" * (-len(self.buffer) % 4)
        glb = (
            struct.pack("<4sII", b"glTF", 2, 28 + len(header) + len(self.buffer))
            + struct.pack("<I4s", len(header), b"JSON")
            + header
            + struct.pack("<I4s", len(self.buffer), b"BIN\x00")
            + self.buffer
        )
        (OUT / (self.name + ".glb")).write_bytes(glb)
        print(self.name, len(p), "vertices,", len(tri), "triangles,", len(glb) // 1024, "KiB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for key, cfg in RESIDENTS.items():
        Resident(key, cfg).bake()
