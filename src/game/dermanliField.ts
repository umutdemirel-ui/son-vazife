import * as THREE from 'three';

/** Height of the visible top of the raised furrows, relative to the field site. */
export const FIELD_FURROW_HEIGHT=.065+.045/2;
/** Lowest actual vertex after leaning, used instead of the bounding box of a rotated cone. */
export function stalkLowestY(geometry:THREE.BufferGeometry,angle:number) {
  const positions=geometry.getAttribute('position');let lowest=Infinity;
  for(let i=0;i<positions.count;i++)lowest=Math.min(lowest,positions.getX(i)*Math.sin(angle)+positions.getY(i)*Math.cos(angle));
  return lowest;
}
export function stalkCenterHeight(geometry:THREE.BufferGeometry,angle:number,supportHeight:number) {
  return supportHeight-stalkLowestY(geometry,angle);
}
