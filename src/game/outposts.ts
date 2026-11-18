import * as THREE from 'three';
import { NightArt } from './nightArt';
import { platformKeeper } from './platformKeeper';
import { OUTPOSTS, OUTPOST_IDS, RELAY, type Outpost } from './valley';
import type { BoxCollider } from './collision';
import { groundHeightAt } from './terrain';
import { VisibilityCells } from './visibilityCells';
import { VillageCraft, block, face, pitchedRoof, type PlateName } from './villageCraft';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import { createDistrictSignpost } from './models';

type Register = (
  id: string,
  pos: THREE.Vector3,
  size: [number, number, number],
  dist?: number,
  parent?: THREE.Object3D,
) => void;

export function buildOutposts(
  scene: THREE.Scene,
  craft: VillageCraft,
  art: NightArt,
  cells: VisibilityCells,
  colliders: BoxCollider[],
  register: Register,
  owned: { dispose: () => void }[],
) {
  const rooms = {} as Record<Outpost, THREE.Group>;
  const doors = {} as Record<Outpost, { pivot: THREE.Group; open: boolean; collider: BoxCollider }>;
  const finish = (color: number, metalness = 0) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness });
    owned.push(mat);
    return mat;
  };
  const ink = finish(0x263135),
    brass = finish(0xaa834e, 0.37),
    paper = finish(0xe2d6b8),
    red = finish(0x9d3e32),
    bagCloth = finish(0x6c6c51);
  const box = (cx: number, cz: number, w: number, d: number) =>
    colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 });
  const cyl = (
    g: THREE.Group,
    mat: THREE.Material,
    rt: number,
    rb: number,
    h: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), mat);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  function target(
    g: THREE.Group,
    id: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    register(id, new THREE.Vector3(x, y, z), [w, h, d], 2.75, g);
  }
  // These originals share their floor height, actual opening and collider with the surveyed building.
  for (const id of OUTPOST_IDS) {
    const b = OUTPOSTS[id],
      w = b.w,
      d = b.d,
      h = id === 'school' ? 3.74 : id === 'station' ? 3.35 : 2.72;
    const g = (rooms[id] = new THREE.Group());
    g.name = b.name;
    g.position.set(b.x, b.y, b.z);
    cells.add(scene, g, 42, 65);
    const shell = new THREE.Group();
    block(shell, craft.masonry, w, 0.09, d, 0, 0.045, 0, 2);
    for (const side of [-1, 1]) {
      block(shell, craft.lime[1], 0.16, h, d, side * (w / 2 - 0.08), h / 2, 0, 2.2);
      box(b.x + side * (w / 2 - 0.08), b.z, 0.16, d);
      const v = (w - b.door) / 2;
      block(shell, craft.lime[0], v, h, 0.16, (side * (b.door + v)) / 2, h / 2, d / 2 - 0.08, 2.2);
      box(b.x + (side * (b.door + v)) / 2, b.z + d / 2 - 0.08, v, 0.16);
    }
    block(shell, craft.lime[0], b.door, h - 2.32, 0.16, 0, 2.32 + (h - 2.32) / 2, d / 2 - 0.08, 2.2);
    block(shell, craft.lime[1], w, h, 0.16, 0, h / 2, -d / 2 + 0.08, 2.2);
    box(b.x, b.z - d / 2 + 0.08, w, 0.16);
    pitchedRoof(shell, craft.tile, craft.tile, w + 0.6, d + 0.55, h, 0.92, w * 0.31);
    bakeStaticChildrenByMaterial(shell);
    if (id === 'exchange') g.add(shell);
    else {
      const model = id === 'school' ? 'mektep' : 'istasyon';
      g.add(art.mount(model, shell));
      art.near(model, b.x, b.z, 50);
    }
    // Normally open to preserve the established routes. A real hinged leaf can also be closed.
    const pivot = new THREE.Group();
    pivot.position.set(-b.door / 2, 0.1, d / 2);
    block(pivot, craft.door, b.door, 2.2, 0.1, b.door / 2, 1.1, 0);
    pivot.rotation.y = -Math.PI * 0.52;
    g.add(pivot);
    doors[id] = { pivot, open: true, collider: {
      minX: b.x - b.door / 2, maxX: b.x + b.door / 2,
      minZ: b.z + d / 2 - 0.09, maxZ: b.z + d / 2 + 0.09,
    } };
    target(pivot, `outpost_door_${id}`, b.door / 2, 1.1, 0, b.door, 2.2, 0.25);
    // Close the underside of the roof even on the open-sided procedural fallback.
    // Meter-scale interior finishes avoid stretching a two-pixel edge of the facade photograph across a room.
    block(g, craft.wood, w - 0.3, 0.032, d - 0.28, 0, h - 0.055, 0, 2.1);
    block(
      g,
      id === 'station' ? craft.limestone : craft.wood,
      w - 0.25,
      0.039,
      d - 0.26,
      0,
      0.089,
      0,
      1.68,
    );
    for (const sign of [-1, 1]) {
      const x = sign * (w / 2 - 0.165);
      block(g, craft.lime[1], 0.04, h - 0.15, d - 0.28, x, h / 2, 0, 2.45);
      block(
        g,
        craft.shutters[id === 'school' ? 0 : 2],
        0.05,
        0.77,
        d - 0.28,
        x - sign * 0.02,
        0.477,
        0,
        1.02,
      );
      const half = (w - b.door) / 2;
      block(
        g,
        craft.lime[1],
        half - 0.07,
        h - 0.14,
        0.035,
        (sign * (half + b.door)) / 2,
        h / 2,
        d / 2 - 0.17,
        2.1,
      );
      if (id !== 'exchange') {
        block(g, craft.lime[0], 0.049, h - 0.12, d - 0.22, sign * (w / 2 + 0.017), h / 2, 0, 2.32);
        block(g, craft.masonry, 0.068, 0.43, d - 0.17, sign * (w / 2 + 0.027), 0.215, 0, 1.62);
        craft.window(
          g,
          sign * (w / 2 + 0.048),
          1.84,
          0,
          1.14,
          1.43,
          (sign * Math.PI) / 2,
          craft.shutters[id === 'school' ? 2 : 1],
        );
        craft.window(g, sign * (w / 2 - 0.2), 1.84, 0, 1.1, 1.38, (-sign * Math.PI) / 2);
      }
    }
    block(g, craft.lime[0], w - 0.32, h - 0.16, 0.055, 0, h / 2, -d / 2 + 0.174, 2.2);
    block(
      g,
      craft.shutters[id === 'school' ? 0 : 2],
      w - 0.3,
      0.77,
      0.071,
      0,
      0.477,
      -d / 2 + 0.195,
      1.07,
    );
    block(g, craft.wood, w - 0.29, 0.054, 0.079, 0, 0.882, -d / 2 + 0.212, 1.6);
    for (const x of [-w * 0.3, 0, w * 0.3])
      block(g, craft.wood, 0.094, 0.118, d - 0.24, x, h - 0.107, 0, 1.7);
    craft.plate(
      g,
      id === 'school' ? 'SARI MEKTEP' : id === 'station' ? 'KUZDAĞ İSTASYONU' : 'SIRT SANTRALİ',
      id === 'station' ? 1.82 : 1.42,
      0.31,
      0,
      id === 'school' ? 3.35 : id === 'station' ? 3.02 : 2.54,
      d / 2 + 0.12,
    );
    const lamp = new THREE.PointLight(0xffd79d, 3.6, 7, 1.5);
    lamp.position.set(0.15, 2.31, 0.1);
    g.add(lamp);
    owned.push(lamp);
    cyl(g, brass, 0.07, 0.17, 0.1, 0.15, 2.47, 0.1);
    cyl(g, paper, 0.085, 0.059, 0.095, 0.15, 2.38, 0.1);
  }
  function desk(g: THREE.Group, x: number, z: number, w: number) {
    block(g, craft.wood, w, 0.085, 0.64, x, 0.79, z, 1.4);
    for (const s of [-1, 1])
      block(g, craft.wood, 0.12, 0.73, 0.52, x + s * (w / 2 - 0.13), 0.405, z, 0.9);
    box(g.position.x + x, g.position.z + z, w, 0.64);
  }
  function book(g: THREE.Group, x: number, y: number, z: number) {
    block(g, red, 0.51, 0.033, 0.35, x, y + 0.018, z);
    for (const side of [-1, 1]) {
      const leaf = block(g, paper, 0.236, 0.025, 0.326, x + side * 0.12, y + 0.042, z);
      leaf.rotation.z = side * -0.057;
      for (let i = 0; i < 6; i++)
        block(
          g,
          ink,
          0.16 - (i % 2) * 0.027,
          0.003,
          0.005,
          x + side * 0.12,
          y + 0.055,
          z - 0.113 + i * 0.041,
        );
    }
  }
  const school = rooms.school,
    station = rooms.station,
    exchange = rooms.exchange;
  // Chalkboard with worn frame, open folio and rows of paired desks flank a clear central aisle.
  function prop(
    g: THREE.Group,
    part: string,
    fallback: THREE.Group,
    x: number,
    y: number,
    z: number,
    yaw = 0,
  ) {
    const visual = art.mount('gece-esyasi', fallback, [part]);
    visual.position.set(x, y, z);
    visual.rotation.y = yaw;
    g.add(visual);
  }
  art.near('gece-esyasi', -10.5, 6, 12);
  art.near('gece-esyasi', 46, -60, 26);
  art.near('gece-esyasi', 59, 28, 25);
  const board = new THREE.Group();
  block(board, craft.wood, 4.05, 1.32, 0.08, 0, 0.66, 0);
  block(board, ink, 3.91, 1.2, 0.03, 0, 0.66, 0.048);
  prop(school, 'tahta', board, 0.2, 1.2, -2.7);
  desk(school, 1.1, 1.85, 1.1);
  book(school, 1.1, 0.835, 1.85);
  target(school, 'night_register', 1.1, 0.94, 1.85, 0.65, 0.38, 0.6);
  target(school, 'seyir_tahta', 0.2, 1.84, -2.63, 3.9, 1.21, 0.14);
  desk(school, -2.8, -1.69, 1.52);
  book(school, -2.79, 0.835, -1.66);
  target(school, 'night_roll', -2.79, 0.91, -1.66, 0.8, 0.44, 0.65);
  for (const z of [-0.33, 1.21]) {
    desk(school, 3.38, z, 1.48);
    block(school, craft.wood, 1.4, 0.085, 0.32, 3.38, 0.49, z + 0.52, 1);
  }
  block(school, craft.wood, 1.12, 0.08, 0.45, 2.76, 1.05, -2.49, 1);
  const satchel = new THREE.Group();
  block(satchel, bagCloth, 0.46, 0.26, 0.23, 0, 0.13, 0);
  block(satchel, brass, 0.073, 0.08, 0.012, 0, 0.15, 0.12);
  prop(school, 'heybe', satchel, 2.76, 1.09, -2.47, -0.12);
  target(school, 'night_bag', 2.76, 1.22, -2.48, 0.77, 0.65, 0.63);
  block(school, craft.wood, 0.13, 0.13, 0.54, 1.45, 2.34, 3.08);
  const bell = new THREE.Group();
  cyl(bell, brass, 0.058, 0.144, 0.2, 0, 0.1, 0);
  prop(school, 'can', bell, 1.45, 2.03, 3.23);
  cyl(school, bagCloth, 0.014, 0.016, 0.83, 1.45, 1.65, 3.23);
  target(school, 'night_bell', 1.45, 1.77, 3.24, 0.55, 1.02, 0.46);
  // Platform and disused railway; the track is outside the station door, not in the walkable room.
  block(station, craft.masonry, 14, 0.13, 2.25, 0, 0.04, 3.74, 2);
  for (const sign of [-1, 1])
    block(station, craft.metal, 26, 0.072, 0.061, 0, 0.112, 6.7 + sign * 0.69, 1);
  for (let n = -15; n <= 15; n++)
    block(station, craft.wood, 0.22, 0.085, 1.87, n * 0.82, 0.047, 6.7, 1.24);
  desk(station, -2.25, -1.48, 1.7);
  book(station, -2.26, 0.835, -1.47);
  target(station, 'night_ticket', -2.25, 0.91, -1.48, 0.8, 0.42, 0.6);
  desk(station, 2.45, -1.54, 1.28);
  const deck = new THREE.Group();
  block(deck, ink, 0.69, 0.12, 0.44, 0, 0.06, 0);
  for (const side of [-1, 1]) cyl(deck, craft.metal, 0.116, 0.116, 0.032, side * 0.149, 0.138, -0.064);
  prop(station, 'makara', deck, 2.45, 0.835, -1.54, -0.08);
  desk(station, 0, -1.7, 1.0);
  book(station, 0, 0.835, -1.7);
  target(station, 'night_verdict', 0, 0.93, -1.7, 0.68, 0.35, 0.6);
  target(station, 'night_spool', 2.45, 1, -1.54, 0.9, 0.49, 0.6);
  const keeper = platformKeeper(art, ink, brass, paper, red);
  station.add(keeper.root);
  target(keeper.root, 'seyir_sef', 0, 1.41, 0, 0.74, 1.1, 0.55);
  const signal = new THREE.Group();
  signal.position.set(5.76, 0.1, 3.74);
  station.add(signal);
  cyl(signal, ink, 0.063, 0.1, 2.72, 0, 1.36, 0);
  const arm = new THREE.Group();
  arm.position.set(0, 2.59, 0);
  block(arm, red, 0.95, 0.16, 0.06, 0.41, 0, 0);
  block(arm, paper, 0.12, 0.16, 0.065, 0.71, 0, 0);
  signal.add(arm);
  arm.rotation.z = -0.62;
  block(signal, craft.metal, 0.29, 0.6, 0.27, 0, 0.69, 0);
  block(signal, red, 0.074, 0.58, 0.079, 0.12, 1.15, 0.07).rotation.z = 0.31;
  target(station, 'night_signal', 5.76, 1.2, 3.74, 0.62, 1.32, 0.61);
  craft.plate(station, 'KAPALI HAT', 1.19, 0.29, -3.35, 1.72, 2.5);
  target(station, 'seyir_peron', -3.35, 1.72, 2.52, 1.22, 0.42, 0.32);
  craft.plate(exchange, 'ABONE 06', 0.63, 0.3, -1.21, 1.66, 2.44);
  target(exchange, 'seyir_abone', -1.21, 1.66, 2.47, 0.71, 0.43, 0.27);
  // Cold service junction and compact rural telephone exchange cabinet.
  const relay = new THREE.Group();
  relay.name = 'Dere dağıtım kutusu';
  relay.position.set(RELAY.x, groundHeightAt(RELAY.x, RELAY.z), RELAY.z);
  cells.add(scene, relay, 30, 44);
  block(relay, craft.wood, 0.21, 2.35, 0.21, 0, 1.17, 0, 0.82);
  block(relay, ink, 0.63, 0.78, 0.25, 0, 1.39, 0.12);
  block(relay, craft.metal, 0.65, 0.06, 0.32, 0, 1.81, 0.13);
  for (const [i, m] of [paper, ink, brass].entries()) {
    block(relay, m, 0.055, 0.36, 0.044, -0.17 + i * 0.17, 1.36, 0.256);
    cyl(relay, m, 0.046, 0.046, 0.07, -0.17 + i * 0.17, 1.57, 0.24);
  }
  target(relay, 'night_relay', 0, 1.41, 0.12, 0.78, 1.12, 0.51);
  box(RELAY.x, RELAY.z, 0.58, 0.4);
  const cabinet = new THREE.Group();
  block(cabinet, craft.wood, 1.04, 1.62, 0.47, 0, 0.81, 0, 1.3);
  block(cabinet, ink, 0.91, 1.22, 0.035, 0, 0.94, 0.25);
  for (let i = 0; i < 3; i++) block(cabinet, brass, 0.12, 0.12, 0.06, -0.24 + i * 0.24, 1.23, 0.29);
  const equipment = art.mount('santral', cabinet);
  equipment.position.set(0, 0.095, -1.85);
  exchange.add(equipment);
  art.near('santral', exchange.position.x, exchange.position.z, 30);
  target(exchange, 'night_line', 0, 1.09, -1.64, 1.14, 1.58, 0.61);
  box(exchange.position.x, exchange.position.z - 1.85, 1.1, 0.52);
  const dial = new THREE.Group();
  dial.name = 'Gasilhane kabul telefonu';
  dial.position.set(-7.74, groundHeightAt(-10.5, 6), 7.68);
  dial.rotation.y = -Math.PI / 2;
  cells.add(scene, dial, 16, 27);
  block(dial, craft.wood, 0.53, 0.06, 0.34, 0, 1.08, 0);
  const tel = new THREE.Group();
  block(tel, ink, 0.31, 0.14, 0.23, 0, 0.07, 0);
  block(tel, ink, 0.37, 0.067, 0.077, 0, 0.172, -0.045);
  prop(dial, 'telefon', tel, 0, 1.111, 0, 0.12);
  target(dial, 'night_call', 0, 1.24, 0, 0.53, 0.54, 0.5);
  for (const [x, z, text, yaw] of [
    [18.5, -24.4, 'MEKTEP YOLU', -0.36],
    [33.7, -37, 'MEKTEP YOLU', -0.42],
    [49, -48, 'İSTASYON YOLU', 2.56],
    [33, 22.1, 'İSTASYON YOLU', -1.9],
    [-31.7, 13.2, 'SANTRAL YOLU', 2.4],
    [-41.6, 45.1, 'SANTRAL YOLU', 1.32],
    [9, 38.4, 'SANTRAL YOLU', 0.25],
  ] as const) {
    const post = createDistrictSignpost(craft, text as PlateName);
    post.position.set(x, groundHeightAt(x, z), z);
    post.rotation.y = yaw;
    cells.add(scene, post, 23, 38);
  }
  // Keep puzzle hooks and the independent signal arm out of the static batches.
  for (const g of [school, station, exchange, relay, dial]) {
    const keep = new Set<THREE.Object3D>([arm, ...Object.values(doors).map(d => d.pivot)]);
    g.traverse((o) => {
      if (o.layers.mask !== 1 || o.name.startsWith('night:')) keep.add(o);
    });
    bakeStaticChildrenByMaterial(g, keep);
  }
  return {
    keeper,
    doors,
    setSignal: (on: boolean) => {
      arm.rotation.z = on ? 0.07 : -0.62;
    },
  };
}
