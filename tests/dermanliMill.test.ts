import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createWatermillAndBridge} from '../src/game/models';
import type {VillageTextures} from '../src/game/textures';
test('walk-in mill has a visible interior ceiling and the stone bridge remains covered by parapets',()=>{
 const t=new THREE.Texture();const textures={stone:t,stoneNormal:null,timber:t,timberNormal:null,roof:t,roofNormal:null} as unknown as VillageTextures;
 const mill=createWatermillAndBridge(textures,'stone');mill.millGroup.updateMatrixWorld(true);mill.bridgeGroup.updateMatrixWorld(true);
 const up=new THREE.Raycaster(new THREE.Vector3(0,1.5,0),new THREE.Vector3(0,1,0));
 const hit=up.intersectObject(mill.millGroup,true);assert.ok(hit.some(h=>h.point.y>3&&h.point.y<3.3));
 const side=new THREE.Raycaster(new THREE.Vector3(0,.7,0),new THREE.Vector3(0,0,1));
 assert.ok(side.intersectObject(mill.bridgeGroup,true).some(h=>h.distance<1.6));
});
