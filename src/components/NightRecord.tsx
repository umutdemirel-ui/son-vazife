import { useState } from 'react';
import { Bell, BookMarked, Cable, Check, CircleDot, Phone, RotateCcw, Ticket } from 'lucide-react';
import { NIGHT_ORDER, PAGES, type NightId } from '../game/nightWatch';
import { MenuDialog } from './MenuDialog';

export function NightRecord({
  id,
  filed,
  onClose,
  onFile,
  onKey,
}: {
  id: NightId;
  filed: boolean;
  onClose: () => void;
  onFile: (v: number[]) => boolean;
  onKey: (v: number) => void;
}) {
  const page = PAGES[id],
    seq = page.kind === 'sequence',
    size = page.answer?.length ?? 1;
  const [input, setInput] = useState<number[]>([]),
    [error, setError] = useState(false);
  const Icon =
    id === 'night_bell'
      ? Bell
      : id === 'night_call'
        ? Phone
        : id === 'night_line' || id === 'night_relay'
          ? Cable
          : page.act === 7
            ? Ticket
            : BookMarked;
  const pick = (i: number) => {
    if (seq && input.length >= size) return;
    onKey(i);
    setError(false);
    setInput(seq ? [...input, i] : [i]);
  };
  const ready = page.kind === 'report' || input.length === size;
  return (
    <MenuDialog title={page.title} kicker={`GECE NÖBETİ / ${page.place}`} onClose={onClose} wide>
      <div className="night-record">
        <article className="night-leaf">
          <div className="night-running">
            <span>KUZDAĞ · SAHA DEFTERİ</span>
            <span>{page.folio}</span>
          </div>
          <Icon size={30} strokeWidth={1.2} aria-hidden="true" />
          <h3>{page.place}</h3>
          <p>{page.text}</p>
          <footer>
            16 KASIM 1993 <span>GECE VARDİYASI</span>
          </footer>
        </article>
        <section className="night-console" aria-label="Kayıt işlemi">
          <p className="panel-index">
            NÖBET KAYDI · {String(NIGHT_ORDER.indexOf(id) + 1).padStart(2, '0')} / {NIGHT_ORDER.length}
          </p>
          {filed ? (
            <>
              <h3>
                <Check size={17} /> Deftere işlendi
              </h3>
              <p>{page.entry}</p>
              <button className="menu-button" onClick={onClose}>
                Kaydı kapat
              </button>
            </>
          ) : (
            <>
              <h3>
                {seq
                  ? 'İşareti kur'
                  : page.kind === 'decision'
                    ? 'Hattın diğer ucu'
                    : page.kind === 'select'
                      ? 'Kaydı doğrula'
                      : 'Nöbet notu'}
              </h3>
              {page.kind === 'report' && (
                <p>
                  Bu kaydı defterine geçir. Bulduğun notu ve sıradaki adresi defterden yeniden
                  okuyabilirsin.
                </p>
              )}
              {seq && (
                <>
                  <p>
                    {id === 'night_line'
                      ? 'Abone yuvalarına sırayla bas.'
                      : 'Çanı üç kez, doğru uzunluklarda çal.'}
                  </p>
                  <div className="night-slots" aria-live="polite" aria-label="Kurulan sıra">
                    {Array.from({ length: size }, (_, i) => (
                      <span key={i} className={input[i] === undefined ? '' : 'filled'}>
                        {input[i] === undefined ? '·' : page.choices![input[i]]}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {page.choices && (
                <div className={`night-choices ${seq ? 'sequence' : ''}`}>
                  {page.choices.map((v, i) => (
                    <button
                      key={v}
                      type="button"
                      disabled={seq && input.length >= size}
                      aria-pressed={seq ? undefined : input[0] === i}
                      onClick={() => pick(i)}
                    >
                      {seq ? (
                        <CircleDot size={14} />
                      ) : (
                        <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                      )}
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {seq && (
                <button
                  className="text-action"
                  disabled={!input.length}
                  onClick={() => {
                    setInput([]);
                    setError(false);
                  }}
                >
                  <RotateCcw size={13} /> Sırayı temizle
                </button>
              )}
              {error && (
                <p role="alert" className="night-error">
                  {page.hint ?? 'Kayıt uyuşmadı. İşareti yeniden dene.'}
                </p>
              )}
              <button
                className="menu-button primary"
                disabled={!ready}
                onClick={() => {
                  if (!onFile(input)) {
                    setError(true);
                    if (seq) setInput([]);
                  }
                }}
              >
                {page.action}
              </button>
            </>
          )}
        </section>
      </div>
    </MenuDialog>
  );
}
