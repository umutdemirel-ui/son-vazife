import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  Keyboard,
  MousePointer2,
} from 'lucide-react';
import { ARCHIVE, serial } from '../archive';
import {
  DEFAULT_CONTROL_SETTINGS,
  type ControlSettings,
  type GraphicsQualityPreset,
} from '../game/types';
import { MenuDialog } from './MenuDialog';

export function ArchivePanel({
  index,
  onSelect,
  onClose,
}: {
  index: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const entry = ARCHIVE[index];
  return (
    <MenuDialog title="Köy arşivi" kicker="KUZDAĞ / SAHA DOSYASI" onClose={onClose} wide>
      <div className="archive-reader" aria-live="polite">
        <figure>
          <img src={entry.image} alt={entry.alt} />
          <figcaption>
            NEGATİF N° {serial(index + 1, 3)} <span>35 MM</span>
          </figcaption>
        </figure>
        <div className="archive-text">
          <p className="panel-index">
            BELGE {serial(index + 1)} <span>/</span> {entry.category.toLocaleUpperCase('tr')}
          </p>
          <h3>{entry.title}</h3>
          <p>{entry.description}</p>
          <blockquote>“{entry.note}”</blockquote>
          <small>— Arşiv kenar notu</small>
        </div>
      </div>
      <div className="reader-pagination">
        <button
          className="text-action"
          onClick={() => onSelect((index + ARCHIVE.length - 1) % ARCHIVE.length)}
        >
          <ArrowLeft size={15} />
          Önceki
        </button>
        <div className="page-numbers">
          {ARCHIVE.map((entry, i) => (
            <button
              key={entry.title}
              aria-label={entry.title}
              aria-current={i === index ? 'page' : undefined}
              onClick={() => onSelect(i)}
            >
              {serial(i + 1)}
            </button>
          ))}
        </div>
        <button className="text-action" onClick={() => onSelect((index + 1) % ARCHIVE.length)}>
          Sonraki
          <ArrowRight size={15} />
        </button>
      </div>
    </MenuDialog>
  );
}

const KEYS = [
  ['Hareket et', 'W A S D'],
  ['Etrafına bak', 'Fare'],
  ['Etkileşime gir', 'E'],
  ['Odaklan', 'Sağ tık'],
  ['Koş', 'Shift'],
  ['Eğil', 'C'],
  ['Mumu yak / söndür', 'F'],
  ['Defter ve harita', 'Tab'],
  ['Sesi aç / kapat', 'M'],
  ['Duraklat', 'Esc'],
];
export function ControlsPanel({ onClose }: { onClose: () => void }) {
  return (
    <MenuDialog title="Nasıl oynanır?" kicker="OYUNCU REHBERİ / 01" onClose={onClose}>
      <p className="panel-intro">
        İlk nöbetinde teslim fişini eski kayıtlarla karşılaştır. Ardından köyü dolaş, kapıları yokla
        ve tanıkları dinle. Bulduğun belgeler defterinde saklanır.
      </p>
      <h3 className="section-tag">
        <Keyboard size={16} />
        KÖYDEKİ KONTROLLER
      </h3>
      <dl className="keys-grid">
        {KEYS.map(([name, shortcut]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>
              <kbd>{shortcut}</kbd>
            </dd>
          </div>
        ))}
      </dl>
      <p className="panel-tip">
        <MousePointer2 size={17} />
        Bakış kilidi kullanılamıyorsa fareyi basılı tutup sürükle. Dokunmatik ekranda soldan yürü,
        sağdan bak.
      </p>
      <button className="menu-button secondary full-button" onClick={onClose}>
        Anladım
        <Check size={16} />
      </button>
    </MenuDialog>
  );
}

function Switch({ value, onClick, label }: { value: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={`switch ${value ? 'is-on' : ''}`}
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onClick}
    >
      <span />
    </button>
  );
}
const QUALITY: [GraphicsQualityPreset, string][] = [
  ['auto', 'Otomatik'],
  ['low', 'Düşük'],
  ['medium', 'Dengeli'],
  ['high', 'Yüksek'],
];
export function SettingsPanel({
  controls,
  update,
  muted,
  toggleMute,
  onClose,
}: {
  controls: ControlSettings;
  update: (patch: Partial<ControlSettings>) => void;
  muted: boolean;
  toggleMute: () => void;
  onClose: () => void;
}) {
  return (
    <MenuDialog title="Ayarlar" kicker="OYUN / TERCİHLER" onClose={onClose}>
      <div className="setting-row">
        <span>
          <Headphones size={16} />
          Ortam ve oyun sesleri
        </span>
        <Switch label="Ortam ve oyun sesleri" value={!muted} onClick={toggleMute} />
      </div>
      <h3 className="section-tag">GÖRÜNTÜ KALİTESİ</h3>
      <div className="quality-options" role="group" aria-label="Görüntü kalitesi">
        {QUALITY.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={controls.graphicsQuality === key}
            onClick={() => update({ graphicsQuality: key })}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="setting-help">Otomatik mod, köyü keşfederken kaliteyi cihazına göre ayarlar.</p>
      <div className="sensitivity">
        <label htmlFor="look-speed">
          Bakış hassasiyeti{' '}
          <output>{controls.mouseSensitivity.toFixed(1).replace('.', ',')}×</output>
        </label>
        <input
          id="look-speed"
          type="range"
          min="0.4"
          max="2.4"
          step="0.1"
          value={controls.mouseSensitivity}
          onChange={(e) => update({ mouseSensitivity: Number(e.target.value) })}
        />
      </div>
      <div className="setting-row">
        <span>Y eksenini ters çevir</span>
        <Switch
          label="Y eksenini ters çevir"
          value={controls.invertY}
          onClick={() => update({ invertY: !controls.invertY })}
        />
      </div>
      <div className="setting-row">
        <span>Bakışı yumuşat</span>
        <Switch
          label="Bakışı yumuşat"
          value={controls.lookSmoothing}
          onClick={() => update({ lookSmoothing: !controls.lookSmoothing })}
        />
      </div>
      <div className="setting-row">
        <span>Tek basışla eğil</span>
        <Switch
          label="Tek basışla eğil"
          value={controls.crouchToggle}
          onClick={() => update({ crouchToggle: !controls.crouchToggle })}
        />
      </div>
      <div className="dialog-actions">
        <button
          className="text-action"
          onClick={() => {
            update(DEFAULT_CONTROL_SETTINGS);
            if (muted) toggleMute();
          }}
        >
          Varsayılana dön
        </button>
        <button className="menu-button primary" onClick={onClose}>
          <Check size={15} />
          Tamam
        </button>
      </div>
    </MenuDialog>
  );
}

export function RestartPanel({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  return (
    <MenuDialog title="Yeni nöbet" kicker="KAYIT DEFTERİ" onClose={onClose}>
      <p className="panel-intro">
        İlk günden yeniden başlamak istiyor musun? Yeni ilerlemen bu cihazdaki önceki nöbet kaydının
        yerini alacak.
      </p>
      <div className="dialog-actions">
        <button className="menu-button secondary" onClick={onClose}>
          Vazgeç
        </button>
        <button className="menu-button primary" onClick={onStart}>
          <BookOpen size={16} />
          Yeni oyuna başla
        </button>
      </div>
    </MenuDialog>
  );
}
