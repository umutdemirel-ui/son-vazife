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

test('home furniture colliders rotate with the house and leave the entrance clear', async () => {
  const { homeFurnitureColliders } = await import('../src/game/homes');
  for (const rotY of [0, Math.PI / 2, -Math.PI / 3]) {
    const spec = { x: 12, z: -8, rotY, w: 6, d: 5, h: 4, style: 'tas' as const };
    const colliders = homeFurnitureColliders(spec);
    const point = (x: number, z: number) => ({ x: spec.x + x * Math.cos(rotY) + z * Math.sin(rotY), z: spec.z - x * Math.sin(rotY) + z * Math.cos(rotY) });
    for (const [x, z] of [[0, -spec.d / 2 + 0.65], [spec.w / 2 - 0.55, -spec.d / 2 + 0.45]]) {
      const original = point(x, z), resolved = { ...original };
      colliders.forEach(c => pushOutsideBox(resolved, c, 0.25));
      assert.ok(Math.hypot(resolved.x - original.x, resolved.z - original.z) > 0.2);
    }
    const entrance = point(0, spec.d / 2), resolved = { ...entrance };
    colliders.forEach(c => pushOutsideBox(resolved, c, 0.25));
    assert.deepEqual(resolved, entrance);
  }
});
