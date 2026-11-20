/** Small, deterministic quest state. All actions target a distinct physical station. */
export type Held = 'empty' | 'soap' | 'ewer' | 'bucket' | 'camphor' | 'shroud';
export type BodyPlace = 'arrival' | 'carrying' | 'slab' | 'burialCarry' | 'done';
export type Ending = 'peace' | 'dark' | 'escape';
export interface RitualState {
  night: number; body: BodyPlace; candle: boolean; risen: boolean;
  stage: number; soaped: boolean; held: Held; dirty: boolean; violations: number;
  clues: string[]; ending: Ending | null;
}
export const NAMES = ['İlk cenaze','İkinci cenaze','Üçüncü cenaze','Dördüncü cenaze','Beşinci cenaze'] as const;
export function newRitual(): RitualState { return {night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}; }
export function ritualObjective(s: RitualState, night = true): string {
  if(s.ending) return 'Son vazife sona erdi.';
  if(s.body==='arrival') return night ? 'Gasilhane önündeki sedyeden cenazeyi al.' : 'Gündüz köyü keşfet. Cenaze gece gasilhaneye gelecek.';
  if(s.body==='carrying') return 'Cenazeyi teneşire taşı.';
  if(s.body==='burialCarry') return 'Cenazeyi mezarlığa götür.';
  if(s.body==='done') return 'Vazife tamamlandı.';
  if(!s.candle) return 'Sabır mumunu yak; ardından hazırlığa başla.';
  if(s.dirty) return s.held==='bucket' ? 'Kirli suyu içerideki gidere dök.' : s.held!=='empty' ? 'Önce elindeki malzemeyi yerine bırak; ardından kirli suyu gidere taşı.' : 'Kirli suyu kovayla alıp gidere taşı.';
  return ['Boş ellerle yüzü ve elleri temizle.',s.soaped?'Sabunu bırak, iki elle sağ tarafı yıka.':'Sabunu al, sağ tarafa sür.',s.soaped?'Sabunu bırak, iki elle sol tarafı yıka.':'Sabunu al, sol tarafa sür.','İbriği al ve temiz suyla durula.','Kâfuru al ve uygula.','Kefeni al ve sar.','Cenazeyi mezarlığa taşımak için al.'][s.stage] ?? '';
}
/** Explain why the current manual operation cannot start without changing state. */
export function workProblem(s:RitualState): string | null {
  if(s.body!=='slab'||s.stage>=6)return 'Teneşirde yapılacak bir işlem yok.';
  if(s.dirty)return 'Önce kirli suyu kovayla gidere taşı.';
  if(!s.candle)return 'Yıkamaya başlamadan sabır mumunu yak.';
  const expected: Held = s.stage===0?'empty':s.stage<=2?(s.soaped?'empty':'soap'):s.stage===3?'ewer':s.stage===4?'camphor':'shroud';
  if(s.held!==expected)return ritualObjective(s);
  return null;
}
export function interactRitual(s:RitualState, id:string, night = true, work = false): string {
  if(s.ending) return 'Vazife sona erdi.';
  if(id==='arrival') {
    if(s.body!=='arrival') return 'Sedye boş.';
    if(!night) return 'Sedye boş; cenaze gece gelecek.';
    if(s.held!=='empty') return 'Cenazeyi taşımak için ellerin boş olmalı.';
    s.body='carrying'; return `${NAMES[s.night-1]} dikkatle sedyeden alındı. Teneşire götür.`;
  }
  if(id==='candle') {
    if(s.body!=='slab') return 'Sabır mumu cenaze teneşirdeyken yakılır.';
    s.candle=true; s.risen=false; return 'Sabır mumu yakıldı.';
  }
  const tools: Record<string,Held>={soap:'soap',ewer:'ewer',bucket:'bucket',camphor:'camphor',shroud:'shroud'};
  if(id in tools) {
    const tool=tools[id];
    if(s.body!=='slab') return 'Malzemeleri cenaze teneşirdeyken kullan.';
    if(s.held===tool){ s.held='empty';return 'Malzeme yerine bırakıldı.'; }
    if(s.held!=='empty') return 'Önce elindekini yerine bırak.';
    if(tool==='bucket' && !s.dirty) return 'Leğende taşınacak kirli su yok.';
    s.held=tool;return `${{soap:'Sabun',ewer:'İbrik',bucket:'Kirli su kovası',camphor:'Kâfur',shroud:'Kefen',empty:''}[tool]} alındı.`;
  }
  if(id==='drain') {
    if(s.held!=='bucket' || !s.dirty) return 'Gidere dökmek için kirli su kovasını al.';
    s.dirty=false;s.held='empty';return 'Kirli su gidere döküldü. Kova yerine bırakıldı.';
  }
  if(id==='discard') {
    if(s.held!=='bucket'||!s.dirty) return 'Burada dökülecek bir şey yok.';
    s.dirty=false;s.held='empty';s.violations++;return 'Kirli su dışarı döküldü. Bu özensizlik vazifeye yazıldı.';
  }
  if(id==='slab') {
    if(s.body==='carrying'){s.body='slab';return 'Cenaze teneşire yerleştirildi. Sabır mumunu yak.';}
    if(s.body!=='slab')return 'Teneşir boş.';
    if(s.stage===6){if(s.held!=='empty')return 'Cenazeyi taşımadan önce elindekini bırak.'; s.body='burialCarry';return 'Kefenlenen cenaze alındı. Mezarlığa götür.';}
    const problem=workProblem(s);if(problem)return problem;
    if(!work)return s.stage<=2 ? 'F tuşunu basılı tutup A ve D ile sırayla yıka.' : 'Teneşirde çalışmak için F tuşunu basılı tut.';
    if(s.stage===0 && s.held==='empty'){s.stage=1;return 'Yüz ve eller temizlendi.';}
    if(s.stage===1||s.stage===2){
      if(!s.soaped&&s.held==='soap'){s.soaped=true;return 'Sabun sürüldü. Sabunu bırakıp iki elinle yıka.';}
      if(s.soaped&&s.held==='empty'){s.soaped=false;s.stage++;return 'Taraf özenle yıkandı.';}
    }
    if(s.stage===3&&s.held==='ewer'){s.stage=4;s.dirty=true;return 'Temiz suyla durulandı. İbriği bırak, kirli suyu kovayla gidere taşı.';}
    if(s.stage===4&&s.held==='camphor'){s.stage=5;return 'Kâfur uygulandı. Kâfuru yerine bırak.';}
    if(s.stage===5&&s.held==='shroud'){s.stage=6;return 'Cenaze kefenlendi. Kefeni bırakıp taşı.';}
    return ritualObjective(s);
  }
  if(id==='cemetery'&&s.body==='burialCarry'){
    if(s.night===5){s.body='done';return 'Beşinci cenaze defnedildi. Son vazife tamamlandı.';}
    s.night++;s.body='arrival';s.candle=false;s.risen=false;s.stage=0;s.soaped=false;s.held='empty';s.dirty=false;
    return `Vazife tamamlandı. Yeni gün başladı; ${s.night}. geceyi beklerken köyü keşfet.`;
  }
  return '';
}
export function leaveUnwatched(s:RitualState): boolean {
  if(s.body!=='slab'||s.candle||s.risen)return false;
  s.risen=true;s.violations++;return true;
}

/** Existing Kuzdağ saves have no duty field. Reject malformed new states instead
 * of silently resetting progress or interpreting another village's coordinates. */
export function isFuneralDuty(value:unknown): value is RitualState {
  if(!value || typeof value!=='object' || Array.isArray(value))return false;
  const s=value as Partial<RitualState>;
  return Number.isInteger(s.night) && s.night!>=1 && s.night!<=5 &&
    Number.isInteger(s.stage) && s.stage!>=0 && s.stage!<=6 &&
    Number.isInteger(s.violations) && s.violations!>=0 && s.violations!<=9999 &&
    ['arrival','carrying','slab','burialCarry','done'].includes(s.body as string) &&
    ['empty','soap','ewer','bucket','camphor','shroud'].includes(s.held as string) &&
    [s.candle,s.risen,s.soaped,s.dirty].every(v=>typeof v==='boolean') &&
    Array.isArray(s.clues) && s.clues.length<=100 && s.clues.every(c=>typeof c==='string') &&
    s.ending===null &&
    (!s.soaped || (s.body==='slab' && (s.stage===1 || s.stage===2))) &&
    (!s.dirty || (s.body==='slab' && s.stage===4)) &&
    (s.held!=='bucket' || s.dirty===true) &&
    (s.body!=='burialCarry' || (s.stage===6 && s.held==='empty')) &&
    (s.body!=='done' || (s.night===5 && s.stage===6 && s.held==='empty'));
}
