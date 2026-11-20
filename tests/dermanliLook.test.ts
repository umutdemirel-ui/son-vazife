import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {applyLookDelta,advanceLook} from '../src/game/dermanliLook';

test('mouse sensitivity, inversion and clamped pitch compose with smoothing',()=>{
 const origin={yaw:0,pitch:0};
 const normal=applyLookDelta(origin,100,100,1,false),inverted=applyLookDelta(origin,100,100,2,true);
 assert.ok(Math.abs(normal.yaw+.22)<1e-9&&Math.abs(normal.pitch+.22)<1e-9);
 assert.ok(Math.abs(inverted.yaw+.44)<1e-9&&Math.abs(inverted.pitch-.44)<1e-9);
 assert.equal(applyLookDelta(origin,0,100000,1,false).pitch,-1.3);
 assert.equal(applyLookDelta(origin,0,100000,1,true).pitch,1.3);
 assert.deepEqual(advanceLook(origin,normal,.016,false),normal);
 const one=advanceLook(origin,normal,.1,true),half=advanceLook(advanceLook(origin,normal,.05,true),normal,.05,true);
 assert.ok(Math.abs(one.yaw-half.yaw)<1e-10&&Math.abs(one.pitch-half.pitch)<1e-10);
 assert.ok(one.yaw>normal.yaw&&one.yaw<0);
});
