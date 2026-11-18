import type { DistrictId } from './types';

/** Metres, north = -Z. Collision, clearing, wayfinding and the notebook share this survey. */
export const VALLEY = { x1: -72, x2: 76, z1: -78, z2: 62 } as const;
export const OUTPOSTS = {
  school: { x: 46, z: -60, w: 11.4, d: 5.9, door: 1.29, y: 1.8, name: 'Sarı Mektep' },
  station: { x: 59, z: 28, w: 8.9, d: 4.9, door: 1.19, y: 1.1, name: 'Kuzdağ İstasyonu' },
  exchange: { x: -54, z: 43, w: 5.6, d: 4.8, door: 1.55, y: 1.55, name: 'Sırt Santrali' },
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
    x: 26,
    z: -28,
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
  if (Math.hypot(x - 26, z + 28) < 13) return 'clinic';
  if (x < -21 && z > -10) return 'mill';
  if (x < -20 && z <= -22) return 'cemetery';
  if (Math.hypot(x - 28, z - 20) < 13) return 'crash_site';
  return 'square';
}
export type Lane = readonly [number, number, number, number, number];
export const CORE_LANES: readonly Lane[] = [
  [0.5, -24, 21.5, -28, 3.8],
  [-1, -29, -18, -30.4, 3.4],
  [-18, -30.4, -32, -34.5, 3.4],
  [-1, 10.1, -14.7, 11.2, 2.7],
  [-14.7, 11.2, -20.8, 8, 2.7],
  [-20.8, 8, -32, 8, 2.7],
  [1, 16, 25, 20, 4],
];
export const OUTER_LANES: readonly Lane[] = [
  // Clinic's west entry round its south wall to the school yard.
  [20, -27.7, 20, -22.5, 3.1],
  [20, -22.5, 33, -22.5, 3.1],
  [33, -22.5, 34, -35, 3.1],
  [34, -35, 32, -42, 3.1],
  [32, -42, 46, -53, 3.1],
  [46, -53, 46, -56.95, 2.4],
  // Old post road: school, east hamlet, station and southern crossing. Avoid the wreck itself.
  [46, -53, 57, -44, 3.1],
  [57, -44, 54, -20, 3.1],
  [54, -20, 49, 1, 3.1],
  [49, 1, 44, 22, 3.1],
  [44, 22, 55, 34, 3.1],
  [55, 34, 59, 34, 3.1],
  [59, 34, 59, 30.52, 2.3],
  [24, 19.7, 24.6, 23.8, 3.3],
  [24.6, 23.8, 31, 24.8, 3.3],
  [31, 24.8, 44, 22, 3.3],
  [55, 34, 29, 42, 2.9],
  [29, 42, 0, 40, 2.9],
  [0, 40, -18, 39, 3.1],
  [-18, 39, -30, 39, 3.1],
  [-30, 39, -43, 47, 3.1],
  [-43, 47, -54, 48, 3.1],
  [-54, 48, -54, 45.45, 2.3],
  // Mill service road meets the relay cabinet before climbing to the exchange.
  [-30, 8, -30, 14, 2.9],
  [-30, 14, -41, 24, 2.9],
  [-41, 24, -47, 31, 2.9],
  [-47, 31, -43, 47, 2.9],
];
export const OUTER_HOMES = [
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
    OUTER_HOMES.some(([a, b]) => Math.hypot(x - a, z - b) < 5.3) ||
    clearedForRoad(x, z, OUTER_LANES) ||
    clearedForRoad(x, z, CORE_LANES) ||
    Math.hypot(x - RELAY.x, z - RELAY.z) < 3.5
  );
}
