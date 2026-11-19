import { DERMANLI_SITES as S, type Point } from './dermanliMap';
export const DAY_SECONDS=480;
export function isNight(seconds:number) { return Math.max(0,seconds)%DAY_SECONDS >= DAY_SECONDS/2; }
type Event = {id:string; at:Point; radius:number; minNight:number; text:string; look?:boolean; sound:'water'|'whisper'|'knock'|'creak'};
export const EVENTS: readonly Event[] = [
 {id:'gasil',at:S.gasilhane,radius:5,minNight:1,text:'Gasilhanede musluk bir an kendi kendine akıyor.',sound:'water'},
 {id:'square',at:S.square,radius:6,minNight:1,text:'Meydandaki çeşmeden su sesi duyuluyor; taşlar kuru.',sound:'water'},
 {id:'home',at:S.gassalHome,radius:7,minNight:2,text:'Gassal evinin kapısına içeriden üç kez vuruluyor.',sound:'knock'},
 {id:'well',at:S.well,radius:5,minNight:2,text:'Kuyudan bir fısıltı yükseliyor; söylediği isim anlaşılmıyor.',sound:'whisper'},
 {id:'house',at:S.abandonedHomes[0],radius:6,minNight:2,text:'Terk evin penceresinde bir gölge belirip kayboluyor.',look:true,sound:'creak'},
 {id:'mill',at:S.mill,radius:8,minNight:3,text:'Değirmenin içinden durup başlayan bir çark sesi geliyor.',sound:'creak'},
 {id:'barn',at:S.barn,radius:8,minNight:3,text:'Ahırdan bir an hayvan sesi duyuluyor; içerisi boş.',sound:'creak'},
 {id:'school',at:S.school,radius:8,minNight:4,text:'Boş sınıfta tebeşir tahtaya dokunuyor.',look:true,sound:'knock'},
 {id:'cemetery',at:S.cemetery,radius:10,minNight:5,text:'Mezarlık dışında yeni eşelenmiş toprak görünüyor.',sound:'whisper'},
 {id:'bridge',at:S.bridge,radius:7,minNight:5,text:'Köprüde ayak sesleri sen durduktan sonra da devam ediyor.',sound:'creak'},
];
export function nextEvent(night:number,x:number,z:number,yaw:number,seen:ReadonlySet<string>): Event | null {
 for(const e of EVENTS){
  if(night<e.minNight||seen.has(`${night}:${e.id}`))continue;
  const dx=e.at[0]-x,dz=e.at[1]-z,dist=Math.hypot(dx,dz);
  if(dist>e.radius)continue;
  if(e.look&&dist>.1&&(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/dist<.55)continue;
  return e;
 }
 return null;
}
