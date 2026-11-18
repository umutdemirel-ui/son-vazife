import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { releaseTemplate } from './workshopAssets';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import { houseFootprint, type BoxCollider } from './collision';
import { block, pitchedRoof, type HouseStyle, type VillageCraft } from './villageCraft';

export interface HomeSpec { x: number; z: number; rotY: number; w: number; d: number; h: number; style: HouseStyle }
export interface Home {
  root: THREE.Group;
  door: THREE.Group;
  doorCollider: BoxCollider;
  open: boolean;
  spec: HomeSpec;
  ground: number;
  family: THREE.Group[];
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

/** A shared, small set of figure resources prevents dozens of families duplicating geometry. */
export class FamilyArt {
  private disposed = false;
  private templates = new Map<string, { scene: THREE.Group; idle?: THREE.AnimationClip }>();
  private slots: { group: THREE.Group; fallback: THREE.Group; id: string; mixer?: THREE.AnimationMixer; model?: THREE.Group }[] = [];
  constructor(compact: boolean, private onReady: (root: THREE.Object3D) => void) {
    const loader = new GLTFLoader();
    for (const id of ['bekci', 'serife', 'kenan', 'idris']) {
      loader.load(`/assets/residents/${compact ? 'compact/' : ''}${id}.glb`, ({ scene, animations }) => {
        if (this.disposed) { releaseTemplate(scene); return; }
        const idle = THREE.AnimationClip.findByName(animations, 'Idle') ?? undefined;
        this.templates.set(id, { scene, idle });
        this.slots.filter(slot => slot.id === id).forEach(slot => this.install(slot));
      }, undefined, () => { /* The dressed fallback stays available offline. */ });
    }
  }
  private install(slot: (typeof this.slots)[number]) {
    const source = this.templates.get(slot.id);
    if (!source || slot.model || this.disposed) return;
    const model = cloneSkeleton(source.scene) as THREE.Group;
    model.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true; });
    slot.group.add(model); slot.fallback.visible = false; slot.model = model;
    if (source.idle) {
      slot.mixer = new THREE.AnimationMixer(model);
      slot.mixer.clipAction(source.idle).play();
    }
    this.onReady(model);
  }
  update(dt: number) {
    for (const slot of this.slots) if (slot.group.visible && slot.mixer) slot.mixer.update(dt);
  }
  private body = new THREE.CapsuleGeometry(0.18, 0.5, 3, 8);
  private head = new THREE.SphereGeometry(0.14, 10, 8);
  private leg = new THREE.CapsuleGeometry(0.075, 0.42, 3, 8);
  private skin = new THREE.MeshStandardMaterial({ color: 0xb99b81, roughness: 0.9 });
  private coats = [0x554d45, 0x655349, 0x606555, 0x534753, 0x685b4b, 0x4b5657].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  private trousers = new THREE.MeshStandardMaterial({ color: 0x292a27, roughness: 0.95 });
  figure(home: number, member: number) {
    const group = new THREE.Group();
    const fallback = new THREE.Group();
    group.add(fallback);
    const torso = new THREE.Mesh(this.body, this.coats[(home * 3 + member) % this.coats.length]);
    torso.position.y = 1.11;
    const head = new THREE.Mesh(this.head, this.skin); head.position.y = 1.67;
    fallback.add(torso, head);
    for (const sign of [-1, 1]) {
      const leg = new THREE.Mesh(this.leg, this.trousers);
      leg.position.set(sign * 0.1, 0.38, 0); fallback.add(leg);
      const arm = new THREE.Mesh(this.leg, this.coats[(home * 3 + member) % this.coats.length]);
      arm.scale.set(0.75, 0.83, 0.75); arm.position.set(sign * 0.25, 1.13, 0); fallback.add(arm);
    }
    if (member === 2) group.scale.setScalar(0.69);
    group.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    const id = member === 1 ? 'serife' : (home % 2 ? 'kenan' : 'idris');
    const slot = { group, fallback, id };
    this.slots.push(slot);
    this.install(slot);
    return group;
  }
  dispose() {
    this.disposed = true;
    for (const slot of this.slots) {
      if (slot.mixer && slot.model) { slot.mixer.stopAllAction(); slot.mixer.uncacheRoot(slot.model); }
      slot.model?.traverse(o => { if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose(); });
    }
    this.slots.length = 0;
    for (const { scene } of this.templates.values()) {
      scene.traverse(o => { if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose(); });
      releaseTemplate(scene);
    }
    this.templates.clear();
    for (const r of [this.body, this.head, this.leg, this.skin, this.trousers, ...this.coats]) r.dispose();
  }
}

/** Walk-in version of a village home. Walls and the leaf use the same survey as collision. */
export function buildHome(spec: HomeSpec, number: number, ground: number, craft: VillageCraft, art: FamilyArt) {
  const root = new THREE.Group(); root.position.set(spec.x, ground, spec.z); root.rotation.y = spec.rotY;
  root.name = `Hane ${number}`;
  const { w, d } = spec, wall = 0.18, height = 2.85, opening = 1.45;
  const finish = spec.style === 'tas' ? craft.masonry : craft.lime[number % craft.lime.length];
  block(root, craft.wood, w, 0.12, d, 0, 0.02, 0, 1.5);
  block(root, finish, w, height, wall, 0, height / 2, -d / 2, 2.2);
  for (const side of [-1, 1])
    block(root, finish, wall, height, d, side * w / 2, height / 2, 0, 2.2);
  const flank = (w - opening) / 2;
  for (const side of [-1, 1])
    block(root, finish, flank, height, wall, side * (opening / 2 + flank / 2), height / 2, d / 2, 2.2);
  block(root, finish, opening, height - 2.18, wall, 0, (height + 2.18) / 2, d / 2, 2.2);
  pitchedRoof(root, craft.tile, finish, w + 0.5, d + 0.5, height, 0.95, Math.max(0.45, w * 0.16));
  // Shuttered windows and structural timber read from the muddy street.
  for (const side of [-1, 1]) {
    craft.window(root, side * (opening / 2 + flank / 2), 1.67, d / 2 + 0.1, Math.min(0.8, flank * 0.68), 0.95);
    if (spec.style !== 'tas')
      block(root, craft.wood, 0.1, height, 0.09, side * (w / 2 - 0.12), height / 2, d / 2 + 0.12);
  }
  craft.plate(root, number, 0.24, 0.24, opening / 2 + 0.2, 2.16, d / 2 + 0.16);
  const door = new THREE.Group(); door.position.set(-opening / 2, 0.08, d / 2 + 0.02);
  block(door, craft.door, opening, 2.1, 0.12, opening / 2, 1.05, 0);
  root.add(door);
  // Simple furnishing, visible inside; the centre and doorway stay walkable.
  block(root, craft.wood, 1.2, 0.1, 0.65, 0, 0.72, -d / 2 + 0.65);
  for (const side of [-1, 1]) block(root, craft.wood, 0.1, 0.7, 0.1, side * 0.48, 0.35, -d / 2 + 0.65);
  const family = [art.figure(number, 0), art.figure(number, 1), art.figure(number, 2)];
  const spots = [[-w / 2 + 0.65, -0.45], [w / 2 - 0.65, -0.45], [w / 2 - 0.9, -d / 2 + 0.8]];
  family.forEach((person, i) => { person.position.set(spots[i][0], 0.08, spots[i][1]); person.rotation.y = Math.PI; person.visible = false; root.add(person); });
  bakeStaticChildrenByMaterial(root, new Set<THREE.Object3D>([door, ...family]));
  const walls = [
    homeCollider(spec, 0, -d / 2, w, wall),
    homeCollider(spec, -w / 2, 0, wall, d), homeCollider(spec, w / 2, 0, wall, d),
    ...[-1, 1].map(side => homeCollider(spec, side * (opening / 2 + flank / 2), d / 2, flank, wall)),
    ...spots.map(([x, z], i) => homeCollider(spec, x, z, i === 2 ? 0.34 : 0.44, i === 2 ? 0.34 : 0.44)),
  ];
  return { home: { root, door, spec, ground, open: false, family, doorCollider: homeCollider(spec, 0, d / 2, opening, wall) } satisfies Home, walls };
}
