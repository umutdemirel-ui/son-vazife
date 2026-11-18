import * as THREE from 'three';
import { NightArt } from './nightArt';
import { OUTPOSTS } from './valley';
import { block } from './villageCraft';

/** A third, non-pursuing apparition. His face is the station clock, stopped at 22:42.
 * After the correct signal he raises his paddle; when the old announcement ends the platform is empty. */
export function platformKeeper(
  art: NightArt,
  coat: THREE.Material,
  brass: THREE.Material,
  enamel: THREE.Material,
  red: THREE.Material,
) {
  const root = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group(),
    sleeve = new THREE.Group();
  root.name = 'night:Peron Şefi';
  root.position.set(3.34, 0.108, 3.92);
  root.rotation.y = -0.2;
  root.visible = false;
  const disk = (
    group: THREE.Group,
    mat: THREE.Material,
    r: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d, 16), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.237, 0.261, 0.78, 12), coat);
  tunic.scale.z = 0.62;
  tunic.position.y = 1.225;
  body.add(tunic);
  for (const s of [-1, 1]) {
    block(body, coat, 0.17, 0.81, 0.19, s * 0.113, 0.48, 0);
    block(body, coat, 0.18, 0.115, 0.3, s * 0.12, 0.058, 0.027);
  }
  block(body, coat, 0.13, 0.67, 0.16, 0.272, 1.216, 0.054);
  block(sleeve, coat, 0.14, 0.7, 0.17, -0.053, -0.31, 0.06);
  block(sleeve, brass, 0.026, 0.32, 0.026, -0.095, -0.81, 0.148);
  disk(sleeve, red, 0.13, 0.035, -0.095, -1.046, 0.15);
  disk(head, brass, 0.143, 0.14, 0, 0.064, 0.01);
  disk(head, enamel, 0.126, 0.012, 0, 0.064, 0.087);
  for (const [t, r] of [
    [((10 + 42 / 60) * Math.PI) / 6, 0.071],
    [(42 * Math.PI) / 30, 0.111],
  ]) {
    const a = block(
      head,
      coat,
      0.008,
      r,
      0.01,
      (Math.sin(t) * r) / 2,
      0.064 + (Math.cos(t) * r) / 2,
      0.097,
    );
    a.rotation.z = -t;
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.13, 0.094, 12), coat);
  cap.scale.z = 0.87;
  cap.position.y = 0.203;
  head.add(cap);
  const headPivot = art.mount('peron-sefi', head, ['saat']),
    arm = art.mount('peron-sefi', sleeve, ['isaret']);
  headPivot.position.y = 1.706;
  arm.position.set(-0.215, 1.546, 0);
  root.add(art.mount('peron-sefi', body, ['uniforma']), headPivot, arm);
  let aligned = false;
  return {
    root,
    setStage(active: boolean, signal: boolean) {
      if (active && !root.visible) void art.request('peron-sefi');
      root.visible = active;
      aligned = signal;
    },
    pose(dt: number, time: number, eye: { x: number; z: number }) {
      if (!root.visible) return;
      const dx = eye.x - OUTPOSTS.station.x - root.position.x,
        dz = eye.z - OUTPOSTS.station.z - root.position.z;
      if (dx * dx + dz * dz > 26 * 26) return;
      const angle = Math.atan2(dx, dz) - root.rotation.y;
      headPivot.rotation.y = THREE.MathUtils.damp(
        headPivot.rotation.y,
        THREE.MathUtils.clamp(Math.atan2(Math.sin(angle), Math.cos(angle)), -1.05, 1.05),
        3,
        dt,
      );
      arm.rotation.z = THREE.MathUtils.damp(
        arm.rotation.z,
        aligned ? -1.78 : -0.14 + 0.031 * Math.sin(time * 0.94),
        2.6,
        dt,
      );
    },
  };
}
