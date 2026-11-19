import type {Ending} from './dermanliRitual';
export type EndingScene = 'mortuary' | 'bridge' | 'dark' | 'entrance';
export interface EndingBeat { scene:EndingScene; text:string }
export const ENDING_TITLES:Record<Ending,string>={peace:'HUZUR',dark:'KARANLIK',escape:'KAÇIŞ'};
/** The player advances at their own pace; the last beat always names the outcome. */
export const ENDING_BEATS:Record<Ending,readonly EndingBeat[]>={
 peace:[
  {scene:'mortuary',text:'Son isim de deftere yazıldı. Gasilhanenin sessizliğinde tanıdık bir ses duyulur: “Ellerin yoruldu, evlat.”'},
  {scene:'mortuary',text:'Halil teneşirde yatan yüzü tanır. Köye gelirken köprüde ölmüştür; tamamlanmayı bekleyen son vazife kendisinindir. Hacı Süleyman çırağının yanında durur.'},
  {scene:'bridge',text:'Ustası onu usulca uğurlarken sis çözülür. Köprünün ötesinde uzun zamandır görünmeyen bir sabah vardır.'},
  {scene:'bridge',text:'İsimler unutulmadı. Dermanlı’nın son vazifesi tamamlandı.'},
 ],
 dark:[
  {scene:'dark',text:'Köyün sessizliği ağırlaşır. Halil, köprüde yarım kalan yolculuğunu hatırlar.'},
  {scene:'dark',text:'Korku ve tamamlanmamış vazifelerin ağırlığı onu bırakmaz. Gasilhanenin yeni sessiz gassalı artık odur.'},
 ],
 escape:[
  {scene:'entrance',text:'Halil orman yoluna çıkar. Ağaçlar arasındaki patika uzar; sisin içinde tanıdık bir kapı belirir.'},
  {scene:'entrance',text:'Aynı köy, aynı sessizlik. Yol yeniden Dermanlı’nın girişine çıkmıştır; vazife hâlâ bekler.'},
 ],
};
