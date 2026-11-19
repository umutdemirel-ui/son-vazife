export type Spirit = 'elif' | 'riza';
export function spiritAvailable(id:Spirit,nightNumber:number,isDark:boolean) {
  return isDark && nightNumber >= (id==='elif' ? 4 : 5);
}
export const SPIRIT_LINES: Record<Spirit,string> = {
  elif:'Elif: “Kapıyı açamadılar. Annemin adını da yaz; kimseyi unutma.”',
  riza:'Muhtar Rıza: “Korkudan kapıyı kapattık. Sonra hiçbirine son vazifeyi yapamadık.”',
};
