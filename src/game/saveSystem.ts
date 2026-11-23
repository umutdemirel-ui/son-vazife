import {isFuneralDuty, type RitualState as FuneralDutyState} from './funeralDuty';
import {
  AutopsyCaseId,
  AutopsyCaseState,
  DistrictId,
  GameAct,
  PlayerGlossaryNote,
  SaveSummary,
} from './types';

const SAVE_STORAGE_KEY = 'son_vazife_save_v2';

export interface SaveGamePayload {
  version: 2;
  funeralDuty?: FuneralDutyState;
  villageRevision?: 1 | 2 | 3 | 4 | 5 | 6;
  survivalSeconds?: number;
  storyEventsSeen?: string[];
  puzzleSeed?: number;
  caughtCount?: number;
  openHomes?: number[];
  closedOutposts?: string[];
  mosqueDoorOpen?: boolean;
  finalCall?: 'report' | 'farewell';
  bodyTransport?: 'slab' | 'carried' | 'delivered';
  /** Absent in earlier saves: their first body is already on the slab. */
  initialBody?: 'bed' | 'carried' | 'slab';
  bodyRisen?: boolean;
  additionalWashes?: { mahmut: number; yolcu: number };
  windowActive?: boolean;
  windowResolved?: boolean;
  savedAt: string;
  act: GameAct;
  playerPos: { x: number; z: number; yaw: number; pitch: number };
  candleLit: boolean;
  candleOil: number;
  vigilLit: boolean;
  vigilTimer: number;
  dreadLevel: number;
  violations: number;
  trustScore: number;
  inventoryCollected: string[];
  rulesViolated: string[];
  cluesDiscovered: string[];
  discoveredDistricts: DistrictId[];
  doors: {
    gasil: boolean;
    abandoned: boolean;
    muhtar: boolean;
    clinic: boolean;
    mill: boolean;
    crypt: boolean;
    shutter: boolean;
  };
  ritual: {
    prep: boolean;
    wash: boolean;
    washStage?: number;
    heldWashTool?: 'empty' | 'soap' | 'ewer' | 'dirty';
    soapAppliedFor?: 'arif' | 'mahmut' | 'yolcu' | null;
    rinseStage?: number;
    dirtyReady: boolean;
    dirtyDrained: boolean;
    bulbOut: boolean;
    finalCamphor: boolean;
    dry: boolean;
    shroud: boolean;
  };
  npcFlags: Record<string, string[]>;
  npcTrust: Record<string, number>;
  autopsyCases: Record<AutopsyCaseId, AutopsyCaseState>;
  glossaryUnlocked?: string[];
  playerGlossaryNotes?: PlayerGlossaryNote[];
  actTitle: string;
}

export function writeAutoSave(payload: SaveGamePayload): boolean {
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const stringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 1000 && value.every((entry) => typeof entry === 'string');

export function readAutoSave(): SaveGamePayload | null {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw || raw.length > 1_000_000) return null;
    const parsed = JSON.parse(raw) as Partial<SaveGamePayload>;
    if (
      parsed.version !== 2 ||
      (parsed.funeralDuty !== undefined && !isFuneralDuty(parsed.funeralDuty)) ||
      (parsed.villageRevision !== undefined && parsed.villageRevision !== 1 && parsed.villageRevision !== 2 && parsed.villageRevision !== 3 && parsed.villageRevision !== 4 && parsed.villageRevision !== 5 && parsed.villageRevision !== 6) ||
      typeof parsed.act !== 'number' ||
      !Number.isInteger(parsed.act) ||
      parsed.act < 1 ||
      parsed.act > 8 ||
      !isRecord(parsed) ||
      !parsed.playerPos ||
      ![parsed.playerPos.x, parsed.playerPos.z, parsed.playerPos.yaw, parsed.playerPos.pitch].every(
        Number.isFinite,
      ) ||
      Math.abs(parsed.playerPos.x) > 1000 ||
      Math.abs(parsed.playerPos.z) > 1000 ||
      (parsed.bodyTransport !== undefined && !['slab', 'carried', 'delivered'].includes(parsed.bodyTransport)) ||
      (parsed.initialBody !== undefined && !['bed', 'carried', 'slab'].includes(parsed.initialBody)) ||
      (parsed.bodyRisen !== undefined && typeof parsed.bodyRisen !== 'boolean') ||
      (parsed.additionalWashes !== undefined && (!isRecord(parsed.additionalWashes) ||
        !['mahmut', 'yolcu'].every(id => Number.isInteger(parsed.additionalWashes?.[id as 'mahmut' | 'yolcu']) && parsed.additionalWashes![id as 'mahmut' | 'yolcu'] >= 0 && parsed.additionalWashes![id as 'mahmut' | 'yolcu'] <= 4))) ||
      (parsed.puzzleSeed !== undefined && (!Number.isInteger(parsed.puzzleSeed) || parsed.puzzleSeed < 0 || parsed.puzzleSeed > 3)) ||
      (parsed.survivalSeconds !== undefined &&
        (!Number.isFinite(parsed.survivalSeconds) ||
          parsed.survivalSeconds < 0 ||
          parsed.survivalSeconds > 315360000)) ||
      (parsed.ritual?.heldWashTool !== undefined && !['empty', 'soap', 'ewer', 'dirty'].includes(parsed.ritual.heldWashTool)) ||
      (parsed.ritual?.soapAppliedFor !== undefined && parsed.ritual.soapAppliedFor !== null && !['arif', 'mahmut', 'yolcu'].includes(parsed.ritual.soapAppliedFor)) ||
      (parsed.ritual?.heldWashTool === 'dirty' && (!parsed.ritual.dirtyReady || parsed.ritual.dirtyDrained)) ||
      (parsed.ritual?.washStage !== undefined && (!Number.isInteger(parsed.ritual.washStage) || parsed.ritual.washStage < 0 || parsed.ritual.washStage > 4)) ||
      (parsed.ritual?.rinseStage !== undefined && (!Number.isInteger(parsed.ritual.rinseStage) || parsed.ritual.rinseStage < 0 || parsed.ritual.rinseStage > 3)) ||
      (parsed.mosqueDoorOpen !== undefined && typeof parsed.mosqueDoorOpen !== 'boolean') ||
      (parsed.closedOutposts !== undefined &&
        (!stringList(parsed.closedOutposts) || parsed.closedOutposts.some(id => !['school', 'station', 'exchange'].includes(id)))) ||
      (parsed.openHomes !== undefined &&
        (!Array.isArray(parsed.openHomes) || parsed.openHomes.length > 100 ||
          parsed.openHomes.some((n) => !Number.isInteger(n) || n < 0 || n >= 100))) ||
      (parsed.caughtCount !== undefined &&
        (!Number.isInteger(parsed.caughtCount) || parsed.caughtCount < 0 || parsed.caughtCount > 2)) ||
      [
        'storyEventsSeen',
        'inventoryCollected',
        'rulesViolated',
        'cluesDiscovered',
        'discoveredDistricts',
        'glossaryUnlocked',
      ].some((key) => {
        const value = parsed[key as keyof SaveGamePayload];
        return value !== undefined && !stringList(value);
      }) ||
      (parsed.npcFlags !== undefined &&
        (!isRecord(parsed.npcFlags) ||
          Object.values(parsed.npcFlags).some((flags) => !stringList(flags)))) ||
      (parsed.npcTrust !== undefined &&
        (!isRecord(parsed.npcTrust) ||
          Object.values(parsed.npcTrust).some((n) => typeof n !== 'number' || !Number.isFinite(n)))) ||
      (parsed.autopsyCases !== undefined && !isRecord(parsed.autopsyCases)) ||
      (parsed.playerGlossaryNotes !== undefined && !Array.isArray(parsed.playerGlossaryNotes))
    ) {
      return null;
    }
    return parsed as SaveGamePayload;
  } catch {
    return null;
  }
}

export function getAutoSaveSummary(): SaveSummary | null {
  const save = readAutoSave();
  if (!save) return null;
  const completedAutopsies = Object.values(save.autopsyCases || {}).filter(
    (c) => c && c.completed,
  ).length;
  return {
    act: save.act,
    actTitle: save.actTitle || `BÖLÜM ${save.act}`,
    savedAt: save.savedAt,
    completedAutopsies,
    discoveredClues: (save.cluesDiscovered || []).length,
  };
}

export function clearAutoSave(): void {
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Check existence separately from parsing, so a damaged save is never overwritten. */
export function autoSaveStatus(): 'available'|'missing'|'invalid'|'inaccessible' {
  try {
    const raw=window.localStorage.getItem(SAVE_STORAGE_KEY);
    if(raw===null)return 'missing';
    return readAutoSave()?'available':'invalid';
  } catch {return 'inaccessible';}
}
