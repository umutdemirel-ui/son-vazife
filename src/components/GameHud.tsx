import React, { useEffect, useRef, useState } from 'react';
import {
  Backpack,
  BookOpen,
  Check,
  Flame,
  Pause,
  Play,
  SlidersHorizontal,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ControlSettings, GameHudState } from '../game/types';
import { MenuDialog } from './MenuDialog';
import { SettingsPanel } from './MenuPanels';

interface GameHudProps {
  hud: GameHudState;
  onToggleNotebook: () => void;
  onToggleCandle: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onUpdateControls: (patch: Partial<ControlSettings>) => void;
  onInteract: () => void;
  onToggleCrouch: () => void;
  onSetVirtualMove: (x: number, y: number) => void;
  onVirtualLook: (dx: number, dy: number) => void;
  onSetSprint: (active: boolean) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  onToggleNotebook,
  onToggleCandle,
  onToggleMute,
  onPause,
  onResume,
  onRestart,
  onReturnTitle,
  onUpdateControls,
  onInteract,
  onToggleCrouch,
  onSetVirtualMove,
  onVirtualLook,
  onSetSprint,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [pausePage, setPausePage] = useState<'menu' | 'settings' | 'restart'>('menu');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [padOffset, setPadOffset] = useState({ x: 0, y: 0 });
  const padOriginRef = useRef<{ x: number; y: number } | null>(null);
  const lookTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches;
      setIsTouchDevice(
        Boolean(coarse || ('ontouchstart' in window && navigator.maxTouchPoints > 0)),
      );
    }
  }, []);

  useEffect(() => {
    if (hud.screen === 'playing') setPausePage('menu');
  }, [hud.screen]);

  const overlayActive =
    hud.isNotebookOpen ||
    Boolean(hud.registryCaseId || hud.nightPage) ||
    Boolean(hud.activeDialogue) ||
    Boolean(hud.activeAutopsyCaseId);

  const handlePadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    padOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updatePadFromPoint(touch.clientX, touch.clientY);
  };

  const handlePadTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch || !padOriginRef.current) return;
    updatePadFromPoint(touch.clientX, touch.clientY);
  };

  const handlePadTouchEnd = () => {
    padOriginRef.current = null;
    setPadOffset({ x: 0, y: 0 });
    onSetVirtualMove(0, 0);
  };

  const updatePadFromPoint = (clientX: number, clientY: number) => {
    if (!padOriginRef.current) return;
    const maxR = 38;
    const dx = clientX - padOriginRef.current.x;
    const dy = clientY - padOriginRef.current.y;
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, maxR);
    const nx = (dx / dist) * (clamped / maxR);
    const ny = (dy / dist) * (clamped / maxR);
    setPadOffset({ x: nx * maxR, y: ny * maxR });
    onSetVirtualMove(nx, -ny);
  };

  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    lookTouchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!lookTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchRef.current.id) {
        const dx = t.clientX - lookTouchRef.current.x;
        const dy = t.clientY - lookTouchRef.current.y;
        lookTouchRef.current.x = t.clientX;
        lookTouchRef.current.y = t.clientY;
        onVirtualLook(dx, dy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!lookTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchRef.current.id) {
        lookTouchRef.current = null;
        break;
      }
    }
  };

  const completedAutopsies = Object.values(hud.autopsyCases).filter((c) => c.completed).length;

  return (
    <>
      {/* Subtle Danger Vignette when Kara Basma or Sis Gözcüsü is close */}
      {hud.screen === 'playing' && hud.dangerProximity > 0.15 && (
        <div
          className="fixed inset-0 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: Math.min(0.85, hud.dangerProximity * 0.9),
            background: 'radial-gradient(circle at center, transparent 42%, rgba(8, 5, 6, 0.92) 100%)',
          }}
        />
      )}

      {/* Touch Look Area */}
      {hud.screen === 'playing' && !overlayActive && isTouchDevice && (
        <div
          className="fixed top-0 right-0 bottom-24 left-1/2 z-10 touch-none"
          onTouchStart={handleLookTouchStart}
          onTouchMove={handleLookTouchMove}
          onTouchEnd={handleLookTouchEnd}
          onTouchCancel={handleLookTouchEnd}
        />
      )}

      {/* Low-Occlusion HUD Perimeter Overlay */}
      {hud.screen === 'playing' && !hud.activeAutopsyCaseId && !hud.registryCaseId && !hud.nightPage && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5">
          <div className="village-hud-top">
            <section className="village-objective">
              <p className="kicker">
                <i />
                {hud.actTitle}
              </p>
              <h2>{hud.locationName}</h2>
              <p>Gün {hud.survivalDay} · Dayanıklılık {Math.max(0, 3 - hud.survivalHits)}/3</p>
              <p>{hud.objectiveText}</p>
              {(hud.stamina < 98 || hud.isCrouching || hud.isHiding || hud.isZooming) && (
                <div className="village-state">
                  {hud.stamina < 98 && <span>Nefes · %{hud.stamina}</span>}
                  {hud.isHiding ? <span>Saklanıyorsun</span> : hud.isCrouching && <span>Eğildin</span>}
                  {hud.isZooming && <span>Odaklandın</span>}
                </div>
              )}
            </section>
            <div className="village-actions">
              <button
                aria-label="Ayarlar"
                title="Ayarlar"
                onClick={() => {
                  setPausePage('settings');
                  onPause();
                }}
              >
                <SlidersHorizontal size={17} />
              </button>
              <button
                aria-label="Duraklat"
                title="Duraklat [Esc]"
                onClick={() => {
                  setPausePage('menu');
                  onPause();
                }}
              >
                <Pause size={17} />
              </button>
              {hud.vigilActive && !hud.isIndoors && (
                <span className="vigil-readout">Sabır mumu · {hud.vigilTimer} sn</span>
              )}
              {hud.saveNoticeText && (
                <span className="saved-readout">
                  <Check size={12} /> Kaydedildi
                </span>
              )}
            </div>
          </div>

          {!overlayActive && (
            <div className="village-aim">
              <i aria-hidden="true" className={hud.interactPrompt ? 'can-interact' : ''} />
              <div>
                {hud.interactPrompt ? (
                  <p className="interact-label">{hud.interactPrompt}</p>
                ) : (
                  !hud.isPointerLocked && !isTouchDevice && <p>Bakış için tıkla veya sürükle</p>
                )}
              </div>
            </div>
          )}

          {/* Touch Controls Overlay */}
          {!overlayActive && isTouchDevice && (
            <div className="fixed inset-x-5 bottom-24 flex items-end justify-between pointer-events-none">
              <div
                className="pointer-events-auto relative w-28 h-28 rounded-full border border-[#574d3d] bg-[#0d0f14]/75 flex items-center justify-center touch-none"
                onTouchStart={handlePadTouchStart}
                onTouchMove={handlePadTouchMove}
                onTouchEnd={handlePadTouchEnd}
                onTouchCancel={handlePadTouchEnd}
              >
                <div
                  className="w-11 h-11 rounded-full border border-[#c79e59] bg-[#2a2318]/90"
                  style={{ transform: `translate(${padOffset.x}px, ${padOffset.y}px)` }}
                />
              </div>

              <div className="pointer-events-auto flex flex-col items-end gap-2">
                {hud.interactPrompt && (
                  <button
                    type="button"
                    onClick={onInteract}
                    className="px-4 py-2.5 bg-[#9e7a43] text-[#0c0c0e] font-semibold text-xs uppercase tracking-wider"
                  >
                    Etkileşim
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onTouchStart={() => onSetSprint(true)}
                    onTouchEnd={() => onSetSprint(false)}
                    onTouchCancel={() => onSetSprint(false)}
                    className="px-3.5 py-2 border border-[#4a4134] bg-[#0d0f14]/88 text-xs uppercase text-[#dfd6c5]"
                  >
                    Koş
                  </button>
                  <button
                    type="button"
                    onClick={onToggleCrouch}
                    className={`px-3.5 py-2 border text-xs uppercase ${
                      hud.isCrouching
                        ? 'border-[#c79e59] bg-[#362815] text-[#f7e3bd]'
                        : 'border-[#4a4134] bg-[#0d0f14]/88 text-[#dfd6c5]'
                    }`}
                  >
                    Eğil
                  </button>
                </div>
              </div>
            </div>
          )}

          {!overlayActive && (
            <div className="village-bottom">
              {hud.captionText && (
                <p className="village-caption" role="status">
                  {hud.captionText}
                </p>
              )}
              {!dockCollapsed && (
                <div className="bag-content">
                  <span className="panel-index">
                    MALZEMELER / {hud.inventory.filter((i) => i.collected).length}
                  </span>
                  {hud.inventory.some((i) => i.collected) ? (
                    <ul>
                      {hud.inventory
                        .filter((i) => i.collected)
                        .map((i) => (
                          <li key={i.id}>{i.name}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>Çantan boş. İlk malzemeleri cami sundurmasında ve çeşmede bulabilirsin.</p>
                  )}
                </div>
              )}
              <div className="village-dock">
                <button aria-expanded={!dockCollapsed} onClick={() => setDockCollapsed((v) => !v)}>
                  <Backpack size={15} />
                  <span>Çanta</span>
                </button>
                <button onClick={onToggleNotebook}>
                  <BookOpen size={16} />
                  <span>Defter ve harita</span>
                  <kbd>Tab</kbd>
                </button>
                <button aria-pressed={hud.candleLit} onClick={onToggleCandle}>
                  <Flame size={15} />
                  <span>Mum</span>
                  <kbd>F</kbd>
                </button>
                {!isTouchDevice && (
                  <button aria-pressed={hud.isCrouching} onClick={onToggleCrouch}>
                    <UserRound size={15} />
                    <span>Eğil</span>
                    <kbd>C</kbd>
                  </button>
                )}
                <button onClick={onToggleMute} aria-label={hud.isMuted ? 'Sesi aç' : 'Sesi kapat'}>
                  {hud.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {hud.screen === 'paused' &&
        (pausePage === 'settings' ? (
          <SettingsPanel
            key="settings"
            controls={hud.controlSettings}
            update={onUpdateControls}
            muted={hud.isMuted}
            toggleMute={onToggleMute}
            onClose={() => setPausePage('menu')}
          />
        ) : pausePage === 'restart' ? (
          <MenuDialog
            key="restart"
            title="Yeniden başla"
            kicker="KÖY / KAYIT"
            onClose={() => setPausePage('menu')}
          >
            <p className="panel-intro">
              Köydeki ilerlemen sıfırlanacak. Meydandaki ilk göreve dönmek istiyor musun?
            </p>
            <div className="dialog-actions">
              <button className="menu-button secondary" onClick={() => setPausePage('menu')}>
                Vazgeç
              </button>
              <button className="menu-button primary" onClick={onRestart}>
                Yeniden başla
              </button>
            </div>
          </MenuDialog>
        ) : (
          <MenuDialog key="pause" title="Duraklatıldı" kicker={hud.actTitle} onClose={onResume}>
            <p className="panel-intro">{hud.objectiveText}</p>
            <dl className="pause-stats">
              <div>
                <dt>Mühürlü dosya</dt>
                <dd>{completedAutopsies} / 3</dd>
              </div>
              <div>
                <dt>Gerilim</dt>
                <dd>%{hud.dreadLevel}</dd>
              </div>
              <div>
                <dt>İhlal</dt>
                <dd>{hud.violations}</dd>
              </div>
            </dl>
            <div className="pause-main">
              <button className="menu-button primary" onClick={onResume}>
                <Play size={15} />
                Devam et
              </button>
              <button className="menu-button secondary" onClick={() => setPausePage('settings')}>
                <SlidersHorizontal size={15} />
                Ayarlar
              </button>
            </div>
            <div className="dialog-actions">
              <button className="text-action" onClick={() => setPausePage('restart')}>
                Yeniden başla
              </button>
              <button className="text-action" onClick={onReturnTitle}>
                Ana ekran
              </button>
            </div>
          </MenuDialog>
        ))}

      {/* Endings & Game Over Modals */}
      {(hud.screen === 'ending_peace' ||
        hud.screen === 'ending_truth' ||
        hud.screen === 'ending_twist' ||
        hud.screen === 'game_over') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080a]/94 p-6">
          <div className="w-full max-w-lg bg-[#0c0d0f] border border-[#e2d9c8]/20 p-8 md:p-10 text-center">
            <div className="font-mono-tech text-[11px] tracking-[0.26em] uppercase text-[#b8322c] mb-2">
              {hud.screen === 'ending_truth'
                ? 'GERÇEK SON · HAKİKAT VE ŞAFAK'
                : hud.screen === 'ending_peace'
                  ? 'DOĞRU SON · SABAH EZANI'
                  : hud.screen === 'ending_twist'
                    ? 'KARANLIK SON · KİMİN CENAZESİ?'
                    : 'GECEYE YENİLDİN'}
            </div>
            <h2 className="font-display text-4xl font-bold text-white tracking-wide mb-4">
              {hud.screen === 'ending_truth'
                ? 'Adalet ve Son Vazife'
                : hud.screen === 'ending_peace'
                  ? 'Son Vazife Tamamlandı'
                  : hud.screen === 'ending_twist'
                    ? 'Giden Senmişsin'
                    : 'Kara Basma Çöktü'}
            </h2>
            <p className="text-sm leading-relaxed text-[#e2d9c8]/80 mb-6">{hud.endingReason}</p>

            <div className="grid grid-cols-4 gap-3 border-y border-[#e2d9c8]/12 py-4 mb-7 text-xs">
              <div>
                <div className="font-mono-tech text-[10px] text-[#6e6459] uppercase">Kayıt</div>
                <div className="font-display text-2xl font-bold tabular-nums text-[#e2d9c8] mt-0.5">
                  {completedAutopsies}/3
                </div>
              </div>
              <div>
                <div className="font-mono-tech text-[10px] text-[#6e6459] uppercase">İhlaller</div>
                <div className="font-display text-2xl font-bold tabular-nums text-[#e2d9c8] mt-0.5">
                  {hud.violations}
                </div>
              </div>
              <div>
                <div className="font-mono-tech text-[10px] text-[#6e6459] uppercase">Ritüel</div>
                <div className="font-display text-2xl font-bold tabular-nums text-[#e2d9c8] mt-0.5">
                  {hud.ritualProgress}/8
                </div>
              </div>
              <div>
                <div className="font-mono-tech text-[10px] text-[#6e6459] uppercase">Belgeler</div>
                <div className="font-display text-2xl font-bold tabular-nums text-[#e2d9c8] mt-0.5">
                  {hud.clues.filter((c) => c.discovered).length}/{hud.clues.length}
                </div>
              </div>
            </div>

            <div className="font-mono-tech flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onRestart}
                className="px-6 py-3.5 bg-[#8c1d18] hover:bg-[#a6231d] text-white font-medium text-xs tracking-[0.18em] uppercase cursor-pointer"
              >
                TEKRAR OYNA
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="px-6 py-3.5 border border-[#e2d9c8]/25 text-[#e2d9c8] hover:border-[#8c1d18] text-xs tracking-[0.18em] uppercase cursor-pointer"
              >
                ANA EKRAN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
