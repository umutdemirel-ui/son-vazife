/** A scrub requires alternating directions; holding a key or repeating one side cannot complete it. */
export type ScrubDirection = 'left' | 'right';
export interface ScrubProgress { strokes:number; last:ScrubDirection|null }
export const SCRUB_STROKES = 4;
export function newScrub(): ScrubProgress { return {strokes:0,last:null}; }
export function scrubStroke(progress:ScrubProgress, direction:ScrubDirection): ScrubProgress {
  if(progress.strokes>=SCRUB_STROKES || progress.last===direction) return progress;
  return {strokes:progress.strokes+1,last:direction};
}
export function isScrubbing(stage:number): boolean { return stage>=0 && stage<=2; }
