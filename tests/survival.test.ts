import assert from 'node:assert/strict';
import { test } from 'node:test';
import { atEscapePoint, SECONDS_PER_DAY, survivalDay } from '../src/game/survival';
import { readAutoSave } from '../src/game/saveSystem';

test('survival days advance only after a complete active day and the exit is bounded', () => {
  assert.equal(survivalDay(0), 1);
  assert.equal(survivalDay(SECONDS_PER_DAY - 0.1), 1);
  assert.equal(survivalDay(SECONDS_PER_DAY), 2);
  assert.equal(atEscapePoint(59, 34), true);
  assert.equal(atEscapePoint(55, 34), false);
});

test('malformed saved positions and survival values are rejected', () => {
  let value = '';
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: () => value } },
  });
  const base = { version: 2, act: 1, playerPos: { x: 0, z: 0, yaw: 0, pitch: 0 } };
  for (const change of [
    { playerPos: { x: 'oops', z: 0, yaw: 0, pitch: 0 } },
    { caughtCount: 3 },
    { survivalSeconds: -1 },
    { cluesDiscovered: {} },
    { npcFlags: { bekci: {} } },
    { npcTrust: { bekci: 'high' } },
    { playerGlossaryNotes: {} },
  ]) {
    value = JSON.stringify({ ...base, ...change });
    assert.equal(readAutoSave(), null);
  }
  value = JSON.stringify(base);
  assert.ok(readAutoSave());
});

test('evening follows the active day clock, repeating at the next dawn', async () => {
  const { isEvening, SECONDS_PER_DAY } = await import('../src/game/survival');
  assert.equal(isEvening(0), false);
  assert.equal(isEvening(SECONDS_PER_DAY / 2 - 0.01), false);
  assert.equal(isEvening(SECONDS_PER_DAY / 2), true);
  assert.equal(isEvening(SECONDS_PER_DAY), false);
  assert.equal(isEvening(SECONDS_PER_DAY * 1.75), true);
});
