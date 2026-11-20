import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import type {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {NightArt,watcherFigure} from '../src/game/nightArt';

test('animated watcher feet remain on ground at different stride phases',async()=>{
 const template=new THREE.Group(),mat=new THREE.MeshStandardMaterial();
 for(const [name,x] of [['bootL',.12],['bootR',-.12]] as const){const geo=new THREE.BoxGeometry(.2,.74,.3).translate(x,.37,0),mesh=new THREE.Mesh(geo,mat);mesh.name=name;template.add(mesh);}
 const loader={loadAsync:async()=>({scene:template})} as unknown as Pick<GLTFLoader,'loadAsync'>;
 const art=new NightArt(true,()=>{},loader),figure=watcherFigure(art,'karabasma',new THREE.Group(),true);
 figure.root.position.set(11,7.3,-5);await art.request('karabasma');
 for(const following of [false,true])for(let t=0;t<8;t+=.17){
  figure.pose(t,following);figure.root.updateWorldMatrix(true,true);let min=Infinity;const v=new THREE.Vector3();
  for(const name of ['bootL','bootR']){const m=figure.root.getObjectByName(name) as THREE.Mesh,points=m.geometry.getAttribute('position');for(let i=0;i<points.count;i++){v.fromBufferAttribute(points,i).applyMatrix4(m.matrixWorld);min=Math.min(min,v.y);}}
  assert.ok(Math.abs(min-7.3)<.00001,`foot at ${min} while surface is 7.3`);
 }
 art.dispose();
});
