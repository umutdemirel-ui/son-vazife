export type WatchStep = 'arrival' | 'ledger' | 'telephone' | 'answered' | 'waited';
const WATCH_KEY = 'son_vazife_first_watch_v1';
let sessionStep: WatchStep | null = null;
const STEPS: WatchStep[] = ['arrival', 'ledger', 'telephone', 'answered', 'waited'];

export function readWatch(): WatchStep | null {
  try {
    const step = localStorage.getItem(WATCH_KEY) as WatchStep | null;
    return step && STEPS.includes(step) ? step : null;
  } catch {
    return sessionStep;
  }
}

export function storeWatch(step: WatchStep | null) {
  sessionStep = step;
  try {
    if (step) localStorage.setItem(WATCH_KEY, step);
    else localStorage.removeItem(WATCH_KEY);
  } catch {
    /* The whole prologue remains playable without a save. */
  }
}

export interface VillageLaunch {
  resume: boolean;
  registryFiled: boolean;
}
