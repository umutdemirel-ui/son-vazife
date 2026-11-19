import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { requiredWashTool, washInstruction } from '../src/game/washing';
import { readAutoSave } from '../src/game/saveSystem';

test('wash requires empty hands, soap, empty hands, then clean water', () => {
  assert.equal(requiredWashTool(0, false), 'empty');
  for (const stage of [1, 2]) {
    assert.equal(requiredWashTool(stage, false), 'soap');
    assert.equal(requiredWashTool(stage, true), 'empty');
    assert.match(washInstruction(stage, true), /iki elle/);
  }
  assert.equal(requiredWashTool(3, false), 'ewer');
});

test('held dirty water is accepted only when a full basin is pending', () => {
  let value = '';
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: () => value } } });
  const save = { version: 2, act: 2, playerPos: { x: 0, z: 0, yaw: 0, pitch: 0 }, ritual: { heldWashTool: 'dirty', dirtyReady: true, dirtyDrained: false } };
  value = JSON.stringify(save); assert.ok(readAutoSave());
  value = JSON.stringify({ ...save, ritual: { ...save.ritual, dirtyDrained: true } }); assert.equal(readAutoSave(), null);
  value = JSON.stringify({ ...save, ritual: { ...save.ritual, heldWashTool: 'unknown' } }); assert.equal(readAutoSave(), null);
  value = JSON.stringify({ ...save, ritual: { ...save.ritual, heldWashTool: 'soap', soapAppliedFor: 'arif' } }); assert.ok(readAutoSave());
});
