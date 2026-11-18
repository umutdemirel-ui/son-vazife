"""Small static glTF workshop. One indexed primitive per object, metre units, +Z front."""

import json
import math
import struct
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REF = Path(__file__).parent / "reference"
OUT = ROOT / "public/assets/workshop"


def rect_uv(rect):
    x, t, r, b = rect
    return [(x, b), (r, b), (r, t), (x, t)]


class Mesh:
    def __init__(self, name, rough=0.92, metal=0):
        self.name, self.rough, self.metal = name, rough, metal
        self.rows, self.keys, self.indices = [], {}, []

    def polygon(self, points, uvs, normals=None):
        a, b, c = np.asarray(points[:3])
        n = np.cross(b - a, c - a)
        norm = np.linalg.norm(n)
        if norm < 1e-12:
            return
        n /= norm
        indices = []
        for i, (p, uv) in enumerate(zip(points, uvs, strict=True)):
            key = tuple(round(float(v), 6) for v in (*p, *(n if normals is None else normals[i]), *uv))
            if key not in self.keys:
                self.keys[key] = len(self.rows)
                self.rows.append(key)
            indices.append(self.keys[key])
        for k in range(1, len(indices) - 1):
            self.indices.extend((indices[0], indices[k], indices[k + 1]))

    def box(self, center, size, uv, top=None, angle=0):
        x, y, z = np.asarray(size) * 0.5

        def point(a, b, c):
            return (
                center[0] + a,
                center[1] + b * math.cos(angle) - c * math.sin(angle),
                center[2] + b * math.sin(angle) + c * math.cos(angle),
            )

        faces = [
            ((-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)),
            ((x, -y, -z), (-x, -y, -z), (-x, y, -z), (x, y, -z)),
            ((x, -y, z), (x, -y, -z), (x, y, -z), (x, y, z)),
            ((-x, -y, -z), (-x, -y, z), (-x, y, z), (-x, y, -z)),
            ((-x, y, z), (x, y, z), (x, y, -z), (-x, y, -z)),
            ((-x, -y, -z), (x, -y, -z), (x, -y, z), (-x, -y, z)),
        ]
        for i, f in enumerate(faces):
            self.polygon([point(*p) for p in f], rect_uv(top if i == 4 and top else uv))

    def skin(self, rings, uv, closed=True, smooth=True):
        """Ordered cross-sections from foot to head; CCW about Y viewed from above."""
        rings = np.asarray(rings)
        rows, cols = rings.shape[:2]
        normals = np.zeros_like(rings)
        for j in range(rows - 1):
            for i in range(cols if closed else cols - 1):
                k = (i + 1) % cols
                ids = [(j, i), (j, k), (j + 1, k), (j + 1, i)]
                f = np.cross(rings[j, k] - rings[j, i], rings[j + 1, i] - rings[j, i])
                f /= max(1e-12, np.linalg.norm(f))
                for idx in ids:
                    normals[idx] += f
        normals /= np.maximum(1e-12, np.linalg.norm(normals, axis=2, keepdims=True))
        for j in range(rows - 1):
            for i in range(cols if closed else cols - 1):
                k = (i + 1) % cols
                ids = [(j, i), (j, k), (j + 1, k), (j + 1, i)]
                self.polygon(
                    [rings[a] for a in ids],
                    [uv(j, i), uv(j, i + 1), uv(j + 1, i + 1), uv(j + 1, i)],
                    [normals[a] for a in ids] if smooth else None,
                )


def save_glb(name, meshes, image, size, folder):
    folder.mkdir(exist_ok=True, parents=True)
    doc = {
        "asset": {"version": "2.0", "generator": "Kuzdag village workshop"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(meshes)))}],
        "nodes": [],
        "meshes": [],
        "materials": [],
        "accessors": [],
        "bufferViews": [],
        "textures": [{"source": 0}],
    }
    data = bytearray()

    def view(payload, target=None):
        data.extend(b"\x00" * (-len(data) % 4))
        rec = {"buffer": 0, "byteOffset": len(data), "byteLength": len(payload)}
        if target:
            rec["target"] = target
        doc["bufferViews"].append(rec)
        data.extend(payload)
        return len(doc["bufferViews"]) - 1

    def acc(arr, kind, comp, target, bounds=False):
        rec = {
            "bufferView": view(arr.tobytes(), target),
            "componentType": comp,
            "type": kind,
            "count": len(arr),
        }
        if bounds:
            rec.update(min=arr.min(axis=0).tolist(), max=arr.max(axis=0).tolist())
        doc["accessors"].append(rec)
        return len(doc["accessors"]) - 1

    for idx, m in enumerate(meshes):
        rows = np.asarray(m.rows, dtype="<f4")
        assert len(rows) < 65536
        attrs = {
            "POSITION": acc(rows[:, :3], "VEC3", 5126, 34962, True),
            "NORMAL": acc(rows[:, 3:6], "VEC3", 5126, 34962),
            "TEXCOORD_0": acc(rows[:, 6:], "VEC2", 5126, 34962),
        }
        doc["nodes"].append({"name": m.name, "mesh": idx})
        doc["meshes"].append(
            {
                "name": m.name,
                "primitives": [
                    {
                        "attributes": attrs,
                        "indices": acc(np.array(m.indices, dtype="<u2"), "SCALAR", 5123, 34963),
                        "material": idx,
                    }
                ],
            }
        )
        doc["materials"].append(
            {
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 0},
                    "roughnessFactor": m.rough,
                    "metallicFactor": m.metal,
                }
            }
        )
    buf = BytesIO()
    image.convert("RGB").resize(size, Image.Resampling.LANCZOS).save(buf, "JPEG", quality=86, optimize=True)
    doc["images"] = [{"bufferView": view(buf.getvalue()), "mimeType": "image/jpeg"}]
    doc["buffers"] = [{"byteLength": len(data)}]
    data.extend(b"\x00" * (-len(data) % 4))
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    (folder / (name + ".glb")).write_bytes(
        struct.pack("<4sII", b"glTF", 2, 28 + len(js) + len(data))
        + struct.pack("<I4s", len(js), b"JSON")
        + js
        + struct.pack("<I4s", len(data), b"BIN\0")
        + data
    )


def bake(name, meshes, image, full=(1024, 1024), small=(512, 512)):
    for s, p in [(full, OUT), (small, OUT / "compact")]:
        save_glb(name, meshes, image, s, p)
    print(name, sum(len(m.indices) // 3 for m in meshes), "triangles")
