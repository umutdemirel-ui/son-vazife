import type { DistrictId } from '../game/types';
import {
  CORE_HOME_CENTRES,
  CORE_LANES,
  CLINIC,
  LANDMARKS,
  MAIN_LANES,
  MUHTAR,
  OUTPOSTS,
  OUTER_HOMES,
  OUTER_LANES,
  VALLEY,
} from '../game/valley';
import { ESCAPE_POINT } from '../game/survival';

interface VillageMapProps {
  discoveredDistricts: DistrictId[];
  playerMapPos: { x: number; z: number; yaw: number };
  showEscape: boolean;
}

const SHEET = { width: 720, height: 590 } as const;
const MAP = {
  x: 30,
  y: 64,
  width: SHEET.width - 60,
  height: SHEET.height - 128,
} as const;
const SCALE_X = MAP.width / (VALLEY.x2 - VALLEY.x1);
const SCALE_Y = MAP.height / (VALLEY.z2 - VALLEY.z1);
const toX = (x: number) => MAP.x + ((x - VALLEY.x1) / (VALLEY.x2 - VALLEY.x1)) * MAP.width;
const toY = (z: number) => MAP.y + ((z - VALLEY.z1) / (VALLEY.z2 - VALLEY.z1)) * MAP.height;
const lanes = [...OUTER_LANES, ...CORE_LANES, ...MAIN_LANES];

const woodedRidges = [
  [-72, -78, 148, 20, 'north'],
  [-72, 18, 28, 44, 'west'],
  [48, -48, 28, 110, 'east'],
] as const;
const contours = [
  [-3, -78, 56, 18], [3, -77, 46, 14], [9, -75, 34, 11],
  [-70, 18, 30, 28], [-69, 19, 24, 22],
  [70, 8, 40, 68], [69, 8, 32, 57], [68, 8, 23, 42],
  [-35, -36, 17, 15], [-35, -36, 12, 10],
] as const;
const treeMarks = [
  [-67, -66], [-58, -72], [-46, -68], [-34, -73], [-20, -70], [-5, -73], [12, -72], [29, -73], [47, -70], [64, -65],
  [-68, -51], [-61, -39], [-68, -24], [-64, -8], [-69, 10], [-67, 27], [-67, 44], [-62, 58], [-51, 62], [-39, 58],
  [-25, 61], [-11, 58], [5, 61], [20, 59], [35, 61], [50, 59], [67, 55], [69, 38], [68, 20], [67, 2], [68, -16], [-68, -36],
  [-54, -55], [-48, -46], [-58, -20], [-51, 2], [-59, 18], [-55, 35], [-42, 53], [57, -57], [62, -43], [59, -29], [63, -12], [59, 8], [58, 28], [62, 48],
] as const;

function MapText({ x, y, children, anchor = 'middle', size = 10, className = '' }: {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  className?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily="var(--mono), 'IBM Plex Mono', monospace"
      fontSize={size}
      fontWeight="700"
      letterSpacing="1.1"
      className={className}
      fill="#302920"
      stroke="#ded2b8"
      strokeWidth="3.5"
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {children}
    </text>
  );
}

function Pine({ x, y, scale = 1, ink = '#344236' }: { x: number; y: number; scale?: number; ink?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity=".82">
      <path d="M0 -7 -4.5 1.2 -2 1.2 -5 6.5 5 6.5 2 1.2 4.5 1.2Z" fill={ink} />
      <path d="M0 5v3" stroke="#675a43" strokeWidth=".9" />
    </g>
  );
}

function LandmarkStamp({ id, name, x, z, index, discovered }: {
  id: string;
  name: string;
  x: number;
  z: number;
  index: number;
  discovered: boolean;
}) {
  const px = toX(x);
  const py = toY(z);
  const number = String(index + 1).padStart(2, '0');
  const isSquare = id === 'square';
  return (
    <g aria-label={`${name}${discovered ? ', keşfedildi' : ', uzak'}`}>
      <circle cx={px} cy={py} r={isSquare ? 16 : 13} fill="#e5dbc4" fillOpacity=".88" stroke="#4a3c2c" strokeWidth="1.2" />
      <circle cx={px} cy={py} r={isSquare ? 12.5 : 10.5} fill={discovered ? '#445642' : '#8c7152'} stroke="#f0e4cc" strokeWidth="1" />
      {isSquare ? <path d={`M${px - 6} ${py - 2}  ${px} ${py - 7}  ${px + 6} ${py - 2}  ${px + 6} ${py + 5}  ${px - 6} ${py + 5}Z`} fill="none" stroke="#f1e6d0" strokeWidth="1.3" /> : null}
      <text x={px} y={py + 3} textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="7.5" fontWeight="700" fill="#fff2d7">{number}</text>
      <circle cx={px} cy={py} r="18" fill="none" stroke={discovered ? '#455741' : '#715b40'} strokeWidth=".7" strokeDasharray="1.5 3" opacity=".72" />
    </g>
  );
}

/** An illustrated field map. Its road and marker coordinates stay tied to the walkable valley. */
export function VillageMap({ discoveredDistricts, playerMapPos, showEscape }: VillageMapProps) {
  const scaleBar = 20 * SCALE_X;
  return (
    <figure className="relative isolate w-full overflow-hidden border border-[#574938] bg-[#d7cbb0] p-2.5 shadow-[0_18px_44px_#15110d55] sm:p-3">
      <div className="pointer-events-none absolute inset-[5px] border border-[#8c795a]/55" />
      <figcaption className="relative flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[#79684e]/55 px-2 pb-2.5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[.28em] text-[#8b3d32]">Kuzdağ Köy Arşivi · Belge 01</p>
          <p className="mt-1 font-display text-lg font-semibold tracking-[.13em] text-[#302619] sm:text-xl">KUZDAĞ SAHA HARİTASI</p>
        </div>
        <div className="text-right font-mono text-[8px] uppercase leading-relaxed tracking-[.14em] text-[#514534] sm:text-[9px]">
          <p>Anadolu · Kasım 1993</p>
          <p>Ölçekli arazi krokisi</p>
        </div>
      </figcaption>

      <svg
        viewBox={`0 0 ${SHEET.width} ${SHEET.height}`}
        className="relative z-0 mt-2 block h-auto w-full border border-[#72624a]/70"
        role="img"
        aria-labelledby="village-map-title village-map-description"
      >
        <title id="village-map-title">Kuzdağ köyü arşiv saha haritası</title>
        <desc id="village-map-description">
          Giriş ekranındaki 1993 köy arşivi kayıtlarıyla aynı sepya ve kırmızı damga estetiğinde, gerçek yürüyüş yollarına göre çizilmiş Kuzdağ haritası. Kuzey yukarıdadır; dere, orman, sekiz bölge ve bulunduğunuz yer gösterilir.
        </desc>
        <defs>
          <linearGradient id="map-ground" x2="0" y2="1">
            <stop offset="0" stopColor="#c9c2a8" />
            <stop offset=".48" stopColor="#b9b59d" />
            <stop offset="1" stopColor="#c5b99c" />
          </linearGradient>
          <linearGradient id="map-river" x2="1" y2="0">
            <stop offset="0" stopColor="#576e6b" />
            <stop offset=".5" stopColor="#8da097" />
            <stop offset="1" stopColor="#657b75" />
          </linearGradient>
          <pattern id="map-paper-fleck" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="7" r=".85" fill="#665841" opacity=".14" />
            <circle cx="24" cy="21" r=".7" fill="#8b7553" opacity=".15" />
            <path d="M11 29h5M27 4h2" stroke="#fff4d9" strokeWidth=".8" opacity=".45" />
          </pattern>
          <pattern id="map-ridge-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <path d="M0 0v9" stroke="#48513e" strokeWidth="1" opacity=".17" />
          </pattern>
          <pattern id="map-river-lines" width="16" height="9" patternUnits="userSpaceOnUse">
            <path d="M0 3q4-3 8 0t8 0M-4 8q4-3 8 0t8 0" fill="none" stroke="#e0e2cb" strokeWidth=".8" opacity=".52" />
          </pattern>
          <pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" fill="none" stroke="#5c5947" strokeWidth=".75" opacity=".2" />
            <circle cx="0" cy="0" r="1.1" fill="#4f4938" opacity=".34" />
          </pattern>
          <clipPath id="valley-map-clip"><rect x={MAP.x} y={MAP.y} width={MAP.width} height={MAP.height} /></clipPath>
          <filter id="map-marker-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#20190f" floodOpacity=".28" />
          </filter>
        </defs>

        <rect width={SHEET.width} height={SHEET.height} fill="#d8cdb4" />
        <rect width={SHEET.width} height={SHEET.height} fill="url(#map-paper-fleck)" />
        <rect x="9" y="9" width={SHEET.width - 18} height={SHEET.height - 18} fill="none" stroke="#6e5c43" strokeWidth="1" />
        <rect x={MAP.x} y={MAP.y} width={MAP.width} height={MAP.height} fill="url(#map-ground)" stroke="#433b2d" strokeWidth="1.5" />

        <g clipPath="url(#valley-map-clip)">
          {/* Shaded mountain skirts establish a valley instead of a flat grid. */}
          {woodedRidges.map(([x, z, width, height, side], i) => {
            const cx = toX(x + width / 2);
            const cy = toY(z + height / 2);
            const rx = (width / (VALLEY.x2 - VALLEY.x1)) * MAP.width / 2;
            const ry = (height / (VALLEY.z2 - VALLEY.z1)) * MAP.height / 2;
            return <g key={side}>
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#8d9277" opacity={i === 0 ? '.32' : '.28'} />
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#map-ridge-hatch)" opacity=".68" />
            </g>;
          })}
          {/* The fir-covered crest at the north borrows the misty mountain silhouette from the title art. */}
          <path d={`M${toX(-72)} ${toY(-57)}  L${toX(-59)} ${toY(-67)}  L${toX(-48)} ${toY(-60)}  L${toX(-35)} ${toY(-74)}  L${toX(-23)} ${toY(-62)}  L${toX(-8)} ${toY(-76)}  L${toX(5)} ${toY(-61)}  L${toX(18)} ${toY(-72)}  L${toX(33)} ${toY(-60)}  L${toX(47)} ${toY(-69)}  L${toX(61)} ${toY(-58)}  L${toX(76)} ${toY(-64)} V${toY(-78)} H${toX(-72)}Z`} fill="#737a64" opacity=".62" />
          <path d={`M${toX(-72)} ${toY(-57)}  L${toX(-59)} ${toY(-67)}  L${toX(-48)} ${toY(-60)}  L${toX(-35)} ${toY(-74)}  L${toX(-23)} ${toY(-62)}  L${toX(-8)} ${toY(-76)}  L${toX(5)} ${toY(-61)}  L${toX(18)} ${toY(-72)}  L${toX(33)} ${toY(-60)}  L${toX(47)} ${toY(-69)}  L${toX(61)} ${toY(-58)}  L${toX(76)} ${toY(-64)}`} fill="none" stroke="#f0e7d0" strokeWidth="1.2" opacity=".62" />

          {contours.map(([x, z, rx, ry], i) => <ellipse
            key={`contour-${i}`} cx={toX(x)} cy={toY(z)} rx={rx * SCALE_X} ry={ry * SCALE_Y}
            fill="none" stroke="#716a52" strokeWidth="1.1" strokeDasharray={i % 2 ? '2 4' : 'none'} opacity=".4"
          />)}

          <rect x={MAP.x} y={MAP.y} width={MAP.width} height={MAP.height} fill="url(#map-grid)" />

          {/* A fine tree engraving marks the boundary forest while keeping the roads legible. */}
          {treeMarks.map(([x, z], i) => <Pine key={`tree-${i}`} x={toX(x)} y={toY(z)} scale={i % 4 === 0 ? 1.22 : .82} ink={i % 3 === 0 ? '#3c4938' : '#566149'} />)}

          {/* The stream and its crossings follow the same valley survey as the playable world. */}
          <path d={`M${toX(-25)} ${toY(-78)} C${toX(-21)} ${toY(-48)} ${toX(-28)} ${toY(-17)} ${toX(-24)} ${toY(8)} S${toX(-22)} ${toY(42)} ${toX(-25)} ${toY(62)}`}
            fill="none" stroke="#394f50" strokeWidth={4.4 * ((SCALE_X + SCALE_Y) / 2) + 6} opacity=".72" />
          <path d={`M${toX(-25)} ${toY(-78)} C${toX(-21)} ${toY(-48)} ${toX(-28)} ${toY(-17)} ${toX(-24)} ${toY(8)} S${toX(-22)} ${toY(42)} ${toX(-25)} ${toY(62)}`}
            fill="none" stroke="url(#map-river)" strokeWidth={4.4 * ((SCALE_X + SCALE_Y) / 2)} />
          <path d={`M${toX(-25)} ${toY(-78)} C${toX(-21)} ${toY(-48)} ${toX(-28)} ${toY(-17)} ${toX(-24)} ${toY(8)} S${toX(-22)} ${toY(42)} ${toX(-25)} ${toY(62)}`}
            fill="none" stroke="url(#map-river-lines)" strokeWidth={4.4 * ((SCALE_X + SCALE_Y) / 2) - 1} />

          {/* Main roads have darker ink edges, warm paper fill and broken cartographer centre marks. */}
          {lanes.map(([x1, z1, x2, z2, width], i) => {
            const roadWidth = width * ((SCALE_X + SCALE_Y) / 2);
            const d = `M${toX(x1)} ${toY(z1)}L${toX(x2)} ${toY(z2)}`;
            return <g key={`road-${i}`}>
              <path d={d} fill="none" stroke="#534332" strokeWidth={roadWidth + 2.8} strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
              <path d={d} fill="none" stroke={i >= OUTER_LANES.length + CORE_LANES.length ? '#b4976d' : '#c3a77c'} strokeWidth={roadWidth} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke="#eadbb9" strokeWidth="1.1" strokeDasharray="2 6" strokeLinecap="round" opacity=".8" />
            </g>;
          })}

          {/* Timber roofs echo the archive photographs and sit on the real house centres. */}
          {CORE_HOME_CENTRES.map(([x, z], i) => <g key={`home-${i}`} transform={`translate(${toX(x)} ${toY(z)}) rotate(${i % 2 ? 4 : -4})`}>
            <path d="M-7 0 0 -5.3 7 0V5H-7Z" fill="#88694d" stroke="#45382a" strokeWidth="1.2" />
            <path d="M-7 0 0 -5.3 7 0" fill="none" stroke="#d2b88d" strokeWidth="1.3" />
            <path d="M0 -4v9" stroke="#534435" strokeWidth=".8" />
          </g>)}
          {OUTER_HOMES.map(([x, z, yaw], i) => <g key={`outer-home-${i}`} transform={`translate(${toX(x)} ${toY(z)}) rotate(${-yaw * 180 / Math.PI})`}>
            <path d="M-5.3 0 0 -4.2 5.3 0V3.8H-5.3Z" fill="#967b59" stroke="#554634" strokeWidth="1" />
            <path d="M-5.3 0 0 -4.2 5.3 0" fill="none" stroke="#dfc89c" strokeWidth=".9" />
          </g>)}

          {/* Simple civic symbols identify the distinctive archive locations at map scale. */}
          <g transform={`translate(${toX(0)} ${toY(4)})`}>
            <path d="M-13 3 0 -9 13 3V13H-13Z" fill="#6e4e39" stroke="#3d3024" strokeWidth="1.6" />
            <path d="M-5 13V4H5V13M0 -9v-6m-3 3h6" fill="none" stroke="#e4d3b2" strokeWidth="1.5" />
          </g>
          <g transform={`translate(${toX(CLINIC.x)} ${toY(CLINIC.z)})`}>
            <path d="M-9 5V-4L0-10 9-4V5Z" fill="#d1c39f" stroke="#564733" strokeWidth="1.2" />
            <path d="M0-6v8m-4-4h8" stroke="#9d4133" strokeWidth="2" />
          </g>
          <g transform={`translate(${toX(-36)} ${toY(8)})`}>
            <circle r="8" fill="#d0c09b" stroke="#554635" strokeWidth="1.3" />
            <path d="M-5-3h10M-5 0h10M-5 3h10M0-7v14" stroke="#706049" strokeWidth=".8" />
          </g>
          {Object.values(OUTPOSTS).map((place) => (
            <g key={place.name} transform={`translate(${toX(place.x)} ${toY(place.z)})`}>
              <path d="M-8 1 0-6 8 1V6H-8Z" fill="#7d6046" stroke="#3e3125" strokeWidth="1.2" />
              <path d="M-8 1 0-6 8 1" fill="none" stroke="#e3cd9f" strokeWidth="1.1" />
              <path d="M-2 6V2H2V6" fill="none" stroke="#eadbbd" strokeWidth=".9" />
            </g>
          ))}

          {/* Terrain names are printed like handwritten notes on the original field sheet. */}
          <MapText x={toX(-49)} y={toY(-52)} size={9}>KARAÇAM ORMANI</MapText>
          <MapText x={toX(62)} y={toY(18)} size={9}>DOĞU SIRTI</MapText>
          <MapText x={toX(-39)} y={toY(-46)} size={8}>MEZARLIK TEPESİ</MapText>
          <MapText x={toX(-24)} y={toY(16)} anchor="start" size={8}>DERE</MapText>
          <MapText x={toX(2)} y={toY(-18)} size={8}>KUZDAĞ</MapText>

          {LANDMARKS.map((landmark, index) => <g key={landmark.id} filter="url(#map-marker-shadow)">
            <LandmarkStamp
              id={landmark.id}
              name={landmark.name}
              x={landmark.x}
              z={landmark.z}
              index={index}
              discovered={discoveredDistricts.includes(landmark.id)}
            />
          </g>)}

          <g transform={`translate(${toX(MUHTAR.x)} ${toY(MUHTAR.z)})`} aria-label="Muhtarlık">
            <rect x="-7" y="-7" width="14" height="14" fill="#a13d32" stroke="#34281f" strokeWidth="1.4" />
            <path d="M-4 0h8M0-4v8" stroke="#f4e7ce" strokeWidth="1.2" />
            <MapText x={10} y={-8} anchor="start" size={8}>MUHTARLIK</MapText>
          </g>

          {showEscape && <g transform={`translate(${toX(ESCAPE_POINT.x)} ${toY(ESCAPE_POINT.z)})`} aria-label="Kaçış noktası">
            <circle r="16" fill="#a13d32" fillOpacity=".12" stroke="#a13d32" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M0 -8 7 7 0 3 -7 7Z" fill="#a13d32" stroke="#f1e3c9" strokeWidth="1.2" />
            <MapText x={0} y={-22} size={8}>PERON · ÇIKIŞ</MapText>
          </g>}

          <g transform={`translate(${toX(playerMapPos.x)} ${toY(playerMapPos.z)})`} aria-label="Bulunduğunuz yer" filter="url(#map-marker-shadow)">
            <circle r="14" fill="#a33d32" fillOpacity=".16" />
            <circle r="7.5" fill="#a33d32" stroke="#f1e6d1" strokeWidth="1.2" />
            <path d="M0 -10 6 6 0 3 -6 6Z" transform={`rotate(${-playerMapPos.yaw * 180 / Math.PI})`} fill="#a33d32" stroke="#fff3dc" strokeWidth="1.7" />
          </g>
        </g>

        {/* North arrow and scale sit outside the terrain ink, as in a printed map margin. */}
        <g transform={`translate(${SHEET.width - 43} 92)`}>
          <text x="0" y="-13" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="11" fontWeight="700" fill="#382e22">K</text>
          <path d="M0 -8 7 9 0 5 -7 9Z" fill="#a23c32" stroke="#3f3025" strokeWidth="1" />
          <path d="M0 7v18" stroke="#3f3025" strokeWidth="1" />
        </g>
        <g transform={`translate(${SHEET.width - 122} ${SHEET.height - 37})`}>
          <path d={`M0 0h${scaleBar}M0-4v8M${scaleBar}-4v8`} stroke="#40372a" strokeWidth="1.4" />
          <text x={scaleBar / 2} y="-7" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="9" fontWeight="700" fill="#40372a">20 METRE</text>
        </g>
        <g transform="translate(43 538) rotate(-9)">
          <circle r="19" fill="none" stroke="#9a4438" strokeWidth="1.3" opacity=".84" />
          <circle r="15" fill="none" stroke="#9a4438" strokeWidth=".7" strokeDasharray="2 2" opacity=".84" />
          <text x="0" y="-1" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="5.5" fontWeight="700" letterSpacing=".5" fill="#984438">KUZDAĞ</text>
          <text x="0" y="6" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="4.5" fill="#984438">ARŞİV · 1993</text>
        </g>
        <text x={SHEET.width / 2} y={SHEET.height - 13} textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="8" letterSpacing="1.5" fill="#554937">SAHA NOTU 01 · KUZEY YUKARIDADIR · KIRMIZI OK YÖNÜNÜZÜ GÖSTERİR</text>
      </svg>

      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#79684e]/55 px-1 pt-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#493d2d] sm:text-[9px]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 bg-[#b4976d] ring-1 ring-[#534332]" />Yol ağı</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 bg-[#84978c] ring-1 ring-[#394f50]" />Dere</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[#4a3c2c] bg-[#445642]" />Keşfedildi</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[#4a3c2c] bg-[#8c7152]" />Uzak bölge</span>
        </div>
        <span className="tracking-[.09em]">{discoveredDistricts.length} / {LANDMARKS.length} bölge kaydedildi</span>
      </div>
    </figure>
  );
}

