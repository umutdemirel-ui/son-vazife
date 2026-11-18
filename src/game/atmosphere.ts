import { SECONDS_PER_DAY } from './survival';

/** A continuous visual cycle; gameplay's day/evening boundary remains unchanged. */
export function atmosphereTargets(seconds: number, rain: number, indoors: boolean, minimum: boolean, low: boolean) {
  const phase = ((Math.max(0, seconds) % SECONDS_PER_DAY) / SECONDS_PER_DAY) * Math.PI * 2;
  // A short twilight at each boundary, with a long readable day and night.
  const t = Math.max(0, Math.min(1, (Math.sin(phase) + 0.32) / 0.64));
  const daylight = t * t * (3 - 2 * t);
  const wet = Math.max(0, Math.min(1, rain));
  const outdoorFog = 0.027 - daylight * 0.006 + wet * 0.005;
  const fog = Math.max(minimum ? 0.035 : low ? 0.029 : 0.013, outdoorFog * (indoors ? 0.72 : 1));
  return {
    daylight,
    fog,
    key: (0.28 + daylight * 0.98) * (1 - wet * 0.22) * (indoors ? 0.86 : 1),
    ambient: (0.47 + daylight * 0.75) * (1 - wet * 0.1) * (indoors ? 0.83 : 1),
    aperture: (0.035 + daylight * 0.19) * (1 - wet * 0.45),
  };
}
