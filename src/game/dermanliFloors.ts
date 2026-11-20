import {DERMANLI_SITES as S,type Point} from './dermanliMap';
import {dermanliSurfaceHeight} from './dermanliTerrain';
import {COFFEEHOUSE_FLOOR_HEIGHT} from './coffeehouse';

/** Horizontal walkable surfaces of Dermanlı's non-house buildings, in local metres.
 * Insets such as rugs are deliberately not separate steps. */
export type WalkableFloor={id:string;site:Point;minX:number;maxX:number;minZ:number;maxZ:number;height:number};
export const DERMANLI_FLOORS:readonly WalkableFloor[]=[
 {id:'gasil',site:S.gasilhane,minX:-3.4,maxX:3.4,minZ:-3.2,maxZ:4.4,height:.16},
 {id:'gasil-step',site:S.gasilhane,minX:3.375,maxX:4.325,minZ:-1,maxZ:1,height:.15},
 {id:'mosque',site:S.mosque,minX:-3.4,maxX:3.4,minZ:-2.3,maxZ:2.3,height:.16},
 {id:'mosque-porch',site:S.mosque,minX:3.4,maxX:5.6,minZ:-2.33,maxZ:2.33,height:.25},
 {id:'office',site:S.office,minX:-3.2,maxX:3.2,minZ:-3,maxZ:3,height:.16},
 {id:'office-porch',site:S.office,minX:-5,maxX:-3.2,minZ:-1.8,maxZ:1.8,height:.14},
 {id:'coffee',site:S.coffee,minX:-3.5,maxX:3.5,minZ:-2.5,maxZ:2.5,height:COFFEEHOUSE_FLOOR_HEIGHT},
 {id:'coffee-porch',site:S.coffee,minX:-3.7,maxX:3.7,minZ:2.475,maxZ:3.825,height:.12},
 {id:'barn',site:S.barn,minX:-3.5,maxX:3.5,minZ:-2.5,maxZ:2.5,height:.11},
 {id:'mill',site:S.mill,minX:-3.1,maxX:3.1,minZ:-2.9,maxZ:2.9,height:.16},
];
export function dermanliBuildingFloorHeight(x:number,z:number,ground:number) {
 for(const f of DERMANLI_FLOORS){const dx=x-f.site[0],dz=z-f.site[1];if(dx>=f.minX&&dx<=f.maxX&&dz>=f.minZ&&dz<=f.maxZ)ground=Math.max(ground,dermanliSurfaceHeight(...f.site)+f.height);}
 return ground;
}
