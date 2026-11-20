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

test('new villagers only appear by day at outdoor sites with distinct conversations',async()=>{
 const {OUTDOOR_RESIDENTS,outdoorResidentAvailable}=await import('../src/game/dermanliCharacters');
 const {DERMANLI_SITES:S}=await import('../src/game/dermanliMap');
 const {insideHome}=await import('../src/game/homes');
 assert.equal(outdoorResidentAvailable(false),true);assert.equal(outdoorResidentAvailable(true),false);
 assert.equal(new Set(Object.values(OUTDOOR_RESIDENTS).map(n=>n.line)).size,3);
 for(const villager of Object.values(OUTDOOR_RESIDENTS)){
  const [sx,sz]=S[villager.site],x=sx+villager.dx,z=sz+villager.dz;
  for(const [hx,hz,w,d] of [[...S.gassalHome,7,5],...[...S.abandonedHomes].map(([a,b])=>[a,b,6.5,5])]){
   const home={spec:{x:hx,z:hz,w,d,rotY:0}} as Parameters<typeof insideHome>[0];
   assert.equal(insideHome(home,x,z),false,`${villager.name} must not be inside a home`);
  }
  assert.ok(villager.line.includes(villager.name.split(' ').at(-1)!));
 }
});
