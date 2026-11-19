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
  kenan: {name:'Kâtip Kenan', line:'Kâtip Kenan: “Defteri kapattım diye olanlar silinmedi. Kayıtları ara, Halil.”'},
  idris: {name:'Mezarcı İdris', line:'Mezarcı İdris: “Korktuk. Duvarın dışında kalanları sonradan aradım, ama her taşı bulamadım.”'},
} as const;
export type MemoryId = keyof typeof RESIDENT_MEMORIES;
export function memoryAvailable(nightNumber:number,isDark:boolean) {return isDark&&nightNumber>=2;}
