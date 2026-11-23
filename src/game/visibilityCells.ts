import * as THREE from 'three';
import type { RenderTier } from './quality';
/** A render-only parent: never overwrite a quest object's own visibility, hierarchy, or coordinates. */
export class VisibilityCells {
  private cells: {
    wrapper: THREE.Group;
    lod?: { near: THREE.Group; far: THREE.Object3D };
    object: THREE.Object3D;
    near: number;
    far: number;
    moving: boolean;
    x: number;
    z: number;
  }[] = [];
  private lastX = Infinity;
  private lastZ = Infinity;
  private lastTier?: RenderTier;
  add(parent: THREE.Object3D, object: THREE.Object3D, near: number, far: number, moving = false) {
    const wrapper = new THREE.Group();
    wrapper.name = 'Görüş hücresi';
    wrapper.matrixAutoUpdate = false;
    wrapper.add(object);
    parent.add(wrapper);
    this.cells.push({ wrapper, object, near, far, moving, x: object.position.x, z: object.position.z });
    this.lastTier = undefined;
  }
  addShell(object: THREE.Object3D, far: THREE.Object3D) {
    const cell = this.cells.find((c) => c.object === object);
    if (!cell) return;
    const near = new THREE.Group();
    near.matrixAutoUpdate = false;
    near.add(object);
    cell.wrapper.add(near, far);
    cell.lod = { near, far };
    far.visible = false;
  }
  update(eye: THREE.Vector3, tier: RenderTier) {
    const steady =
      tier === this.lastTier && Math.abs(eye.x - this.lastX) + Math.abs(eye.z - this.lastZ) < 0.55;
    for (const c of this.cells) {
      if (steady && !c.moving) continue;
      const r =
        (tier === 'minimum'
          ? c.near
          : tier === 'low'
            ? c.far
            : tier === 'medium'
              ? c.far * 1.4
              : c.far * 2) + (c.wrapper.visible ? 1.5 : 0);
      const dx = (c.moving ? c.object.position.x : c.x) - eye.x,
        dz = (c.moving ? c.object.position.z : c.z) - eye.z;
      const d2 = dx * dx + dz * dz;
      c.wrapper.visible = d2 <= r * r;
      if (c.lod && c.wrapper.visible) {
        const split = tier === 'minimum' ? 18 : tier === 'low' ? 28 : Infinity;
        const cutoff = split + (c.lod.near.visible ? 1.5 : 0);
        c.lod.near.visible = d2 <= cutoff * cutoff;
        c.lod.far.visible = !c.lod.near.visible;
      }
    }
    if (!steady) {
      this.lastX = eye.x;
      this.lastZ = eye.z;
      this.lastTier = tier;
    }
  }
}
