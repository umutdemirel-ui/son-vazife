import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {EVENTS,nextEvent,isNight,DAY_SECONDS} from '../src/game/dermanliEvents';
test('clock and proximity/gaze events are bounded and cannot repeat in same night',()=>{
 assert.equal(isNight(0),false);assert.equal(isNight(DAY_SECONDS/2),true);assert.equal(isNight(DAY_SECONDS),false);
 const e=EVENTS.find(e=>e.id==='school')!;const x=e.at[0],z=e.at[1]+4;
 assert.equal(nextEvent(3,x,z,0,new Set()),null);
 assert.equal(nextEvent(4,x,z,Math.PI,new Set()),null);
 assert.equal(nextEvent(4,x,z,0,new Set())?.id,'school');
 assert.equal(nextEvent(4,x,z,0,new Set(['4:school'])),null);
});
