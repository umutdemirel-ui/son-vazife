/** Dermanlı survey translated from docs/referans/son_vazife_blender_koy.py.
 * Blender's north (+Y) is Three.js's north (-Z); units are metres. This is
 * intentionally independent of the legacy Kuzdağ world and save coordinates.
 */
export type Point = readonly [number, number];
export type SurveyPath = { id: string; points: readonly Point[]; width: number; closed?: boolean; kind: 'road' | 'trail' | 'water' };
export const MAP_SCALE = 0.3;
export function mapPoint(x: number, y: number): Point { return [(x - 190) * MAP_SCALE, (y - 280) * MAP_SCALE]; }
function curve(a: Point, b: Point, c: Point, d: Point, steps = 20): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, u = 1 - t;
    return mapPoint(u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0],
      u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]);
  });
}
function line(a: Point, b: Point): Point[] { return [mapPoint(...a), mapPoint(...b)]; }
function join(...parts: Point[][]): Point[] { return parts.flatMap((p, i) => i ? p.slice(1) : p); }
const path = (id: string, width: number, points: Point[], kind: SurveyPath['kind'] = 'road', closed = false): SurveyPath =>
  ({ id, width: width * MAP_SCALE, points, kind, closed });
export const DERMANLI_PATHS: readonly SurveyPath[] = [
  path('halka', 9, join(curve([190,440],[120,440],[80,395],[80,330]), curve([80,330],[80,230],[115,150],[190,150]), curve([190,150],[270,150],[325,220],[325,300]), curve([325,300],[325,380],[270,440],[190,440])).slice(0,-1), 'road', true),
  path('giris', 14, join(curve([190,560],[190,520],[200,490],[190,440]), line([190,440],[190,296]))),
  path('kuzey', 9, line([190,296],[190,224])),
  path('mezarlik', 7, line([190,150],[190,112])),
  path('bati', 7, curve([80,328],[125,322],[150,322],[166,322])),
  path('dogu', 7, line([214,316],[325,302])),
  path('kopru', 6, line([325,318],[378,322])),
  path('okul', 6, curve([100,195],[85,170],[70,150],[62,132])),
  path('kuyu', 6, line([85,255],[58,255])),
  path('degirmen', 6, curve([275,160],[280,120],[290,95],[298,85])),
  path('orman', 6, line([80,345],[0,352])),
  path('gasilhane-mezarlik-kestirme', 3, curve([250,190],[255,150],[235,125],[215,108]), 'trail'),
  path('tarla-gassal-kestirme', 3, curve([250,470],[255,440],[250,410],[254,375]), 'trail'),
  path('dere', 14, join(curve([360,0],[345,90],[365,180],[350,260]), curve([350,260],[335,340],[345,340],[355,420]), curve([355,420],[365,500],[368,500],[358,560])), 'water'),
];
export const DERMANLI_SITES = {
  entrance: mapPoint(190, 536), mosque: mapPoint(188, 200), gasilhane: mapPoint(253, 204),
  cemetery: mapPoint(190, 71), square: mapPoint(190, 322), gassalHome: mapPoint(254, 360),
  well: mapPoint(50, 255), school: mapPoint(61, 116), mill: mapPoint(311, 80),
  barn: mapPoint(216, 511), field: mapPoint(290, 505), bridge: mapPoint(353, 319),
  abandonedHomes: [[126,241],[131,296],[148,383],[288,265]].map(([x,y]) => mapPoint(x,y)),
} as const;
function segmentDistance(x: number, z: number, a: Point, b: Point): number {
  const dx = b[0]-a[0], dz = b[1]-a[1], length = dx*dx+dz*dz;
  const t = length ? Math.max(0, Math.min(1, ((x-a[0])*dx+(z-a[1])*dz)/length)) : 0;
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}
/** Distance to a path's centreline, also suitable for vegetation clearance. */
export function distanceToPath(x: number, z: number, p: SurveyPath): number {
  let best = Infinity;
  for (let i = 1; i < p.points.length; i++) best = Math.min(best, segmentDistance(x,z,p.points[i-1],p.points[i]));
  if (p.closed) best = Math.min(best, segmentDistance(x,z,p.points[p.points.length-1],p.points[0]));
  return best;
}
function smooth(a: number,b: number,x: number) { const t = Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
/** Equivalent of H in the reference script, using exact segment distances. */
export function dermanliHeight(x: number, z: number): number {
  const sx = x / MAP_SCALE + 190, sy = z / MAP_SCALE + 280;
  const out = Math.hypot(Math.max(30-sx,0,sx-345), Math.max(25-sy,0,sy-545));
  if (!out) return 0;
  const roadDistance = Math.min(...DERMANLI_PATHS.map(p => distanceToPath(x,z,p))) / MAP_SCALE;
  const noise = 0.65 + 0.35 * (Math.sin(sx*0.05+1.3)*Math.cos(sy*0.04)+0.5*Math.sin(sx*0.13+sy*0.09));
  return 12*smooth(0,70,out)*noise*smooth(14,45,roadDistance);
}
