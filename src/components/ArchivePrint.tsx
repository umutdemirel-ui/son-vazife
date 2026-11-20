import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ARCHIVE, serial } from '../archive';

function Postmark() {
  return (
    <svg
      className="postmark"
      viewBox="0 0 70 70"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="35" cy="35" r="32" strokeWidth="1.6" strokeDasharray="137 1 48 2 5 1" />
      <circle cx="35" cy="35" r="28.8" strokeWidth=".75" />
      <path id="seal-arc" d="M 12,38 A 23,23 0 1,1 58,38" stroke="none" />
      <text
        fill="currentColor"
        stroke="none"
        fontFamily="'Barlow Condensed',sans-serif"
        fontSize="8.1"
        letterSpacing="1.15"
      >
        <textPath href="#seal-arc" startOffset="50%" textAnchor="middle">
          KUZDAĞ ARŞİVİ
        </textPath>
      </text>
      <path d="m18 41 12-15 7 8 4-6 11 13Zm8-10 4 2 3-3m-12 14h28" strokeWidth="1.3" />
      <text
        x="35"
        y="54"
        fill="currentColor"
        stroke="none"
        textAnchor="middle"
        fontSize="7.4"
        letterSpacing="1.5"
      >
        1993
      </text>
    </svg>
  );
}

export function ArchivePrint({
  index,
  change,
  onInspect,
}: {
  index: number;
  change: (by: number) => void;
  onInspect: () => void;
}) {
  const entry = ARCHIVE[index];
  return (
    <aside className="archive-feature" aria-label="Köy arşivinden fotoğraflar">
      <div className="photo-stack">
        <button
          type="button"
          className="archive-print"
          onClick={onInspect}
          aria-label={`${entry.title} arşiv kaydını incele`}
        >
          <span className="masking-tape" aria-hidden="true" />
          <span className="print-meta">
            <b>SAHA FOTOĞRAFI</b>
            <span>NO. {serial(index + 1, 3)}</span>
          </span>
          <span className="print-image">
            <img src={entry.image} alt={entry.alt} />
            <span className="inspect-hint">
              <ArrowUpRight size={15} />
            </span>
          </span>
          <span className="print-caption" aria-live="polite">
            <strong>{entry.title}</strong>
            <small>{entry.caption}</small>
          </span>
          <Postmark />
        </button>
      </div>
      <div className="print-pager">
        <span className="pager-label">ARŞİVDEN</span>
        <span className="print-count">
          <b>{serial(index + 1)}</b>
          <i>/</i>
          {serial(ARCHIVE.length)}
        </span>
        <div className="pager-arrows">
          <button type="button" aria-label="Önceki fotoğraf" onClick={() => change(-1)}>
            <ArrowLeft size={16} />
          </button>
          <button type="button" aria-label="Sonraki fotoğraf" onClick={() => change(1)}>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
