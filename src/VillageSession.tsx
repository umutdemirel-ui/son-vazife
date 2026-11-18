/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AutopsyWorkbench } from './components/AutopsyWorkbench';
import { DialogueOverlay } from './components/DialogueOverlay';
import { DeliveryRegister } from './components/DeliveryRegister';
import { NightRecord } from './components/NightRecord';
import { GameHud } from './components/GameHud';
import { NotebookModal } from './components/NotebookModal';
import { LoadingVillage } from './components/LoadingVillage';
import { storeWatch, type VillageLaunch } from './game/firstWatch';
import { createInitialAutopsyCases } from './game/autopsy';
import { SonVazifeEngine } from './game/engine';
import {
  AutopsyCameraAngle,
  AutopsyCaseId,
  AutopsyTool,
  AutopsyZoneId,
  ControlSettings,
  DEFAULT_CONTROL_SETTINGS,
  GameHudState,
  GlossaryCategory,
  INITIAL_CLUES,
  INITIAL_GLOSSARY_ENTRIES,
  INITIAL_INVENTORY,
  INITIAL_RULES,
} from './game/types';

const INITIAL_HUD: GameHudState = {
  screen: 'title',
  act: 1,
  actTitle: 'BÖLÜM I · İLK OTOPSİ VE HAZIRLIK',
  objectiveText: '',
  locationName: 'Kuzdağ Köyü',
  currentDistrict: 'square',
  discoveredDistricts: ['square'],
  isIndoors: false,
  candleLit: false,
  candleOil: 100,
  vigilTimer: 180,
  vigilActive: false,
  dreadLevel: 0,
  stamina: 100,
  isCrouching: false,
  isSprinting: false,
  isZooming: false,
  violations: 0,
  trustScore: 50,
  interactPrompt: null,
  captionText: null,
  isNotebookOpen: false,
  isMuted: false,
  isPointerLocked: false,
  isHiding: false,
  dangerProximity: 0,
  windowAnomalyActive: false,
  dirtyBasinReady: false,
  inventory: INITIAL_INVENTORY,
  rules: INITIAL_RULES,
  clues: INITIAL_CLUES,
  ritualProgress: 0,
  endingReason: '',
  controlSettings: DEFAULT_CONTROL_SETTINGS,
  resolvedQualityTier: 'high',
  assetLoadPercent: 0,
  assetsReady: false,
  hasSavedGame: false,
  saveSummary: null,
  saveNoticeText: null,
  activeDialogue: null,
  registryCaseId: null,
  nightPage: null,
  activeAutopsyCaseId: null,
  activeAutopsyTool: 'magnifier',
  activeAutopsyCameraAngle: 'overview',
  cameraFlashAlpha: 0,
  autopsyCases: createInitialAutopsyCases(),
  playerMapPos: { x: 0, z: 23, yaw: 0 },
  glossaryEntries: INITIAL_GLOSSARY_ENTRIES,
  playerGlossaryNotes: [],
};

export default function VillageSession({
  session,
  onExit,
}: {
  session: VillageLaunch;
  onExit: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SonVazifeEngine | null>(null);
  const [hud, setHud] = useState<GameHudState>(INITIAL_HUD);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // Leave one paint for the loading slate before constructing the village.
    const timer = window.setTimeout(() => {
      try {
        const engine = new SonVazifeEngine(mount, setHud);
        engineRef.current = engine;
        if (session.resume) engine.continueSavedGame();
        else engine.startNewGame(session.registryFiled);
        storeWatch(null);
      } catch (error) {
        console.warn('Köy sahnesi başlatılamadı:', error);
        engineRef.current?.dispose();
        engineRef.current = null;
        setFailed(true);
      }
    }, 30);
    return () => {
      window.clearTimeout(timer);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [session]);

  const activeAutopsyCase = hud.activeAutopsyCaseId
    ? hud.autopsyCases[hud.activeAutopsyCaseId]
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07080a]">
      {/* Isolated WebGL Canvas Container — React HUD updates never tear down or re-render Three.js */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {(failed || hud.screen === 'title') && <LoadingVillage failed={failed} onExit={onExit} />}

      <GameHud
        hud={hud}
        onToggleNotebook={() => engineRef.current?.toggleNotebook()}
        onToggleCandle={() => engineRef.current?.toggleCandle()}
        onToggleMute={() => engineRef.current?.toggleMute()}
        onPause={() => engineRef.current?.pauseGame()}
        onResume={() => engineRef.current?.resumeGame()}
        onRestart={() => engineRef.current?.startNewGame()}
        onReturnTitle={() => {
          engineRef.current?.returnToTitle();
          onExit();
        }}
        onUpdateControls={(patch: Partial<ControlSettings>) =>
          engineRef.current?.updateControlSettings(patch)
        }
        onInteract={() => engineRef.current?.triggerInteract()}
        onToggleCrouch={() => engineRef.current?.toggleCrouch()}
        onSetVirtualMove={(x: number, y: number) => engineRef.current?.setVirtualMove(x, y)}
        onVirtualLook={(dx: number, dy: number) => engineRef.current?.addVirtualLook(dx, dy)}
        onSetSprint={(active: boolean) => engineRef.current?.setVirtualSprint(active)}
      />

      {hud.screen === 'playing' && hud.activeDialogue && (
        <DialogueOverlay
          dialogue={hud.activeDialogue}
          onSelectOption={(optionId: string) => engineRef.current?.selectDialogueOption(optionId)}
          onClose={() => engineRef.current?.closeDialogue()}
        />
      )}

      {hud.screen === 'playing' && hud.nightPage && (
        <NightRecord
          key={hud.nightPage}
          id={hud.nightPage}
          filed={hud.clues.some((c) => c.id === hud.nightPage && c.discovered)}
          onClose={() => engineRef.current?.closeNightPage()}
          onFile={(v) => engineRef.current?.fileNightPage(v) ?? false}
          onKey={(v) => engineRef.current?.soundNightKey(v)}
        />
      )}

      {hud.screen === 'playing' && hud.registryCaseId && (
        <DeliveryRegister
          key={hud.registryCaseId}
          entry={hud.autopsyCases[hud.registryCaseId]}
          onSubmit={(answers) => engineRef.current?.fileDelivery(answers) ?? false}
          onInspect={() => engineRef.current?.inspectDelivery()}
          onClose={() => engineRef.current?.closeDeliveryFile()}
        />
      )}

      {hud.screen === 'playing' && activeAutopsyCase && (
        <AutopsyWorkbench
          caseState={activeAutopsyCase}
          activeTool={hud.activeAutopsyTool}
          activeCameraAngle={hud.activeAutopsyCameraAngle}
          cameraFlashAlpha={hud.cameraFlashAlpha}
          captionText={hud.captionText}
          onSelectTool={(tool: AutopsyTool) => engineRef.current?.selectAutopsyTool(tool)}
          onSelectCameraAngle={(angle: AutopsyCameraAngle) =>
            engineRef.current?.selectAutopsyCameraAngle(angle)
          }
          onTagAnomaly={(caseId: AutopsyCaseId, anomalyId: string, tag: string) =>
            engineRef.current?.tagCrimeSceneAnomaly(caseId, anomalyId, tag)
          }
          onLinkAnomaly={(caseId: AutopsyCaseId, anomalyId: string, zoneId: AutopsyZoneId | '') =>
            engineRef.current?.linkCrimeSceneAnomaly(caseId, anomalyId, zoneId)
          }
          onUpdateSelection={(caseId: AutopsyCaseId, cause: string, time: string) =>
            engineRef.current?.updateAutopsySelections(caseId, cause, time)
          }
          onSubmitDiagnosis={(caseId: AutopsyCaseId) =>
            engineRef.current?.submitAutopsyDiagnosis(caseId)
          }
          onExit={() => engineRef.current?.exitAutopsyMode()}
        />
      )}

      {hud.screen === 'playing' && hud.isNotebookOpen && (
        <NotebookModal
          rules={hud.rules}
          clues={hud.clues}
          inventory={hud.inventory}
          autopsyCases={hud.autopsyCases}
          discoveredDistricts={hud.discoveredDistricts}
          playerMapPos={hud.playerMapPos}
          glossaryEntries={hud.glossaryEntries}
          playerGlossaryNotes={hud.playerGlossaryNotes}
          onAddGlossaryNote={(title: string, category: GlossaryCategory, body: string) =>
            engineRef.current?.addGlossaryNote(title, category, body)
          }
          onDeleteGlossaryNote={(noteId: string) => engineRef.current?.deleteGlossaryNote(noteId)}
          onClose={() => engineRef.current?.toggleNotebook()}
        />
      )}
    </div>
  );
}
