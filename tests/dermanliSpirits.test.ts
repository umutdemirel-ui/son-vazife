import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createDermanliSpirit,disposeDermanliSpirits} from '../src/game/dermanliSpirits';
import {spiritAvailable} from '../src/game/dermanliCharacters';

test('distinct figures have complete silhouettes and age-appropriate scale',()=>{
 const child=createDermanliSpirit('elif'),adult=createDermanliSpirit('riza');
 assert.equal(child.visible,false);assert.equal(adult.visible,false);
 for(const figure of [child,adult])for(const part of ['head','torso','left-arm','right-arm','shoe'])assert.ok(figure.getObjectByName(part),part);
 assert.ok(child.getObjectByName('braid'));assert.ok(child.getObjectByName('dress'));assert.ok(adult.getObjectByName('hat'));assert.ok(adult.getObjectByName('moustache'));
 const height=(figure:THREE.Object3D)=>new THREE.Box3().setFromObject(figure).getSize(new THREE.Vector3()).y;
 assert.ok(height(child)<height(adult)*.8);
 let disposed=0;const head=child.getObjectByName('head') as THREE.Mesh;head.geometry.addEventListener('dispose',()=>disposed++);
 disposeDermanliSpirits([child,adult]);assert.equal(disposed,1);
});

test('Elif and Rıza appear only on their intended nights',()=>{
 for(let n=1;n<=5;n++)for(const id of ['elif','riza'] as const){assert.equal(spiritAvailable(id,n,false),false);assert.equal(spiritAvailable(id,n,true),n>=(id==='elif'?4:5));}
});
