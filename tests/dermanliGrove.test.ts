import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {PINE_SPRITE_HEIGHT,PINE_TRANSPARENT_MARGIN,pineGroundInset} from '../src/game/dermanliGrove';

test('pine sprite inset compensates only the transparent bottom margin and scales with tree',()=>{
 assert.ok(PINE_TRANSPARENT_MARGIN>0&&PINE_TRANSPARENT_MARGIN<.01);
 assert.ok(pineGroundInset(1)>.02&&pineGroundInset(1)<.05);
 assert.equal(pineGroundInset(.8),PINE_SPRITE_HEIGHT*PINE_TRANSPARENT_MARGIN*.8);
 assert.equal(pineGroundInset(1.2),PINE_SPRITE_HEIGHT*PINE_TRANSPARENT_MARGIN*1.2);
});
