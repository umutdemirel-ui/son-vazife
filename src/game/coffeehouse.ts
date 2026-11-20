import * as THREE from 'three';
import { block, face, pitchedRoof, type VillageCraft } from './villageCraft';
import type { BoxCollider } from './collision';

/** Survey shared by the building and its movement/line-of-sight boundaries. */
export const COFFEEHOUSE_WALLS: readonly BoxCollider[] = [
  {minX:-3.6,maxX:-3.4,minZ:-2.6,maxZ:2.6},
  {minX:3.4,maxX:3.6,minZ:-2.6,maxZ:2.6},
  {minX:-3.6,maxX:3.6,minZ:-2.6,maxZ:-2.4},
  {minX:-3.6,maxX:-1,minZ:2.4,maxZ:2.6},
  {minX:1,maxX:3.6,minZ:2.4,maxZ:2.6},
];
export const COFFEEHOUSE_OPEN_DOOR: BoxCollider = {minX:-1.08,maxX:-.92,minZ:2.52,maxZ:4.52};
export const COFFEEHOUSE_POSTS: readonly BoxCollider[] = [-3.2,3.2].map(x=>({minX:x-.09,maxX:x+.09,minZ:3.31,maxZ:3.49}));

export const COFFEEHOUSE_FLOOR_HEIGHT = .10;

/** Single-storey village coffeehouse: purpose-built, not a reskinned house. */
export function createCoffeehouse(craft: VillageCraft) {
  const root=new THREE.Group();root.name='Dermanlı kahvehanesi';
  const w=7,d=5,h=3.05,wall=craft.lime[0],wood=craft.wood;
  block(root,wood,w,.14,d,0,COFFEEHOUSE_FLOOR_HEIGHT-.07,0,1.4);
  block(root,wall,w,h,.2,0,h/2,-d/2,2.2);
  for(const x of [-w/2,w/2])block(root,wall,.2,h,d,x,h/2,0,2.2);
  // Front elevation is physically split into a central door and two large windows.
  for(const x of [-3.12,-1.3,1.3,3.12])block(root,wall,.76,h,.2,x,h/2,d/2,2.2);
  for(const x of [-2.2,2.2]){
    block(root,craft.masonry,1.08,.88,.2,x,.44,d/2,1.8);
    block(root,wall,1.08,.95,.2,x,2.575,d/2,2.2);
    // Double-sided inset photographic glazing, with dimensional timber frame.
    for(const side of [-1,1])face(root,craft.pane,1.02,1.18,x,1.55,d/2+side*.102,side<0?Math.PI:0);
    for(const dx of [-.57,.57])block(root,wood,.09,1.38,.26,x+dx,1.55,d/2,1.3);
    for(const y of [.88,2.22])block(root,wood,1.22,.09,.26,x,y,d/2,1.3);
    block(root,wood,.06,1.26,.26,x,1.55,d/2,1.3);
    block(root,wood,1.12,.06,.26,x,1.55,d/2,1.3);
  }
  block(root,wall,2, .85,.2,0,2.625,d/2,2.2);
  for(const x of [-1.04,1.04])block(root,wood,.10,2.24,.28,x,1.12,d/2,1.3);
  block(root,wood,2.2,.14,.3,0,2.3,d/2,1.3);
  const door=new THREE.Group();door.position.set(-1,.1,d/2+.03);
  block(door,wood,2,2.15,.12,1,1.075,0,1.4);
  face(door,craft.door,1.96,2.1,1,1.075,.065);
  face(door,craft.door,1.96,2.1,1,1.075,-.065,Math.PI);
  door.rotation.y=-Math.PI/2;root.add(door);
  // Textured stone foundation, projecting eaves and sheltered front porch.
  for(const x of [-3.5,3.5])block(root,craft.masonry,.22,.4,5,x,.2,0,1.6);
  block(root,craft.masonry,7,.4,.22,0,.2,-2.5,1.6);
  block(root,wood,w,.12,d,0,h-.06,0,1.4);
  pitchedRoof(root,craft.roofVariants[1],craft.roofVariants[1],7.65,5.65,h,.8,1.3);
  block(root,wood,7.65,.13,.14,0,h,2.8,1.5);
  block(root,craft.masonry,7.4,.12,1.35,0,.06,3.15,1.6);
  block(root,wood,7.4,.12,1.45,0,2.8,3.15,1.4);
  for(const x of [-3.2,3.2]){
    block(root,wood,.16,2.7,.16,x,1.4,3.4,1.3);
    block(root,craft.limestone,.3,.1,.3,x,.1,3.4,1.0);
  }
  return {root,door};
}
