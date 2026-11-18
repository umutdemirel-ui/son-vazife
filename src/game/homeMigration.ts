import { LEGACY_OUTER_HOMES } from './valley';
import type { Home } from './homes';

/** Survey of the original walk-in houses, in the same stable order as home door IDs. */
const oldCore = [
  [10.6, 2, -Math.PI / 2, 6.2, 5.4],
  [-11.2, 18, Math.PI / 2, 5.6, 4.8],
  [11.4, -8.6, -Math.PI / 2 + 0.08, 5.8, 5],
  [-13, -20.5, Math.PI / 2 - 0.12, 6, 5.2],
  [19.5, 13, -Math.PI * 0.6, 6.4, 5.4],
  [-19.2, -3.5, Math.PI * 0.45, 5.8, 5],
  [18.2, -34.5, -Math.PI * 0.25, 6, 5.2],
  [-16.8, -35.5, Math.PI * 0.35, 5.8, 5],
] as const;
const oldHomes = [
  ...oldCore,
  ...LEGACY_OUTER_HOMES.map(([x, z, r], i) => [x, z, r, 5.2 + (i % 3) * 0.4, 4.3 + (i % 2) * 0.3] as const),
];

/** Preserve the local position of a player saved inside a house when its footprint moves. */
export function migrateOldHomePosition(x: number, z: number, homes: Pick<Home, 'spec'>[]) {
  for (let i = 0; i < oldHomes.length; i++) {
    const [ox, oz, rotation, width, depth] = oldHomes[i];
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    const dx = x - ox, dz = z - oz;
    const lx = dx * cos - dz * sin, lz = dx * sin + dz * cos;
    if (Math.abs(lx) >= width / 2 - 0.1 || Math.abs(lz) >= depth / 2 - 0.1) continue;
    const dest = homes[i]?.spec;
    if (!dest) break;
    const c = Math.cos(dest.rotY), s = Math.sin(dest.rotY);
    return { x: dest.x + lx * c + lz * s, z: dest.z - lx * s + lz * c };
  }
  return { x, z };
}
