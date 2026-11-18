import type { GraphicsQualityPreset } from './types';
export type RenderTier = Exclude<GraphicsQualityPreset, 'auto'>;
export type Allocation = 'minimum' | 'compact' | 'full';
const tiers: RenderTier[] = ['minimum', 'low', 'medium', 'high'];
export function deviceClass(gpu: string, cores: number, memory: number, touch: boolean) {
  const softwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  const legacy =
    /Intel.*(?:HD Graphics [234]\d{3}|HD Graphics 5[0-3]0|UHD Graphics 60[05])|Adreno.*(?:3\d{2}|4\d{2})|Mali-(?:T[67]\d{2}|4[05]0)/i.test(
      gpu,
    );
  const veryWeak = softwareGl || legacy || cores <= 2 || memory <= 2;
  return { softwareGl, veryWeak, lowEnd: veryWeak || cores <= 4 || memory <= 4 || touch };
}
export const capTier = (tier: RenderTier, cap: RenderTier) =>
  tiers[Math.min(tiers.indexOf(tier), tiers.indexOf(cap))];
export function adaptiveTier(current: RenderTier, cap: RenderTier, ms: number, fastWindows: number) {
  const i = tiers.indexOf(current);
  const choice =
    ms > 40
      ? 0
      : ms > 29
        ? Math.min(i, 1)
        : ms > 22
          ? Math.max(i - 1, 0)
          : fastWindows >= 4
            ? Math.min(i + 1, 3)
            : i;
  return capTier(tiers[choice], cap);
}
export function startingTier(
  preset: GraphicsQualityPreset,
  software: boolean,
  veryWeak: boolean,
  lowEnd: boolean,
): RenderTier {
  if (software) return 'minimum';
  return preset === 'auto' ? (veryWeak ? 'minimum' : lowEnd ? 'low' : 'medium') : preset;
}
export const allocationFor = (tier: RenderTier): Allocation =>
  tier === 'minimum' ? 'minimum' : tier === 'low' ? 'compact' : 'full';
export const surfaceUrl = (name: string, compact: boolean) =>
  `/assets/village/${compact ? 'compact/' : ''}${name}.webp`;
export function rasterRatio(
  tier: RenderTier,
  width: number,
  height: number,
  native: number,
  software: boolean,
  softwareSide = 384,
) {
  const side = Math.max(1, width, height);
  if (tier === 'minimum') return Math.min(native, 0.65, (software ? softwareSide : 720) / side);
  if (tier === 'low') return Math.min(native, 0.82, 1000 / side);
  return Math.min(native, tier === 'high' ? 1.4 : 1);
}

/** Software completion samples include GPU work, unlike the independently serviced input timer.
 * Adjust after sustained load only. A hidden tab / first shader compile isn't a useful sample. */
export class SoftwareRasterBudget {
  side = 384;
  private total = 0;
  private count = 0;
  sample(ms: number): boolean {
    if (!Number.isFinite(ms) || ms <= 0 || ms > 800) return false;
    this.total += ms;
    this.count++;
    if (this.count < 12) return false;
    const avg = this.total / this.count,
      previous = this.side;
    this.total = 0;
    this.count = 0;
    if (avg > 78) this.side = Math.max(288, this.side - 48);
    else if (avg < 35) this.side = Math.min(512, this.side + 32);
    return this.side !== previous;
  }
}
