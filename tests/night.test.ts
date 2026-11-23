import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AUTOPSY_LAYER, createAutopsyCadaverOverlay } from '../src/game/autopsy';
import { houseFootprint } from '../src/game/collision';
import { NightArt, NIGHT_MODELS, nightUrl } from '../src/game/nightArt';
import { NightPatrol, wallBetween } from '../src/game/nightPatrol';
import {
  FIELD_CLUES,
  NIGHT_ORDER,
  PAGES,
  correctPage,
  nextNightPage,
  nightAct,
  nightStealthPrompt,
} from '../src/game/nightWatch';
import { groundHeightAt } from '../src/game/terrain';
import { INITIAL_CLUES } from '../src/game/types';
import {
  LANDMARKS,
  OUTER_HOMES,
  OUTER_LANES,
  OUTPOSTS,
  VALLEY,
  districtAt,
  insideOutpost,
  reservedGround,
} from '../src/game/valley';
import { WorkshopAssets } from '../src/game/workshopAssets';

function glb(url: string) {
  const data = readFileSync(new URL(`../public${url}`, import.meta.url));
  assert.equal(data.toString('ascii', 0, 4), 'glTF');
  assert.equal(data.readUInt32LE(8), data.length);
  const end = 20 + data.readUInt32LE(12);
  return {
    doc: JSON.parse(data.toString('utf8', 20, end)),
    bin: data.subarray(end + 8),
    size: data.length,
  };
}

test('recorded evidence determines the next chapter, independent of optional notes or rereads', () => {
  const found = new Set<string>(FIELD_CLUES.map((c) => c.id));
  const has = (id: string) => found.has(id);
  for (const id of NIGHT_ORDER) {
    assert.equal(INITIAL_CLUES.filter((c) => c.id === id && !c.discovered).length, 1);
    assert.equal(nextNightPage(has), id);
    assert.equal(nightAct(has), PAGES[id].act);
    const answer = PAGES[id].answer ?? (id === 'night_call' ? [0] : []);
    assert.ok(correctPage(id, answer));
    assert.ok(!correctPage(id, [...answer, 9]));
    if (answer.length && id !== 'night_call') assert.ok(!correctPage(id, [-1, ...answer.slice(1)]));
    assert.ok(PAGES[id].objective && PAGES[id].entry);
    found.add(id);
  }
  assert.equal(nextNightPage(has), undefined);
  assert.equal(nightAct(has), 8);
  assert.ok(correctPage('night_call', [1]));
  assert.ok(!correctPage('night_call', []));
  assert.ok(nightStealthPrompt('night_signal', false, false));
  assert.ok(nightStealthPrompt('night_signal', true, true));
  assert.equal(nightStealthPrompt('night_signal', true, false), null);
});

test('outer district landmarks, walk-in thresholds and house foundations use the same metre survey', () => {
  assert.equal(LANDMARKS.length, 8);
  assert.equal(OUTER_HOMES.length, 14);
  for (const m of LANDMARKS) {
    assert.ok(m.x > VALLEY.x1 && m.x < VALLEY.x2 && m.z > VALLEY.z1 && m.z < VALLEY.z2);
    assert.equal(districtAt(m.x, m.z), m.id);
  }
  for (const [id, b] of Object.entries(OUTPOSTS)) {
    assert.equal(insideOutpost(b.x, b.z + b.d / 2 - 0.1), id);
    assert.equal(insideOutpost(b.x, b.z + b.d / 2 + 0.1), null);
    assert.ok(b.door > 0.84);
    assert.equal(groundHeightAt(b.x, b.z), b.y);
    assert.equal(groundHeightAt(b.x, b.z + b.d / 2 + 1), b.y);
  }
  for (const [x, z] of OUTER_HOMES)
    for (const sign of [-1, 1])
      assert.ok(Math.abs(groundHeightAt(x + sign * 3, z + 2.7) - groundHeightAt(x, z)) < 1e-4);
  for (const [x, z, a, b] of OUTER_LANES) assert.ok(reservedGround((x + a) / 2, (z + b) / 2));
});

test('both night packs ship the expected named parts, metric solids, UVs and smaller on-demand files', () => {
  const named: Record<string, string[]> = {
    arif: ['arif', 'pestemal'],
    yolcu: ['yolcu', 'etiket'],
    karabasma: ['coat', 'hood', 'sleeveR', 'sleeveL', 'bootR', 'bootL'],
    'sis-gozcusu': ['coat', 'hood', 'sleeveR', 'sleeveL', 'bootR', 'bootL', 'cape'],
    'peron-sefi': ['uniforma', 'saat', 'isaret'],
    'gece-esyasi': ['tahta', 'heybe', 'makara', 'telefon', 'can'],
  };
  for (const id of NIGHT_MODELS) {
    let full = 0;
    for (const compact of [false, true]) {
      const { doc, size } = glb(nightUrl(id, compact));
      if (!compact) full = size;
      else assert.ok(size < full * 0.55 && size < 160000, id);
      assert.equal(doc.images.length, 1);
      assert.ok(Number.isInteger(doc.images[0].bufferView));
      assert.equal(doc.images[0].uri, undefined);
      assert.deepEqual(
        doc.nodes.map((n: { name: string }) => n.name),
        named[id] ?? [id],
      );
      for (const mesh of doc.meshes) {
        const [p] = mesh.primitives,
          a = doc.accessors[p.attributes.POSITION];
        assert.equal(mesh.primitives.length, 1);
        assert.equal(doc.accessors[p.attributes.NORMAL].count, a.count);
        assert.equal(doc.accessors[p.attributes.TEXCOORD_0].count, a.count);
        if (['arif', 'yolcu', 'mahmut'].includes(mesh.name)) {
          assert.ok(a.max[0] - a.min[0] > 1.8 && a.max[0] - a.min[0] < 2.1);
          assert.ok(a.max[1] < 0.35 && a.min[1] >= -0.005);
        }
        if (mesh.name === 'hood') assert.ok(a.max[1] > 2 && a.max[1] < 2.4);
      }
    }
  }
});

test('a school or station facade never seals the walkable centre with a textured quad', () => {
  for (const [key, room] of [
    ['mektep', OUTPOSTS.school],
    ['istasyon', OUTPOSTS.station],
  ] as const) {
    const { doc, bin } = glb(nightUrl(key, true));
    const p = doc.meshes[0].primitives[0];
    const pos = doc.accessors[p.attributes.POSITION],
      idx = doc.accessors[p.indices];
    const vertices = doc.bufferViews[pos.bufferView],
      indices = doc.bufferViews[idx.bufferView];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        new Float32Array(bin.buffer, bin.byteOffset + vertices.byteOffset, pos.count * 3),
        3,
      ),
    );
    geo.setIndex(
      new THREE.Uint16BufferAttribute(
        new Uint16Array(bin.buffer, bin.byteOffset + indices.byteOffset, idx.count),
        1,
      ),
    );
    const facade = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    facade.updateMatrixWorld();
    const probe = (x: number, y: number) =>
      new THREE.Raycaster(
        new THREE.Vector3(x, y, room.d / 2 + 1),
        new THREE.Vector3(0, 0, -1),
        0,
        1.5,
      ).intersectObject(facade).length;
    for (const x of [-0.4, 0, 0.4]) assert.equal(probe(x, 1.68), 0);
    assert.ok(probe(room.door / 2 + 0.23, 1.68) > 0);
  }
});

test('forensic camera can pick each actual body zone at its centre after the art swap', () => {
  const art = new NightArt(true, () => {}),
    cam = new THREE.PerspectiveCamera(67, 1.57, 0.1, 45);
  for (const [id, offset] of [
    ['case_arif', -0.862],
    ['case_mahmut', -0.822],
    ['case_unknown', -0.782],
  ] as const) {
    const body = createAutopsyCadaverOverlay(id, art, offset),
      preset = body.cameraPresets.overview;
    cam.position.copy(preset.pos);
    cam.lookAt(preset.lookAt);
    cam.updateMatrixWorld();
    body.group.updateMatrixWorld(true);
    for (const [zone, mesh] of Object.entries(body.zoneMeshes)) {
      const point = mesh.getWorldPosition(new THREE.Vector3()).project(cam);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(point.x, point.y), cam);
      ray.layers.set(AUTOPSY_LAYER);
      assert.equal(
        ray.intersectObjects(Object.values(body.zoneMeshes), false)[0]?.object.userData.autopsyZoneId,
        zone,
        `${id}:${zone}`,
      );
    }
  }
  art.dispose();
});

test('night mounts retain case visibility on load, have per-part fallbacks, and discard late requests on exit', async () => {
  const scene = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.BoxGeometry());
  cloth.name = 'arif';
  scene.add(cloth);
  let released = 0,
    ready = 0;
  cloth.geometry.addEventListener('dispose', () => released++);
  let finish!: (model: GLTF) => void;
  const pending = new Promise<GLTF>((res) => {
    finish = res;
  });
  const urls: string[] = [];
  const art = new NightArt(true, () => ready++, {
    loadAsync: async (u) => {
      urls.push(u);
      return pending;
    },
  });
  const fallback = new THREE.Group(),
    mount = art.mount('arif', fallback),
    towel = new THREE.Group();
  mount.visible = false;
  art.mount('arif', towel, ['pestemal']);
  art.near('arif', 0, 0, 4);
  art.approach({ x: 7, z: 0 });
  assert.deepEqual(urls, []);
  const loaded = art.request('arif');
  assert.equal(art.request('arif'), loaded);
  art.approach({ x: 0, z: 0 });
  finish({ scene } as GLTF);
  await loaded;
  assert.deepEqual(urls, [nightUrl('arif', true)]);
  assert.equal(mount.visible, false);
  assert.equal(fallback.visible, false);
  assert.equal(towel.visible, true);
  assert.equal(ready, 1);
  art.dispose();
  assert.equal(released, 1);
  const late = new NightArt(false, () => assert.fail('installed after exit'), {
    loadAsync: () => Promise.resolve({ scene } as GLTF),
  });
  const load = late.request('arif');
  late.dispose();
  await load;
  assert.equal(released, 2);
});

test('patrol sight respects rotated walls, safe players and per-chapter routes', () => {
  const box = houseFootprint(0, 0, 2, 5, Math.PI / 4);
  assert.equal(wallBetween(-4, 0, 4, 0, [box]), true);
  assert.equal(wallBetween(-4, 4, 4, 4, [box]), false);
  const patrol = new NightPatrol(1),
    root = new THREE.Group();
  const player = { x: 62, z: 36 };
  patrol.tick(root, 7, 0.01, player, false, []);
  const initial = root.position.clone();
  assert.ok(initial.x > 53 && initial.z > 28);
  assert.ok(patrol.tick(root, 7, 0.1, player, true, []));
  assert.ok(
    Math.hypot(player.x - root.position.x, player.z - root.position.z) <
      Math.hypot(player.x - initial.x, player.z - initial.z),
  );
  assert.equal(patrol.tick(root, 7, 0.1, player, false, []), false);
  patrol.tick(root, 8, 0.01, player, true, []);
  assert.ok(root.position.x < -28);
});

test('a horizontal scanned log is fitted by length and cannot cut across the crypt', async () => {
  const { doc } = glb('/assets/workshop/dressing/dead_tree.glb');
  const a = doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION];
  const size = a.max.map((v: number, i: number) => v - a.min[i]);
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2])));
  const assets = new WorkshopAssets({ loadAsync: async () => ({ scene }) as GLTF });
  await assets.load('full', () => {});
  const log = assets.dressing('dead_tree', 4.6, true)!;
  const extent = new THREE.Box3().setFromObject(log).getSize(new THREE.Vector3());
  assert.ok(Math.abs(extent.x - 4.6) < 0.001);
  assert.ok(extent.y < 0.6);
  assets.dispose();
});

test('cemetery foundations and grave footprints remain grounded on one level', async () => {
  const { CEMETERY, CEMETERY_GRAVES } = await import('../src/game/cemetery');
  const level = groundHeightAt(CEMETERY.x, CEMETERY.z);
  for (const [x, z] of CEMETERY_GRAVES) {
    for (const dx of [-0.4, 0.4]) for (const dz of [-0.8, 0.8]) {
      assert.ok(Math.abs(groundHeightAt(CEMETERY.x + x + dx, CEMETERY.z + z + dz) - level) < 1e-8);
    }
  }
  for (const x of [-9, 0, 9]) for (const z of [-9, 0, 9])
    assert.equal(groundHeightAt(CEMETERY.x + x, CEMETERY.z + z), level);
});

test('bell and exchange sequences vary by saved seed, with evidence in separate records', async () => {
  const { nightPageFor, correctPage } = await import('../src/game/nightWatch');
  const bells = new Set<string>(), lines = new Set<string>();
  for (let seed = 0; seed < 4; seed++) {
    const bell = nightPageFor('night_bell', seed).answer!;
    const line = nightPageFor('night_line', seed).answer!;
    bells.add(bell.join('')); lines.add(line.join(''));
    assert.ok(correctPage('night_bell', bell, seed));
    assert.ok(correctPage('night_line', line, seed));
    assert.ok(correctPage('night_seal', [seed], seed));
    assert.ok(!correctPage('night_seal', [(seed + 1) % 4], seed));
    assert.match(nightPageFor('night_tag', seed).entry, /işaret/);
    assert.match(nightPageFor('night_roll', seed).entry, /anahtar/);
  }
  assert.equal(bells.size, 4);
  assert.equal(lines.size, 4);
});

test('a watcher accelerates into pursuit but cannot see through a wall', () => {
  const actor = new THREE.Group(), patrol = new NightPatrol(0);
  patrol.tick(actor, 3, 0, { x: 100, z: 100 }, true, []);
  const start = actor.position.clone();
  assert.equal(patrol.tick(actor, 3, 0.25, { x: start.x, z: start.z + 8 }, true, []), true);
  assert.ok(actor.position.distanceTo(start) > 1.35, 'pursuit speed exceeds the sprinting player');
  patrol.reset();
  patrol.tick(actor, 3, 0, { x: 100, z: 100 }, true, []);
  const wall = { minX: 0, maxX: 2, minZ: -20, maxZ: -19 };
  assert.equal(patrol.tick(actor, 3, 0.25, { x: 1, z: -17 }, true, [wall]), false);
});
