import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, FilePenLine, Phone, PhoneOff } from 'lucide-react';
import type { WatchStep } from '../game/firstWatch';

const REGISTER = [
  { no: '036', name: 'Arif Çetin', house: 'Hane 12', date: '11.02.1972' },
  { no: '041', name: 'Hacı Arif Efendi', house: 'Hane 06', date: '16.11.1973' },
  { no: '048', name: 'Hasan Efendi', house: 'Hane 06', date: '22.09.1978' },
];
const TIME: Record<WatchStep, string> = {
  arrival: '16.40',
  ledger: '18.12',
  telephone: '19.06',
  answered: '19.07',
  waited: '19.09',
};

export function FirstWatch({
  step,
  onStep,
  onExit,
  onEnterVillage,
}: {
  step: WatchStep;
  onStep: (step: WatchStep) => void;
  onExit: () => void;
  onEnterVillage: (filed: boolean) => void;
}) {
  const [row, setRow] = useState<string>('');
  const [error, setError] = useState(false);
  const filed = step !== 'arrival' && step !== 'ledger';
  const ending = step === 'answered' || step === 'waited';
  return (
    <main className={`watch-scene watch-${step}`}>
      <div className="watch-toolbar">
        <button className="text-action" onClick={onExit}>
          <ArrowLeft size={15} />
          Ana menü
        </button>
        <span>
          16 KASIM 1993 <i>/</i> {TIME[step]}
        </span>
      </div>
      <div className="watch-layout">
        <section className="watch-copy" key={step} aria-live="polite">
          <p className="kicker">
            <i />
            {ending ? 'İLK NÖBET / KAYIT ALINDI' : 'ÖNSÖZ / İLK NÖBET'}
          </p>
          <h1>
            {step === 'arrival'
              ? 'Gasilhanenin anahtarı'
              : step === 'ledger'
                ? 'Aynı isim, iki tarih.'
                : step === 'telephone'
                  ? 'Hat düşüyor.'
                  : step === 'answered'
                    ? 'Hattın öteki ucu'
                    : 'Cevapsız çağrı'}
          </h1>
          {step === 'arrival' && (
            <>
              <p>
                Şehirden getirdiğin valizi kapıya bıraktın. Anahtar kilitte döndü; senden önceki
                gassalın önlüğü hâlâ askıda.
              </p>
              <p>
                Masada bugüne ait bir teslim fişi var. Getirenin adı boş. İlk işin, cenazeyi köy
                defterine kaydetmek.
              </p>
            </>
          )}
          {step === 'ledger' && (
            <>
              <p>
                Fişin kenarına kurşun kalemle bir hane numarası yazılmış. Aynı kişiyi eski defterde
                bul ve iki kaydı birbirine iliştir.
              </p>
              <div className="watch-slip">
                <small>BUGÜNKÜ TESLİM FİŞİ · 071</small>
                <b>Hacı Arif Efendi</b>
                <span>Hane 06 &nbsp; / &nbsp; 16.11.1993</span>
              </div>
            </>
          )}
          {step === 'telephone' && (
            <>
              <p>
                Yirmi yıl önce aynı ad, aynı hane. Yeni satırın mürekkebi kurumadan ampul sönüyor.
                Kapının ötesindeki evlerden yalnızca birinin penceresi aydınlık.
              </p>
              <p className="watch-quote">Masadaki telefon çalıyor.</p>
            </>
          )}
          {step === 'answered' && (
            <>
              <p>
                Ahizeyi kulağına götürünce kendi kaleminin kâğıda sürtünüşünü duyuyorsun. Sonra
                yaşlı bir ses:
              </p>
              <p className="watch-quote">“Getireni yazma. Geçen sefer de yazmadın.”</p>
              <p>Hat kesildi. Meydandaki bekçi iki kaydın neden aynı olduğunu biliyor olabilir.</p>
            </>
          )}
          {step === 'waited' && (
            <>
              <p>
                Elini ahizeye sürmedin. Dördüncü çalışta ses kesildi. Karşıdaki evin ışığı da tam o
                sırada söndü.
              </p>
              <p className="watch-quote">Fişin arkasında bir not var: “Bekçiye sor.”</p>
              <p>Defterin arasına fişi koydun. Meydana giden yol henüz tümüyle kararmadı.</p>
            </>
          )}
          <div className="watch-actions">
            {step === 'arrival' && (
              <button className="menu-button primary" onClick={() => onStep('ledger')}>
                <BookOpen size={17} />
                Defteri aç
                <ArrowRight size={15} />
              </button>
            )}
            {step === 'telephone' && (
              <>
                <button className="menu-button primary" onClick={() => onStep('answered')}>
                  <Phone size={16} />
                  Ahizeyi kaldır
                </button>
                <button className="menu-button secondary" onClick={() => onStep('waited')}>
                  <PhoneOff size={16} />
                  Bekle
                </button>
              </>
            )}
            {ending && (
              <button className="menu-button primary" onClick={() => onEnterVillage(true)}>
                Meydana çık
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
        {step === 'ledger' ? (
          <form
            className="ledger-page"
            onSubmit={(e) => {
              e.preventDefault();
              if (row !== '041') {
                setError(true);
                return;
              }
              onStep('telephone');
            }}
          >
            <div className="document-id">
              KUZDAĞ MUHTARLIĞI <span>DL / 02</span>
            </div>
            <h2>Cenaze defteri</h2>
            <p className="ledger-instruction">Bugünkü fişle eşleşen satırı seç.</p>
            <fieldset>
              <legend className="sr-only">Eski cenaze kayıtları</legend>
              {REGISTER.map((r) => (
                <label className={`ledger-row ${row === r.no ? 'selected' : ''}`} key={r.no}>
                  <input
                    type="radio"
                    name="record"
                    value={r.no}
                    checked={row === r.no}
                    onChange={() => {
                      setRow(r.no);
                      setError(false);
                    }}
                  />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.house} · {r.date}
                    </small>
                  </span>
                  <em>#{r.no}</em>
                </label>
              ))}
            </fieldset>
            {error && (
              <p role="alert" className="ledger-error">
                Fişle uyuşmuyor. Hem isim hem hane aynı olmalı.
              </p>
            )}
            <button className="ledger-submit" disabled={!row} type="submit">
              <FilePenLine size={16} />
              Kaydı iliştir
            </button>
          </form>
        ) : step === 'arrival' ? (
          <aside className="arrival-receipt">
            <div className="document-id">
              KUZDAĞ GASİLHANESİ <span>N° 071</span>
            </div>
            <h2>Cenaze teslim fişi</h2>
            <dl>
              <div>
                <dt>Adı</dt>
                <dd>Hacı Arif Efendi</dd>
              </div>
              <div>
                <dt>Hane</dt>
                <dd>06</dd>
              </div>
              <div>
                <dt>Tarih</dt>
                <dd>16 Kasım 1993</dd>
              </div>
              <div>
                <dt>Teslim eden</dt>
                <dd>—</dd>
              </div>
            </dl>
            <p>“Gece gelenlerle ilgili soru sorma.”</p>
          </aside>
        ) : null}
      </div>
      <div className="watch-bottom">
        <span>
          {filed ? <Check size={14} /> : <span className="rec-dot" />}{' '}
          {filed ? '071 / DEFTERE İŞLENDİ' : 'KUZDAĞ / BİRİNCİ GÜN'}
        </span>
        {!ending && (
          <button className="text-action" onClick={() => onEnterVillage(filed)}>
            Önsözü geç
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </main>
  );
}
