import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {buildHome} from '../src/game/homes';
import {pushOutsideBox} from '../src/game/collision';
import type {VillageCraft} from '../src/game/villageCraft';

test('Dermanlı home windows are actual openings but remain collision-safe',()=>{
 const stone=new THREE.MeshStandardMaterial(),wood=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.3,side:THREE.DoubleSide});
 const craft={wood,masonry:stone,lime:[stone],earthen:stone,limestone:stone,shutters:[wood],windowGlass:glass,roofVariants:[stone],metalRoof:stone,door:wood,kilim:stone,metal:wood,plate:()=>{},window:()=>{}} as unknown as VillageCraft;
 for(const use of ['gassal','abandoned'] as const){
   const {home,walls}=buildHome({x:0,z:0,rotY:0,w:6.5,d:5,h:3,style:'tas'},3,0,craft,use);
   home.root.updateMatrixWorld(true);
   const ray=new THREE.Raycaster(new THREE.Vector3(2.375,1.77,0),new THREE.Vector3(0,0,1));
   const hits=ray.intersectObject(home.root,true).filter(hit=>hit.distance<2.8);
   assert.ok(hits.some(hit=>(hit.object as THREE.Mesh).material===glass),`${use} glass is visible from inside`);
   assert.ok(hits.every(hit=>(hit.object as THREE.Mesh).material===glass),`${use} window blocked by an opaque wall`);
   const point={x:2.375,z:2.5};for(const wall of walls)pushOutsideBox(point,wall,.32);
   assert.notEqual(point.z,2.5,'player cannot walk through glazing');
   home.root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
 }
 stone.dispose();wood.dispose();glass.dispose();
});
