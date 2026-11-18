import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { migrateOldHomePosition } from '../src/game/homeMigration';
import type { Home } from '../src/game/homes';

test('old save inside a moved home follows the same local coordinates; outdoor saves stay put', () => {
  const homes = [{ spec: { x: 12.5, z: 2, rotY: -Math.PI / 2, w: 6.2, d: 5.4, h: 4.3, style: 'cumba' } }] as Pick<Home, 'spec'>[];
  assert.deepEqual(migrateOldHomePosition(10.6, 2, homes), { x: 12.5, z: 2 });
  assert.deepEqual(migrateOldHomePosition(0, 0, homes), { x: 0, z: 0 });
  const p = migrateOldHomePosition(11.6, 2, homes);
  assert.ok(Math.abs(p.x - 13.5) < 1e-8 && Math.abs(p.z - 2) < 1e-8);
});

test('revision one save follows a relocated home without changing outdoor coordinates', () => {
  const homes = [{ spec: { x: 13.5, z: 3.5, rotY: -Math.PI / 2, w: 6.2, d: 5.4, h: 4.3, style: 'cumba' } }] as Pick<Home, 'spec'>[];
  assert.deepEqual(migrateOldHomePosition(12.5, 2, homes, 1), { x: 13.5, z: 3.5 });
  assert.deepEqual(migrateOldHomePosition(0, 0, homes, 1), { x: 0, z: 0 });
});

test('old outpost and platform saves move with their sites', async () => {
  const { migrateOutpostPosition } = await import('../src/game/homeMigration');
  assert.deepEqual(migrateOutpostPosition(46, -60), { x: 43, z: -65 });
  assert.deepEqual(migrateOutpostPosition(59, 34), { x: 60, z: 49 });
  assert.deepEqual(migrateOutpostPosition(-54, 43), { x: -56, z: 51 });
  assert.deepEqual(migrateOutpostPosition(0, 0), { x: 0, z: 0 });
});
