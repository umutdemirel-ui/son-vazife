import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {buildHome,HOME_FLOOR_HEIGHT} from '../src/game/homes';
import {pushOutsideBox} from '../src/game/collision';
import type {VillageCraft} from '../src/game/villageCraft';

test('Dermanlı home windows are actual openings but remain collision-safe',()=>{
 const stone=new THREE.MeshStandardMaterial(),wood=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.3,side:THREE.DoubleSide});
 const craft={wood,masonry:stone,lime:[stone],earthen:stone,limestone:stone,shutters:[wood],windowGlass:glass,roofVariants:[stone],metalRoof:stone,door:wood,kilim:stone,metal:wood,plate:()=>{},window:()=>{}} as unknown as VillageCraft;
 for(const use of ['gassal','abandoned'] as const){
   const {home,walls}=buildHome({x:0,z:0,rotY:0,w:6.5,d:5,h:3,style:'tas'},3,0,craft,use);
   home.root.updateMatrixWorld(true);
   const floor=new THREE.Raycaster(new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0)).intersectObject(home.root,true);
   assert.ok(Math.abs(floor[0].point.y-HOME_FLOOR_HEIGHT)<1e-6);
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

test('house walking height follows the actual floor, including rotated buildings',async()=>{
 const {dermanliWalkingHeight}=await import('../src/game/dermanliBridge');
 const stone=new THREE.MeshStandardMaterial(),wood=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,side:THREE.DoubleSide});
 const craft={wood,masonry:stone,lime:[stone],earthen:stone,limestone:stone,shutters:[wood],windowGlass:glass,roofVariants:[stone],metalRoof:stone,door:wood,kilim:stone,metal:wood,plate:()=>{},window:()=>{}} as unknown as VillageCraft;
 for(const rotation of [0,Math.PI/3]){
  const spec={x:0,z:0,rotY:rotation,w:6.5,d:5,h:3,style:'tas' as const};
  const {home}=buildHome(spec,3,0,craft,'gassal');home.root.updateMatrixWorld(true);
  const local=new THREE.Vector3(0,0,1.8),world=local.applyMatrix4(home.root.matrixWorld);
  const hits=new THREE.Raycaster(new THREE.Vector3(world.x,.5,world.z),new THREE.Vector3(0,-1,0)).intersectObject(home.root,true);
  assert.ok(hits.length>0);assert.ok(Math.abs(dermanliWalkingHeight(world.x,world.z,[home])-hits[0].point.y)<1e-6);
  const outside=new THREE.Vector3(0,0,3.2).applyMatrix4(home.root.matrixWorld);
  assert.equal(dermanliWalkingHeight(outside.x,outside.z,[home]),dermanliWalkingHeight(outside.x,outside.z));
  home.root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
 }
 stone.dispose();wood.dispose();glass.dispose();
});

test('gassal, school and abandoned side windows are transparent and collision-safe',()=>{
 const stone=new THREE.MeshStandardMaterial(),wood=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.3,side:THREE.DoubleSide});
 const craft={wood,masonry:stone,lime:[stone],earthen:stone,limestone:stone,shutters:[wood],windowGlass:glass,roofVariants:[stone],metalRoof:stone,door:wood,kilim:stone,metal:wood,plate:()=>{},window:()=>{}} as unknown as VillageCraft;
 for(const use of ['gassal','school','abandoned'] as const){
  const width=use==='school'?8:7,depth=use==='school'?6:5;
  const {home,walls}=buildHome({x:0,z:0,rotY:0,w:width,d:depth,h:3,style:'tas'},0,0,craft,use);home.root.updateMatrixWorld(true);
  for(const side of [-1,1]){
   const ray=new THREE.Raycaster(new THREE.Vector3(0,1.8,-.8),new THREE.Vector3(side,0,0),0,width/2+.3);
   const hits=ray.intersectObject(home.root,true);assert.ok(hits.some(h=>(h.object as THREE.Mesh).material===glass),`${use} missing glazing`);
   assert.ok(hits.every(h=>(h.object as THREE.Mesh).material===glass),`${use} side opening blocked by an opaque wall`);
   const p={x:side*width/2,z:-.8};for(const wall of walls)pushOutsideBox(p,wall,.32);
   assert.notEqual(p.x,side*width/2,`${use} glass should block player movement`);
  }
  home.root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
 }
 stone.dispose();wood.dispose();glass.dispose();
});

test('gassal and school rear windows have visible glass and retain collision',()=>{
 const stone=new THREE.MeshStandardMaterial(),wood=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.3,side:THREE.DoubleSide});
 const craft={wood,masonry:stone,lime:[stone],earthen:stone,limestone:stone,shutters:[wood],windowGlass:glass,roofVariants:[stone],metalRoof:stone,door:wood,kilim:stone,metal:wood,plate:()=>{},window:()=>{}} as unknown as VillageCraft;
 for(const use of ['gassal','school'] as const){
  const w=use==='school'?8:7,d=use==='school'?6:5;
  const {home,walls}=buildHome({x:0,z:0,rotY:0,w,d,h:3,style:'tas'},0,0,craft,use);home.root.updateMatrixWorld(true);
  for(const side of [-1,1]){
   const x=side*w*.32+.16,ray=new THREE.Raycaster(new THREE.Vector3(x,1.8,0),new THREE.Vector3(0,0,-1),0,d/2+.3);
   const hits=ray.intersectObject(home.root,true);assert.ok(hits.some(h=>(h.object as THREE.Mesh).material===glass),`${use} rear glazing missing`);
   assert.ok(hits.every(h=>(h.object as THREE.Mesh).material===glass),`${use} rear glazing blocked`);
   const p={x,z:-d/2};for(const wall of walls)pushOutsideBox(p,wall,.32);assert.notEqual(p.z,-d/2);
  }
  home.root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
 }
 stone.dispose();wood.dispose();glass.dispose();
});
