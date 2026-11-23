import { DEFAULT_CONTROL_SETTINGS, type ControlSettings } from './types';

const CONTROLS_KEY = 'son_vazife_controls_v1';
const MUTE_KEY = 'son_vazife_mute_v1';
// A blocked storage API should not unmute audio when entering the 3D scene.
let sessionControls = { ...DEFAULT_CONTROL_SETTINGS };
let sessionMuted = false;

export function readControls(): ControlSettings {
  try {
    const raw = localStorage.getItem(CONTROLS_KEY);
    if (!raw) return { ...sessionControls };
    const value = JSON.parse(raw);
    return {
      graphicsQuality: ['auto', 'minimum', 'high', 'medium', 'low'].includes(value.graphicsQuality)
        ? value.graphicsQuality
        : DEFAULT_CONTROL_SETTINGS.graphicsQuality,
      mouseSensitivity: Number.isFinite(value.mouseSensitivity)
        ? Math.max(0.4, Math.min(2.4, value.mouseSensitivity))
        : DEFAULT_CONTROL_SETTINGS.mouseSensitivity,
      invertY: value.invertY === true,
      lookSmoothing: value.lookSmoothing !== false,
      crouchToggle: value.crouchToggle !== false,
    };
  } catch {
    return { ...sessionControls };
  }
}

export function storeControls(settings: ControlSettings) {
  sessionControls = { ...settings };
  try {
    localStorage.setItem(CONTROLS_KEY, JSON.stringify(settings));
  } catch {
    /* Storage is optional. */
  }
}

export function readMuted(): boolean {
  try {
    const value = localStorage.getItem(MUTE_KEY);
    return value === null ? sessionMuted : value === 'true';
  } catch {
    return sessionMuted;
  }
}

export function storeMuted(muted: boolean) {
  sessionMuted = muted;
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    /* Private browsing. */
  }
}
