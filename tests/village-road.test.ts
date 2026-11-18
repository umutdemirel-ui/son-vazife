import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { MAIN_LANES, MAIN_ROAD_POINTS, mainRoadX, reservedGround } from '../src/game/valley';

test('the visible road centre, surveyed segments and vegetation clearing share one spine', () => {
  assert.equal(MAIN_LANES.length, MAIN_ROAD_POINTS.length - 1);
  for (const [ax, az, bx, bz] of MAIN_LANES) {
    assert.equal(mainRoadX(az), ax);
    assert.equal(mainRoadX(bz), bx);
    const z = (az + bz) / 2;
    assert.ok(Math.abs(mainRoadX(z) - (ax + bx) / 2) < 1e-10);
    assert.ok(reservedGround(mainRoadX(z), z));
  }
});

test('the surveyed side roads form one connected network', async () => {
  const { CORE_LANES, OUTER_LANES } = await import('../src/game/valley');
  const roads = [...MAIN_LANES, ...CORE_LANES, ...OUTER_LANES];
  const distanceToSegment = (x: number, z: number, [a, b, c, d]: readonly number[]) => {
    const dx = c - a, dz = d - b;
    const t = Math.max(0, Math.min(1, ((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - a - t * dx, z - b - t * dz);
  };
  const connected = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < roads.length; i++) {
      if (connected.has(i)) continue;
      const r = roads[i];
      if ([...connected].some(j => {
        const s = roads[j], tolerance = (r[4] + s[4]) / 2;
        return Math.min(distanceToSegment(r[0], r[1], s), distanceToSegment(r[2], r[3], s),
          distanceToSegment(s[0], s[1], r), distanceToSegment(s[2], s[3], r)) <= tolerance;
      })) { connected.add(i); changed = true; }
    }
  }
  assert.deepEqual(roads.filter((_, i) => !connected.has(i)), []);
});
