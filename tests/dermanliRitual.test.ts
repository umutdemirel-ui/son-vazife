import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {interactRitual,leaveUnwatched,newRitual,workProblem} from '../src/game/dermanliRitual';
const act=(s:ReturnType<typeof newRitual>,id:string,night=true)=>interactRitual(s,id,night,true);
test('washing requires a lit candle and deliberate work',()=>{const s=newRitual();act(s,'arrival');act(s,'slab');assert.match(interactRitual(s,'slab',true,true),/mumunu yak/);assert.equal(s.stage,0);act(s,'candle');assert.match(interactRitual(s,'slab'),/basılı tut/);assert.equal(s.stage,0);act(s,'slab');assert.equal(s.stage,1);});
test('manual work checks candle, required equipment and dirty water before starting',()=>{
 const s=newRitual();act(s,'arrival');act(s,'slab');assert.match(workProblem(s)!,/mumunu yak/);act(s,'candle');assert.equal(workProblem(s),null);
 act(s,'slab');assert.match(workProblem(s)!,/Sabunu al/);act(s,'soap');assert.equal(workProblem(s),null);
 act(s,'slab');assert.match(workProblem(s)!,/Sabunu bırak/);act(s,'soap');assert.equal(workProblem(s),null);
 s.dirty=true;assert.match(workProblem(s)!,/kirli su/);
});
test('separate tools and two-handed washing enforce the ritual and safe disposal',()=>{
 const s=newRitual(); act(s,'arrival');act(s,'slab');act(s,'candle');act(s,'slab');
 act(s,'soap');act(s,'slab');assert.equal(s.stage,1);act(s,'slab');assert.equal(s.stage,1);act(s,'soap');act(s,'slab');
 act(s,'soap');act(s,'slab');act(s,'soap');act(s,'slab');assert.equal(s.stage,3);
 act(s,'ewer');act(s,'slab');assert.equal(s.dirty,true);act(s,'slab');assert.equal(s.stage,4);act(s,'ewer');act(s,'bucket');act(s,'drain');assert.equal(s.dirty,false);
 act(s,'camphor');act(s,'slab');act(s,'camphor');act(s,'shroud');act(s,'slab');act(s,'shroud');act(s,'slab');assert.equal(s.body,'burialCarry');act(s,'cemetery');assert.equal(s.night,2);
});
test('unwatched body and outside disposal penalize once',()=>{const s=newRitual();act(s,'arrival');act(s,'slab');assert.equal(leaveUnwatched(s),true);assert.equal(leaveUnwatched(s),false);s.dirty=true;act(s,'bucket');act(s,'discard');assert.equal(s.violations,2);});
test('escape and final endings are explicit',()=>{const s=newRitual();act(s,'forest');assert.equal(s.ending,'escape');const n=newRitual();n.night=5;n.body='burialCarry';n.clues=['home','school','mill','well','cemetery'];act(n,'cemetery');assert.equal(n.ending,'peace');});
test('all five nights advance only after the body is wrapped and buried',()=>{
 const s=newRitual();s.clues=['home','mill','school','well','cemetery'];
 for(let night=1;night<=5;night++){
  assert.equal(s.night,night);act(s,'arrival');act(s,'slab');act(s,'candle');act(s,'slab');
  for(let side=0;side<2;side++){act(s,'soap');act(s,'slab');act(s,'soap');act(s,'slab');}
  act(s,'ewer');act(s,'slab');act(s,'ewer');act(s,'bucket');act(s,'drain');act(s,'camphor');act(s,'slab');act(s,'camphor');act(s,'shroud');act(s,'slab');act(s,'shroud');act(s,'slab');act(s,'cemetery');
 }
 assert.equal(s.ending,'peace'); assert.equal(s.violations,0);
});
test('missed records or careless handling choose the dark ending',()=>{
 const s=newRitual();s.night=5;s.body='burialCarry';act(s,'cemetery');assert.equal(s.ending,'dark');
 const t=newRitual();t.night=5;t.body='burialCarry';t.clues=['home','school','mill','well','cemetery'];t.violations=1;act(t,'cemetery');assert.equal(t.ending,'dark');
});
test('a new funeral arrives at night, not during the day',()=>{
 const s=newRitual();assert.match(act(s,'arrival',false),/gece/);assert.equal(s.body,'arrival');act(s,'arrival',true);assert.equal(s.body,'carrying');
});
