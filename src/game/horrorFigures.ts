import * as THREE from 'three';

/** Two original, lightweight apparitions. They are used for surprise encounters,
 * not as invisible damage sources or replacements for the existing patrols. */
export function createHorrorFigures(): THREE.Group[] {
  return ['kefenli', 'isli'].map((kind) => {
    const root = new THREE.Group();
    root.name = kind === 'kefenli' ? 'Kefenli Misafir' : 'İsli Yüz';
    const garment = new THREE.MeshStandardMaterial({ color: kind === 'kefenli' ? 0x777a70 : 0x191a1a, roughness: 1 });
    const skin = new THREE.MeshStandardMaterial({ color: kind === 'kefenli' ? 0x807d72 : 0x574c45, roughness: 1 });
    const eyes = new THREE.MeshBasicMaterial({ color: kind === 'kefenli' ? 0xcbbda1 : 0xb94930 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 1.15, 9), garment);
    body.position.y = 0.87; root.add(body);
    const head = new THREE.Group(); head.name = 'scare-head'; head.position.y = 1.68;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skin);
    skull.scale.set(0.88, 1.2, 0.86); head.add(skull);
    for (const x of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eyes);
      eye.position.set(x, 0.015, 0.18); head.add(eye);
    }
    if (kind === 'kefenli') {
      for (const y of [-0.13, 0.09]) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.07, 12, 1, true), garment);
        band.position.y = y; head.add(band);
      }
    } else {
      const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), garment);
      mouth.scale.set(1.2, 0.35, 0.3); mouth.position.set(0, -0.13, 0.18); head.add(mouth);
    }
    root.add(head);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.name = side < 0 ? 'scare-left' : 'scare-right';
      arm.position.set(side * 0.28, 1.28, 0);
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.57, 4, 8), garment);
      sleeve.position.set(side * 0.1, -0.34, 0); sleeve.rotation.z = side * 0.22; arm.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skin);
      hand.position.set(side * 0.18, -0.68, 0); arm.add(hand); root.add(arm);
    }
    return root;
  });
}

export function disposeHorrorFigures(figures: THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  for (const figure of figures) figure.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
