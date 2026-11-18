import * as THREE from 'three';
import type { BoxCollider } from './collision';
import { pushOutsideBox } from './collision';
import { exteriorFloorAt } from './terrain';

type Route = readonly (readonly [number, number])[];
// Patrol the lanes, not a mathematical orbit through houses. The two figures have
// different beats; unlocking a chapter never spawns one on its interaction point.
const BEATS: readonly (readonly [Route, Route])[] = [
  [
    [
      [1, -21],
      [1, -6],
      [1, 9],
      [0.5, 16],
      [1, 9],
      [1, -6],
    ],
    [
      [-29, 8],
      [-21, 8],
      [-15, 11.2],
      [-16, 9.4],
      [-21, 8],
    ],
  ],
  [
    [
      [33, -39],
      [42, -49],
      [48, -52],
      [54, -46],
      [48, -52],
      [42, -49],
    ],
    [
      [20, -23],
      [33, -21],
      [34, -32],
      [33, -21],
    ],
  ],
  [
    [
      [48, 6],
      [45, 19],
      [51, 29],
      [55, 33],
      [51, 29],
      [45, 19],
    ],
    [
      [66, 36.4],
      [61, 35.7],
      [54, 35.7],
      [50, 33],
      [54, 35.7],
      [61, 35.7],
    ],
  ],
  [
    [
      [-30, 38],
      [-41, 45],
      [-47, 47],
      [-41, 45],
    ],
    [
      [-30, 15],
      [-39, 23],
      [-43, 27],
      [-46, 32],
      [-43, 27],
      [-39, 23],
    ],
  ],
];
export function wallBetween(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  boxes: readonly BoxCollider[],
  radius = 0.12,
) {
  for (const b of boxes) {
    let x = ax,
      z = az,
      u = bx,
      v = bz;
    if (b.frame) {
      const f = b.frame;
      x = (ax - f.x) * f.cos - (az - f.z) * f.sin;
      z = (ax - f.x) * f.sin + (az - f.z) * f.cos;
      u = (bx - f.x) * f.cos - (bz - f.z) * f.sin;
      v = (bx - f.x) * f.sin + (bz - f.z) * f.cos;
    }
    let lo = 0,
      hi = 1;
    const dx = u - x,
      dz = v - z;
    if (Math.abs(dx) < 1e-7) {
      if (x < b.minX - radius || x > b.maxX + radius) continue;
    } else {
      const t = (b.minX - radius - x) / dx,
        s = (b.maxX + radius - x) / dx;
      lo = Math.max(lo, Math.min(t, s));
      hi = Math.min(hi, Math.max(t, s));
    }
    if (Math.abs(dz) < 1e-7) {
      if (z < b.minZ - radius || z > b.maxZ + radius) continue;
    } else {
      const t = (b.minZ - radius - z) / dz,
        s = (b.maxZ + radius - z) / dz;
      lo = Math.max(lo, Math.min(t, s));
      hi = Math.min(hi, Math.max(t, s));
    }
    if (lo <= hi) return true;
  }
  return false;
}
export class NightPatrol {
  private beat = -1;
  private next = 0;
  private pursuing = false;
  private stranded = 0;
  constructor(private actor: 0 | 1) {}
  reset() {
    this.beat = -1;
    this.pursuing = false;
    this.stranded = 0;
  }
  tick(
    root: THREE.Object3D,
    act: number,
    dt: number,
    player: { x: number; z: number },
    exposed: boolean,
    boxes: readonly BoxCollider[],
  ) {
    const beat = act < 6 ? 0 : act - 5,
      route = BEATS[beat][this.actor],
      p = root.position;
    if (this.beat !== beat) {
      this.beat = beat;
      this.next = 1;
      this.stranded = 0;
      this.pursuing = false;
      p.x = route[0][0];
      p.z = route[0][1];
    }
    const dist = Math.hypot(player.x - p.x, player.z - p.z);
    const chasing =
      exposed &&
      dist < (this.pursuing ? 12 : 8.5) &&
      !wallBetween(p.x, p.z, player.x, player.z, boxes, 0.22);
    if ((this.pursuing && !chasing) || this.stranded > 0.8) {
      let min = Infinity,
        closest = this.next;
      route.forEach(([x, z], i) => {
        const d = Math.hypot(x - p.x, z - p.z);
        if (d > 0.45 && d < min && !wallBetween(p.x, p.z, x, z, boxes, 0.29)) {
          min = d;
          closest = i;
        }
      });
      this.next = closest;
      this.stranded = 0;
    }
    this.pursuing = chasing;
    const [x, z] = route[this.next];
    const dx = (chasing ? player.x : x) - p.x,
      dz = (chasing ? player.z : z) - p.z,
      d = Math.hypot(dx, dz);
    if (!chasing && d < 0.3) this.next = (this.next + 1) % route.length;
    const step = Math.min(d, dt * (chasing ? 2.35 : this.actor === 0 ? 1.37 : 1.03));
    if (d > 0.015) {
      const oldX = p.x,
        oldZ = p.z;
      p.x += (dx / d) * step;
      p.z += (dz / d) * step;
      for (const box of boxes) pushOutsideBox(p, box, 0.25);
      const turn = Math.atan2(dx, dz) - root.rotation.y;
      root.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, dt * 5);
      this.stranded = Math.hypot(p.x - oldX, p.z - oldZ) < step * 0.22 ? this.stranded + dt : 0;
    }
    p.y = p.x >= -27.4 && p.x <= -20.6 && Math.abs(p.z - 8) < 1.45 ? 0.44 : exteriorFloorAt(p.x, p.z);
    return chasing;
  }
}
