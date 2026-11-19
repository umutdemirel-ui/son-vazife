import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {spiritAvailable} from '../src/game/dermanliCharacters';
test('Elif and Rıza appear only outdoors at their story night',()=>{
 assert.equal(spiritAvailable('elif',3,true),false);assert.equal(spiritAvailable('elif',4,false),false);assert.equal(spiritAvailable('elif',4,true),true);
 assert.equal(spiritAvailable('riza',4,true),false);assert.equal(spiritAvailable('riza',5,true),true);
});
