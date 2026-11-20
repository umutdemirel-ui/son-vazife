import * as THREE from 'three';
import {DERMANLI_SITES as S} from './dermanliMap';
import {dermanliSurfaceHeight} from './dermanliTerrain';

// Dimensions match the stone bridge in createWatermillAndBridge.
export const BRIDGE_HALF_LENGTH=3.4, BRIDGE_HALF_WIDTH=1.6, BRIDGE_DECK_HEIGHT=.39, BRIDGE_RAMP_LENGTH=1.2;

/** The walkable deck and its ramps, otherwise the triangulated terrain. */
export function dermanliWalkingHeight(x:number,z:number) {
  const dx=Math.abs(x-S.bridge[0]),dz=Math.abs(z-S.bridge[1]);
  if(dz<=BRIDGE_HALF_WIDTH && dx<=BRIDGE_HALF_LENGTH+BRIDGE_RAMP_LENGTH){
    const fraction=Math.min(1,Math.max(0,(BRIDGE_HALF_LENGTH+BRIDGE_RAMP_LENGTH-dx)/BRIDGE_RAMP_LENGTH));
    return Math.max(dermanliSurfaceHeight(x,z),dermanliSurfaceHeight(...S.bridge)+BRIDGE_DECK_HEIGHT*fraction);
  }
  return dermanliSurfaceHeight(x,z);
}

/** Two real, textured sloping surfaces; collision remains governed by bridge parapets. */
export function createBridgeApproaches(material:THREE.Material) {
  const group=new THREE.Group();group.name='Köprü yaklaşım rampaları';
  for(const side of [-1,1]){
    const geo=new THREE.PlaneGeometry(BRIDGE_RAMP_LENGTH,BRIDGE_HALF_WIDTH*2);
    geo.rotateX(-Math.PI/2);
    const pos=geo.getAttribute('position');
    for(let i=0;i<pos.count;i++)pos.setY(i,BRIDGE_DECK_HEIGHT*(.5-side*pos.getX(i)/BRIDGE_RAMP_LENGTH));
    geo.computeVertexNormals();
    const ramp=new THREE.Mesh(geo,material);ramp.position.x=side*(BRIDGE_HALF_LENGTH+BRIDGE_RAMP_LENGTH/2);ramp.receiveShadow=true;group.add(ramp);
  }
  return group;
}
