import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {clearDermanliSave,readDermanliSave,writeDermanliSave} from '../src/game/dermanliSave';
import {newRitual} from '../src/game/dermanliRitual';
test('new-map saves validate and never overwrite legacy storage',()=>{
 const data=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)}});
 data.set('son_vazife_save_v2','legacy');
 const save={version:1 as const,ritual:newRitual(),x:0,z:0,yaw:0,pitch:0};assert.equal(writeDermanliSave(save),true);assert.deepEqual(readDermanliSave(),save);
 data.set('son_vazife_dermanli_v1',JSON.stringify({...save,ritual:{...save.ritual,stage:99}}));assert.equal(readDermanliSave(),null);
 clearDermanliSave();assert.equal(data.get('son_vazife_save_v2'),'legacy');
});
