import { strict as assert } from 'node:assert';
import test from 'node:test';
import { armSwing, createWorkHands } from '../src/game/handRig';

test('first-person arms have articulated fingers and speed-dependent movement', () => {
  const rig = createWorkHands();
  assert.ok(rig.getObjectByName('Sol el'));
  assert.ok(rig.getObjectByName('Sağ el'));
  let fingers = 0;
  rig.traverse(o => { if (o.name === 'parmak') fingers++; });
  assert.equal(fingers, 8);
  assert.equal(armSwing(Math.PI, 0, false, false).swing, 0);
  const walk = armSwing(Math.PI, 3.7, false, false).swing;
  const run = armSwing(Math.PI, 5.2, true, false).swing;
  const held = armSwing(Math.PI, 3.7, false, true).swing;
  assert.ok(run > walk && walk > held && held > 0);
  assert.ok(armSwing(3 * Math.PI, 5.2, true, false).swing < 0);
});
