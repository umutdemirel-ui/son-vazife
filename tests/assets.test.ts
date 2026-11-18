import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import { houseFootprint, pushOutsideBox } from '../src/game/collision';
import { VILLAGE_NPCS, updateNpcActorPatrol, type NpcRuntimeActor } from '../src/game/npcs';
import { ResidentVisual, type ResidentModel, type ResidentLoader } from '../src/game/residentVisual';
import type { NpcId } from '../src/game/types';

const ids = Object.keys(VILLAGE_NPCS) as NpcId[];

test('every resident ships a distinct, self-contained, metre-scale skin with working hand sockets', () => {
  const plates = new Set<string>();
  for (const id of ids) {
    const bytes = readFileSync(new URL(`../public/assets/residents/${id}.glb`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', id);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const jsonEnd = 20 + bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.toString('utf8', 20, jsonEnd));
    const skin = gltf.skins[gltf.nodes.find((n: { skin?: number }) => n.skin !== undefined).skin];
    const bones = new Set(skin.joints.map((i: number) => gltf.nodes[i].name));
    for (const joint of ['Head', 'HandL', 'HandR', 'ThighL', 'ThighR'])
      assert.ok(bones.has(joint), `${id}: ${joint}`);
    assert.deepEqual(gltf.animations.map((clip: { name: string }) => clip.name).sort(), ['Idle', 'Walk']);
    const { POSITION, JOINTS_0, WEIGHTS_0, TEXCOORD_0 } = gltf.meshes[0].primitives[0].attributes;
    const bounds = gltf.accessors[POSITION];
    assert.ok(Math.abs(bounds.min[1]) < 0.001 && bounds.max[1] > 1.48 && bounds.max[1] < 1.86);
    assert.ok(bounds.max[2] - bounds.min[2] > 0.22, 'model has physical depth');
    for (const attr of [JOINTS_0, WEIGHTS_0, TEXCOORD_0])
      assert.equal(gltf.accessors[attr].count, bounds.count);
    const image = gltf.images[0];
    assert.equal(image.uri, undefined);
    const view = gltf.bufferViews[image.bufferView];
    const start = jsonEnd + 8 + view.byteOffset;
    assert.equal(bytes.readUInt16BE(start), 0xffd8, 'embedded JPEG');
    plates.add(
      createHash('sha256')
        .update(bytes.subarray(start, start + view.byteLength))
        .digest('hex'),
    );
  }
  assert.equal(plates.size, ids.length);
});

test('equipment and placeholder survive a missing GLB; a late response cannot resurrect a disposed actor', () => {
  for (const id of ids) {
    let complete!: (asset: ResidentModel) => void;
    const loader: ResidentLoader = {
      load(url, done, _progress, fail) {
        assert.equal(url, `/assets/residents/${id}.glb`);
        complete = done;
        fail?.(new Error('unavailable'));
      },
    };
    const visual = new ResidentVisual(id, loader);
    let meshes = 0,
      lamps = 0;
    visual.group.traverse((o) => {
      if (o instanceof THREE.Mesh) meshes++;
      if (o instanceof THREE.PointLight) lamps++;
    });
    assert.ok(meshes > 2);
    assert.equal(lamps, id === 'serife' ? 0 : 1);
    visual.update(0.05, true, 1, 0.5);
    visual.dispose();
    const geo = new THREE.BoxGeometry();
    let released = false;
    geo.addEventListener('dispose', () => {
      released = true;
    });
    complete({
      scene: new THREE.Group().add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial())),
      animations: [],
    });
    assert.ok(released);
    assert.equal(visual.group.children.length, 0);
  }
});

test('the interaction proxy follows the patrol root, and talking stops both travel and walking animation', () => {
  const def = VILLAGE_NPCS.bekci;
  const wp = def.waypoints[0];
  const root = new THREE.Group();
  root.position.set(wp.x, 0, wp.z);
  const proxy = new THREE.Object3D();
  proxy.position.y = 1;
  root.add(proxy);
  let walking = false;
  const actor: NpcRuntimeActor = {
    def,
    root,
    pos: root.position.clone(),
    waypointIndex: 1,
    yaw: 0,
    pauseTimer: 0,
    spokenNodes: new Set(),
    trust: 50,
    visual: {
      eyeHeight: 1.6,
      update: (_dt: number, moving: boolean) => {
        walking = moving;
      },
    },
  };
  const before = actor.pos.clone();
  const player = new THREE.Vector3(20, 0, 20);
  updateNpcActorPatrol(actor, 0.05, player, false, 3);
  assert.ok(walking && before.distanceTo(actor.pos) > 0.01);
  assert.equal(proxy.getWorldPosition(new THREE.Vector3()).z, actor.pos.z);
  const speaking = actor.pos.clone();
  updateNpcActorPatrol(actor, 0.05, player, true, 4);
  assert.ok(!walking && actor.pos.equals(speaking));
});

test('turned house walls resolve in local space, without blocking the empty street-side corner', () => {
  const angle = Math.PI / 3,
    cx = -12,
    cz = 18;
  const house = houseFootprint(cx, cz, 6, 4, angle);
  const at = (x: number, z: number) => ({
    x: cx + x * Math.cos(angle) + z * Math.sin(angle),
    z: cz - x * Math.sin(angle) + z * Math.cos(angle),
  });
  const inside = at(2.91, 0.6),
    wall = at(3.42, 0.6);
  pushOutsideBox(inside, house, 0.42);
  assert.ok(Math.hypot(inside.x - wall.x, inside.z - wall.z) < 1e-5);
  const corner = at(1.2, 2.8),
    original = { ...corner };
  pushOutsideBox(corner, house, 0.42);
  assert.deepEqual(corner, original);
  const openDoor = { x: -7.1, z: 6 };
  for (const [minZ, maxZ] of [
    [2.6, 5.2],
    [6.8, 9.4],
  ])
    pushOutsideBox(openDoor, { minX: -7.35, maxX: -6.85, minZ, maxZ }, 0.42);
  assert.deepEqual(openDoor, { x: -7.1, z: 6 });
});

test('porch witnesses stand on the boards; the lane still follows the terrain', async () => {
  const { exteriorFloorAt, groundHeightAt } = await import('../src/game/terrain');
  for (const [actor, padX, padZ] of [
    [VILLAGE_NPCS.serife, -10.8, -10.5],
    [VILLAGE_NPCS.kenan, 10.5, -18],
  ] as const) {
    const { x, z } = actor.waypoints[0];
    assert.equal(exteriorFloorAt(x, z), groundHeightAt(padX, padZ) + 0.14);
  }
  assert.equal(exteriorFloorAt(0, 14), groundHeightAt(0, 14));
});
