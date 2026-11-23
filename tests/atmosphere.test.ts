import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { atmosphereTargets } from '../src/game/atmosphere';

test('visual day cycle is smooth and repeats without changing the gameplay clock', () => {
  const at = (s: number) => atmosphereTargets(s, 0, false, false, false);
  assert.equal(at(150).daylight, 1);
  assert.equal(at(450).daylight, 0);
  assert.ok(Math.abs(at(299.99).daylight - at(300.01).daylight) < 0.001);
  assert.ok(Math.abs(at(599.99).daylight - at(600.01).daylight) < 0.001);
  assert.deepEqual(at(150), at(750));
  assert.ok(at(150).key > at(450).key);
});

test('weather and interiors soften light without hiding nearby scenery', () => {
  const dry = atmosphereTargets(150, 0, false, false, false);
  const wet = atmosphereTargets(150, 1, false, false, false);
  const inside = atmosphereTargets(150, 1, true, false, false);
  assert.ok(wet.fog > dry.fog && wet.key < dry.key && wet.aperture < dry.aperture);
  assert.ok(inside.ambient < wet.ambient && inside.fog < wet.fog);
  for (const minimum of [true, false]) for (const low of [true, false]) {
    const { fog } = atmosphereTargets(450, 1, false, minimum, low);
    // At twenty metres at least half of the scene remains visible.
    assert.ok(Math.exp(-fog * fog * 20 * 20) > 0.5);
  }
});
