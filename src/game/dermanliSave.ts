import { type RitualState } from './dermanliRitual';
const KEY='son_vazife_dermanli_v1';
export interface DermanliSave { version:1; ritual:RitualState; x:number; z:number; yaw:number; pitch:number; elapsed?:number; events?:string[]; hits?:number }
export function readDermanliSave(): DermanliSave|null {
  try {
    const v=JSON.parse(localStorage.getItem(KEY)??'null') as DermanliSave|null;
    if(!v||v.version!==1||![v.x,v.z,v.yaw,v.pitch].every(Number.isFinite)||Math.abs(v.x)>90||Math.abs(v.z)>105||Math.abs(v.pitch)>1.3) return null;
    if(v.elapsed!==undefined && (!Number.isFinite(v.elapsed)||v.elapsed<0||v.elapsed>315360000)) return null;
    if(v.events!==undefined && (!Array.isArray(v.events)||v.events.length>200||v.events.some(e=>typeof e!=='string'))) return null;
    if(v.hits!==undefined && (!Number.isInteger(v.hits)||v.hits<0||v.hits>3)) return null;
    const s=v.ritual;
    if(!s||!Number.isInteger(s.night)||s.night<1||s.night>5||!Number.isInteger(s.stage)||s.stage<0||s.stage>6||!Number.isInteger(s.violations)||s.violations<0||s.violations>9999||
      !['arrival','carrying','slab','burialCarry','done'].includes(s.body)||!['empty','soap','ewer','bucket','camphor','shroud'].includes(s.held)||
      ![s.candle,s.risen,s.soaped,s.dirty].every(x=>typeof x==='boolean')||!Array.isArray(s.clues)||s.clues.length>100||s.clues.some(c=>typeof c!=='string')||
      !(s.ending===null||['peace','dark','escape'].includes(s.ending))) return null;
    return v;
  } catch { return null; }
}
export function writeDermanliSave(v:DermanliSave): boolean {try {localStorage.setItem(KEY,JSON.stringify(v));return true;}catch{return false;}}
export function clearDermanliSave(){try{localStorage.removeItem(KEY);}catch{/* unavailable */}}
