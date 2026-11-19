import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {DermanliThreat} from '../src/game/dermanliThreat';
test('night pursuer respects safe areas, obstacles and hit cooldown',()=>{
 const t=new DermanliThreat(), p={x:0,z:0,yaw:0};
 t.tick(36,true,false,p,[]);assert.equal(t.active,true);
 assert.equal(t.tick(.1,true,true,p,[]),'none');assert.equal(t.active,false);
 t.tick(20,true,false,p,[]);t.x=0;t.z=1;
 assert.equal(t.tick(.1,true,false,p,[]),'hit');assert.equal(t.active,false);
 t.active=true;t.x=0;t.z=1;
 assert.equal(t.tick(.1,true,false,p,[]),'none');
});
