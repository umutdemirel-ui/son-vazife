export type Spirit = 'elif' | 'riza';
export function spiritAvailable(id:Spirit,nightNumber:number,isDark:boolean) {
  return isDark && nightNumber >= (id==='elif' ? 4 : 5);
}
export const SPIRIT_LINES: Record<Spirit,string> = {
  elif:'Elif: “Kapıyı açamadılar. Annemin adını da yaz; kimseyi unutma.”',
  riza:'Muhtar Rıza: “Korkudan kapıyı kapattık. Sonra hiçbirine son vazifeyi yapamadık.”',
};

/** Former village characters return as outdoor memories, not household residents. */
export const RESIDENT_MEMORIES = {
  bekci: {name:'Bekçi Hasan', line:'Bekçi Hasan: “Geceleri kapının önünde bekledim. İçeriden gelen sesleri unutamadım.”'},
  serife: {name:'Şerife Nine', line:'Şerife Nine: “Kuyunun başında adlarını sayardık. Birini eksik bırakırsan, ses yine gelir.”'},
  kenan: {name:'Katip Kenan', line:'Katip Kenan: “Defteri kapattım diye olanlar silinmedi. Kayıtları ara, Halil.”'},
  idris: {name:'Mezarcı İdris', line:'Mezarcı İdris: “Korktuk. Duvarın dışında kalanları sonradan aradım, ama her taşı bulamadım.”'},
} as const;
export type MemoryId = keyof typeof RESIDENT_MEMORIES;
export function memoryAvailable(nightNumber:number,isDark:boolean) {return isDark&&nightNumber>=2;}

/** Three more villagers appear in the coffeehouse by day; they vanish with nightfall. */
export const COFFEE_RESIDENTS = {
  cemil: {name:'Kahveci Cemil',line:'Cemil: “Çay taze, otur biraz. İlanı muhtar astırdı; yardım geleceğini söylemişlerdi.”',model:'kenan',outfit:'coffee-apron',x:2.55,z:-2.0,seated:false},
  salih: {name:'Salih',line:'Salih: “Bu köyde herkes birbirini tanırdı. Şimdi bir ismi anınca bile içim ürperiyor.”',model:'bekci',outfit:'flat-cap',x:-2,z:.45,seated:true},
  ferit: {name:'Ferit',line:'Ferit: “Akşam olunca çan sesini dinle. Bazen okulun önünde biri var sanırsın.”',model:'idris',outfit:'wool-scarf',x:2,z:.45,seated:true},
} as const;
export type CoffeeResidentId = keyof typeof COFFEE_RESIDENTS;
export function coffeeResidentAvailable(isDark:boolean) {return !isDark;}

/** Daytime villagers are outdoors, away from doorways; their models are reused for now. */
export const OUTDOOR_RESIDENTS = {
  hatice: {name:'Hatice Nine',model:'serife',outfit:'headscarf',site:'school',dx:5,dz:6,
    line:'Hatice Nine: “Çocukların sesini duyar gibi oluyorum. Okul kapısının önündeki çanlara iyi bak, evladım.”'},
  osman: {name:'Çiftçi Osman',model:'idris',outfit:'farm-vest',site:'barn',dx:-5,dz:2,
    line:'Çiftçi Osman: “Hasat zamanı herkes ahıra uğrardı. Defterde son senenin hesabı hâlâ durur.”'},
  ismail: {name:'İsmail',model:'kenan',outfit:'mill-apron',site:'mill',dx:-5,dz:4,
    line:'İsmail: “Değirmenci yardım bekledi, sonra çarkın sesi bile duyulmaz oldu. Defterini içeride bırakmıştı.”'},
} as const;
export type OutdoorResidentId = keyof typeof OUTDOOR_RESIDENTS;
export function outdoorResidentAvailable(isDark:boolean) {return !isDark;}

/** Daytime conversations change with completed burials, without storing separate counters. */
export const VILLAGER_FOLLOWUPS: Record<string, readonly [string,string]> = {
  coffee_cemil: [
    'Cemil: “Sabah oldu ama bardakları yine üç kişi için dizdim. Gelen olursa çayı soğumasın.”',
    'Cemil: “İlan hâlâ duvarda. Beklediğimiz yardım gelmedi; sen yine de isimleri okumayı bırakma.”',
  ],
  coffee_salih: [
    'Salih: “Mezarlığa bir taş daha konduğunu gördüm. Adını söyleyince sanki biraz yaklaştı.”',
    'Salih: “Geceleri herkes susuyor. Gündüz adlarını anmak bile onlara borcumuz.”',
  ],
  coffee_ferit: [
    'Ferit: “Çanların üçü de yerinde. Sesleri birbirine benzer; sırayı deftere yazmışlar.”',
    'Ferit: “Okulun kapısını unutamadım. İçeride kalanların adını bilen birine rastlarsan dinle.”',
  ],
  villager_hatice: [
    'Hatice Nine: “Bir isim daha yazılmış. Okulun önünden geçerken ötekileri de hatırla.”',
    'Hatice Nine: “Elif annesine kavuşmak isterdi. Tahtadaki yazıyı kimse silmesin.”',
  ],
  villager_osman: [
    'Çiftçi Osman: “Samanın altında kalan kayıtları buldun mu? O yıl harman yarıda kalmıştı.”',
    'Çiftçi Osman: “Tarlada çalışanların sesini hatırlıyorum. Her biri için bir isim kalsın geriye.”',
  ],
  villager_ismail: [
    'İsmail: “Değirmenin defterindeki son sayfaları oku. Yardım çağrıları orada kalmış.”',
    'İsmail: “Çark hâlâ dönüyor. Değirmenciyi de onunla birlikte anmayı unutma.”',
  ],
};
export function villagerConversation(id:string,night:number) {
  const lines=VILLAGER_FOLLOWUPS[id];
  if(!lines||night<2)return null;
  const phase=night>=4?4:2;
  return {key:`${id}_day${phase}`,line:lines[phase===4?1:0]};
}
/** Stable IDs allow each heard conversation to survive reloads in the existing notebook. */
export const VILLAGER_FOLLOWUP_NOTES:Record<string,string>=Object.fromEntries(
  Object.entries(VILLAGER_FOLLOWUPS).flatMap(([id,lines])=>[[`${id}_day2`,lines[0]],[`${id}_day4`,lines[1]]]),
);
