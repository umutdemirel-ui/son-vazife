import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {EVENTS,nextEvent,isNight,DAY_SECONDS} from '../src/game/dermanliEvents';
test('clock and proximity/gaze events are bounded and cannot repeat in same night',()=>{
 assert.equal(isNight(0),false);assert.equal(isNight(DAY_SECONDS/2),true);assert.equal(isNight(DAY_SECONDS),false);
 const e=EVENTS.find(e=>e.id==='school')!;const x=e.at[0],z=e.at[1]+3.5;
 assert.equal(nextEvent(3,x,z,0,new Set()),null);
 assert.equal(nextEvent(4,x,z,Math.PI,new Set()),null);
 assert.equal(nextEvent(4,x,z,0,new Set())?.id,'school');
 assert.equal(nextEvent(4,x,e.at[1]+6,0,new Set()),null,'must not trigger from outside the classroom');
 assert.equal(nextEvent(4,x,z,0,new Set(['4:school'])),null);
});

test('burial advances to a new dawn',async()=>{
 const {nextDawn}=await import('../src/game/dermanliEvents');
 assert.equal(nextDawn(130),DAY_SECONDS);assert.equal(isNight(nextDawn(130)),false);
 assert.equal(nextDawn(DAY_SECONDS),DAY_SECONDS*2);
});

test('visual village progression follows saved burials and the night phase',async()=>{
 const {villageNightVisuals}=await import('../src/game/dermanliEvents');
 assert.deepEqual(villageNightVisuals(1,false,false),{completed:0,litHome:-1,fountainFlowing:false});
 assert.deepEqual(villageNightVisuals(2,true,false),{completed:1,litHome:0,fountainFlowing:true});
 assert.deepEqual(villageNightVisuals(5,true,false),{completed:4,litHome:3,fountainFlowing:true});
 assert.equal(villageNightVisuals(5,false,true).completed,5);
});
test('village time follows active wall time even at low frame rates and pauses when inactive',async()=>{
 const {advanceVillageClock}=await import('../src/game/dermanliEvents');
 assert.equal(advanceVillageClock(10,.5,true),10.5);
 assert.equal(advanceVillageClock(10,4,false),10);
 assert.equal(advanceVillageClock(10,-1,true),10);
 assert.equal(advanceVillageClock(10,Infinity,true),10);
});

test('house apparition only triggers while looking at its front window on the second night',async()=>{
 const {DERMANLI_SITES:S}=await import('../src/game/dermanliMap');
 const [hx,hz]=S.abandonedHomes[0],x=hx-2.125;
 assert.equal(nextEvent(1,x,hz+5,0,new Set()),null);
 assert.equal(nextEvent(2,x,hz+5,Math.PI,new Set()),null);
 assert.equal(nextEvent(2,x,hz-2,Math.PI,new Set()),null);
 assert.equal(nextEvent(2,x,hz+5,0,new Set())?.id,'house');
 assert.equal(nextEvent(2,x,hz+5,0,new Set(['2:house'])),null);
});

test('square fountain event requires facing the fountain and is not repeated that night',async()=>{
 const {DERMANLI_SITES:S}=await import('../src/game/dermanliMap');
 const [x,z]=S.square;
 assert.equal(nextEvent(1,x,z+4,Math.PI,new Set()),null);
 assert.equal(nextEvent(1,x,z+4,0,new Set(),1.1),null,'looking up must not trigger a visual event');
 assert.equal(nextEvent(1,x,z+4,0,new Set())?.id,'square');
 assert.equal(nextEvent(1,x,z+4,0,new Set(['1:square'])),null);
});

test('well apparition requires night two and a view of the well',async()=>{
 const {DERMANLI_SITES:S}=await import('../src/game/dermanliMap');const [x,z]=S.well;
 assert.equal(nextEvent(1,x,z+4,0,new Set()),null);
 assert.equal(nextEvent(2,x,z+4,Math.PI,new Set()),null);
 assert.equal(nextEvent(2,x,z+4,0,new Set(),1),null);
 assert.equal(nextEvent(2,x,z+4,0,new Set())?.id,'well');
 assert.equal(nextEvent(2,x,z+4,0,new Set(['2:well'])),null);
});
