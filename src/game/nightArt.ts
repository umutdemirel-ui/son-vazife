import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { releaseTemplate } from './workshopAssets';

export const NIGHT_MODELS = [
  'arif',
  'mahmut',
  'yolcu',
  'karabasma',
  'sis-gozcusu',
  'mektep',
  'istasyon',
  'santral',
  'gece-esyasi',
  'peron-sefi',
] as const;
export type NightModel = (typeof NIGHT_MODELS)[number];
type Point = { x: number; z: number };
interface Slot {
  fallback: THREE.Object3D;
  parent: THREE.Group;
  parts: readonly string[];
  fit?: (visual: THREE.Group) => void;
}
export const nightUrl = (id: NightModel, compact: boolean) =>
  `/assets/night/${compact ? 'compact/' : ''}${id}.glb`;

/** Case logic owns the stable mount. The loader only changes its art, even when the file
 * arrives halfway through an examination. No new transfer on repeated district visits. */
export class NightArt {
  private templates = new Map<NightModel, THREE.Group>();
  private slots = new Map<NightModel, Slot[]>();
  private zones: { id: NightModel; x: number; z: number; radius: number }[] = [];
  // Cache the promise itself: two nearby mounts wait for the same decode, including a failed one.
  private requests = new Map<NightModel, Promise<void>>();
  private closed = false;
  constructor(
    private compact: boolean,
    private ready: (root: THREE.Object3D) => void,
    private loader: Pick<GLTFLoader, 'loadAsync'> = new GLTFLoader(),
  ) {}
  mount(id: NightModel, fallback: THREE.Object3D, parts: readonly string[] = [id], fit?: Slot['fit']) {
    const parent = new THREE.Group();
    parent.name = `night:${id}`;
    parent.add(fallback);
    const slot = { parent, fallback, parts, fit };
    const list = this.slots.get(id) ?? [];
    list.push(slot);
    this.slots.set(id, list);
    const template = this.templates.get(id);
    if (template) this.install(template, slot);
    return parent;
  }
  near(id: NightModel, x: number, z: number, radius = 35) {
    this.zones.push({ id, x, z, radius });
  }
  approach(p: Point) {
    if (this.closed || !this.zones.length) return;
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const s = this.zones[i];
      if (this.requests.has(s.id) || Math.hypot(p.x - s.x, p.z - s.z) <= s.radius) {
        void this.request(s.id);
        this.zones.splice(i, 1);
      }
    }
  }
  request(id: NightModel): Promise<void> {
    if (this.closed) return Promise.resolve();
    const existing = this.requests.get(id);
    if (existing) return existing;
    const pending = this.load(id);
    this.requests.set(id, pending);
    return pending;
  }
  private async load(id: NightModel) {
    try {
      const { scene } = await this.loader.loadAsync(nightUrl(id, this.compact));
      if (this.closed) {
        releaseTemplate(scene);
        return;
      }
      this.templates.set(id, scene);
      for (const s of this.slots.get(id) ?? []) this.install(scene, s);
    } catch {
      /* Keep the solid, correct-state fallback and its independent E target. */
    }
  }
  private install(template: THREE.Group, s: Slot) {
    const pieces = s.parts.length
      ? s.parts.map((name) => template.getObjectByName(name))
      : template.children;
    if (!pieces.length || pieces.some((p) => !p)) return;
    const visual = new THREE.Group();
    visual.name = 'Dokulu model';
    for (const p of pieces) visual.add(p!.clone(true));
    visual.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true;
    });
    s.fit?.(visual);
    s.fallback.visible = false;
    s.parent.add(visual);
    this.ready(visual);
  }
  dispose() {
    this.closed = true;
    this.zones = [];
    this.slots.clear();
    this.requests.clear();
    for (const m of this.templates.values()) releaseTemplate(m);
    this.templates.clear();
  }
}

/** Articulated sleeves, boots and hood use actual shoulder/ankle pivots; the physics root
 * stays on the ground. The silhouette in the window is an independent instance. */
export function watcherFigure(art: NightArt, id: 'karabasma' | 'sis-gozcusu', fallback: THREE.Object3D) {
  const pivots = new Map<string, THREE.Group>();
  const kara = id === 'karabasma';
  const root = art.mount(id, fallback, [], (g) => {
    for (const [name, x, y] of [
      ['hood', 0, kara ? 1.76 : 1.72],
      ['sleeveL', 0.22, 1.66],
      ['sleeveR', -0.22, 1.66],
      ['bootL', 0.12, 0.74],
      ['bootR', -0.12, 0.74],
      ['cape', 0, 1.73],
    ] as const) {
      const part = g.getObjectByName(name);
      if (!part) continue;
      const joint = new THREE.Group();
      joint.position.set(x, y, 0);
      part.position.sub(joint.position);
      joint.add(part);
      g.add(joint);
      pivots.set(name, joint);
    }
  });
  return {
    root,
    pose(t: number, following: boolean) {
      const a = Math.sin(t * (kara ? 3.15 : 1.9));
      for (const [name, j] of pivots) {
        if (name === 'hood') {
          j.rotation.y = 0.18 * Math.sin(t * 0.74);
          j.rotation.z = following ? -0.1 : 0.04 * a;
        } else if (name === 'cape') {
          j.rotation.x = 0.035 * a;
        } else {
          const side = name.endsWith('L') ? 1 : -1;
          j.rotation.x =
            (name.startsWith('boot') ? -0.24 : 0.13) * a * side -
            (following && name.startsWith('sleeve') ? 0.21 : 0);
        }
      }
    },
  };
}
