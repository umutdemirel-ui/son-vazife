/** Active exploration time only; menus and background tabs do not advance the clock. */
export const SECONDS_PER_DAY = 600;
export const ESCAPE_POINT = { x: 59, z: 34, radius: 2.5 } as const;
/** The second half of each active-play day is evening/night. */
export function isEvening(seconds: number): boolean {
  return Math.max(0, seconds) % SECONDS_PER_DAY >= SECONDS_PER_DAY / 2;
}
export function survivalDay(seconds: number): number {
  return Math.floor(Math.max(0, seconds) / SECONDS_PER_DAY) + 1;
}
export function atEscapePoint(x: number, z: number): boolean {
  return Math.hypot(x - ESCAPE_POINT.x, z - ESCAPE_POINT.z) <= ESCAPE_POINT.radius;
}
