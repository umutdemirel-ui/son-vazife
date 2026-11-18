import { LEGACY_OUTER_HOMES, REV1_CORE_HOME_CENTRES, REV1_OUTER_HOMES } from './valley';
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
export function migrateOldHomePosition(x: number, z: number, homes: Pick<Home, 'spec'>[], revision?: 1) {
  const survey = revision === 1
    ? [
        ...oldCore.map(([, , rotation, width, depth], i) => [
          ...REV1_CORE_HOME_CENTRES[i], rotation, width, depth,
        ] as const),
        ...REV1_OUTER_HOMES.map(([a, b, rotation], i) => [
          a, b, rotation, 5.2 + (i % 3) * 0.4, 4.3 + (i % 2) * 0.3,
        ] as const),
      ]
    : oldHomes;
  for (let i = 0; i < survey.length; i++) {
    const [ox, oz, rotation, width, depth] = survey[i];
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

/** Translate saves from the former remote rooms and station platform into their new sites. */
export function migrateOutpostPosition(x: number, z: number) {
  const old = [
    { x: 46, z: -60, halfW: 5.7, minZ: -2.95, maxZ: 3.65, dx: -3, dz: -5 },
    { x: 59, z: 28, halfW: 7, minZ: -2.45, maxZ: 8, dx: 1, dz: 15 },
    { x: -54, z: 43, halfW: 2.8, minZ: -2.4, maxZ: 3.1, dx: -2, dz: 8 },
  ];
  for (const b of old) {
    if (Math.abs(x - b.x) < b.halfW && z - b.z > b.minZ && z - b.z < b.maxZ) {
      return { x: x + b.dx, z: z + b.dz };
    }
  }
  return { x, z };
}
