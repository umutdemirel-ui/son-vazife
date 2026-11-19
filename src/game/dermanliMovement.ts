import { pushOutsideBox, type BoxCollider } from './collision';
/** Identical collision resolution for interactive movement and navigation tests. */
export function moveDermanliPlayer(p:{x:number;z:number},dx:number,dz:number,walls:readonly BoxCollider[]) {
  p.x=Math.max(-90,Math.min(90,p.x+dx));p.z=Math.max(-105,Math.min(105,p.z+dz));
  for(const wall of walls)pushOutsideBox(p,wall,.32);
}
