/** Active exploration pacing. An early apparition is guaranteed; evenings accelerate the rhythm. */
export function scareInterval(act: number, evening = false) {
  return Math.max(evening ? 48 : 85, (evening ? 115 : 170) - Math.max(0, act - 1) * 12);
}
export class ScareClock {
  private remaining = 35;
  private visible = 0;
  reset() { this.remaining = 35; this.visible = 0; }
  tick(dt: number, act: number, active: boolean, evening = false) {
    if (!active) return { visible: false, triggered: false };
    this.visible = Math.max(0, this.visible - dt);
    this.remaining -= dt * (evening ? 1.35 : 1);
    if (this.remaining <= 0) {
      this.remaining = scareInterval(act, evening);
      this.visible = 1.35;
      return { visible: true, triggered: true };
    }
    return { visible: this.visible > 0, triggered: false };
  }
}
