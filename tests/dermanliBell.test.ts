import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bellHint,newBell,ringBell} from '../src/game/dermanliBell';
test('bell sequences differ per seed and feedback comes only after all three strikes',()=>{
 const orders=[[0,1,2],[0,2,1],[1,0,2],[2,1,0]];
 for(let seed=0;seed<4;seed++){
  const s=newBell(seed);assert.equal(ringBell(s,orders[seed][0]),'pending');assert.equal(ringBell(s,orders[seed][1]),'pending');assert.equal(ringBell(s,orders[seed][2]),'solved');assert.equal(ringBell(s,0),'already');
  assert.doesNotMatch(bellHint(seed),/\d/);
 }
 const wrong=newBell(0);ringBell(wrong,2);ringBell(wrong,1);assert.equal(ringBell(wrong,0),'wrong');assert.deepEqual(wrong.input,[]);
});
