import { DERMANLI_BOUNDS as B } from './dermanliMap';
import { pushOutsideBox, type BoxCollider } from './collision';
/** Identical collision resolution for interactive movement and navigation tests. */
export function moveDermanliPlayer(p:{x:number;z:number},dx:number,dz:number,walls:readonly BoxCollider[]) {
  p.x=Math.max(B.minX,Math.min(B.maxX,p.x+dx));p.z=Math.max(B.minZ,Math.min(B.maxZ,p.z+dz));
  for(const wall of walls)pushOutsideBox(p,wall,.32);
}
