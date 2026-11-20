import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createBridgeApproaches,dermanliWalkingHeight,BRIDGE_DECK_HEIGHT} from '../src/game/dermanliBridge';
import {DERMANLI_SITES as S} from '../src/game/dermanliMap';
import {dermanliSurfaceHeight} from '../src/game/dermanliTerrain';
import {createWatermillAndBridge} from '../src/game/models';
import type {VillageTextures} from '../src/game/textures';

test('bridge deck and approaches support walking height on their visible surfaces',()=>{
 const t=new THREE.Texture(),material=new THREE.MeshStandardMaterial();
 const textures={stone:t,stoneNormal:null,timber:t,timberNormal:null,roof:t,roofNormal:null} as unknown as VillageTextures;
 const bridge=createWatermillAndBridge(textures,'stone').bridgeGroup,ramps=createBridgeApproaches(material);
 for(const obj of [bridge,ramps]){obj.position.set(S.bridge[0],dermanliSurfaceHeight(...S.bridge),S.bridge[1]);obj.updateMatrixWorld(true);}
 for(const dx of [-4.55,-4.1,-3.45,-3,0,3,3.45,4.1,4.55]){
  const x=S.bridge[0]+dx,z=S.bridge[1],ray=new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObjects([bridge,ramps],true)[0];assert.ok(hit,`missing surface at ${dx}`);
  assert.ok(Math.abs(hit.point.y-dermanliWalkingHeight(x,z))<.00001,`incorrect support at ${dx}`);
 }
 assert.ok(Math.abs(dermanliWalkingHeight(...S.bridge)-dermanliSurfaceHeight(...S.bridge)-BRIDGE_DECK_HEIGHT)<1e-8);
 assert.equal(dermanliWalkingHeight(S.bridge[0],S.bridge[1]+3),dermanliSurfaceHeight(S.bridge[0],S.bridge[1]+3));
 ramps.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});bridge.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});material.dispose();t.dispose();
});
