import type { DistrictId } from '../game/types';
import {
  CORE_HOME_CENTRES,
  CORE_LANES,
  LANDMARKS,
  MAIN_LANES,
  MUHTAR,
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

const VIEW = { width: 560, height: 530, inset: 18 } as const;
const MAP_WIDTH = VIEW.width - VIEW.inset * 2;
const MAP_HEIGHT = VIEW.height - VIEW.inset * 2;
const SCALE_X = MAP_WIDTH / (VALLEY.x2 - VALLEY.x1);
const SCALE_Y = MAP_HEIGHT / (VALLEY.z2 - VALLEY.z1);
const toX = (x: number) => VIEW.inset + ((x - VALLEY.x1) / (VALLEY.x2 - VALLEY.x1)) * MAP_WIDTH;
const toY = (z: number) => VIEW.inset + ((z - VALLEY.z1) / (VALLEY.z2 - VALLEY.z1)) * MAP_HEIGHT;
const lanes = [...MAIN_LANES, ...CORE_LANES, ...OUTER_LANES];

const forest = [
  [-67, -66], [-58, -72], [-46, -68], [-34, -73], [-20, -70], [-5, -73], [12, -72], [29, -73], [47, -70], [64, -65],
  [-68, -51], [-61, -39], [-68, -24], [-64, -8], [-69, 10], [-67, 27], [-67, 44], [-62, 58], [-51, 62], [-39, 58],
  [-25, 61], [-11, 58], [5, 61], [20, 59], [35, 61], [50, 59], [67, 55], [69, 38], [68, 20], [67, 2], [68, -16], [67, -34], [68, -50],
  [-54, -55], [-48, -46], [-58, -20], [-51, 2], [-59, 18], [-55, 35], [-42, 53], [57, -57], [62, -43], [59, -29], [63, -12], [59, 8], [58, 28], [62, 48],
] as const;

function MapLabel({ x, y, children, anchor = 'middle' }: {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily="var(--mono), monospace"
      fontSize="12"
      fontWeight="700"
      letterSpacing=".4"
      fill="#352c21"
      stroke="#d8cdb4"
      strokeWidth="3.2"
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {children}
    </text>
  );
}

/** A measured field sheet: map scale follows the real 148 × 140 metre valley survey. */
export function VillageMap({ discoveredDistricts, playerMapPos, showEscape }: VillageMapProps) {
  return (
    <figure className="w-full border border-[#665744] bg-[#d6cbb0] p-2 shadow-[0_12px_28px_#17130e33]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-[#77664d]/50 px-2 pb-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#514634]">
        <span>SAHA KROKİSİ · NO. 01</span>
        <span>KUZDAĞ · KASIM 1993</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="block h-auto w-full"
        role="img"
        aria-labelledby="village-map-title village-map-description"
      >
        <title id="village-map-title">Kuzdağ köyü saha haritası</title>
        <desc id="village-map-description">
          Kuzey yukarıdadır. Yerleşim yolları, dere, haneler ve sekiz önemli bölge ölçülü olarak gösterilmiştir.
        </desc>
        <defs>
          <pattern id="survey-paper-grain" width="31" height="31" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="6" r=".7" fill="#75684e" opacity=".15" />
            <circle cx="22" cy="17" r=".6" fill="#82745a" opacity=".11" />
            <path d="M8 27h5M25 4h2" stroke="#fff5df" strokeWidth=".7" opacity=".28" />
          </pattern>
          <pattern id="survey-woodland" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8 2 4 10h8zM8 8v4" fill="#67705a" stroke="#465340" strokeWidth=".7" opacity=".78" />
          </pattern>
          <clipPath id="survey-map-clip">
            <rect x={VIEW.inset} y={VIEW.inset} width={MAP_WIDTH} height={MAP_HEIGHT} />
          </clipPath>
        </defs>

        <rect width={VIEW.width} height={VIEW.height} fill="#c9bea3" />
        <rect width={VIEW.width} height={VIEW.height} fill="url(#survey-paper-grain)" />
        <rect x="9" y="9" width={VIEW.width - 18} height={VIEW.height - 18} fill="none" stroke="#78664c" strokeWidth="1" />
        <rect x={VIEW.inset} y={VIEW.inset} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#b8b49c" stroke="#5d503e" strokeWidth="1.2" />

        <g clipPath="url(#survey-map-clip)">
          {/* Hill shade and the broken woodland edge enclose the village like the archive photograph. */}
          <path d={`M${toX(-72)} ${toY(-78)} H${toX(76)} V${toY(-57)} Q${toX(38)} ${toY(-47)} ${toX(6)} ${toY(-61)} Q${toX(-28)} ${toY(-48)} ${toX(-72)} ${toY(-57)}Z`} fill="#aaa990" opacity=".63" />
          <path d={`M${toX(-72)} ${toY(18)} Q${toX(-46)} ${toY(23)} ${toX(-55)} ${toY(62)} H${toX(-72)}Z`} fill="#989982" opacity=".48" />
          <path d={`M${toX(48)} ${toY(-47)} Q${toX(72)} ${toY(-36)} ${toX(76)} ${toY(-12)} V${toY(62)} H${toX(57)} Q${toX(49)} ${toY(26)} ${toX(60)} ${toY(-4)}Z`} fill="#999b81" opacity=".48" />
          <path d={`M${toX(-72)} ${toY(-78)} H${toX(76)} V${toY(-57)} Q${toX(38)} ${toY(-47)} ${toX(6)} ${toY(-61)} Q${toX(-28)} ${toY(-48)} ${toX(-72)} ${toY(-57)}Z`} fill="url(#survey-woodland)" opacity=".58" />
          <path d={`M${toX(48)} ${toY(-47)} Q${toX(72)} ${toY(-36)} ${toX(76)} ${toY(-12)} V${toY(62)} H${toX(57)} Q${toX(49)} ${toY(26)} ${toX(60)} ${toY(-4)}Z`} fill="url(#survey-woodland)" opacity=".53" />
          <path d={`M${toX(-72)} ${toY(18)} Q${toX(-46)} ${toY(23)} ${toX(-55)} ${toY(62)} H${toX(-72)}Z`} fill="url(#survey-woodland)" opacity=".48" />

          {/* Topographic contours mark the uplands and the cemetery rise. */}
          {[
            [-2, -78, 57], [5, -77, 49], [7, -77, 39],
            [-70, 18, 32], [-70, 18, 25],
            [70, 8, 37], [70, 8, 30], [70, 8, 22],
            [-34, -36, 13], [-34, -36, 9],
          ].map(([x, z, radius], i) => (
            <ellipse
              key={`contour-${i}`}
              cx={toX(x)}
              cy={toY(z)}
              rx={radius * SCALE_X}
              ry={radius * SCALE_Y}
              fill="none"
              stroke="#786f57"
              strokeWidth="1"
              strokeDasharray={i % 3 === 0 ? '1 0' : '3 3'}
              opacity=".42"
            />
          ))}

          {/* Survey grid, clipped to the valley boundary. */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = VIEW.inset + (MAP_WIDTH / 8) * i;
            return <path key={`grid-x-${i}`} d={`M${x} ${VIEW.inset}V${VIEW.height - VIEW.inset}`} stroke="#72684f" strokeWidth=".6" opacity=".2" />;
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const y = VIEW.inset + (MAP_HEIGHT / 8) * i;
            return <path key={`grid-y-${i}`} d={`M${VIEW.inset} ${y}H${VIEW.width - VIEW.inset}`} stroke="#72684f" strokeWidth=".6" opacity=".2" />;
          })}

          {/* Trees trace the dense edges while leaving the surveyed village and paths readable. */}
          {forest.map(([x, z], i) => (
            <path key={`tree-${i}`} d={`M${toX(x)} ${toY(z) - 3.2}l-2.4 4.5h4.8z`} fill="#3f4c3a" opacity=".7" />
          ))}

          {/* The stream is drawn to measured scale; roads cross it at the village and cemetery bridges. */}
          <path
            d={`M${toX(-25)} ${toY(-78)} C${toX(-21)} ${toY(-48)} ${toX(-28)} ${toY(-17)} ${toX(-24)} ${toY(8)} S${toX(-22)} ${toY(42)} ${toX(-25)} ${toY(62)}`}
            fill="none"
            stroke="#566b68"
            strokeWidth={4.4 * ((SCALE_X + SCALE_Y) / 2) + 3}
            opacity=".75"
          />
          <path
            d={`M${toX(-25)} ${toY(-78)} C${toX(-21)} ${toY(-48)} ${toX(-28)} ${toY(-17)} ${toX(-24)} ${toY(8)} S${toX(-22)} ${toY(42)} ${toX(-25)} ${toY(62)}`}
            fill="none"
            stroke="#819a91"
            strokeWidth={4.4 * ((SCALE_X + SCALE_Y) / 2)}
            opacity=".92"
          />

          {/* Packed earth lanes carry the same measured widths as the 3D world. */}
          {lanes.map(([x1, z1, x2, z2, width], i) => {
            const roadWidth = width * ((SCALE_X + SCALE_Y) / 2);
            return (
              <g key={`road-${i}`}>
                <line x1={toX(x1)} y1={toY(z1)} x2={toX(x2)} y2={toY(z2)} stroke="#594a39" strokeWidth={roadWidth + 3} strokeLinecap="round" opacity=".92" />
                <line x1={toX(x1)} y1={toY(z1)} x2={toX(x2)} y2={toY(z2)} stroke={i < MAIN_LANES.length ? '#a78d68' : '#b79f7a'} strokeWidth={roadWidth} strokeLinecap="round" />
                <line x1={toX(x1)} y1={toY(z1)} x2={toX(x2)} y2={toY(z2)} stroke="#dfcba4" strokeWidth="1.2" strokeDasharray="2 5" strokeLinecap="round" opacity=".55" />
              </g>
            );
          })}

          {/* House roofs orient toward the same lanes as the constructed village. */}
          {CORE_HOME_CENTRES.map(([x, z], i) => (
            <g key={`core-home-${i}`} transform={`translate(${toX(x)} ${toY(z)}) rotate(${i % 2 ? 4 : -4})`}>
              <rect x="-7" y="-5" width="14" height="10" rx="1" fill="#8b684d" stroke="#4e4033" strokeWidth="1.2" />
              <path d="M-7 -1 0 -6 7 -1" fill="none" stroke="#d1b48a" strokeWidth="1.3" />
            </g>
          ))}
          {OUTER_HOMES.map(([x, z, yaw], i) => (
            <g key={`outer-home-${i}`} transform={`translate(${toX(x)} ${toY(z)}) rotate(${-yaw * 180 / Math.PI})`}>
              <rect x="-5.2" y="-3.8" width="10.4" height="7.6" rx=".8" fill="#96795a" stroke="#564735" strokeWidth="1" />
              <path d="M-5.2 -0.4 0 -4.3 5.2 -0.4" fill="none" stroke="#d1b48a" strokeWidth="1" />
            </g>
          ))}

          <MapLabel x={toX(-50)} y={toY(-56)}>KARAÇAM ORMANI</MapLabel>
          <MapLabel x={toX(62)} y={toY(18)}>DOĞU SIRTI</MapLabel>
          <MapLabel x={toX(-38)} y={toY(-45)}>MEZARLIK TEPESİ</MapLabel>

          {/* Landmarks are numbered like the location records in the title screen archive. */}
          {LANDMARKS.map((landmark, i) => {
            const seen = discoveredDistricts.includes(landmark.id);
            const x = toX(landmark.x);
            const y = toY(landmark.z);
            const code = String(i + 1).padStart(2, '0');
            return (
              <g key={landmark.id} aria-label={`${landmark.name}${seen ? ', keşfedildi' : ''}`}>
                <circle cx={x} cy={y} r="11" fill={seen ? '#4b5945' : '#6e5841'} stroke="#282219" strokeWidth="1.7" />
                <circle cx={x} cy={y} r="8.2" fill="none" stroke="#d7c69f" strokeWidth=".8" />
                <text x={x} y={y + 3.2} textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="9" fontWeight="700" fill="#f0e3c6">{code}</text>
              </g>
            );
          })}

          <g transform={`translate(${toX(MUHTAR.x)} ${toY(MUHTAR.z)})`} aria-label="Muhtarlık">
            <rect x="-6" y="-6" width="12" height="12" fill="#a34235" stroke="#38291f" strokeWidth="1.5" />
            <path d="M-4 0h8M0 -4v8" stroke="#f0dfbd" strokeWidth="1" />
            <MapLabel x={10} y={-8} anchor="start">MUHTARLIK</MapLabel>
          </g>

          {showEscape && (
            <g transform={`translate(${toX(ESCAPE_POINT.x)} ${toY(ESCAPE_POINT.z)})`} aria-label="Kaçış noktası">
              <circle r="12" fill="#9e382c" fillOpacity=".18" stroke="#9e382c" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M0 -6 5 5 0 2 -5 5Z" fill="#9e382c" stroke="#f1e3c9" strokeWidth="1" />
              <MapLabel x={0} y={-16}>PERON · ÇIKIŞ</MapLabel>
            </g>
          )}

          <g transform={`translate(${toX(playerMapPos.x)} ${toY(playerMapPos.z)})`} aria-label="Bulunduğunuz yer">
            <circle r="11" fill="#9e382c" fillOpacity=".16" />
            <path d="M0 -9 6 6 0 3 -6 6Z" transform={`rotate(${-playerMapPos.yaw * 180 / Math.PI})`} fill="#a4362b" stroke="#f7ebd2" strokeWidth="1.8" />
          </g>
        </g>

        {/* North arrow and coordinate marginalia echo the archival field sheet. */}
        <g transform="translate(39 43)">
          <text x="0" y="-9" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="9" fontWeight="700" fill="#342b20">K</text>
          <path d="M0 -4 5 9 0 6 -5 9Z" fill="#a33e32" stroke="#342b20" strokeWidth=".8" />
        </g>
        <g transform={`translate(${VIEW.width - 94} ${VIEW.height - 36})`}>
          <path d={`M0 0h${20 * SCALE_X}M0 -3v6M${20 * SCALE_X} -3v6`} stroke="#42382a" strokeWidth="1.4" />
          <text x={10 * SCALE_X} y="-6" textAnchor="middle" fontFamily="var(--mono), monospace" fontSize="8" fill="#42382a">20 m</text>
        </g>
      </svg>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#77664d]/50 px-2 pt-2 font-mono text-[9px] uppercase tracking-[.08em] text-[#514634]">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 bg-[#a78d68] ring-1 ring-[#594a39]" />Yol</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 bg-[#819a91]" />Dere</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[#282219] bg-[#6e5841]" />Bölge</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-[#9e382c]" />Siz</span>
      </div>
    </figure>
  );
}
