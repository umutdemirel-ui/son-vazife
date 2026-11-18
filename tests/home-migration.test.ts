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
