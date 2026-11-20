import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createCoffeehouse,COFFEEHOUSE_WALLS,COFFEEHOUSE_OPEN_DOOR,COFFEEHOUSE_POSTS,COFFEEHOUSE_FLOOR_HEIGHT} from '../src/game/coffeehouse';
import {pushOutsideBox} from '../src/game/collision';
import type {VillageCraft} from '../src/game/villageCraft';

test('purpose-built coffeehouse has an open entrance, windows and a roof',()=>{
 const material=new THREE.MeshStandardMaterial();
 const craft={lime:[material],wood:material,masonry:material,pane:material,door:material,limestone:material,roofVariants:[material,material]} as unknown as VillageCraft;
 const {root}=createCoffeehouse(craft);root.updateMatrixWorld(true);
 const front=(x:number)=>new THREE.Raycaster(new THREE.Vector3(x,1.5,5),new THREE.Vector3(0,0,-1)).intersectObject(root,true);
 assert.ok(front(0).every(hit=>hit.distance>6),'doorway must not contain a solid wall');
 assert.ok(front(2.2).some(hit=>hit.distance<3),'front window should be visibly framed and glazed');
 const floor=new THREE.Raycaster(new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0)).intersectObject(root,true);
 assert.ok(Math.abs(floor[0].point.y-COFFEEHOUSE_FLOOR_HEIGHT)<1e-6);
 const roof=new THREE.Raycaster(new THREE.Vector3(0,1.5,0),new THREE.Vector3(0,1,0)).intersectObject(root,true);
 assert.ok(roof.some(hit=>hit.point.y>2.8&&hit.point.y<3.1));
 const clear={x:0,z:2.5};for(const c of [...COFFEEHOUSE_WALLS,COFFEEHOUSE_OPEN_DOOR,...COFFEEHOUSE_POSTS])pushOutsideBox(clear,c,.32);
 assert.deepEqual(clear,{x:0,z:2.5},'central entrance stays passable');
 let tiled=false;root.traverse(o=>{if(o instanceof THREE.Mesh){const uv=o.geometry.getAttribute('uv');if(uv)for(let i=0;i<uv.count;i++)if(uv.getX(i)>1.5||uv.getY(i)>1.5)tiled=true;}});
 assert.ok(tiled,'large surfaces use metre-scaled UVs');
 root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});material.dispose();
});
