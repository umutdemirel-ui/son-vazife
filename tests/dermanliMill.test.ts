import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createWatermillAndBridge} from '../src/game/models';
import type {VillageTextures} from '../src/game/textures';
import {MILL_WHEEL_COLLIDER as c} from '../src/game/dermanliMill';
import {pushOutsideBox} from '../src/game/collision';

test('mill wheel collider covers the rotating wheel while leaving the doorway clear',()=>{
 const t=new THREE.Texture(),textures={stone:t,stoneNormal:null,timber:t,timberNormal:null,roof:t,roofNormal:null} as unknown as VillageTextures;
 const refs=createWatermillAndBridge(textures,'stone');
 try{
  for(let i=0;i<72;i++){
   refs.wheelPivot.rotation.x=i*Math.PI/36;refs.millGroup.updateMatrixWorld(true);
   // The axis-aligned box of a rotated torus is overly conservative; test actual vertices.
   refs.wheelPivot.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
    const p=o.geometry.getAttribute('position'),v=new THREE.Vector3();
    for(let j=0;j<p.count;j++){v.fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld);
     assert.ok(v.x>=c.minX&&v.x<=c.maxX&&v.z>=c.minZ&&v.z<=c.maxZ,`wheel exceeds collider at ${i}: ${v.toArray()}`);
    }
   });
  }
  const doorway={x:3.6,z:0},before={...doorway};pushOutsideBox(doorway,c,.32);assert.deepEqual(doorway,before);
 }finally{
  for(const group of [refs.millGroup,refs.bridgeGroup])group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});t.dispose();
 }
});
