import * as THREE from 'three';
import { SECONDS_PER_DAY } from './survival';

/** Keep the shadow camera centred on the player, without changing sun direction.
 * Snapping to a small world grid reduces shimmering when walking. */
export function positionSunLight(light: THREE.DirectionalLight, x: number, z: number, seconds: number, daylight: number): void {
  const centreX = Math.round(x * 2) / 2;
  const centreZ = Math.round(z * 2) / 2;
  const angle = seconds / SECONDS_PER_DAY * Math.PI * 2;
  light.target.position.set(centreX, 0, centreZ);
  light.position.set(centreX + 18 + Math.cos(angle) * 5, 23 + daylight * 5, centreZ + 22 + Math.sin(angle) * 5);
}
