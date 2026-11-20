import { DERMANLI_SITES as S, type Point } from './dermanliMap';
export const DAY_SECONDS=240;
export function isNight(seconds:number) { return Math.max(0,seconds)%DAY_SECONDS >= DAY_SECONDS/2; }
/** Burial opens a new day, not a second funeral during the same night. */
export function nextDawn(seconds:number) { return (Math.floor(Math.max(0,seconds)/DAY_SECONDS)+1)*DAY_SECONDS; }
type Event = {id:string; at:Point; radius:number; minNight:number; text:string; look?:boolean; sound:'water'|'whisper'|'knock'|'creak'};
export const EVENTS: readonly Event[] = [
 {id:'gasil',at:S.gasilhane,radius:5,minNight:1,text:'Gasilhanede kimse dokunmadığı hâlde bir an su sesi duyuluyor.',sound:'water'},
 {id:'square',at:S.square,radius:6,minNight:1,text:'Meydandaki çeşme bir an kendi kendine akıyor.',look:true,sound:'water'},
 {id:'home',at:S.gassalHome,radius:7,minNight:2,text:'Gassal evinin kapısına içeriden üç kez vuruluyor.',sound:'knock'},
 {id:'well',at:S.well,radius:5,minNight:2,text:'Kuyudan bir fısıltı yükseliyor; söylediği isim anlaşılmıyor.',sound:'whisper'},
 {id:'house',at:[S.abandonedHomes[0][0]-2.125,S.abandonedHomes[0][1]+2.5],radius:6,minNight:2,text:'Terk evin penceresinde bir gölge belirip kayboluyor.',look:true,sound:'creak'},
 {id:'mill',at:S.mill,radius:8,minNight:3,text:'Değirmenin içinden durup başlayan bir çark sesi geliyor.',sound:'creak'},
 {id:'barn',at:S.barn,radius:8,minNight:3,text:'Ahırdan bir an hayvan sesi duyuluyor; içerisi boş.',sound:'creak'},
 {id:'school',at:[S.school[0],S.school[1]-2.83],radius:5.5,minNight:4,text:'Boş sınıfta tebeşir tahtaya dokunuyor.',look:true,sound:'knock'},
 {id:'cemetery',at:S.cemetery,radius:10,minNight:5,text:'Mezarlık dışında yeni eşelenmiş toprak görünüyor.',sound:'whisper'},
 {id:'bridge',at:S.bridge,radius:7,minNight:5,text:'Köprüde ayak sesleri sen durduktan sonra da devam ediyor.',sound:'creak'},
];
export function nextEvent(night:number,x:number,z:number,yaw:number,seen:ReadonlySet<string>,pitch=0): Event | null {
 for(const e of EVENTS){
  if(night<e.minNight||seen.has(`${night}:${e.id}`))continue;
  // The figure is behind the front window; do not announce it from the back of the house.
  if(e.id==='house' && z<=S.abandonedHomes[0][1]+2.7)continue;
  // The chalk can only be seen from inside the classroom.
  if(e.id==='school' && (Math.abs(x-S.school[0])>=3.8 || Math.abs(z-S.school[1])>=2.75))continue;
  const dx=e.at[0]-x,dz=e.at[1]-z,dist=Math.hypot(dx,dz);
  if(dist>e.radius)continue;
  if(e.look && (Math.abs(pitch)>.7 || (dist>.1&&(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/dist<.55)))continue;
  return e;
 }
 return null;
}

/** Render changes are derived from saved ritual progress, so reloading cannot reset them. */
export function villageNightVisuals(nightNumber:number, night:boolean, finished:boolean) {
 const completed=finished?5:Math.max(0,Math.min(4,Math.floor(nightNumber)-1));
 return { completed, litHome:night&&nightNumber>=2?(nightNumber-2)%S.abandonedHomes.length:-1, fountainFlowing:night };
}
/** Physics may cap frame steps, but the village clock measures active real time. */
export function advanceVillageClock(seconds:number,frameSeconds:number,active:boolean) {
 return active&&Number.isFinite(frameSeconds)&&frameSeconds>0?seconds+frameSeconds:seconds;
}
