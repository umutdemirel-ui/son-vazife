/** Active-play scare pacing; early chapters are quiet, later chapters are less forgiving. */
export function scareInterval(act: number) {
  return act < 2 ? Infinity : Math.max(65, 160 - (act - 2) * 15);
}
export class ScareClock {
  private remaining = 85;
  private visible = 0;
  reset() { this.remaining = 85; this.visible = 0; }
  tick(dt: number, act: number, active: boolean) {
    if (!active || act < 2) return { visible: false, triggered: false };
    this.visible = Math.max(0, this.visible - dt);
    this.remaining -= dt;
    if (this.remaining <= 0) {
      this.remaining = scareInterval(act);
      this.visible = 0.85;
      return { visible: true, triggered: true };
    }
    return { visible: this.visible > 0, triggered: false };
  }
}
