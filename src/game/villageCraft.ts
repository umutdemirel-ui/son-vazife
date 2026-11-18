import * as THREE from 'three';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import type { ProceduralTextureSet } from './textures';

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
] as const;
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
      const face = Math.floor(i / 8);
      uv.setXY(
        i,
        (uv.getX(i) * (face === 0 ? d : w)) / tileSize,
        (uv.getY(i) * (face === 1 ? d : h)) / tileSize,
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
function enamelAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
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
  inscriptions.forEach(([s, t], i) => plate(0, 128 * i, 512, 128, s, t));
  for (let i = 0; i < 8; i++) plate(i * 64, 896, 64, 64, String(i + 1).padStart(2, '0'));
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
  readonly kilim: THREE.MeshStandardMaterial;
  readonly pane: THREE.MeshStandardMaterial;
  readonly door: THREE.MeshStandardMaterial;
  readonly water = new THREE.MeshStandardMaterial({ color: 0x65776c, metalness: 0.15, roughness: 0.25 });
  readonly metal = new THREE.MeshStandardMaterial({ color: 0x786448, metalness: 0.42, roughness: 0.57 });
  readonly enamel: THREE.MeshStandardMaterial;
  private maps: THREE.Texture[] = [];
  private disposed = false;

  constructor(t: ProceduralTextureSet) {
    const standard = (
      map: THREE.Texture | null,
      color: number,
      roughness = 0.91,
      normalMap: THREE.Texture | null = null,
    ) => new THREE.MeshStandardMaterial({ map, color, normalMap, roughness });
    this.masonry = standard(t.stone, 0xd9d7ca, 0.95, t.stoneNormal);
    this.masonry.normalScale.setScalar(0.73);
    this.wood = standard(t.timber, 0xb0a28d, 0.88, t.timberNormal);
    this.limestone = standard(t.marble, 0xc8c3b8, 0.94);
    this.lime = [0xe0d4ba, 0xc3c1a6, 0xc7a385].map((c) => standard(t.plaster, c, 0.93, t.plasterNormal));
    this.shutters = [0x708075, 0x947d63, 0x677d85].map((c) => standard(t.timber, c, 0.93));
    this.tile = standard(t.roof, 0xc7b3a4, 0.9, t.roofNormal);
    this.kilim = standard(t.kilim, 0xa59a8f, 0.99);
    this.pane = standard(null, 0x424c52, 0.72);
    this.door = standard(t.timber, 0xaca08a, 0.92);
    const atlas = enamelAtlas();
    this.maps.push(atlas);
    this.enamel = standard(atlas, 0xffffff, 0.74);
    const loader = new THREE.TextureLoader();
    const photo = (
      file: string,
      mat: THREE.MeshStandardMaterial,
      slot: 'map' | 'normalMap',
      repeat = false,
    ) => {
      mat.userData.authoredFinish = true;
      const tex = loader.load(`/assets/village/${file}.webp`, () => {
        if (this.disposed) return;
        mat[slot] = tex;
        if (mat === this.pane) mat.color.setHex(0xd1d2c7);
        mat.needsUpdate = true;
      });
      tex.colorSpace = slot === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = t.stone.anisotropy;
      this.maps.push(tex);
    };
    photo('fieldstone', this.masonry, 'map', true);
    photo('fieldstone-normal', this.masonry, 'normalMap', true);
    photo('cut-limestone', this.limestone, 'map', true);
    photo('sash', this.pane, 'map');
    photo('plank-door', this.door, 'map');
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
    const row = number ? 7 : inscriptions.findIndex(([, title]) => title === name);
    const uv = label.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(
        i,
        number ? ((name - 1) * 64 + 1 + uv.getX(i) * 62) / 512 : 0.002 + uv.getX(i) * 0.996,
        1 - (row * 128 + 1 + (1 - uv.getY(i)) * (number ? 62 : 126)) / 1024,
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
    const g = new THREE.Group();
    g.name = `hane-${no}-${style}`;
    const bay = style === 'cumba',
      gable = style === 'himis';
    const eave = height + (bay ? 0.34 : gable ? 0.05 : -0.58);
    const split = bay ? 2.22 : gable ? 1.13 : eave - 0.85;
    const upW = w + (bay ? 0.17 : 0.02),
      upD = d + (bay ? 0.2 : 0.02);
    const lime = this.lime[(no - 1) % 3],
      paint = this.shutters[(no - 1) % 3];
    block(g, this.masonry, w, split + 0.24, d, 0, split / 2 - 0.12, 0, 2.5);
    block(g, lime, upW, eave - split, upD, 0, (split + eave) / 2, 0);
    block(g, this.wood, upW + 0.12, 0.14, upD + 0.14, 0, split, 0);
    block(g, this.wood, upW + 0.52, 0.18, upD + 0.6, 0, eave + 0.02, 0);
    const rise = gable ? 1.72 : bay ? 1.48 : 1.14;
    const roofW = upW + 0.78,
      roofD = upD + 0.82,
      ridge = roofW * (gable ? 0.5 : bay ? 0.25 : 0.31);
    pitchedRoof(g, this.tile, gable ? lime : this.tile, roofW, roofD, eave + 0.1, rise, ridge);
    block(g, this.tile, ridge * 2 + 0.15, 0.12, 0.19, 0, eave + 0.1 + rise, 0);
    const cx = (no % 2 ? -1 : 1) * w * 0.25,
      cy = eave + rise + 0.3;
    block(g, this.masonry, 0.56, 1.42, 0.62, cx, cy - 0.66, -d * 0.19, 1.6);
    block(g, this.limestone, 0.68, 0.11, 0.73, cx, cy + 0.08, -d * 0.19);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.32, 10), this.tile);
    pot.position.set(cx, cy + 0.29, -d * 0.19);
    g.add(pot);
    const front = facade(g, 0, d / 2);
    const doorX = (no % 2 ? -1 : 1) * w * (gable ? 0.22 : 0.14);
    block(front, this.wood, 1.16, 1.97, 0.2, doorX, 1.05, 0.045);
    face(front, this.door, 0.98, 1.84, doorX, 1.04, 0.15);
    block(front, this.limestone, 1.35, 0.17, 0.55, doorX, 0.085, 0.19);
    this.plate(front, no, 0.22, 0.22, doorX + 0.78, 1.69, 0.024);
    const awning = block(front, this.tile, 1.62, 0.115, 0.75, doorX, 2.18, 0.3);
    awning.rotation.x = 0.18;
    const mid = (split + eave) / 2,
      zoom = d / 2;
    if (bay) {
      // Enclosed projection above the threshold; its timber corbels don't reach the walking lane.
      const bw = w * 0.68,
        bh = eave - 2.26;
      block(g, lime, bw, bh, 0.62, 0, 2.26 + bh / 2, zoom + 0.33);
      for (const y of [2.24, eave]) block(g, this.wood, bw + 0.17, 0.14, 0.85, 0, y, zoom + 0.32);
      block(g, this.tile, bw + 0.34, 0.12, 1.02, 0, eave + 0.13, zoom + 0.28).rotation.x = 0.12;
      for (const dx of [-0.33, 0, 0.33]) {
        this.window(g, dx * bw, mid + 0.05, zoom + 0.65, 0.84, 1.3);
        block(g, this.wood, 0.12, 0.66, 0.15, dx * bw, 1.98, zoom + 0.31).rotation.x = 0.68;
      }
      // A single folded kilim, not the same dressing in every lit or empty house.
      if (no === 1) {
        const rug = face(g, this.kilim, 0.88, 0.80, 0.33 * bw, mid - 1.00, zoom + 0.864);
        rug.rotation.z = -0.025;
        const hem = rug.geometry.attributes.position;
        for (let i = 0; i < hem.count; i++) if (hem.getY(i) < 0) hem.setZ(i, -0.035);
        rug.geometry.computeVertexNormals();
        for (let i = 0; i < 13; i++)
          block(
            g,
            this.limestone,
            0.012,
            0.069,
            0.012,
            0.33 * bw - 0.425 + i * 0.069,
            mid - 1.42 - i * 0.0015,
            zoom + 0.829,
          );
      }
      for (const dx of [-1, 1]) block(g, this.wood, 0.11, bh, 0.12, dx * (bw / 2 - 0.03), mid, zoom + 0.61);
    } else {
      const wy = gable ? eave - 1.04 : 1.8;
      for (const dx of gable ? [-0.31, 0.04, 0.36] : [doorX > 0 ? -0.27 : 0.27]) {
        this.window(
          g,
          w * dx,
          wy,
          upD / 2 + 0.015,
          gable ? 0.76 : 0.88,
          gable ? 1.13 : 1.06,
          0,
          paint,
          !gable && no % 2 === 0,
        );
      }
    }
    for (const sign of [-1, 1]) {
      const wall = facade(g, (sign * upW) / 2, 0, (sign * Math.PI) / 2);
      for (const off of [-0.23, 0.25])
        this.window(
          wall,
          off * d,
          eave - 0.95,
          0.012,
          0.78,
          1.13,
          0,
          off < 0 ? paint : undefined,
          no % 3 === 0,
        );
      if (gable) {
        for (const off of [-1, 1]) {
          block(front, this.wood, 0.12, eave - split, 0.12, off * w * 0.49, mid, 0.04);
          block(wall, this.wood, 0.105, 1.13, 0.1, off * d * 0.4, split + 0.55, 0.034).rotation.z =
            off * 0.46;
        }
      }
    }
    this.window(g, -w * 0.19, eave - 1, -upD / 2 - 0.01, 0.75, 1.05, Math.PI, paint, true);
    bakeStaticChildrenByMaterial(g);
    return g;
  }

  fountain() {
    const g = new THREE.Group();
    g.name = 'Hayrat çeşmesi';
    const stone = this.masonry,
      cap = this.limestone;
    block(g, stone, 2.36, 2.05, 0.55, 0, 0.99, -0.39, 2.1);
    block(g, stone, 1.86, 0.55, 0.55, 0, 2.26, -0.39, 2.1);
    block(g, cap, 1.98, 0.13, 0.72, 0, 2.59, -0.38);
    this.plate(g, 'KÖY ÇEŞMESİ', 1.24, 0.3, 0, 2.37, -0.103);
    // Actual set-back spout wall, arched stone surround with individual wedge joints.
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 4; i++) block(g, cap, 0.22, 0.29, 0.29, sign * 0.75, 0.25 + i * 0.3, -0.02);
      block(g, cap, 0.32, 0.1, 0.35, sign * 0.75, 1.21, -0.015);
    }
    for (let i = 0; i < 11; i++) {
      const shape = new THREE.Shape(),
        inner = 0.64,
        outer = i === 5 ? 0.94 : 0.87;
      const a = (i * Math.PI) / 11 + 0.007,
        b = ((i + 1) * Math.PI) / 11 - 0.007;
      shape.moveTo(inner * Math.cos(a), inner * Math.sin(a));
      shape.absarc(0, 0, inner, a, b, false);
      shape.lineTo(outer * Math.cos(b), outer * Math.sin(b));
      shape.absarc(0, 0, outer, b, a, true);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false, curveSegments: 12 });
      const voussoir = new THREE.Mesh(geo, cap);
      voussoir.position.set(0, 1.24, -0.105);
      voussoir.castShadow = voussoir.receiveShadow = true;
      g.add(voussoir);
    }
    block(g, cap, 2.04, 0.19, 0.92, 0, 0.095, 0.29);
    block(g, cap, 2.04, 0.4, 0.24, 0, 0.36, 0.66); // ewer rests on this coping at +0.56 m
    for (const sign of [-1, 1]) block(g, cap, 0.17, 0.4, 0.66, sign * 0.935, 0.36, 0.25);
    block(g, this.water, 1.7, 0.018, 0.54, 0, 0.43, 0.256);
    block(g, cap, 0.5, 0.09, 0.43, 0.72, 1.155, 0.13); // soap shelf: top at +1.20 m
    const brass = this.metal;
    const outlet = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.02, -0.13),
      new THREE.Vector3(0, 1.02, 0.11),
      new THREE.Vector3(0, 0.96, 0.18),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(outlet, 8, 0.034, 8, false), brass));
    block(g, brass, 0.035, 0.13, 0.035, 0, 1.075, 0.045);
    const tap = new THREE.Mesh(new THREE.TorusGeometry(0.077, 0.012, 6, 14), brass);
    tap.position.set(0, 1.14, 0.045);
    tap.rotation.x = Math.PI / 2;
    g.add(tap);
    bakeStaticChildrenByMaterial(g);
    return g;
  }

  /** All trim is outside the split +X wall. The oak leaf stays on the original hinge. */
  gasilEntry(parent: Parent, hinge: THREE.Group, w: number, d: number, h: number) {
    const entry = facade(parent, w / 2 + 0.125, 0, Math.PI / 2);
    for (const sign of [-1, 1]) {
      block(entry, this.lime[0], 2.37, h, 0.055, sign * 2.0, h / 2, 0.012);
      block(entry, this.masonry, 2.37, 0.86, 0.11, sign * 2.0, 0.4, 0.033, 2.25);
      block(entry, this.wood, 0.14, 2.32, 0.18, sign * 0.89, 1.17, 0.07);
      const strut = block(entry, this.wood, 0.105, 0.61, 0.105, sign * 1.38, 2.71, 0.23);
      strut.rotation.x = 0.74;
    }
    block(entry, this.lime[0], 1.62, h - 2.4, 0.056, 0, 2.4 + (h - 2.4) / 2, 0.014);
    block(entry, this.wood, 1.94, 0.14, 0.2, 0, 2.43, 0.065);
    this.plate(entry, 'GASİLHANE', 1.33, 0.33, 0, 2.71, 0.057);
    block(entry, this.wood, 3.26, 0.12, 1.02, 0, 3.07, 0.4).rotation.x = 0.16;
    block(entry, this.tile, 3.39, 0.1, 1.12, 0, 3.16, 0.4).rotation.x = 0.16;
    const flank = facade(parent, 0, d / 2 + 0.145);
    block(flank, this.lime[0], w + 0.2, h, 0.065, 0, h / 2, 0);
    block(flank, this.masonry, w + 0.22, 0.95, 0.115, 0, 0.45, 0.027, 2.25);
    for (const x of [-1.7, 0.63]) {
      this.window(flank, x, 2.18, 0.037, 0.9, 1.03);
      for (const dx of [-0.25, 0, 0.25]) block(flank, this.metal, 0.025, 1.07, 0.032, x + dx, 2.18, 0.15);
    }
    // The hinge is on -Z: viewed from +X it is on the viewer's right.
    const leaf = face(hinge, this.door, 1.54, 2.22, 0.049, 1.11, 0.77, Math.PI / 2);
    const uv = leaf.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  }

  dispose() {
    this.disposed = true;
    this.maps.forEach((t) => t.dispose());
    for (const m of [
      this.masonry,
      this.wood,
      this.limestone,
      ...this.lime,
      ...this.shutters,
      this.tile,
      this.kilim,
      this.pane,
      this.door,
      this.metal,
      this.enamel,
      this.water,
    ])
      m.dispose();
  }
}
