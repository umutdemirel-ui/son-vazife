import * as THREE from 'three';
import type { NightArt } from './nightArt';
import { block, type VillageCraft } from './villageCraft';
import { bakeStaticChildrenByMaterial } from './meshBatch';

export type Person = 'arif' | 'mahmut' | 'yolcu';
/** The lightweight fallback is also a solid fitted shape with its underside on the bed.
 * A final shroud is a REPLACEMENT, never another capsule or floating ties over a body. */
export function funeralFigure(art: NightArt, id: Person, tag = true) {
  const fallback = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: id === 'mahmut' ? 0x666c70 : id === 'arif' ? 0xc7bba4 : 0xbab2a1,
    roughness: 0.98,
  });
  const profile =
    id === 'yolcu'
      ? [
          [0, -0.97],
          [0.12, -0.92],
          [0.135, -0.79],
          [0.1, -0.65],
          [0.26, -0.55],
          [0.29, -0.36],
          [0.255, -0.03],
          [0.2, 0.36],
          [0.15, 0.72],
          [0.09, 0.8],
          [0.105, 0.9],
          [0, 0.97],
        ]
      : [
          [0, -0.69],
          [0.2, -0.6],
          [0.28, -0.47],
          [0.29, -0.28],
          [0.25, 0.08],
          [0.21, 0.42],
          [0.17, 0.74],
          [0.12, 0.9],
          [0, 0.96],
        ];
  const wrapped = new THREE.Mesh(
    new THREE.LatheGeometry(
      profile.map(([r, x]) => new THREE.Vector2(r, x)),
      16,
    ),
    mat,
  );
  wrapped.rotation.z = -Math.PI / 2;
  wrapped.scale.set(0.48, 1, 1);
  wrapped.position.y = 0.139;
  fallback.add(wrapped);
  if (id !== 'yolcu') {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 9),
      new THREE.MeshStandardMaterial({ color: 0xb9a68f, roughness: 0.96 }),
    );
    head.scale.set(0.164, 0.114, 0.121);
    head.position.set(-0.775, 0.127, 0);
    fallback.add(head);
  }
  return art.mount(id, fallback, id === 'yolcu' && tag ? ['yolcu', 'etiket'] : [id]);
}
export function preparationTowel(art: NightArt) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0xe1d8c5, roughness: 1 }),
  );
  m.scale.x = 0.53;
  m.rotation.z = -Math.PI / 2;
  m.position.set(0.025, 0.145, 0);
  g.add(m);
  return art.mount('arif', g, ['pestemal']);
}
export const STRETCHERS = { mahmut: { x: 0.85, z: -2.03 }, yolcu: { x: 0.85, z: 2.32 } } as const;
export function receivingBay(parent: THREE.Group, art: NightArt, craft: VillageCraft) {
  const carts = {} as Record<'mahmut' | 'yolcu', THREE.Group>;
  for (const id of ['mahmut', 'yolcu'] as const) {
    const g = new THREE.Group();
    const { x, z } = STRETCHERS[id];
    g.position.set(x, 0.16, z);
    parent.add(g);
    block(g, craft.wood, 2.16, 0.075, 0.72, 0, 0.6225, 0, 1.4);
    for (const s of [-1, 1]) {
      block(g, craft.metal, 2.28, 0.045, 0.046, 0, 0.62, s * 0.363);
      for (const end of [-1, 1]) {
        block(g, craft.metal, 0.048, 0.58, 0.048, end * 0.85, 0.33, s * 0.29);
        block(g, craft.metal, 0.13, 0.09, 0.06, end * 0.85, 0.047, s * 0.29);
      }
      block(g, craft.metal, 1.74, 0.045, 0.035, 0, 0.27, s * 0.29);
    }
    bakeStaticChildrenByMaterial(g);
    const guest = funeralFigure(art, id);
    guest.position.y = 0.661;
    guest.visible = false;
    g.add(guest);
    carts[id] = guest;
  }
  return carts;
}
