import type { DistrictId } from './types';

/** Metres, north = -Z. Collision, clearing, wayfinding and the notebook share this survey. */
export const VALLEY = { x1: -72, x2: 76, z1: -78, z2: 62 } as const;
/** Shared anchor for the rebuilt hillside clinic. */
export const CLINIC = { x: 32, z: -10 } as const;
export const OUTPOSTS = {
  school: { x: 43, z: -65, w: 11.4, d: 5.9, door: 1.29, y: 1.8, name: 'Sarı Mektep' },
  station: { x: 60, z: 43, w: 8.9, d: 4.9, door: 1.19, y: 1.1, name: 'Kuzdağ İstasyonu' },
  exchange: { x: -56, z: 51, w: 5.6, d: 4.8, door: 1.55, y: 1.55, name: 'Sırt Santrali' },
} as const;
export const OUTPOST_IDS = Object.keys(OUTPOSTS) as (keyof typeof OUTPOSTS)[];
export type Outpost = keyof typeof OUTPOSTS;
export function insideOutpost(x: number, z: number): Outpost | null {
  for (const id of OUTPOST_IDS) {
    const b = OUTPOSTS[id];
    if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) return id;
  }
  return null;
}
export const LANDMARKS: {
  id: DistrictId;
  name: string;
  short: string;
  sub: string;
  x: number;
  z: number;
}[] = [
  {
    id: 'square',
    name: 'Köy Meydanı & Gasilhane',
    short: 'Meydan',
    sub: 'Cami · Çeşme · Muhtarlık',
    x: 0,
    z: 4,
  },
  {
    id: 'clinic',
    name: 'Sağlık Ocağı',
    short: 'Sağlık Ocağı',
    sub: 'Vaka II · Şoför Mahmut',
    x: CLINIC.x,
    z: CLINIC.z,
  },
  {
    id: 'mill',
    name: 'Eski Su Değirmeni',
    short: 'Değirmen',
    sub: 'Dere Köprüsü · Boğanak',
    x: -36,
    z: 8,
  },
  {
    id: 'cemetery',
    name: 'Mezarlık & Taş Mahzen',
    short: 'Taş Mahzen',
    sub: 'Vaka III · Mezarcı İdris',
    x: -34,
    z: -36,
  },
  {
    id: 'crash_site',
    name: 'Viraj Kaza Alanı',
    short: 'Viraj',
    sub: '22.40 · Minibüs enkazı',
    x: 28,
    z: 20,
  },
  { id: 'school', ...OUTPOSTS.school, short: 'Mektep', sub: 'Kuzeydoğu · Derslik ve avlu çanı' },
  { id: 'station', ...OUTPOSTS.station, short: 'İstasyon', sub: 'Doğu hattı · Gişe ve son peron' },
  { id: 'exchange', ...OUTPOSTS.exchange, short: 'Santral', sub: 'Güneybatı sırtı · Dağıtım kulübesi' },
];
export function districtAt(x: number, z: number): DistrictId {
  if (z < -40 && x > 12) return 'school';
  if (x > 38) return z < -31 ? 'school' : 'station';
  if ((x < -26 && z > 19) || (x < -40 && z > 10)) return 'exchange';
  if (Math.hypot(x - CLINIC.x, z - CLINIC.z) < 13) return 'clinic';
  if (x < -21 && z > -10) return 'mill';
  if (x < -20 && z <= -22) return 'cemetery';
  if (Math.hypot(x - 28, z - 20) < 13) return 'crash_site';
  return 'square';
}
export type Lane = readonly [number, number, number, number, number];
/** New village spine, ordered from the northern slope to the southern crossing. */
export const MAIN_ROAD_POINTS = [
  [-2, -48], [-1, -39], [1, -30], [2, -22], [0.5, -14],
  [-0.5, -5], [1, 4], [0, 12], [1, 20], [-1, 30], [0, 42],
] as const;
export const MAIN_LANES: readonly Lane[] = MAIN_ROAD_POINTS.slice(1).map(([x, z], i) => {
  const [px, pz] = MAIN_ROAD_POINTS[i];
  return [px, pz, x, z, 4.6] as const;
});
/** Same interpolated centre is used by road mesh and roadside dressing. */
export function mainRoadX(z: number): number {
  const points = MAIN_ROAD_POINTS;
  if (z <= points[0][1]) return points[0][0];
  for (let i = 1; i < points.length; i++) {
    const [x, end] = points[i], [startX, start] = points[i - 1];
    if (z <= end) {
      const t = (z - start) / (end - start);
      return startX + (x - startX) * t;
    }
  }
  return points[points.length - 1][0];
}
/** Branch streets of the rebuilt village: each chain begins on the spine. */
export const CORE_LANES: readonly Lane[] = [
  // Upper village: climb behind the office to the hillside clinic junction.
  [1.5, -26, 7, -27.4, 3.2],
  [7, -27.4, 14, -26.5, 3.2],
  [14, -26.5, 20, -27.7, 3.2],
  // Cemetery road approaches its bridge and entrance from the north-west.
  [1, -30, -6, -30, 3.0],
  [-6, -30, -13, -31.2, 3.0],
  [-13, -31.2, -20, -30.8, 3.0],
  [-20, -30.8, -24.5, -32.0, 3.0],
  [-24.5, -32.0, -32, -34.5, 3.0],
  // South of the mosque, the footpath bends toward the mill bridge.
  [0.5, 16, -6, 15.5, 2.8],
  [-6, 15.5, -14.7, 11.2, 2.8],
  [-14.7, 11.2, -20.8, 8, 2.8],
  [-20.8, 8, -32, 8, 2.8],
  // The lower village forks toward the wreck and eastern hamlet.
  [1, 20, 12, 19, 3.8],
  [12, 19, 24, 19.7, 3.8],
];
export const OUTER_LANES: readonly Lane[] = [
  // Hillside clinic spur leaves the old northern road and approaches its west door.
  [20, -22.5, 24, -19, 3.1],
  [24, -19, 26, -10, 3.1],
  [26, -10, 28.3, -10, 2.5],
  // Northern road to the school yard.
  [20, -27.7, 20, -22.5, 3.1],
  [20, -22.5, 33, -22.5, 3.1],
  [33, -22.5, 36, -29, 3.1],
  [36, -29, 34, -35, 3.1],
  [34, -35, 32, -42, 3.1],
  [32, -42, 46, -53, 3.1],
  [46, -53, 43, -58, 3.1],
  [43, -58, 43, -61.95, 2.4],
  // The eastern hillside route winds from the school to the station and southern crossing.
  [46, -53, 57, -44, 3.1],
  [57, -44, 56, -34, 3.1],
  [56, -34, 54, -20, 3.1],
  [54, -20, 52, -9, 3.1],
  [52, -9, 49, 1, 3.1],
  [49, 1, 46, 12, 3.1],
  [46, 12, 44, 22, 3.1],
  [44, 22, 50, 32, 3.1],
  [50, 32, 53, 47, 3.1],
  [53, 47, 60, 49, 3.1],
  [60, 49, 60, 45.52, 2.3],
  [24, 19.7, 24.6, 23.8, 3.3],
  [24.6, 23.8, 31, 24.8, 3.3],
  [31, 24.8, 44, 22, 3.3],
  [53, 47, 40, 40, 2.9],
  [40, 40, 29, 42, 2.9],
  [29, 42, 15, 39, 2.9],
  [15, 39, 0, 40, 2.9],
  [0, 40, -18, 39, 3.1],
  [-18, 39, -30, 39, 3.1],
  [-30, 39, -43, 47, 3.1],
  [-43, 47, -48, 54, 3.1],
  [-48, 54, -56, 56, 3.1],
  [-56, 56, -56, 53.45, 2.3],
  // Mill service road meets the relay cabinet before climbing to the exchange.
  [-30, 8, -30, 14, 2.9],
  [-30, 14, -41, 24, 2.9],
  [-41, 24, -47, 31, 2.9],
  [-47, 31, -43, 47, 2.9],
];
/** Shared house centres for foundations, vegetation clearings and world construction. */
// Revision 1 survey retained only to migrate saved positions.
export const REV1_CORE_HOME_CENTRES = [
  [12.5, 2], [-10.6, 21.5], [13, -8.6], [-14, -21.5],
  [21, 12], [-20, -5.5], [17.5, -36.5], [-15.5, -37.5],
] as const;
// More organic settlement: houses sit in irregular clusters along the valley.
export const CORE_HOME_CENTRES = [
  [13.5, 3.5], [-10, 23.5], [14, -9.5], [-15, -22],
  [23, 11], [-20, -6.5], [17, -38], [-15, -39],
] as const;
export const LEGACY_OUTER_HOMES = [
  // A closer, staggered street frontage frames the muddy north–south lane,
  // while leaving the surveyed routes and the entrances unobstructed.
  [-7.6, -43, Math.PI / 2],
  [8.2, -43, -Math.PI / 2],
  [-7.8, 30, Math.PI / 2],
  [8.0, 30, -Math.PI / 2],
  [35, -51, 0.46],
  [46, -41, -1.6],
  [62, -29, -1.4],
  [45, -13, 1.5],
  [59, 3, -1.4],
  [37, 31, 2.5],
  [24, 48, 3.0],
  [-37, 53, 2.8],
  [-58, 31, 1.3],
  [-40, 16, 0.6],
] as const;
export const REV1_OUTER_HOMES = [
  [-9.0, -45, 1.38], [10.2, -42, -1.38],
  [-9.0, 32, 1.40], [10.0, 31, -1.35],
  [34, -49, 0.35], [47, -42, -1.48], [64, -29, -1.3],
  [46, -12, 1.38], [61, 3, -1.35], [38, 30, 2.42],
  [24, 50, 2.9], [-37, 55, 2.7], [-60, 31, 1.25], [-41, 17, 0.52],
] as const;
export const OUTER_HOMES = [
  [-10.0, -46.0, 1.34], [11.2, -43.5, -1.34],
  [-10.0, 34.0, 1.36], [11.0, 33.0, -1.32],
  [34.0, -49.0, 0.35], [47.5, -41.0, -1.48], [64.0, -31.0, -1.3],
  [47.5, -12.0, 1.38], [62.5, 4.0, -1.35], [39.0, 30.5, 2.42],
  [23.0, 51.0, 2.9], [-36.0, 56.0, 2.7], [-60.5, 33.0, 1.25], [-42.0, 17.0, 0.52],
] as const;
export const RELAY = { x: -46, z: 27.8 };
export function clearedForRoad(x: number, z: number, lanes: readonly Lane[]) {
  return lanes.some(([a, b, c, d, w]) => {
    const dx = c - a,
      dz = d - b,
      t = Math.max(0, Math.min(1, ((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - a - t * dx, z - b - t * dz) < w / 2 + 2.2;
  });
}
export function reservedGround(x: number, z: number) {
  return (
    Object.values(OUTPOSTS).some(
      (b) => Math.abs(x - b.x) < b.w / 2 + 4.5 && Math.abs(z - b.z) < b.d / 2 + 6,
    ) ||
    [...CORE_HOME_CENTRES, ...OUTER_HOMES].some(([a, b]) => Math.hypot(x - a, z - b) < 5.3) ||
    clearedForRoad(x, z, OUTER_LANES) ||
    clearedForRoad(x, z, CORE_LANES) ||
    clearedForRoad(x, z, MAIN_LANES) ||
    Math.hypot(x - RELAY.x, z - RELAY.z) < 3.5
  );
}
