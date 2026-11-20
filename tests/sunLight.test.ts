import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import * as THREE from 'three';
import { positionSunLight } from '../src/game/sunLight';

test('sun shadow follows the player without changing sunlight direction', () => {
  const sun=new THREE.DirectionalLight();
  positionSunLight(sun,0,0,150,1);
  const direction=sun.position.clone().sub(sun.target.position);
  positionSunLight(sun,65.2,-47.8,150,1);
  assert.deepEqual(sun.position.clone().sub(sun.target.position).toArray(),direction.toArray());
  assert.ok(Math.abs(sun.target.position.x-65.2)<=.25);
  assert.ok(Math.abs(sun.target.position.z+47.8)<=.25);
  const previous=sun.target.position.clone();
  positionSunLight(sun,65.21,-47.79,150,1);
  assert.deepEqual(sun.target.position.toArray(),previous.toArray());
});
