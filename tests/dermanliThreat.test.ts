import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {DermanliThreat} from '../src/game/dermanliThreat';
test('pursuer cannot damage through a wall even at close range',()=>{
 const threat=new DermanliThreat();threat.active=true;threat.x=-.4;threat.z=0;
 const wall={minX:-.05,maxX:.05,minZ:-1,maxZ:1};
 assert.equal(threat.tick(.01,true,false,{x:.4,z:0,yaw:0},[wall]),'none');
 assert.equal(threat.tick(.01,true,false,{x:.4,z:0,yaw:0},[]),'hit');
});
test('night pursuer respects safe areas, obstacles and hit cooldown',()=>{
 const t=new DermanliThreat(), p={x:0,z:0,yaw:0};
 t.tick(36,true,false,p,[]);assert.equal(t.active,true);
 assert.equal(t.tick(.1,true,true,p,[]),'none');assert.equal(t.active,false);
 t.tick(20,true,false,p,[]);t.x=0;t.z=1;
 assert.equal(t.tick(.1,true,false,p,[]),'hit');assert.equal(t.active,false);
 t.active=true;t.x=0;t.z=1;
 assert.equal(t.tick(.1,true,false,p,[]),'none');
});
