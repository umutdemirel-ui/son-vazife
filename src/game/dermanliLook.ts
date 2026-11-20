/** Mouse input is accumulated as a target so sensitivity, inversion and smoothing compose. */
export interface LookAngles {yaw:number;pitch:number}
export function applyLookDelta(target:LookAngles,dx:number,dy:number,sensitivity:number,invertY:boolean):LookAngles {
  return {yaw:target.yaw-dx*.0022*sensitivity,pitch:Math.max(-1.3,Math.min(1.3,target.pitch-dy*.0022*sensitivity*(invertY?-1:1)))};
}
/** Same 30/s exponential response used by the earlier village, independent of frame rate. */
export function advanceLook(current:LookAngles,target:LookAngles,dt:number,smooth:boolean):LookAngles {
  const alpha=smooth?1-Math.exp(-30*Math.max(0,dt)):1;
  return {yaw:current.yaw+(target.yaw-current.yaw)*alpha,pitch:current.pitch+(target.pitch-current.pitch)*alpha};
}
