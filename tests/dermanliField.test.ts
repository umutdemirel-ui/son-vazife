import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import * as THREE from 'three';
import {FIELD_FURROW_HEIGHT,stalkCenterHeight} from '../src/game/dermanliField';

test('tilted stalks touch the raised furrow using real geometry vertices',()=>{
 const geo=new THREE.ConeGeometry(.035,.65,4),vertices=geo.getAttribute('position');
 for(let angle=-.12;angle<=.12;angle+=.01){
  const matrix=new THREE.Matrix4().makeRotationZ(angle);matrix.setPosition(0,stalkCenterHeight(geo,angle,FIELD_FURROW_HEIGHT),0);
  let lowest=Infinity;const v=new THREE.Vector3();
  for(let i=0;i<vertices.count;i++){v.fromBufferAttribute(vertices,i).applyMatrix4(matrix);lowest=Math.min(lowest,v.y);}
  assert.ok(Math.abs(lowest-FIELD_FURROW_HEIGHT)<1e-8);
 }
 geo.dispose();
});
