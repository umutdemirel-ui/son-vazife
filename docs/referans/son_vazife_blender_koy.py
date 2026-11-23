# -*- coding: utf-8 -*-
"""
SON VAZİFE - Issız Köy Haritası (Blender betiği)

Kullanım:
  1) Blender'ı aç (3.6 veya 4.x önerilir)
  2) Scripting sekmesi > Open > bu dosyayı seç > Run Script
  3) Sahne temizlenir ve köy baştan kurulur.

Notlar:
  - Arazi: köy düz, kenarlar tepelik (HILL_HEIGHT ile ayarlanır; 0 yaparsan tamamen düz olur).
  - Ölçek: haritadaki 1 birim = S metre (varsayılan 0.3). Köyü büyütmek için S'yi artır.
  - Üst kamera: "Ust_Kamera" (aktif). Giriş kapısından bakan kamera: "Oyuncu_Kamera".
  - Etiketler "Etiketler" koleksiyonunda, istersen gizle.
  - Oyun motoruna aktarmak için EXPORT_FBX = True yap (önce .blend dosyasını kaydet).
"""
import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

# ----------------------------------------------------------------- ayarlar
SEED = 7
S = 0.3                      # 1 harita birimi = S metre
CX, CY = 190.0, 280.0        # harita merkezi (harita koordinatı)
EXPORT_FBX = False
LABELS_IN_RENDER = False
random.seed(SEED)


def P(x, y, z=0.0):
    """Harita koordinatı -> Blender koordinatı (kuzey = +Y)."""
    return Vector(((x - CX) * S, -(y - CY) * S, z))


def srgb(h):
    h = h.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b))


# ----------------------------------------------------------------- sahne
def reset_scene():
    try:
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
    except Exception:
        pass
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for blocks in (bpy.data.meshes, bpy.data.materials, bpy.data.curves,
                   bpy.data.lights, bpy.data.cameras):
        for b in list(blocks):
            blocks.remove(b)


COL = {}


def make_collections():
    for n in ("Zemin", "Yollar_Dere", "Binalar", "Mezarlik", "Agaclar",
              "Isiklar", "Etiketler", "Kameralar"):
        c = bpy.data.collections.new(n)
        bpy.context.scene.collection.children.link(c)
        COL[n] = c


# ----------------------------------------------------------------- malzeme
def mat(name, hexcol, rough=0.9, emit=None, strength=0.0, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*srgb(hexcol), 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metallic
    if emit:
        key = 'Emission Color' if 'Emission Color' in b.inputs else 'Emission'
        b.inputs[key].default_value = (*srgb(emit), 1.0)
        b.inputs['Emission Strength'].default_value = strength
    return m


M = {}


def make_materials():
    M['ground'] = mat("Zemin", "#1b2018", 1.0)
    M['dirt'] = mat("Toprak_Yol", "#3a3128", 1.0)
    M['dirt_edge'] = mat("Yol_Kenar", "#241e18", 1.0)
    M['trail'] = mat("Patika", "#2b251d", 1.0)
    M['water'] = mat("Su", "#0b2a38", 0.05)
    M['mud'] = mat("Camur", "#1c1914", 1.0)
    M['stone'] = mat("Tas", "#4b5058", 0.95)
    M['stone_dark'] = mat("Tas_Koyu", "#33302c", 1.0)
    M['dome'] = mat("Kubbe", "#4f6258", 0.8)
    M['wall'] = mat("Duvar", "#4a4540", 1.0)
    M['wall_old'] = mat("Duvar_Eski", "#2f2b27", 1.0)
    M['wall_warm'] = mat("Duvar_Sicak", "#5a4a38", 1.0)
    M['wall_cold'] = mat("Duvar_Soguk", "#3f4650", 1.0)
    M['wall_barn'] = mat("Ahir_Duvar", "#4a2a22", 1.0)
    M['roof'] = mat("Cati", "#2a2420", 1.0)
    M['roof_old'] = mat("Cati_Eski", "#1d1a17", 1.0)
    M['dark'] = mat("Kapi_Pencere", "#070707", 1.0)
    M['wood'] = mat("Tahta", "#2a2018", 1.0)
    M['deadwood'] = mat("Olu_Agac", "#3a362f", 1.0)
    M['leaf'] = mat("Yaprak", "#16231b", 1.0)
    M['grave'] = mat("Mezar_Tasi", "#6e7075", 0.95)
    M['field'] = mat("Tarla", "#2a2c1d", 1.0)
    M['furrow'] = mat("Tarla_Sira", "#3a3d26", 1.0)
    M['win_amber'] = mat("Pencere_Sicak", "#e0a83c", 0.5, emit="#e0a83c", strength=6.0)
    M['win_blue'] = mat("Pencere_Soguk", "#9ec9e0", 0.5, emit="#9ec9e0", strength=4.0)
    M['label'] = mat("Etiket", "#ffffff", 1.0, emit="#ffffff", strength=2.0)
    M['label_key'] = mat("Etiket_Ana", "#ff5a4a", 1.0, emit="#ff5a4a", strength=2.5)
    try:  # zemine hafif doku
        nt = M['ground'].node_tree
        b = nt.nodes.get('Principled BSDF')
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = 0.35
        tex.inputs['Detail'].default_value = 6.0
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.25
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    except Exception:
        pass


# ----------------------------------------------------------------- mesh araçları
def finish(name, bm, loc, rot, mats, col):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    col.objects.link(ob)
    return ob


def _faces(bm, vs, idx, mi):
    out = []
    for f in idx:
        face = bm.faces.new([vs[i] for i in f])
        face.material_index = mi
        out.append(face)
    return out


def add_box(bm, size, base=(0, 0, 0), rot_z=0.0, mi=0):
    sx, sy, sz = size
    rot = Matrix.Rotation(rot_z, 3, 'Z')
    b = Vector(base)
    pts = [(-sx / 2, -sy / 2, 0), (sx / 2, -sy / 2, 0), (sx / 2, sy / 2, 0), (-sx / 2, sy / 2, 0),
           (-sx / 2, -sy / 2, sz), (sx / 2, -sy / 2, sz), (sx / 2, sy / 2, sz), (-sx / 2, sy / 2, sz)]
    vs = [bm.verts.new(b + rot @ Vector(p)) for p in pts]
    _faces(bm, vs, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], mi)


def add_gable(bm, w, d, rh, base=(0, 0, 0), overhang=0.5, mi=1):
    b = Vector(base)
    hw, hd = w / 2 + overhang, d / 2 + overhang
    pts = [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw, 0, rh), (hw, 0, rh)]
    vs = [bm.verts.new(b + Vector(p)) for p in pts]
    _faces(bm, vs, [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)], mi)


def add_cone(bm, r1, r2, h, base=(0, 0, 0), tilt=0.0, azim=0.0, seg=10, mi=0, caps=True):
    rot = Matrix.Rotation(azim, 3, 'Z') @ Matrix.Rotation(tilt, 3, 'Y')
    b = Vector(base)
    tv = lambda v: b + rot @ Vector(v)
    ang = lambda i: 2 * math.pi * i / seg
    bot = [bm.verts.new(tv((r1 * math.cos(ang(i)), r1 * math.sin(ang(i)), 0))) for i in range(seg)]
    fs = []
    if r2 > 0.0001:
        top = [bm.verts.new(tv((r2 * math.cos(ang(i)), r2 * math.sin(ang(i)), h))) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            fs.append(bm.faces.new((bot[i], bot[j], top[j], top[i])))
        if caps:
            fs.append(bm.faces.new(top))
    else:
        apex = bm.verts.new(tv((0, 0, h)))
        for i in range(seg):
            fs.append(bm.faces.new((bot[i], bot[(i + 1) % seg], apex)))
    if caps:
        fs.append(bm.faces.new(bot[::-1]))
    for f in fs:
        f.material_index = mi


def add_dome(bm, r, base=(0, 0, 0), seg=16, rings=6, mi=1):
    b = Vector(base)
    rows = []
    for k in range(rings):
        phi = (math.pi / 2) * k / rings
        rr, z = r * math.cos(phi), r * math.sin(phi)
        rows.append([bm.verts.new(b + Vector((rr * math.cos(2 * math.pi * i / seg),
                                              rr * math.sin(2 * math.pi * i / seg), z)))
                     for i in range(seg)])
    apex = bm.verts.new(b + Vector((0, 0, r)))
    fs = []
    for k in range(rings - 1):
        for i in range(seg):
            j = (i + 1) % seg
            fs.append(bm.faces.new((rows[k][i], rows[k][j], rows[k + 1][j], rows[k + 1][i])))
    for i in range(seg):
        fs.append(bm.faces.new((rows[-1][i], rows[-1][(i + 1) % seg], apex)))
    fs.append(bm.faces.new(rows[0][::-1]))
    for f in fs:
        f.material_index = mi


def done(bm):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


# ----------------------------------------------------------------- yollar / dere
ROADPTS = []     # ağaç yerleştirirken kaçınılacak noktalar (harita koordinatı)
KEEP_OUT = []    # (x, y, yarıçap)


def bez(p0, p1, p2, p3, n=20):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    return pts


def L(p0, p1):
    return ('L', p0, p1)


def C(p0, p1, p2, p3):
    return ('C', p0, p1, p2, p3)


def chain(*segs):
    out = []
    for s in segs:
        if s[0] == 'L':
            a, b = s[1], s[2]
            pts = [(a[0] + (b[0] - a[0]) * k / 8, a[1] + (b[1] - a[1]) * k / 8) for k in range(9)]
        else:
            pts = bez(*s[1:])
        if out:
            pts = pts[1:]
        out += pts
    return out


def ribbon(name, pts, width, z, material, closed=False, col="Yollar_Dere"):
    Ps = [P(x, y) for x, y in pts]
    n = len(Ps)
    hw = width * S / 2
    bm = bmesh.new()
    left, right = [], []
    for i in range(n):
        if closed:
            t = Ps[(i + 1) % n] - Ps[i - 1]
        elif i == 0:
            t = Ps[1] - Ps[0]
        elif i == n - 1:
            t = Ps[-1] - Ps[-2]
        else:
            t = Ps[i + 1] - Ps[i - 1]
        t.z = 0
        t.normalize()
        nx = Vector((-t.y, t.x, 0))
        off = Vector((0, 0, z))
        left.append(bm.verts.new(Ps[i] + nx * hw + off))
        right.append(bm.verts.new(Ps[i] - nx * hw + off))
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        bm.faces.new((left[i], right[i], right[j], left[j]))
    bm.normal_update()
    if sum(f.normal.z for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return finish(name, bm, (0, 0, 0), (0, 0, 0), [material], COL[col])


def build_roads():
    ring = chain(C((190, 440), (120, 440), (80, 395), (80, 330)),
                 C((80, 330), (80, 230), (115, 150), (190, 150)),
                 C((190, 150), (270, 150), (325, 220), (325, 300)),
                 C((325, 300), (325, 380), (270, 440), (190, 440)))[:-1]
    main = chain(C((190, 560), (190, 520), (200, 490), (190, 440)), L((190, 440), (190, 296)))
    paths = {
        "Kuzey_Yol": (chain(L((190, 296), (190, 224))), 9),
        "Mezarlik_Yolu": (chain(L((190, 150), (190, 112))), 7),
        "Bati_Yol": (chain(C((80, 328), (125, 322), (150, 322), (166, 322))), 7),
        "Dogu_Yol": (chain(L((214, 316), (325, 302))), 7),
        "Kopru_Yolu": (chain(L((325, 318), (378, 322))), 6),
        "Okul_Yolu": (chain(C((100, 195), (85, 170), (70, 150), (62, 132))), 6),
        "Kuyu_Yolu": (chain(L((85, 255), (58, 255))), 6),
        "Degirmen_Yolu": (chain(C((275, 160), (280, 120), (290, 95), (298, 85))), 6),
        "Orman_Yolu": (chain(L((80, 345), (0, 352))), 6),
    }
    shortcuts = {
        "Kestirme_Gasilhane_Mezarlik": chain(C((250, 190), (255, 150), (235, 125), (215, 108))),
        "Kestirme_Tarla_Gassal": chain(C((250, 470), (255, 440), (250, 410), (254, 375))),
    }
    # yol kenarı (koyu) + yol yüzeyi
    ribbon("Halka_Yol_Kenar", ring, 13, 0.02, M['dirt_edge'], closed=True)
    ribbon("Halka_Yol", ring, 9, 0.04, M['dirt'], closed=True)
    ribbon("Ana_Yol_Kenar", main, 18, 0.02, M['dirt_edge'])
    ribbon("Ana_Yol", main, 14, 0.045, M['dirt'])
    ROADPTS.extend(ring + main)
    for nm, (pts, w) in paths.items():
        ribbon(nm + "_Kenar", pts, w + 3, 0.02, M['dirt_edge'])
        ribbon(nm, pts, w, 0.043, M['dirt'])
        ROADPTS.extend(pts)
    for nm, pts in shortcuts.items():
        ribbon(nm, pts, 3, 0.035, M['trail'])
        ROADPTS.extend(pts)

    stream = chain(C((360, 0), (345, 90), (365, 180), (350, 260)),
                   C((350, 260), (335, 340), (345, 340), (355, 420)),
                   C((355, 420), (365, 500), (368, 500), (358, 560)))
    ribbon("Dere_Yatagi", stream, 20, 0.015, M['mud'])
    ribbon("Dere", stream, 14, 0.06, M['water'])
    ROADPTS.extend(stream)


HILL_HEIGHT = 12.0     # kenar tepelerinin yaklaşık yüksekliği (metre)
FLAT = (30, 25, 345, 545)   # köyün düz kalan alanı (x0, y0, x1, y1), harita koordinatı


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def road_dist(sx, sy):
    best = 1e9
    for (px, py) in ROADPTS:
        d = (px - sx) ** 2 + (py - sy) ** 2
        if d < best:
            best = d
    return math.sqrt(best)


def H(sx, sy):
    """Arazi yüksekliği: köy ve yollar düz, kenarlar tepelik, dere/yol boyunca vadi."""
    x0, y0, x1, y1 = FLAT
    out = math.hypot(max(x0 - sx, 0, sx - x1), max(y0 - sy, 0, sy - y1))
    if out <= 0:
        return 0.0
    rise = smooth(0, 70, out)
    n = 0.65 + 0.35 * (math.sin(sx * 0.05 + 1.3) * math.cos(sy * 0.04)
                       + 0.5 * math.sin(sx * 0.13 + sy * 0.09))
    return HILL_HEIGHT * rise * n * smooth(14, 45, road_dist(sx, sy))


def build_ground():
    bm = bmesh.new()
    a, b = P(-70, -70), P(450, 630)
    vs = [bm.verts.new((a.x, b.y, 0)), bm.verts.new((b.x, b.y, 0)),
          bm.verts.new((b.x, a.y, 0)), bm.verts.new((a.x, a.y, 0))]
    bm.faces.new(vs)
    bm.normal_update()
    if bm.faces[0].normal.z < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=70, use_grid_fill=True)
    for v in bm.verts:
        sx, sy = v.co.x / S + CX, -v.co.y / S + CY
        v.co.z = H(sx, sy)
    ob = finish("Zemin", bm, (0, 0, 0), (0, 0, 0), [M['ground']], COL["Zemin"])
    for p in ob.data.polygons:
        p.use_smooth = True


# ----------------------------------------------------------------- binalar
def house(name, x, y, w, h, wall_h, roof_h, wm, rm, ruined=False, col="Binalar"):
    ww, dd = w * S, h * S
    cx, cy = x + w / 2, y + h / 2
    bm = bmesh.new()
    add_box(bm, (ww, dd, wall_h), (0, 0, 0), 0, 0)
    add_gable(bm, ww, dd, roof_h, (0, 0, wall_h), 0.5, 1)
    add_box(bm, (1.1, 0.25, 2.1), (ww * 0.2, -dd / 2, 0), 0, 2)
    add_box(bm, (0.9, 0.25, 1.0), (-ww * 0.25, -dd / 2, 1.2), 0, 2)
    add_box(bm, (0.25, 0.9, 1.0), (ww / 2, 0, 1.2), 0, 2)
    done(bm)
    rot = (0, 0, 0)
    if ruined:
        rot = (random.uniform(-0.03, 0.03), random.uniform(-0.03, 0.03), random.uniform(-0.2, 0.2))
    ob = finish(name, bm, P(cx, cy), rot, [wm, rm, M['dark']], COL[col])
    KEEP_OUT.append((cx, cy, max(w, h) * 0.9))
    return ob, ww, dd, cx, cy


def point_light(name, loc, color, energy, radius=0.4):
    li = bpy.data.lights.new(name, 'POINT')
    li.color = color
    li.energy = energy
    li.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    COL["Isiklar"].objects.link(ob)
    return ob


def window_box(name, loc, size, material):
    bm = bmesh.new()
    add_box(bm, size, (0, 0, 0))
    done(bm)
    return finish(name, bm, loc, (0, 0, 0), [material], COL["Binalar"])


def build_buildings():
    # Cami
    x, y, w, h = 160, 180, 56, 40
    ww, dd = w * S, h * S
    bm = bmesh.new()
    add_box(bm, (ww, dd, 6.0), (0, 0, 0), 0, 0)
    add_dome(bm, 3.9, (0, 0, 6.0), 18, 7, 1)
    dx, dy = (224 - 188) * S, -(186 - 200) * S
    add_cone(bm, 0.9, 0.7, 14, (dx, dy, 0), seg=12, mi=0)
    add_cone(bm, 1.5, 1.5, 0.35, (dx, dy, 13.5), seg=12, mi=0)
    add_cone(bm, 0.65, 0.5, 4.0, (dx, dy, 14.0), seg=12, mi=0)
    add_cone(bm, 0.85, 0.0, 2.8, (dx, dy, 18.0), seg=12, mi=1)
    add_box(bm, (1.6, 0.25, 2.8), (0, -dd / 2, 0), 0, 0)
    done(bm)
    finish("Cami", bm, P(x + w / 2, y + h / 2), (0, 0, 0), [M['stone'], M['dome']], COL["Binalar"])
    KEEP_OUT.append((x + w / 2, y + h / 2, 40))

    # Gasilhane (soğuk ışık)
    ob, ww, dd, cx, cy = house("Gasilhane", 232, 190, 42, 28, 3.4, 1.6, M['wall_cold'], M['roof'])
    wl = P(cx, cy) + Vector((-ww * 0.25, -dd / 2 - 0.15, 1.2))
    window_box("Gasilhane_Pencere", wl, (0.9, 0.08, 1.0), M['win_blue'])
    point_light("Gasilhane_Isik", wl + Vector((0, -1.2, 0.6)), (0.62, 0.8, 1.0), 220)

    # Gassalın evi (sıcak ışık)
    ob, ww, dd, cx, cy = house("Gassal_Evi", 232, 345, 44, 30, 3.2, 1.8, M['wall_warm'], M['roof'])
    wl = P(cx, cy) + Vector((-ww * 0.25, -dd / 2 - 0.15, 1.2))
    window_box("Gassal_Pencere", wl, (0.9, 0.08, 1.0), M['win_amber'])
    point_light("Gassal_Isik", wl + Vector((0, -1.2, 0.6)), (1.0, 0.65, 0.25), 260)

    # Terk evler
    for i, (x, y, w, h) in enumerate([(112, 230, 28, 22), (118, 285, 26, 22),
                                      (135, 372, 26, 22), (275, 255, 26, 20)]):
        house("Terk_Ev_%d" % (i + 1), x, y, w, h, 3.0, 1.5, M['wall_old'], M['roof_old'], ruined=True)

    # Okul, kahvehane, ahır
    house("Eski_Okul", 38, 100, 46, 32, 3.8, 1.8, M['wall_old'], M['roof_old'], ruined=True)
    house("Kahvehane", 214, 306, 26, 18, 3.0, 1.4, M['wall_old'], M['roof_old'], ruined=True)
    house("Ahir", 203, 500, 26, 22, 4.5, 2.6, M['wall_barn'], M['roof'])

    # Değirmen + çark
    house("Degirmen", 298, 68, 26, 24, 4.0, 2.2, M['wall'], M['roof'])
    bm = bmesh.new()
    add_cone(bm, 2.2, 2.2, 0.7, (0, 0, 0), seg=20, mi=0)
    add_box(bm, (4.4, 0.5, 0.2), (0, 0, 0), 0, 0)
    done(bm)
    finish("Degirmen_Carki", bm, P(340, 80, 2.4), (0, math.pi / 2, 0), [M['wood']], COL["Binalar"])

    # Meydan: taş zemin, çeşme, kuyu
    bm = bmesh.new()
    add_cone(bm, 24 * S, 24 * S, 0.06, (0, 0, 0.02), seg=36, mi=0)
    done(bm)
    finish("Meydan_Zemin", bm, P(190, 322), (0, 0, 0), [M['stone_dark']], COL["Binalar"])
    bm = bmesh.new()
    add_cone(bm, 2.0, 2.0, 0.7, (0, 0, 0), seg=20, mi=0, caps=False)
    add_cone(bm, 1.9, 1.9, 0.02, (0, 0, 0.45), seg=20, mi=1)
    add_cone(bm, 0.3, 0.25, 1.8, (0, 0, 0), seg=10, mi=0)
    done(bm)
    finish("Cesme", bm, P(190, 322), (0, 0, 0), [M['stone'], M['water']], COL["Binalar"])
    bm = bmesh.new()
    add_cone(bm, 1.0, 1.0, 1.0, (0, 0, 0), seg=14, mi=0, caps=False)
    add_cone(bm, 0.95, 0.95, 0.02, (0, 0, 0.3), seg=14, mi=1)
    add_box(bm, (0.2, 0.2, 2.2), (-1.0, 0, 0), 0, 2)
    add_box(bm, (0.2, 0.2, 2.2), (1.0, 0, 0), 0, 2)
    add_box(bm, (2.4, 0.2, 0.2), (0, 0, 2.2), 0, 2)
    done(bm)
    finish("Kuyu", bm, P(50, 255), (0, 0, 0), [M['stone'], M['dark'], M['wood']], COL["Binalar"])
    KEEP_OUT.extend([(190, 322, 34), (50, 255, 12)])

    # Köprü
    bm = bmesh.new()
    add_box(bm, (6.4, 2.4, 0.25), (0, 0, 0.15), 0, 0)
    add_box(bm, (6.4, 0.15, 0.9), (0, 1.1, 0.4), 0, 0)
    add_box(bm, (6.4, 0.15, 0.9), (0, -1.1, 0.4), 0, 0)
    done(bm)
    finish("Tas_Kopru", bm, P(353, 319), (0, 0, 0), [M['stone']], COL["Binalar"])

    # Giriş kapısı sütunları
    for i, gx in enumerate((183, 199)):
        bm = bmesh.new()
        add_box(bm, (0.8, 0.8, 2.8), (0, 0, 0), 0, 0)
        add_box(bm, (1.0, 1.0, 0.25), (0, 0, 2.8), 0, 0)
        done(bm)
        finish("Kapi_Sutun_%d" % (i + 1), bm, P(gx, 536), (0, 0, random.uniform(-0.05, 0.05)),
               [M['stone']], COL["Binalar"])


# ----------------------------------------------------------------- mezarlık
def build_cemetery():
    x0, y0, x1, y1 = 145, 32, 235, 110
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    gate_x, gate_w = 190, 8
    step = 3.3
    for e in range(4):
        a, b = corners[e], corners[(e + 1) % 4]
        pa, pb = P(*a), P(*b)
        length = (pb - pa).length
        n = max(2, int(length / step))
        ang = math.atan2(pb.y - pa.y, pb.x - pa.x)
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            s0, s1 = pa.lerp(pb, t0), pa.lerp(pb, t1)
            mid = s0.lerp(s1, 0.5)
            mx, my = mid.x / S + CX, -mid.y / S + CY
            if e == 2 and abs(mx - gate_x) < gate_w:
                continue
            bm = bmesh.new()
            add_box(bm, (0.2, 0.2, 1.5), (0, 0, 0), 0, 0)
            finish("Cit_Direk", bm, s0, (0, 0, 0), [M['wood']], COL["Mezarlik"])
            for z in (0.55, 1.05):
                bm = bmesh.new()
                add_box(bm, ((s1 - s0).length, 0.07, 0.1), (0, 0, 0), 0, 0)
                finish("Cit_Tahta", bm, mid + Vector((0, 0, z)), (0, 0, ang), [M['wood']], COL["Mezarlik"])
    # mezar taşı şablonu
    bm = bmesh.new()
    add_box(bm, (0.7, 0.18, 1.0), (0, 0, 0), 0, 0)
    add_box(bm, (0.5, 0.18, 0.2), (0, 0, 1.0), 0, 0)
    done(bm)
    me = bpy.data.meshes.new("Mezar_Tasi")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M['grave'])
    gx = 154
    while gx < 228:
        gy = 60
        while gy < 104:
            if abs(gx - 190) > 8:
                ob = bpy.data.objects.new("Mezar", me)
                ob.location = P(gx + random.uniform(-3, 3), gy + random.uniform(-3, 3))
                ob.rotation_euler = (random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1),
                                     random.uniform(-0.35, 0.35))
                COL["Mezarlik"].objects.link(ob)
            gy += 13
        gx += 14
    KEEP_OUT.append((190, 71, 62))


# ----------------------------------------------------------------- ağaçlar
def tree_templates():
    T = {}
    bm = bmesh.new()
    add_cone(bm, 0.25, 0.18, 2.0, (0, 0, 0), seg=7, mi=0)
    add_cone(bm, 2.0, 0.0, 3.2, (0, 0, 1.6), seg=9, mi=1)
    add_cone(bm, 1.6, 0.0, 3.0, (0, 0, 3.4), seg=9, mi=1)
    add_cone(bm, 1.1, 0.0, 2.8, (0, 0, 5.0), seg=9, mi=1)
    done(bm)
    T['pine'] = (bm, [M['wood'], M['leaf']], "Cam")

    bm = bmesh.new()
    add_cone(bm, 0.35, 0.12, 7.0, (0, 0, 0), seg=7, mi=0)
    for z, tl, az in ((3.0, 0.9, 0.3), (4.2, -0.8, 1.9), (5.2, 0.7, 3.6), (2.2, 1.0, 5.0)):
        add_cone(bm, 0.12, 0.03, 2.6, (0, 0, z), tilt=tl, azim=az, seg=5, mi=0)
    done(bm)
    T['dead'] = (bm, [M['deadwood']], "Olu_Agac")

    bm = bmesh.new()
    add_cone(bm, 0.65, 0.5, 4.2, (0, 0, 0), seg=10, mi=0)
    add_dome(bm, 5.5, (0, 0, 3.6), 14, 6, 1)
    add_dome(bm, 3.6, (2.6, 1.0, 3.2), 12, 5, 1)
    done(bm)
    T['plane'] = (bm, [M['wood'], M['leaf']], "Cinar")

    meshes = {}
    for k, (bm, mats, nm) in T.items():
        me = bpy.data.meshes.new(nm)
        bm.to_mesh(me)
        bm.free()
        for m in mats:
            me.materials.append(m)
        meshes[k] = me
    return meshes


def near_any(x, y):
    for (px, py) in ROADPTS:
        if (px - x) ** 2 + (py - y) ** 2 < 14 ** 2:
            return True
    for (kx, ky, kr) in KEEP_OUT:
        if (kx - x) ** 2 + (ky - y) ** 2 < kr ** 2:
            return True
    return False


def place_tree(me, x, y, smin=0.8, smax=1.4):
    ob = bpy.data.objects.new(me.name, me)
    ob.location = P(x, y, H(x, y))
    s = random.uniform(smin, smax)
    ob.scale = (s, s, s * random.uniform(0.9, 1.2))
    ob.rotation_euler = (0, 0, random.uniform(0, 6.28))
    COL["Agaclar"].objects.link(ob)


def build_trees():
    T = tree_templates()
    # meydandaki çınar
    place_tree(T['plane'], 170, 306, 1.0, 1.0)
    # kenar orman halkaları (SVG'deki orman kümeleri)
    clusters = [(20, 15, 18), (62, 10, 16), (102, 18, 17), (142, 8, 15), (182, 12, 15), (222, 10, 16),
                (262, 14, 17), (302, 10, 15), (12, 90, 16), (10, 160, 18), (15, 230, 17), (10, 295, 16),
                (14, 410, 18), (10, 470, 17), (15, 520, 18), (366, 200, 15), (370, 390, 17),
                (366, 455, 16), (372, 522, 18), (368, 110, 14), (40, 546, 16), (92, 549, 15),
                (262, 548, 16), (310, 550, 16)]
    for (cx, cy, r) in clusters:
        for _ in range(6):
            a, d = random.uniform(0, 6.28), random.uniform(0, r * 1.2)
            x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
            if not near_any(x, y):
                place_tree(T['dead'] if random.random() < 0.18 else T['pine'], x, y)
    # haritanın dışını kapatan sık ağaç sırası
    step = 13
    for i in range(-3, 34):
        for (x, y) in ((i * step - 20, -22), (i * step - 20, 582)):
            place_tree(T['pine'], x + random.uniform(-5, 5), y + random.uniform(-6, 6), 1.0, 1.7)
    for j in range(-3, 46):
        for (x, y) in ((-24, j * step - 20), (406, j * step - 20)):
            place_tree(T['pine'], x + random.uniform(-6, 6), y + random.uniform(-5, 5), 1.0, 1.7)
    # köy içi seyrek ağaçlar
    placed = 0
    for _ in range(500):
        x, y = random.uniform(25, 345), random.uniform(25, 545)
        if placed >= 38:
            break
        if near_any(x, y):
            continue
        place_tree(T['dead'] if random.random() < 0.35 else T['pine'], x, y, 0.8, 1.2)
        placed += 1


# ----------------------------------------------------------------- tarla
def build_field():
    bm = bmesh.new()
    add_box(bm, (100 * S, 70 * S, 0.04), (0, 0, 0.02), 0, 0)
    done(bm)
    finish("Tarla", bm, P(290, 505), (0, 0, 0), [M['field']], COL["Zemin"])
    for k in range(8):
        bm = bmesh.new()
        add_box(bm, (92 * S, 0.5, 0.18), (0, 0, 0), 0, 0)
        done(bm)
        finish("Tarla_Sira", bm, P(290, 478 + k * 8.5, 0.04), (0, 0, 0), [M['furrow']], COL["Zemin"])
    KEEP_OUT.append((290, 505, 62))


# ----------------------------------------------------------------- ışık, dünya, kamera, etiket
def setup_world_and_sun():
    w = bpy.data.worlds.new("Gece")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get('Background')
    bg.inputs[0].default_value = (0.004, 0.007, 0.016, 1.0)
    bg.inputs[1].default_value = 1.0
    try:  # hafif sis
        out = nt.nodes.get('World Output')
        vs = nt.nodes.new('ShaderNodeVolumeScatter')
        vs.inputs['Density'].default_value = 0.004
        vs.inputs['Color'].default_value = (0.5, 0.6, 0.7, 1.0)
        nt.links.new(vs.outputs['Volume'], out.inputs['Volume'])
    except Exception:
        pass
    sun = bpy.data.lights.new("Ay_Isigi", 'SUN')
    sun.energy = 0.9
    sun.color = (0.55, 0.65, 1.0)
    ob = bpy.data.objects.new("Ay_Isigi", sun)
    ob.rotation_euler = (math.radians(55), 0, math.radians(35))
    COL["Isiklar"].objects.link(ob)
    point_light("Cesme_Isik", P(190, 322, 2.0), (0.5, 0.7, 0.9), 60)


def setup_cameras():
    cd = bpy.data.cameras.new("Ust_Kamera")
    cd.type = 'ORTHO'
    cd.ortho_scale = 280 * S * 1.15
    top = bpy.data.objects.new("Ust_Kamera", cd)
    top.location = (0, 0, 120)
    COL["Kameralar"].objects.link(top)
    cd2 = bpy.data.cameras.new("Oyuncu_Kamera")
    cd2.lens = 28
    pl = bpy.data.objects.new("Oyuncu_Kamera", cd2)
    pl.location = P(190, 548, 1.7)
    pl.rotation_euler = (math.radians(90), 0, 0)
    COL["Kameralar"].objects.link(pl)
    bpy.context.scene.camera = top
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1620
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            continue


def label(text, x, y, key=False):
    cu = bpy.data.curves.new("Etiket_" + text, 'FONT')
    cu.body = text
    cu.size = 4.0
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.materials.append(M['label_key'] if key else M['label'])
    ob = bpy.data.objects.new("Etiket_" + text, cu)
    ob.location = P(x, y, 22)
    ob.hide_render = not LABELS_IN_RENDER
    COL["Etiketler"].objects.link(ob)


def build_labels():
    items = [("1 Giris", 190, 515, False), ("2 Cami", 188, 168, False), ("3 Gasilhane", 253, 236, True),
             ("4 Mezarlik", 190, 52, True), ("5 Meydan", 190, 268, False), ("6 Gassal Evi", 254, 332, True),
             ("7 Terk Evler", 148, 358, False), ("8 Kuyu", 45, 235, False), ("9 Eski Okul", 61, 86, False),
             ("10 Degirmen", 311, 108, False), ("11 Tarla", 290, 452, False), ("12 Orman Yolu", 22, 352, False)]
    for t, x, y, k in items:
        label(t, x, y, k)


# ----------------------------------------------------------------- ana akış
def main():
    reset_scene()
    make_collections()
    make_materials()
    build_roads()
    build_ground()
    build_field()
    build_buildings()
    build_cemetery()
    build_trees()
    setup_world_and_sun()
    setup_cameras()
    build_labels()
    try:  # görünümü malzeme önizlemeye al
        for area in bpy.context.screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces[0].shading.type = 'MATERIAL'
    except Exception:
        pass
    if EXPORT_FBX:
        try:
            bpy.ops.export_scene.fbx(filepath=bpy.path.abspath("//son_vazife_koy.fbx"))
        except Exception as e:
            print("FBX aktarımı başarısız:", e)
    print("Son Vazife köy haritası hazır. Nesne sayısı:", len(bpy.data.objects))


main()
