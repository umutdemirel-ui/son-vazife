import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {DERMANLI_FLOORS,dermanliBuildingFloorHeight} from '../src/game/dermanliFloors';
import {dermanliSurfaceHeight} from '../src/game/dermanliTerrain';

test('each building floor covers its centre and terrain elsewhere remains unchanged',()=>{
 assert.equal(new Set(DERMANLI_FLOORS.map(f=>f.id)).size,10);
 for(const f of DERMANLI_FLOORS){
  const x=f.site[0]+(f.minX+f.maxX)/2,z=f.site[1]+(f.minZ+f.maxZ)/2;
  assert.ok(dermanliBuildingFloorHeight(x,z,dermanliSurfaceHeight(x,z))>=dermanliSurfaceHeight(...f.site)+f.height-1e-6,f.id);
 }
 for(const [x,z] of [[0,0],[-65,0],[65,23]])assert.equal(dermanliBuildingFloorHeight(x,z,dermanliSurfaceHeight(x,z)),dermanliSurfaceHeight(x,z));
});
