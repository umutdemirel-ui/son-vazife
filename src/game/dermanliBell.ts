/** The written hint uses symbols, while the physical mapping lives at the school.
 * Nothing renders the numeric combination; each new game chooses a saved seed. */
export const BELL_SYMBOLS = ['Ay', 'Dal', 'Taş'] as const;
const ORDERS: readonly (readonly number[])[] = [[0,1,2], [0,2,1], [1,0,2], [2,1,0]];
const HINTS = [
  'Taş en son yankılanır. Dal, Ay ile Taş arasındadır.',
  'Ay önce yankılanır. Dal, Taş sustuktan sonra duyulur.',
  'Taş en son yankılanır. Ay, Dal ile Taş arasındadır.',
  'Ay en son yankılanır. Dal, Taş ile Ay arasındadır.',
] as const;
export interface BellState { seed:number; input:number[]; solved:boolean }
export function newBell(seed=Math.floor(Math.random()*ORDERS.length)): BellState { return {seed:Math.max(0,Math.min(3,Math.floor(seed))),input:[],solved:false}; }
export function bellHint(seed:number): string { return HINTS[seed] ?? HINTS[0]; }
export function ringBell(state:BellState,index:number): 'pending'|'wrong'|'solved'|'already' {
  if(state.solved)return 'already';
  if(!Number.isInteger(index)||index<0||index>2)return 'wrong';
  state.input.push(index);
  if(state.input.length<3)return 'pending';
  const valid=state.input.every((value,i)=>value===ORDERS[state.seed][i]);state.input=[];
  if(valid){state.solved=true;return 'solved';}
  return 'wrong';
}
