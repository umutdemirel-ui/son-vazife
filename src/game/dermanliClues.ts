/** The school record is behind a bell-operated compartment, not a free clue. */
export function canReadClue(id:string, bellSolved:boolean): boolean {
  return id!=='school' || bellSolved;
}
export const SCHOOL_LOCKED='Okulun dolabı açılmıyor. Üç çanın sesinden sonra mekanizmanın çalıştığına dair bir işaret var.';
