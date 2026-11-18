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
