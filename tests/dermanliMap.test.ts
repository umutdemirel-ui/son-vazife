import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { DERMANLI_PATHS, DERMANLI_SITES, distanceToPath, dermanliHeight, mapPoint } from '../src/game/dermanliMap';

test('survey uses Blender metre scale and north orientation', () => {
  assert.deepEqual(mapPoint(190,280), [0,0]);
  assert.deepEqual(mapPoint(200,270), [3,-3]);
  assert.ok(DERMANLI_SITES.school[0] < 0 && DERMANLI_SITES.school[1] < 0);
  assert.ok(DERMANLI_SITES.mill[0] > 0 && DERMANLI_SITES.mill[1] < 0);
  assert.ok(DERMANLI_SITES.bridge[0] > 0);
});
test('closed ring, entrance and all surveyed paths remain in the new map', () => {
  const ids = DERMANLI_PATHS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const ring = DERMANLI_PATHS.find(p => p.id === 'halka')!;
  const entrance = DERMANLI_PATHS.find(p => p.id === 'giris')!;
  assert.equal(ring.closed, true);
  assert.ok(distanceToPath(...entrance.points[20], ring) < 0.01);
  for (const id of ['okul','kuyu','degirmen','orman','kopru','dere','gasilhane-mezarlik-kestirme','tarla-gassal-kestirme']) assert.ok(ids.includes(id));
});
test('village centre stays level and roads form valleys in the hills', () => {
  assert.equal(dermanliHeight(...DERMANLI_SITES.square), 0);
  const end = DERMANLI_PATHS.find(p => p.id === 'orman')!.points.at(-1)!;
  assert.equal(dermanliHeight(...end), 0);
  assert.ok(dermanliHeight(-65, 0) > 0);
});

test('standalone terrain builds one finite mesh per surveyed path and disposes safely', async () => {
  const { createDermanliTerrain } = await import('../src/game/dermanliTerrain');
  const terrain = createDermanliTerrain();
  assert.equal(terrain.root.children.length, DERMANLI_PATHS.length + 1);
  for (const mesh of terrain.root.children) {
    const position = (mesh as import('three').Mesh).geometry.getAttribute('position');
    assert.ok(Array.from(position.array).every(Number.isFinite));
  }
  terrain.dispose();
});

test('map landmarks match the actual mosque and cover the full movement area',async()=>{
 const {DERMANLI_BOUNDS:b}=await import('../src/game/dermanliMap');
 assert.equal(DERMANLI_SITES.mosque[0],DERMANLI_SITES.gasilhane[0]);
 assert.ok(Math.abs(DERMANLI_SITES.mosque[1]-DERMANLI_SITES.gasilhane[1]+5.7)<1e-9);
 for(const site of [DERMANLI_SITES.gasilhane,DERMANLI_SITES.mosque,DERMANLI_SITES.entrance,DERMANLI_SITES.well])assert.ok(site[0]>=b.minX&&site[0]<=b.maxX&&site[1]>=b.minZ&&site[1]<=b.maxZ);
});
