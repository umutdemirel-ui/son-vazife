import * as THREE from 'three';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import type { KitId, WorkshopAssets } from './workshopAssets';
import type { VillageTextures } from './textures';

type Mat = THREE.Material;
type Parent = THREE.Object3D;
export type HouseStyle = 'cumba' | 'himis' | 'tas';
const inscriptions = [
  ['KUZDAĞ KÖYÜ', 'GASİLHANE'],
  ['HAYRAT  ·  1954', 'KÖY ÇEŞMESİ'],
  ['T.C.  ·  KUZDAĞ', 'MUHTARLIK'],
  ['KUZDAĞ', 'SAĞLIK OCAĞI'],
  ['DERE YOLU', '←  DEĞİRMEN'],
  ['YUKARI MAHALLE', 'MEZARLIK  ←'],
  ['MEYDAN', 'ÇEŞME  →'],
  ['KUZEYDOĞU', 'MEKTEP YOLU'],
  ['DOĞU HATTI', 'İSTASYON YOLU'],
  ['DERE SIRTI', 'SANTRAL YOLU'],
  ['KUZDAĞ · 1941', 'SARI MEKTEP'],
  ['DOĞU HATTI · KM 14', 'KUZDAĞ İSTASYONU'],
  ['P.T.T. · KUZDAĞ', 'SIRT SANTRALİ'],
  ['T.C.D.D. · 1973', 'KAPALI HAT'],
  ['P.T.T.', 'ABONE 06'],
] as const;
const atlasHeight = inscriptions.length * 128 + 3 * 64;
export type PlateName = (typeof inscriptions)[number][1];

/** Box UVs can be measured in metres: a long garden wall shouldn't stretch one stone across it. */
export function block(
  parent: Parent,
  mat: Mat,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  tileSize?: number,
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (tileSize) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      uv.setXY(
        i,
        (uv.getX(i) * (face < 2 ? d : w)) / tileSize,
        (uv.getY(i) * (face >= 2 && face < 4 ? d : h)) / tileSize,
      );
    }
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function face(
  parent: Parent,
  mat: Mat,
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  yaw = 0,
) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function facade(parent: Parent, x: number, z: number, yaw = 0) {
  const side = new THREE.Group();
  side.position.set(x, 0, z);
  side.rotation.y = yaw;
  parent.add(side);
  return side;
}

/** +Z is the eave facing the lane. A long ridge gives gables, a short one gives hips. */
export function pitchedRoof(
  parent: Parent,
  tile: Mat,
  end: Mat,
  w: number,
  d: number,
  y: number,
  rise: number,
  ridgeHalf: number,
) {
  const x = w / 2,
    z = d / 2,
    r = ridgeHalf;
  type V = [number, number, number];
  const fl: V = [-x, 0, z],
    fr: V = [x, 0, z],
    bl: V = [-x, 0, -z],
    br: V = [x, 0, -z];
  const l: V = [-r, rise, 0],
    h: V = [r, rise, 0];
  const panel = (mat: Mat, corners: V[], side = false) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(corners.flat(), 3));
    geo.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(
        corners.flatMap((p) => [
          (side ? p[2] : p[0]) / 4,
          ((p[1] / rise) * Math.hypot(rise, side ? x - r : z)) / 4,
        ]),
        2,
      ),
    );
    geo.setIndex(corners.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = y;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
  };
  panel(tile, [fl, fr, h, l]);
  panel(tile, [br, bl, l, h]);
  panel(end, [fr, br, h], true);
  panel(end, [bl, fl, l], true);
}

/** A single enamel atlas for nameplates, street directions and house numbers. */
function enamelAtlas(villageName = 'KUZDAĞ') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  function plate(x: number, y: number, w: number, h: number, line: string, title?: string) {
    ctx.fillStyle = title === 'KÖY ÇEŞMESİ' ? '#635d50' : '#293e44';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cecab2';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, y + 5, w - 12, h - 10);
    for (const dx of [11, w - 11])
      for (const dy of [11, h - 11]) {
        ctx.fillStyle = '#857762';
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    ctx.fillStyle = '#ede6cf';
    ctx.font = title ? 'bold 19px serif' : 'bold 40px serif';
    ctx.fillText(line, x + w / 2, y + h * (title ? 0.25 : 0.51));
    if (title) {
      ctx.font = 'bold 48px serif';
      ctx.fillText(title, x + w / 2, y + h * 0.66, w - 45);
    }
    for (let i = 0; i < w * 0.6; i++) {
      const t = (i * 293 + 19) % w,
        u = (i * 131 + t * 7) % h;
      ctx.fillStyle = u < 7 || u > h - 7 ? '#73543d' : 'rgba(53,43,29,.22)';
      ctx.fillRect(x + t, y + u, (i % 5) + 1, (i % 3) + 1);
    }
  }
  inscriptions.forEach(([s, t], i) => plate(0, 128 * i, 512, 128, s.replaceAll('KUZDAĞ',villageName), t.replaceAll('KUZDAĞ',villageName))); 
  for (let i = 0; i < 24; i++)
    plate(
      (i % 8) * 64,
      inscriptions.length * 128 + Math.floor(i / 8) * 64,
      64,
      64,
      String(i + 1).padStart(2, '0'),
    );
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Per-world finishes: the custom photo maps are local and never replaced by a CC0 timber swap. */
export class VillageCraft {
  readonly masonry: THREE.MeshStandardMaterial;
  readonly wood: THREE.MeshStandardMaterial;
  readonly limestone: THREE.MeshStandardMaterial;
  readonly lime: THREE.MeshStandardMaterial[];
  readonly shutters: THREE.MeshStandardMaterial[];
  readonly tile: THREE.MeshStandardMaterial;
  readonly roofVariants: THREE.MeshStandardMaterial[];
  readonly earthen: THREE.MeshStandardMaterial;
  readonly metalRoof: THREE.MeshStandardMaterial;
  readonly kilim: THREE.MeshStandardMaterial;
  readonly pane: THREE.MeshStandardMaterial;
  readonly door: THREE.MeshStandardMaterial;
  readonly water: THREE.MeshStandardMaterial;
  readonly metal = new THREE.MeshStandardMaterial({ color: 0x786448, metalness: 0.42, roughness: 0.57 });
  readonly enamel: THREE.MeshStandardMaterial;
  private maps: THREE.Texture[] = [];
  private replacements: {
    id: KitId;
    part: string;
    mount: Parent;
    fallback: THREE.Group;
    privateMats: boolean;
  }[] = [];
  private entryFinish: THREE.MeshStandardMaterial;

  constructor(t: VillageTextures, villageName = 'KUZDAĞ') {
    const standard = (
      map: THREE.Texture | null,
      color: number,
      roughness = 0.91,
      normalMap: THREE.Texture | null = null,
    ) => new THREE.MeshStandardMaterial({ map, color, normalMap, roughness });
    this.masonry = standard(t.stone, 0xd9d7ca, 0.95, t.stoneNormal);
    this.masonry.normalScale.setScalar(0.72);
    this.wood = standard(t.board, 0xb6a892, 0.92);
    this.limestone = standard(t.marble, 0xc8c3b8, 0.94);
    this.lime = [0xe0d4ba, 0xc3c1a6, 0xc7a385].map((c) => standard(t.plaster, c, 0.93, t.plasterNormal));
    this.shutters = [0x708075, 0x947d63, 0x677d85].map((c) => standard(t.timber, c, 0.93));
    this.tile = standard(t.roof, 0xc7b3a4, 0.93, t.roofNormal);
    this.roofVariants = [0x947f70, 0xb2a094, 0x8d7973].map(c => standard(t.roof, c, 0.96, t.roofNormal));
    this.earthen = standard(t.earthenPlaster, 0xa79a83, 0.98, t.wornPlasterNormal);
    this.metalRoof = standard(t.metalSheet, 0xb5b8b3, 0.72);
    this.metalRoof.metalness = 0.28;
    this.kilim = standard(t.kilim, 0xb4a79a, 0.99);
    this.pane = standard(t.sash, 0xd1d2c7, 0.73);
    this.door = standard(t.door, 0xc1b4a6, 0.88);
    this.water = new THREE.MeshStandardMaterial({
      map: t.water,
      color: 0x96aaa4,
      roughness: 0.36,
      metalness: 0.12,
    });
    this.entryFinish = standard(t.entry, 0xf2ece0, 0.94);
    const atlas = enamelAtlas(villageName);
    this.maps.push(atlas);
    this.enamel = standard(atlas, 0xffffff, 0.74);
  }

  /** Keep the stable parent (including visibility, hinge or collider), swap only its art. */
  mount(id: KitId, part: string, fallback: THREE.Group, privateMats = false) {
    const mount = new THREE.Group();
    mount.add(fallback);
    this.replacements.push({ id, part, mount, fallback, privateMats });
    return mount;
  }
  install(assets: WorkshopAssets, id: KitId) {
    for (const slot of this.replacements.filter((v) => v.id === id)) {
      const mesh = assets.node(id, slot.part);
      if (!mesh) continue;
      slot.mount.add(mesh);
      slot.fallback.removeFromParent();
      const geos = new Set<THREE.BufferGeometry>(),
        mats = new Set<THREE.Material>();
      slot.fallback.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geos.add(o.geometry);
          if (slot.privateMats)
            for (const m of Array.isArray(o.material) ? o.material : [o.material]) mats.add(m);
        }
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      slot.fallback.clear();
    }
    this.replacements = this.replacements.filter((v) => v.id !== id);
  }

  plate(
    parent: Parent,
    name: PlateName | number,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    yaw = 0,
  ) {
    const label = face(parent, this.enamel, w, h, x, y, z, yaw);
    const number = typeof name === 'number';
    const row = number
      ? inscriptions.length + Math.floor((name - 1) / 8) * 0.5
      : inscriptions.findIndex(([, title]) => title === name);
    const uv = label.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(
        i,
        number ? (((name - 1) % 8) * 64 + 1 + uv.getX(i) * 62) / 512 : 0.002 + uv.getX(i) * 0.996,
        1 - (row * 128 + 1 + (1 - uv.getY(i)) * (number ? 62 : 126)) / atlasHeight,
      );
    }
    return label;
  }

  window(
    parent: Parent,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    yaw = 0,
    shutter?: Mat,
    closed = false,
  ) {
    const side = facade(parent, x, z, yaw);
    block(side, this.wood, w + 0.1, h + 0.1, 0.11, 0, y, 0.025);
    face(side, this.pane, w, h, 0, y, 0.086);
    block(side, this.limestone, w + 0.25, 0.085, 0.24, 0, y - h / 2 - 0.06, 0.06);
    if (!shutter) return;
    for (const sign of [-1, 1]) {
      const leaf = facade(side, sign * (w / 2 + 0.025), 0.105, sign * (closed ? 2.99 : 0.19));
      block(leaf, shutter, w * 0.47, h + 0.02, 0.055, sign * w * 0.24, y, 0);
      for (const v of [-0.29, 0.29])
        block(leaf, this.wood, w * 0.43, 0.043, 0.022, sign * w * 0.24, y + h * v, 0.036);
    }
  }

  house(style: HouseStyle, no: number, w: number, d: number, height: number) {
    const shell = new THREE.Group();
    const fallback = new THREE.Group();
    const eave = style === 'cumba' ? 4.82 : style === 'himis' ? 4.23 : 3.34;
    block(fallback, this.masonry, 6, 1.02, 5, 0, 0.51, 0, 2.5);
    block(fallback, this.lime[no % 3], 6, eave - 1.02, 5, 0, (eave + 1.02) / 2, 0);
    pitchedRoof(fallback, this.tile, this.tile, 6.64, 5.76, eave, 1.17, 1.14);
    // The fallback is visible while assets load and when a model fails. Give it a
    // complete street-facing facade rather than an unbroken featureless box.
    const doorX = style === 'cumba' ? -0.37 : style === 'himis' ? -0.72 : 1.04;
    face(fallback, this.wood, 0.95, 2.04, doorX, 1.02, 2.506);
    for (const x of [-2.1, 2.05]) {
      this.window(fallback, x, 1.75, 2.51, 0.75, 0.95);
      if (eave > 3.8) this.window(fallback, x, 3.2, 2.51, 0.75, 0.9);
    }
    if (style !== 'tas') {
      for (const x of [-2.94, 0, 2.94])
        block(fallback, this.wood, 0.12, eave - 1.02, 0.08, x, (eave + 1.02) / 2, 2.53);
      block(fallback, this.wood, 6, 0.12, 0.08, 0, 2.55, 2.53);
    }
    shell.add(this.mount(style, style, fallback));
    this.plate(shell, no, 0.24, 0.24, doorX + 0.81, 1.8, 2.513);
    if (no === 1) {
      const rug = face(shell, this.kilim, 0.54, 0.7, 0.57, 3.01, 2.971);
      rug.rotation.z = -0.025;
    }
    shell.name = `hane-${no}-${style}`;
    shell.scale.set(w / 6, height / 4, d / 5);
    return shell;
  }

  /** Lapped boards, recessed seams, battens and fasteners; the lid remains at the pickup height. */
  chest(w: number, h: number, d: number) {
    const g = new THREE.Group(),
      mat = this.wood,
      rows = 4;
    for (const s of [-1, 1]) {
      for (let i = 0; i < rows; i++) {
        const y = 0.038 + ((i + 0.5) * (h - 0.082)) / rows;
        block(g, mat, w, (h - 0.082) / rows - 0.006, 0.043, 0, y, (s * (d - 0.043)) / 2);
        block(g, mat, 0.043, (h - 0.082) / rows - 0.006, d - 0.068, (s * (w - 0.043)) / 2, y, 0);
      }
      for (const side of [-1, 1]) {
        block(g, mat, 0.065, h - 0.026, 0.027, side * (w * 0.5 - 0.066), h * 0.5, s * (d * 0.5 + 0.008));
        for (const y of [0.086, h - 0.1])
          block(g, this.metal, 0.013, 0.013, 0.008, side * (w * 0.5 - 0.066), y, s * (d * 0.5 + 0.026));
      }
      block(g, mat, w + 0.018, 0.052, 0.074, 0, 0.03, s * (d * 0.5 - 0.031));
    }
    const n = Math.ceil(d / 0.13);
    for (let i = 0; i < n; i++)
      block(g, mat, w + 0.014, 0.049, d / n - 0.003, 0, h - 0.0245, -d * 0.5 + ((i + 0.5) * d) / n);
    bakeStaticChildrenByMaterial(g);
    return g;
  }

  fountain() {
    const g = new THREE.Group();
    g.name = 'Hayrat çeşmesi';
    const fallback = new THREE.Group();
    block(fallback, this.masonry, 2.37, 2.59, 0.55, 0, 1.26, -0.42, 2.1);
    block(fallback, this.limestone, 2.1, 0.54, 0.25, 0, 0.28, 0.66);
    block(fallback, this.limestone, 0.48, 0.095, 0.48, 0.72, 1.1525, 0.095);
    block(g, this.water, 1.74, 0.016, 0.7, 0, 0.426, 0.18);
    this.plate(g, 'KÖY ÇEŞMESİ', 0.86, 0.178, 0, 2.442, -0.198);
    const brass = this.metal;
    const outlet = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.935, -0.227),
      new THREE.Vector3(0, 0.935, 0.072),
      new THREE.Vector3(0, 0.865, 0.144),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(outlet, 8, 0.034, 8, false), brass));
    block(g, brass, 0.035, 0.12, 0.035, 0, 0.982, 0.025);
    const tap = new THREE.Mesh(new THREE.TorusGeometry(0.077, 0.012, 6, 14), brass);
    tap.position.set(0, 1.042, 0.025);
    tap.rotation.x = Math.PI / 2;
    g.add(tap);
    bakeStaticChildrenByMaterial(g);
    g.add(this.mount('hayrat', 'hayrat', fallback));
    return g;
  }

  /** All trim is outside the split +X wall. The oak leaf stays on the original hinge. */
  gasilEntry(parent: Parent, hinge: THREE.Group, w: number, d: number, h: number, earthenWall: Mat, southExtension = 0) {
    const entry = facade(parent, w / 2 + 0.125, 0, Math.PI / 2);
    // A split projection, not a decal across the doorway. Source x=201..264 is the leaf.
    const panel = (
      parent: Parent,
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      crop: number[],
      yaw = 0,
      material: Mat = this.entryFinish,
    ) => {
      const p = face(parent, material, w, h, x, y, z, yaw),
        uv = p.geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(
          i,
          (crop[0] - 52 + (crop[2] - crop[0]) * uv.getX(i)) / 397,
          1 - (crop[1] - 90 + (crop[3] - crop[1]) * (1 - uv.getY(i))) / 157,
        );
      return p;
    };
    const jamb = (d - 1.6) / 2;
    panel(entry, jamb, h, -0.8 - jamb / 2, h / 2, 0.012, [53, 91, 201, 245], 0, earthenWall);
    panel(entry, jamb, h, 0.8 + jamb / 2, h / 2, 0.012, [264, 91, 448, 245], 0, earthenWall);
    panel(entry, 1.6, h - 2.35, 0, (h + 2.35) / 2, 0.012, [201, 91, 264, 119], 0, earthenWall);
    for (const sign of [-1, 1]) block(entry, this.wood, 0.1, 2.31, 0.135, sign * 0.85, 1.16, 0.02);
    block(entry, this.wood, 1.93, 0.13, 0.16, 0, 2.38, 0.048);
    this.plate(entry, 'GASİLHANE', 1.28, 0.3, 0, 2.77, 0.035);
    const flank = facade(parent, 0, d / 2 + southExtension + 0.145);
    block(flank, earthenWall, w + 0.2, h, 0.065, 0, h / 2, 0, 2.2);
    block(flank, this.masonry, w + 0.22, 0.95, 0.115, 0, 0.45, 0.027, 2.25);
    for (const x of [-1.7, 0.63]) {
      this.window(flank, x, 2.18, 0.037, 0.9, 1.03);
      for (const dx of [-0.25, 0, 0.25])
        block(flank, this.metal, 0.025, 1.07, 0.032, x + dx, 2.18, 0.15);
    }
    // The hinge is on -Z: viewed from +X it is on the viewer's right.
    panel(hinge, 1.54, 2.22, 0.049, 1.11, 0.77, [205, 134, 261, 239], Math.PI / 2);
  }

  dispose() {
    this.replacements.length = 0;
    this.maps.forEach((t) => t.dispose());
    for (const m of [
      this.masonry,
      this.wood,
      this.limestone,
      ...this.lime,
      ...this.shutters,
      this.tile,
      ...this.roofVariants,
      this.earthen,
      this.metalRoof,
      this.kilim,
      this.pane,
      this.door,
      this.metal,
      this.enamel,
      this.entryFinish,
      this.water,
    ])
      m.dispose();
  }
}
