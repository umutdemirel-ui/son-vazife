import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {canReadClue} from '../src/game/dermanliClues';
test('the school record requires the solved bell puzzle; other records remain explorable',()=>{
 assert.equal(canReadClue('school',false),false);assert.equal(canReadClue('school',true),true);
 assert.equal(canReadClue('home',false),true);assert.equal(canReadClue('mosque',false),true);
});
