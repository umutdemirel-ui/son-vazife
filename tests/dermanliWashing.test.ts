import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {isScrubbing,newScrub,scrubStroke,SCRUB_STROKES} from '../src/game/dermanliWashing';
test('washing requires alternating manual strokes, not repeated input',()=>{
 let p=newScrub();p=scrubStroke(p,'left');p=scrubStroke(p,'left');assert.equal(p.strokes,1);
 p=scrubStroke(p,'right');p=scrubStroke(p,'left');assert.equal(p.strokes,3);
 p=scrubStroke(p,'right');assert.equal(p.strokes,SCRUB_STROKES);assert.equal(scrubStroke(p,'left').strokes,SCRUB_STROKES);
 assert.equal(isScrubbing(0),true);assert.equal(isScrubbing(2),true);assert.equal(isScrubbing(3),false);
});
