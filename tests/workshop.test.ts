import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import {
  adaptiveTier,
  deviceClass,
  allocationFor,
  rasterRatio,
  SoftwareRasterBudget,
  startingTier,
  surfaceUrl,
} from '../src/game/quality';
import { VisibilityCells } from '../src/game/visibilityCells';
import { distantShell } from '../src/game/distantShell';
import { BUILD_KIT, WorkshopAssets, workshopManifest } from '../src/game/workshopAssets';

const file = (url: string) => new URL(`../public${url}`, import.meta.url);
function glb(url: string) {
  const bytes = readFileSync(file(url));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  return JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
}

test('Asgari is opt-in on capable devices and automatic on software / very weak devices', () => {
  assert.equal(startingTier('high', true, false, false), 'minimum');
  assert.equal(startingTier('auto', false, true, true), 'minimum');
  assert.equal(startingTier('auto', false, false, true), 'low');
  assert.equal(startingTier('auto', false, false, false), 'medium');
  assert.equal(startingTier('minimum', false, false, false), 'minimum');
  assert.equal(startingTier('high', false, true, true), 'high');
  assert.equal(allocationFor('minimum'), 'minimum');
  assert.equal(allocationFor('high'), 'full');
  for (const [w, h] of [
    [3840, 2160],
    [812, 375],
    [320, 640],
  ]) {
    const r = rasterRatio('minimum', w, h, 3, true);
    assert.ok(r > 0 && r * Math.max(w, h) <= 384.01);
    assert.ok(rasterRatio('medium', w, h, 3, false) <= 1);
  }
  const scale = new SoftwareRasterBudget();
  for (let i = 0; i < 9; i++) scale.sample(100);
  scale.sample(3000);
  assert.equal(scale.side, 384);
  for (let i = 0; i < 60; i++) scale.sample(100);
  assert.equal(scale.side, 288);
  for (let i = 0; i < 140; i++) scale.sample(28);
  assert.equal(scale.side, 512);
});

test('Auto recognises older integrated GPUs even with many cores and recovers without bouncing tiers', () => {
  assert.equal(deviceClass('ANGLE Intel HD Graphics 4000', 8, 8, false).veryWeak, true);
  assert.equal(deviceClass('ANGLE Vulkan SwiftShader', 8, 8, false).softwareGl, true);
  assert.equal(deviceClass('Discrete GPU', 8, 8, false).lowEnd, false);
  assert.equal(adaptiveTier('low', 'high', 17, 3), 'low');
  assert.equal(adaptiveTier('low', 'high', 17, 4), 'medium');
  assert.equal(adaptiveTier('low', 'low', 16, 8), 'low');
  assert.equal(adaptiveTier('high', 'high', 45, 0), 'minimum');
});

test('compact manifests never fetch the large scans or full workshop; all listed files actually ship', () => {
  const minimal = workshopManifest('minimum'),
    low = workshopManifest('compact'),
    full = workshopManifest('full');
  assert.deepEqual(
    minimal.map((r) => r.id),
    BUILD_KIT,
  );
  assert.ok(minimal.every((r) => r.url.includes('/compact/')));
  assert.deepEqual(
    low.filter((r) => !r.url.includes('/compact/')).map((r) => r.id),
    ['lantern', 'chair', 'binder'],
  );
  assert.equal(full.length, 15);
  for (const r of [...low, ...full]) assert.ok(statSync(file(r.url)).size > 128);
  assert.ok(minimal.reduce((b, r) => b + statSync(file(r.url)).size, 0) < 1250000);
  for (const s of ['cini', 'gasil-siva', 'mese', 'yalak-su', 'forest-floor', 'karacam'])
    assert.ok(statSync(file(surfaceUrl(s, true))).size < 80000);
  for (const id of ['bekci', 'serife', 'kenan', 'idris']) {
    const g = glb(`/assets/residents/compact/${id}.glb`);
    assert.ok(g.skins[0].joints.length >= 15);
    assert.deepEqual(g.animations.map((a: { name: string }) => a.name).sort(), ['Idle', 'Walk']);
    assert.ok(statSync(file(`/assets/residents/compact/${id}.glb`)).size < 240000);
  }
});

test('houses, fountain and supplies have physical silhouettes, UVs and shaded surfaces in both kits', () => {
  for (const profile of ['full', 'minimum'] as const) {
    for (const r of workshopManifest(profile).slice(0, BUILD_KIT.length)) {
      const g = glb(r.url);
      assert.equal(g.images.length, 1);
      assert.equal(g.images[0].uri, undefined);
      for (const mesh of g.meshes) {
        assert.equal(mesh.primitives.length, 1);
        const p = mesh.primitives[0],
          a = g.accessors[p.attributes.POSITION];
        assert.equal(g.accessors[p.attributes.TEXCOORD_0].count, a.count);
        assert.equal(g.accessors[p.attributes.NORMAL].count, a.count);
        const [w, h, d] = a.max.map((m: number, i: number) => m - a.min[i]);
        assert.ok(Math.abs(a.min[1]) <= 0.04);
        if (['himis', 'tas', 'cumba'].includes(r.id)) {
          assert.ok(w > 6 && d > 5 && h > 4);
          assert.ok(g.accessors[p.indices].count / 3 < 1600);
        } else if (r.id === 'hayrat') {
          assert.ok(w > 2 && h > 2.5 && d > 1.25);
        } else {
          assert.ok(w > 0.19 && h > 0.04 && d > 0.12, mesh.name);
        }
      }
      if (r.id === 'emanet')
        assert.deepEqual(g.nodes.map((n: { name: string }) => n.name).sort(), [
          'defter',
          'ibrik',
          'kefen',
          'sabun',
        ]);
    }
  }
});

test('distance culling and shell changes cannot reveal a collected object or change the world-space target', () => {
  const scene = new THREE.Scene(),
    cells = new VisibilityCells(),
    root = new THREE.Group(),
    far = new THREE.Group(),
    item = new THREE.Object3D();
  root.position.set(12, 0, 8);
  item.position.set(1, 0.8, 0);
  root.add(item);
  item.visible = false;
  cells.add(scene, root, 34, 55);
  cells.addShell(root, far);
  const eye = new THREE.Vector3(26, 1.65, 8);
  cells.update(eye, 'minimum');
  assert.equal(far.visible, false);
  cells.update(eye.set(38, 1.65, 8), 'minimum');
  assert.equal(far.visible, true);
  assert.equal(root.parent!.visible, false);
  cells.update(eye.set(100, 1.65, 8), 'minimum');
  assert.equal(root.parent!.parent!.visible, false);
  cells.update(eye.set(12, 1.65, 8), 'minimum');
  assert.ok(root.parent!.visible && root.parent!.parent!.visible);
  assert.equal(item.visible, false);
  assert.deepEqual(item.getWorldPosition(new THREE.Vector3()).toArray(), [13, 0.8, 8]);
});

test('a district shell is one indexed draw and excludes dynamic subtrees / examination targets', () => {
  const g = new THREE.Group(),
    stone = new THREE.MeshStandardMaterial(),
    large = () => new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), stone);
  const roof = large(),
    door = large(),
    target = large();
  roof.position.y = 4;
  target.layers.set(1);
  g.add(door, target, roof);
  const proxy = distantShell(g, new THREE.MeshBasicMaterial(), new Set([door]));
  assert.equal(proxy.geometry.index!.count, 36);
  assert.equal(proxy.geometry.getAttribute('swatch').count, 24);
  proxy.geometry.computeBoundingBox();
  assert.ok(proxy.geometry.boundingBox!.min.y >= 2.5);
  assert.equal(door.parent, g);
});

test('a missing kit part does not stall loading, and in-flight templates are released on exit', async () => {
  const calls: string[] = [],
    percent: number[] = [];
  const result = () => ({ scene: new THREE.Group() }) as GLTF;
  const assets = new WorkshopAssets({
    async loadAsync(url) {
      calls.push(url);
      if (url.endsWith('/hayrat.glb')) throw new Error('offline');
      return result();
    },
  });
  await assets.load('minimum', (_, p) => percent.push(p));
  assert.equal(calls.length, 5);
  assert.equal(percent.at(-1), 100);
  assert.equal(assets.node('hayrat'), null);
  assets.dispose();
  let finish!: (g: GLTF) => void;
  const pending = new Promise<GLTF>((res) => {
    finish = res;
  });
  const inFlight = new WorkshopAssets({ loadAsync: () => pending });
  const done = inFlight.load('minimum', () => assert.fail('progress after exit'));
  inFlight.dispose();
  const scene = result(),
    geo = new THREE.BoxGeometry();
  let released = false;
  geo.addEventListener('dispose', () => {
    released = true;
  });
  scene.scene.add(new THREE.Mesh(geo));
  finish(scene);
  await done;
  assert.ok(released);
  assert.equal(inFlight.node('cumba'), null);
});
