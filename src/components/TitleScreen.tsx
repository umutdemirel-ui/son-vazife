import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CloudFog,
  Crosshair,
  Focus,
  Headphones,
  MapPin,
  Maximize,
  Minimize,
  Mountain,
  Play,
  RotateCcw,
  UserRound,
  VolumeX,
} from 'lucide-react';
import { ARCHIVE } from '../archive';
import { HorrorAudioEngine } from '../game/audio';
import { readWatch, storeWatch, type VillageLaunch, type WatchStep } from '../game/firstWatch';
import { readControls, readMuted, storeControls, storeMuted } from '../game/preferences';
import { getAutoSaveSummary } from '../game/saveSystem';
import type { ControlSettings } from '../game/types';
import { ArchivePrint } from './ArchivePrint';
import { FirstWatch } from './FirstWatch';
import { ArchivePanel, ControlsPanel, RestartPanel, SettingsPanel } from './MenuPanels';

type Panel = 'archive' | 'controls' | 'settings' | 'restart' | null;

export function TitleScreen({ onLaunch }: { onLaunch: (session: VillageLaunch) => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [photo, setPhoto] = useState(0);
  const [inWatch, setInWatch] = useState(false);
  const [watch, setWatch] = useState(readWatch);
  const [save] = useState(getAutoSaveSummary);
  const [controls, setControls] = useState(readControls);
  const [muted, setMuted] = useState(readMuted);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [notice, setNotice] = useState('');
  const audio = useRef<HorrorAudioEngine | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hasSave = Boolean(watch || save);

  // Audio starts only after a real user gesture, and never competes with the 3D scene.
  function wakeAudio() {
    if (!audio.current) audio.current = new HorrorAudioEngine();
    audio.current.setMuted(muted || document.hidden);
    audio.current.init();
  }
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    const sync = () => audio.current?.setMuted(muted || document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [muted]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    shellRef.current?.scrollTo({ top: 0 });
  }, [inWatch]);

  function toggleMute() {
    const next = !muted;
    audio.current?.setMuted(next);
    setMuted(next);
    storeMuted(next);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice('Tarayıcın bu görünümde tam ekrana izin vermiyor.');
    }
  }
  function update(patch: Partial<ControlSettings>) {
    const next = { ...controls, ...patch };
    setControls(next);
    storeControls(next);
  }
  function openPanel(next: Panel) {
    audio.current?.playPaperFlip();
    setPanel(next);
  }
  function photoBy(by: number) {
    audio.current?.playPaperFlip();
    setPhoto((i) => (i + by + ARCHIVE.length) % ARCHIVE.length);
  }
  function nextStep(step: WatchStep) {
    setWatch(step);
    storeWatch(step);
    if (step === 'telephone') audio.current?.playTelephone();
    else if (step === 'ledger' || step === 'arrival') audio.current?.playPaperFlip();
    shellRef.current?.scrollTo({ top: 0 });
  }
  function newGame() {
    setPanel(null);
    nextStep('arrival');
    setInWatch(true);
  }
  function play() {
    if (watch) {
      setInWatch(true);
      if (watch === 'telephone') audio.current?.playTelephone();
    } else if (save) onLaunch({ resume: true, registryFiled: false });
    else newGame();
  }

  // Enter/Space on the scene starts (or resumes); on a focused control the
  // browser retains its normal activation. A dialog must never start the game.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || panel) return;
      if (e.code === 'KeyM') {
        wakeAudio();
        toggleMute();
        return;
      }
      if (e.key === 'Escape' && inWatch) {
        setInWatch(false);
        return;
      }
      if (
        inWatch ||
        (e.target instanceof HTMLElement &&
          e.target.closest('button, input, select, textarea, a, [contenteditable="true"]'))
      )
        return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        wakeAudio();
        play();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <div
      className="sv-shell"
      ref={shellRef}
      onPointerDownCapture={wakeAudio}
      onKeyDownCapture={wakeAudio}
    >
      <header className="menu-header">
        <button
          className="brand"
          aria-label="Kuzdağ Arşivi · Ana menü"
          onClick={() => {
            setPanel(null);
            setInWatch(false);
          }}
        >
          <img width="36" height="41" src="/mark.svg" alt="" />
          <span>
            <b>KUZDAĞ</b>
            <small>KÖY ARŞİVİ</small>
          </span>
        </button>
        <nav aria-label="Oyun menüsü" className="main-nav">
          <button
            className={!panel && !inWatch ? 'active' : ''}
            aria-current={!panel && !inWatch ? 'page' : undefined}
            onClick={() => {
              setInWatch(false);
              setPanel(null);
            }}
          >
            Ana menü
          </button>
          <button
            className={panel === 'archive' ? 'active' : ''}
            onClick={() => openPanel('archive')}
          >
            Köy arşivi
          </button>
          <button
            className={panel === 'settings' ? 'active' : ''}
            onClick={() => openPanel('settings')}
          >
            Ayarlar
          </button>
        </nav>
        <div className="header-tools">
          <button
            className="sound-button"
            aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
            aria-pressed={!muted}
            onClick={toggleMute}
          >
            {muted ? (
              <VolumeX size={17} />
            ) : (
              <span className="equalizer" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
            <span>{muted ? 'Ses kapalı' : 'Ses açık'}</span>
          </button>
          <span className="tool-divider" />
          <button
            className="fullscreen-button"
            onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
            title={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
          >
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>
      {inWatch && watch ? (
        <FirstWatch
          step={watch}
          onStep={nextStep}
          onExit={() => setInWatch(false)}
          onEnterVillage={(registryFiled) => onLaunch({ resume: false, registryFiled })}
        />
      ) : (
        <main className="title-stage">
          <div className="stage-art" aria-hidden="true" />
          <div className="stage-shade" aria-hidden="true" />
          <div className="hero-grid">
            <section className="hero-copy" aria-labelledby="game-title">
              <p className="kicker hero-kicker">
                <i />
                ANADOLU PSİKOLOJİK KORKU
              </p>
              <h1 id="game-title" className="game-title" aria-label="Son Vazife">
                <span className="title-son">SON</span> <span className="title-vazife">VAZİFE</span>
              </h1>
              <div className="genre-row">
                <span>
                  <Focus size={15} />
                  Birinci şahıs
                </span>
                <i />
                <span>
                  <UserRound size={14} />
                  Tek oyunculu
                </span>
              </div>
              <p className="story-intro">
                Issız bir Anadolu köyünün yeni gassalısın. Burada ölüler deftere yazılır, ama bazı
                isimler hiç silinmez.
              </p>
              <div className="hero-actions">
                <button className="menu-button primary" onClick={play}>
                  <Play size={15} fill="currentColor" strokeWidth={1} />
                  {hasSave ? 'Devam et' : 'Oyuna başla'}
                  <ArrowRight size={16} className="cta-arrow" />
                </button>
                <button className="menu-button secondary" onClick={() => openPanel('controls')}>
                  <BookOpen size={17} />
                  Nasıl oynanır?
                </button>
              </div>
              {hasSave && (
                <div className="resume-meta">
                  <span>
                    {watch ? 'ÖNSÖZ · İLK NÖBET' : `BÖLÜM ${save!.act} · ${save!.savedAt}`}
                  </span>
                  <button onClick={() => openPanel('restart')}>
                    <RotateCcw size={12} />
                    Yeni oyun
                  </button>
                </div>
              )}
            </section>
            <ArchivePrint index={photo} change={photoBy} onInspect={() => openPanel('archive')} />
          </div>
          <div className="scene-id" aria-hidden="true">
            <span />
            <Crosshair size={12} />
            MEKÂN 01 <i>/</i> GASİLHANE
          </div>
        </main>
      )}
      <footer className="field-footer">
        <dl className="field-readings">
          <div>
            <MapPin />
            <dt>Konum</dt>
            <dd>Kuzdağ Köyü, Anadolu</dd>
          </div>
          <div>
            <Mountain />
            <dt>Rakım</dt>
            <dd>1.480 m</dd>
          </div>
          <div>
            <CloudFog />
            <dt>Hava durumu</dt>
            <dd>Sisli, 6°C</dd>
          </div>
        </dl>
        <div className="headphone-note">
          <Headphones size={20} />
          <span>Kulaklıkla oynamanız önerilir.</span>
        </div>
      </footer>
      {notice && (
        <p role="status" className="menu-toast">
          {notice}
        </p>
      )}
      {panel === 'archive' && (
        <ArchivePanel
          index={photo}
          onSelect={(i) => {
            audio.current?.playPaperFlip();
            setPhoto(i);
          }}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'settings' && (
        <SettingsPanel
          controls={controls}
          update={update}
          muted={muted}
          toggleMute={toggleMute}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'controls' && <ControlsPanel onClose={() => setPanel(null)} />}
      {panel === 'restart' && <RestartPanel onClose={() => setPanel(null)} onStart={newGame} />}
    </div>
  );
}
