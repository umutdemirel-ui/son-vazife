import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {createGasilSouthWall} from '../src/game/gasilWindows';

test('mortuary south wall has two glazed openings, opaque surrounds and tiled UVs',()=>{
 const wall=new THREE.MeshStandardMaterial(),glass=new THREE.MeshStandardMaterial({transparent:true,side:THREE.DoubleSide}),wood=new THREE.MeshStandardMaterial(),metal=new THREE.MeshStandardMaterial();
 const root=new THREE.Group();createGasilSouthWall(root,wall,glass,wood,metal);root.updateMatrixWorld(true);
 for(const x of [-1.7,.63])for(const side of [-1,1]){
  const ray=new THREE.Raycaster(new THREE.Vector3(x+.13,2.31,4.4+side),new THREE.Vector3(0,0,-side),0,2);
  const hits=ray.intersectObject(root,true);assert.ok(hits.some(h=>(h.object as THREE.Mesh).material===glass));
  assert.ok(hits.every(h=>(h.object as THREE.Mesh).material===glass),'opening must not be backed by opaque wall or fake window');
 }
 const wallRay=new THREE.Raycaster(new THREE.Vector3(2,2.1,5),new THREE.Vector3(0,0,-1),0,2);
 assert.ok(wallRay.intersectObject(root,true).some(h=>(h.object as THREE.Mesh).material===wall));
 let tiled=false;root.traverse(o=>{if(o instanceof THREE.Mesh&&(o.material===wall)){const uv=o.geometry.getAttribute('uv');for(let i=0;i<uv.count;i++)if(uv.getX(i)>1.3||uv.getY(i)>1.3)tiled=true;}});assert.ok(tiled);
 root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});for(const m of [wall,glass,wood,metal])m.dispose();
});
