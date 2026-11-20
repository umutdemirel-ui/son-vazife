import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {legacyArchiveFromSave,readLegacyArchive} from '../src/game/dermanliLegacyArchive';
import type {SaveGamePayload} from '../src/game/saveSystem';

test('legacy case summary only reveals completed case names and never mutates the save',()=>{
 const save={act:2,autopsyCases:{case_arif:{completed:true},case_mahmut:{completed:false},case_unknown:{completed:false}}} as unknown as SaveGamePayload;
 const before=JSON.stringify(save);assert.deepEqual(legacyArchiveFromSave(save),{act:2,completed:['Vaka I · Hacı Arif']});assert.equal(JSON.stringify(save),before);
 assert.equal(legacyArchiveFromSave(null),null);
});

test('reading legacy summary does not modify either game storage slot',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)};
 Object.defineProperty(globalThis,'window',{configurable:true,value:{localStorage:storage}});
 data.set('son_vazife_save_v2',JSON.stringify({version:2,act:2,playerPos:{x:0,z:0,yaw:0,pitch:0},autopsyCases:{case_arif:{completed:true}}}));
 data.set('son_vazife_dermanli_v1','new-save');const before=[...data];
 assert.deepEqual(readLegacyArchive(),{act:2,completed:['Vaka I · Hacı Arif']});assert.deepEqual([...data],before);
 data.set('son_vazife_save_v2','corrupt');assert.equal(readLegacyArchive(),null);
});
