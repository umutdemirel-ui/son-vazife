import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {spiritAvailable} from '../src/game/dermanliCharacters';
test('Elif and Rıza appear only outdoors at their story night',()=>{
 assert.equal(spiritAvailable('elif',3,true),false);assert.equal(spiritAvailable('elif',4,false),false);assert.equal(spiritAvailable('elif',4,true),true);
 assert.equal(spiritAvailable('riza',4,true),false);assert.equal(spiritAvailable('riza',5,true),true);
});

test('legacy characters appear only as outdoor night memories from the second night',async()=>{
 const {memoryAvailable,RESIDENT_MEMORIES}=await import('../src/game/dermanliCharacters');
 assert.equal(memoryAvailable(1,true),false);assert.equal(memoryAvailable(2,false),false);assert.equal(memoryAvailable(2,true),true);
 assert.deepEqual(Object.keys(RESIDENT_MEMORIES).sort(),['bekci','idris','kenan','serife']);
 for(const memory of Object.values(RESIDENT_MEMORIES))assert.ok(memory.line.includes(memory.name));
});
