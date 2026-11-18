import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { pushOutsideBox, translateColliders } from '../src/game/collision';

test('local building walls follow a relocated anchor without changing their doorway', () => {
  const walls = [
    { minX: -3.4, maxX: -2.95, minZ: -3.2, maxZ: -0.8 },
    { minX: -3.4, maxX: -2.95, minZ: 0.8, maxZ: 3.2 },
  ];
  const placed = translateColliders({ x: 20, z: 30 }, walls);
  assert.deepEqual(placed[0], { minX: 16.6, maxX: 17.05, minZ: 26.8, maxZ: 29.2 });
  const doorway = { x: 16.85, z: 30 };
  placed.forEach(wall => pushOutsideBox(doorway, wall, 0.25));
  assert.deepEqual(doorway, { x: 16.85, z: 30 });
  const wallPoint = { x: 16.85, z: 28 };
  placed.forEach(wall => pushOutsideBox(wallPoint, wall, 0.25));
  assert.notDeepEqual(wallPoint, { x: 16.85, z: 28 });
  assert.equal(walls[0].minX, -3.4);
});
