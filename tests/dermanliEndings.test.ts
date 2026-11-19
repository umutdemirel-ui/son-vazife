import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {ENDING_BEATS,ENDING_TITLES} from '../src/game/dermanliEndings';
test('three distinct endings retain their narrative beats and the peace bridge scene',()=>{
 for(const id of ['peace','dark','escape'] as const){assert.ok(ENDING_BEATS[id].length>=2);assert.ok(ENDING_TITLES[id]);assert.ok(ENDING_BEATS[id].every(beat=>beat.text.length>20));}
 assert.equal(ENDING_BEATS.peace[0].scene,'mortuary');assert.equal(ENDING_BEATS.peace.at(-1)?.scene,'bridge');
 assert.equal(ENDING_BEATS.dark.at(-1)?.scene,'dark');assert.equal(ENDING_BEATS.escape.at(-1)?.scene,'entrance');
});
