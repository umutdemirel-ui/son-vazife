import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {HorrorAudioEngine} from '../src/game/audio';

test('ghost bridge footsteps schedule three quiet delayed tones and respect mute',()=>{
 const calls:number[]=[],param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const ctx={currentTime:10,createOscillator:()=>({type:'',frequency:param,connect(){},start(t:number){calls.push(t);},stop(){}}),createGain:()=>({gain:param,connect(){}})};
 const audio=new HorrorAudioEngine() as unknown as {ctx:unknown;masterGain:unknown;muted:boolean;playGhostFootsteps:()=>void};
 audio.ctx=ctx;audio.masterGain={};audio.playGhostFootsteps();assert.deepEqual(calls,[10.12,10.68,11.24]);
 audio.muted=true;audio.playGhostFootsteps();assert.equal(calls.length,3);
});
