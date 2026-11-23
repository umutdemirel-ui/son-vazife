import * as THREE from 'three';

/** Lightweight articulated first-person hands; all geometry is owned by the returned rig. */
export function createWorkHands() {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xb8947e, roughness: 0.86 });
  const nail = new THREE.MeshStandardMaterial({ color: 0xc5a397, roughness: 0.78 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x454642, roughness: 1 });
  for (const side of [-1, 1]) {
    const hand = new THREE.Group();
    hand.name = side < 0 ? 'Sol el' : 'Sağ el';
    hand.position.set(side * 0.24, -0.12, 0);
    hand.rotation.z = side * -0.12;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.105, 0.43, 16), cloth);
    sleeve.rotation.x = Math.PI / 2.6; sleeve.position.set(side * 0.025, -0.15, 0.25); hand.add(sleeve);
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.09, 12), skin);
    wrist.rotation.x = Math.PI / 2.6; wrist.position.set(0, -0.035, 0.09); hand.add(wrist);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skin);
    palm.scale.set(0.087, 0.043, 0.115); hand.add(palm);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Group();
      finger.name = 'parmak';
      finger.position.set((i - 1.5) * 0.038, 0, -0.075);
      finger.rotation.y = (i - 1.5) * 0.08;
      const len = [0.085, 0.11, 0.102, 0.082][i];
      const digit = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, len - 0.032, 4, 8), skin);
      digit.rotation.x = Math.PI / 2; digit.position.z = -len / 2; finger.add(digit);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), nail);
      tip.scale.set(0.011, 0.003, 0.016); tip.position.set(0, 0.015, -len + 0.014); finger.add(tip);
      hand.add(finger);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.052, 4, 8), skin);
    thumb.rotation.set(Math.PI / 2, 0, side * -0.72);
    thumb.position.set(side * 0.096, -0.005, -0.012); hand.add(thumb);
    root.add(hand);
  }
  return root;
}

/** Alternating arm swing uses the same phase as the player's footsteps. */
export function armSwing(phase: number, speed: number, sprinting: boolean, restrained: boolean) {
  const amount = THREE.MathUtils.clamp(speed / 3.7, 0, 1) * (restrained ? 0.18 : sprinting ? 1 : 0.5);
  return { swing: Math.sin(phase * 0.5) * amount, bounce: Math.sin(phase) * amount };
}
