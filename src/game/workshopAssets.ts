import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Allocation } from './quality';

export const BUILD_KIT = ['cumba', 'himis', 'tas', 'hayrat', 'emanet'] as const;
export const DRESSING = [
  'lantern',
  'chair',
  'binder',
  'barrel',
  'cabinet',
  'candleholders',
  'desk_lamp',
  'dead_tree',
  'rock',
  'crate',
] as const;
export type KitId = (typeof BUILD_KIT)[number];
export type DressingId = (typeof DRESSING)[number];
export type ModelId = KitId | DressingId;
export function workshopManifest(profile: Allocation): { id: ModelId; url: string }[] {
  const kit = BUILD_KIT.map((id) => ({
    id,
    url: `/assets/workshop/${profile === 'full' ? '' : 'compact/'}${id}.glb`,
  }));
  return [
    ...kit,
    ...(profile === 'minimum' ? [] : profile === 'compact' ? DRESSING.slice(0, 3) : DRESSING).map(
      (id) => ({ id, url: `/assets/workshop/dressing/${id}.glb` }),
    ),
  ];
}

/** Each template owns its geometry, material and bitmap; instances never own the atlas. */
function releaseTemplate(root: THREE.Object3D) {
  const geos = new Set<THREE.BufferGeometry>(),
    mats = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>(),
    images = new Set<ImageBitmap>();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      geos.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) mats.add(m);
    }
  });
  for (const m of mats) {
    for (const t of Object.values(m)) if (t instanceof THREE.Texture) textures.add(t);
    m.dispose();
  }
  for (const t of textures) {
    if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) images.add(t.image);
    t.dispose();
  }
  for (const im of images) im.close();
  for (const g of geos) g.dispose();
}
export class WorkshopAssets {
  private models = new Map<ModelId, THREE.Group>();
  private disposed = false;
  constructor(private loader: Pick<GLTFLoader, 'loadAsync'> = new GLTFLoader()) {}
  async load(profile: Allocation, onModel: (id: ModelId, percent: number) => void) {
    const queue = workshopManifest(profile);
    let next = 0,
      done = 0;
    const worker = async () => {
      while (!this.disposed && next < queue.length) {
        const { id, url } = queue[next++];
        try {
          const { scene } = await this.loader.loadAsync(url);
          if (this.disposed) {
            releaseTemplate(scene);
            return;
          }
          scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.castShadow = o.receiveShadow = true;
            }
          });
          this.models.set(id, scene);
        } catch {
          /* The solid fallback and the separate interaction target remain. */
        }
        if (!this.disposed) onModel(id, Math.round((++done / queue.length) * 100));
      }
    };
    await Promise.all(Array.from({ length: profile === 'full' ? 3 : 2 }, worker));
  }
  node(id: KitId, part: string = id) {
    return this.models.get(id)?.getObjectByName(part)?.clone() ?? null;
  }
  dressing(id: DressingId, height: number, casts: boolean) {
    const source = this.models.get(id);
    if (!source) return null;
    const obj = source.clone(true),
      group = new THREE.Group();
    const box = new THREE.Box3().setFromObject(obj),
      center = box.getCenter(new THREE.Vector3());
    const scale = height / Math.max(0.01, box.max.y - box.min.y);
    obj.scale.setScalar(scale);
    obj.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    obj.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = casts;
    });
    group.add(obj);
    return group;
  }
  dispose() {
    this.disposed = true;
    for (const m of this.models.values()) releaseTemplate(m);
    this.models.clear();
  }
}
