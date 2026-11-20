import * as THREE from 'three';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import { houseFootprint, type BoxCollider } from './collision';
import { block, face, pitchedRoof, type HouseStyle, type VillageCraft } from './villageCraft';

export interface HomeSpec { x: number; z: number; rotY: number; w: number; d: number; h: number; style: HouseStyle }
export interface Home {
  root: THREE.Group;
  door: THREE.Group;
  doorCollider: BoxCollider;
  open: boolean;
  spec: HomeSpec;
  ground: number;
}

/** Transform metre-sized local wall footprints exactly as the visible house is transformed. */
export function homeCollider(spec: HomeSpec, x: number, z: number, w: number, d: number) {
  const c = Math.cos(spec.rotY), s = Math.sin(spec.rotY);
  return houseFootprint(spec.x + x * c + z * s, spec.z - x * s + z * c, w, d, spec.rotY);
}
export function insideHome(h: Home, x: number, z: number) {
  const c = Math.cos(h.spec.rotY), s = Math.sin(h.spec.rotY);
  const dx = x - h.spec.x, dz = z - h.spec.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  return Math.abs(lx) < h.spec.w / 2 - 0.1 && Math.abs(lz) < h.spec.d / 2 - 0.1;
}

function flankWidth(w: number, opening: number) { return (w - opening) / 2; }

/** Solid ground-level furniture; the rug and high shelf are deliberately passable. */
export function homeFurnitureColliders(spec: HomeSpec): BoxCollider[] {
  return [
    homeCollider(spec, 0, -spec.d / 2 + 0.65, 1.2, 0.65),
    homeCollider(spec, spec.w / 2 - 0.55, -spec.d / 2 + 0.45, 0.75, 0.42),
  ];
}

/** Walk-in version of a village home. Walls and the leaf use the same survey as collision. */
export function buildHome(spec: HomeSpec, number: number, ground: number, craft: VillageCraft, use: 'home' | 'school' | 'gassal' | 'abandoned' | 'coffee' = 'home') {
  const root = new THREE.Group(); root.position.set(spec.x, ground, spec.z); root.rotation.y = spec.rotY;
  root.name = `Hane ${number}`;
  const { w, d } = spec, wall = 0.18, height = 2.75 + (number % 3) * 0.12, opening = use === 'home' ? 1.45 : 2;
  const finish = spec.style === 'tas' ? craft.masonry : number % 4 === 0 ? craft.earthen : craft.lime[number % craft.lime.length];
  const upperFinish = spec.style === 'tas' ? craft.lime[(number + 1) % craft.lime.length] : finish;
  block(root, craft.wood, w, 0.12, d, 0, 0.02, 0, 1.5);
  block(root, finish, w, height, wall, 0, height / 2, -d / 2, 2.2);
  for (const side of [-1, 1])
    block(root, finish, wall, height, d, side * w / 2, height / 2, 0, 2.2);
  const flank = (w - opening) / 2;
  for (const side of [-1, 1])
    block(root, finish, flank, height, wall, side * (opening / 2 + flank / 2), height / 2, d / 2, 2.2);
  block(root, finish, opening, height - 2.18, wall, 0, (height + 2.18) / 2, d / 2, 2.2);
  // Most facades have the low stone storey and timber-framed upper silhouette
  // of an old Anatolian hamlet. The upper storey is a sealed visual shell;
  // the existing ground floor and its door remain fully walkable.
  const upper = number % 3 !== 0;
  const roofY = upper ? height + 1.55 : height;
  if (upper) {
    block(root, upperFinish, w - 0.08, 1.55, d - 0.08, 0, height + 0.775, 0, 2.2);
    block(root, craft.wood, w + 0.12, 0.13, 0.13, 0, height + 0.08, d / 2, 2.2);
    for (const side of [-1, 1]) {
      block(root, craft.wood, 0.11, 1.55, 0.10, side * (w / 2 - 0.16), height + 0.775, d / 2, 2.2);
      craft.window(root, side * w * 0.24, height + 0.82, d / 2 + 0.04, 0.72, 0.92, 0, number % 2 ? craft.shutters[number % craft.shutters.length] : undefined);
    }
  }
  const roof = number % 4 === 1 ? craft.metalRoof : craft.roofVariants[number % craft.roofVariants.length];
  pitchedRoof(root, roof, roof, w + 0.5, d + 0.5, roofY, 0.68 + (number % 3) * 0.08, Math.max(0.45, w * (spec.style === 'tas' ? 0.12 : 0.22)));
  // Rough timber eaves and projecting lintels add depth without covering openings.
  block(root, craft.wood, w + 0.48, 0.12, 0.12, 0, roofY - 0.04, d / 2 + 0.18, 1.5);
  block(root, craft.wood, w + 0.48, 0.12, 0.12, 0, roofY - 0.04, -d / 2 - 0.18, 1.5);
  block(root, craft.masonry, 0.42, 0.85, 0.42, -w * 0.27, roofY + 0.46, -d * 0.18, 1.0);
  // Modest thresholds and stone foundations give each street facade depth.
  block(root, craft.masonry, w + 0.1, 0.52, 0.15, 0, -0.04, -d / 2 - 0.02, 2.2);
  for (const side of [-1, 1]) {
    block(root, craft.masonry, 0.15, 0.52, d, side * (w / 2 + 0.02), -0.04, 0, 2.2);
    block(root, craft.masonry, flankWidth(w, opening), 0.52, 0.15, side * (opening / 2 + (w - opening) / 4), -0.04, d / 2 + 0.02, 2.2);
  }
  // Shuttered windows and structural timber read from the muddy street.
  for (const side of [-1, 1]) {
    craft.window(root, side * (opening / 2 + flank / 2), 1.67, d / 2 + 0.1, Math.min(0.8, flank * 0.68), 0.95, 0, number % 3 === 0 ? craft.shutters[(number + 1) % craft.shutters.length] : undefined);
    if (spec.style !== 'tas')
      block(root, craft.wood, 0.1, height, 0.09, side * (w / 2 - 0.12), height / 2, d / 2 + 0.12);
  }
  // A short, weathered lintel and doorframe stay fixed when the leaf opens.
  block(root, craft.wood, 0.1, 2.2, 0.1, -opening / 2 - 0.05, 1.1, d / 2 + 0.08);
  block(root, craft.wood, 0.1, 2.2, 0.1, opening / 2 + 0.05, 1.1, d / 2 + 0.08);
  block(root, craft.wood, opening + 0.3, 0.16, 0.16, 0, 2.19, d / 2 + 0.08);
  craft.plate(root, number, 0.24, 0.24, opening / 2 + 0.2, 2.16, d / 2 + 0.16);
  const door = new THREE.Group(); door.position.set(-opening / 2, 0.08, d / 2 + 0.02);
  // A door photograph belongs on the broad faces, not stretched over its thin edges.
  block(door, craft.wood, opening, 2.1, 0.12, opening / 2, 1.05, 0);
  face(door, craft.door, opening, 2.1, opening / 2, 1.05, 0.061);
  face(door, craft.door, opening, 2.1, opening / 2, 1.05, -0.061, Math.PI);
  root.add(door);
  if (use === 'home') {
  // Simple furnishing, visible inside; the centre and doorway stay walkable.
  block(root, craft.wood, 1.2, 0.1, 0.65, 0, 0.72, -d / 2 + 0.65);
  for (const side of [-1, 1]) block(root, craft.wood, 0.1, 0.7, 0.1, side * 0.48, 0.35, -d / 2 + 0.65);
  // Empty but lived-in interiors, arranged away from the doorway.
  block(root, craft.wood, 1.15, 0.08, 0.28, -w / 2 + 0.75, 1.85, -d / 2 + 0.2, 1.0);
  block(root, craft.shutters[number % craft.shutters.length], 0.42, 0.3, 0.2, -w / 2 + 0.65, 2.03, -d / 2 + 0.2);
  block(root, craft.wood, 0.75, 0.35, 0.42, w / 2 - 0.55, 0.2, -d / 2 + 0.45, 1.0);
  block(root, craft.kilim, 1.4, 0.012, 0.8, 0, 0.09, 0.45);
  } else {
    // A closed ceiling prevents the sealed upper storey from showing through.
    block(root, craft.wood, w, .1, d, 0, height-.05, 0, 1.5);
  }
  bakeStaticChildrenByMaterial(root, new Set<THREE.Object3D>([door]));
  const walls = [
    homeCollider(spec, 0, -d / 2, w, wall),
    homeCollider(spec, -w / 2, 0, wall, d), homeCollider(spec, w / 2, 0, wall, d),
    ...[-1, 1].map(side => homeCollider(spec, side * (opening / 2 + flank / 2), d / 2, flank, wall)),
    ...(use === 'home' ? homeFurnitureColliders(spec) : []),
  ];
  return { home: { root, door, spec, ground, open: false, doorCollider: homeCollider(spec, 0, d / 2, opening, wall) } satisfies Home, walls };
}
