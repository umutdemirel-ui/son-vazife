import { CEMETERY } from './cemetery';
import type { BoxCollider } from './collision';
import { CLINIC, MUHTAR, CORE_LANES, OUTER_LANES, OUTER_HOMES, OUTPOSTS, OUTPOST_IDS, mainRoadX, reservedGround } from './valley';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { surfaceUrl, type Allocation } from './quality';
import { VillageTextures } from './textures';

/**
 * Deterministic heightfield for the expanded Kuzdağ Anatolian mountain valley.
 * Keeps village square, clinic, mill, cemetery hill, and crash bend gently walkable
 * while carving a shallow mountain stream at x ≈ -24 and raising surrounding mountain ridges.
 */
function valleyHeight(x: number, z: number): number {
  // Ridges begin beyond the original village; the outlying wards cut level pads into them.
  // An asymmetric forested upland encloses the village rather than a flat
  // bowl with a uniform circular rim. Paths and buildings retain surveyed pads.
  const laneDistX = Math.max(0, Math.abs(x + 3) - 42);
  const laneDistZ = z < -50 ? -50 - z : z > 42 ? z - 42 : 0;
  const edgeDist = Math.hypot(laneDistX, laneDistZ);

  const ridgeDetail =
    edgeDist > 2
      ? (Math.sin(x * 0.085 + z * 0.06) * 1.15 + Math.cos(x * 0.045 - z * 0.075) * 1.45) *
        Math.min(1, (edgeDist - 2) / 18)
      : 0;
  // Separate wooded ridges on the western and eastern slopes, rather than
  // the old uniform circular wall. The broad valley floor remains walkable.
  const ridgeRise = 1 - Math.exp(-Math.pow(edgeDist / 38, 1.75));
  const westernRidge = 1.5 * Math.sin(z * 0.025 + 0.8) * Math.max(0, -x / 80);
  const easternRidge = 2.2 * Math.cos(z * 0.032 - 0.3) * Math.max(0, x / 80);
  const mountain = (21 + westernRidge + easternRidge) * ridgeRise + ridgeDetail * 1.25;

  // Gentle natural undulation along the village roads
  const gentleSlope = Math.sin(z * 0.055) * 0.14 + Math.cos(x * 0.065) * 0.08
    + 0.22 * Math.sin(x * 0.045 + z * 0.035) * Math.min(1, Math.hypot(x, z) / 40);

  // Slight elevation bump for Mezarlık Tepesi (-34, -36)
  const dCemeteryHill = Math.hypot(x + 34, z + 36);
  const cemeteryRise = dCemeteryHill < 14 ? (1 - dCemeteryHill / 14) * 0.85 : 0;

  // Shallow stream channel along x ≈ -24 (except under the wooden bridge at z ≈ 8 and cemetery road at z ≈ -32)
  const streamCenter = -24 + Math.sin(z * 0.07) * 1.4;
  const streamDist = Math.abs(x - streamCenter);
  const nearBridge = Math.abs(z - 8) < 3.4 || Math.abs(z + 32) < 3.4 || Math.abs(z - 39) < 2.4;
  const streamDip =
    streamDist < 3.2 && !nearBridge ? -0.68 * Math.cos((streamDist / 3.2) * (Math.PI * 0.5)) : 0;

  // Flatten building pads so interiors sit flush on ground
  const dMosque = Math.hypot(x + 10.5, z - 6.0);
  const dAbandoned = Math.hypot(x + 10.8, z + 10.5);
  const dMuhtar = Math.hypot(x - MUHTAR.x, z - MUHTAR.z);
  const dFountain = Math.hypot(x - 4.8, z - 12.5);
  const dClinic = Math.hypot(x - CLINIC.x, z - CLINIC.z);
  const dMill = Math.hypot(x + 36.0, z - 8.0);
  const dCrypt = Math.hypot(x + 34.0, z + 36.0);
  const dCrash = Math.hypot(x - 28.0, z - 20.0);

  const padMask = Math.min(
    1,
    Math.min(
      dMosque / 8.0,
      dAbandoned / 6.2,
      dMuhtar / 7.2,
      dFountain / 4.0,
      dClinic / 7.5,
      dMill / 6.8,
      dCrypt / 7.2,
      dCrash / 6.5,
    ),
  );

  const natural = mountain + cemeteryRise + streamDip + gentleSlope * padMask;
  for (const id of OUTPOST_IDS) {
    const b = OUTPOSTS[id];
    const dist = Math.hypot(
      Math.max(0, Math.abs(x - b.x) - b.w * 0.5 - 3),
      Math.max(0, Math.abs(z - b.z) - b.d * 0.5 - 5),
    );
    if (dist < 10) {
      const t = dist / 10;
      return b.y + (natural - b.y) * t * t * (3 - 2 * t);
    }
  }
  return natural;
}

// A foundation cannot use only its centre sample on the sloping outer ridge.
const homePads = OUTER_HOMES.map(([x, z]) => ({ x, z, y: valleyHeight(x, z) }));
export function groundHeightAt(x: number, z: number): number {
  const natural = valleyHeight(x, z);
  // The cemetery, crypt and grave markers are built on one level foundation.
  // Extend the plateau beyond the enclosure so the terrain's coarse mesh samples
  // also lie at the same height under its walls and graves.
  const edge = Math.max(Math.abs(x - CEMETERY.x), Math.abs(z - CEMETERY.z));
  if (edge < 14) {
    const t = Math.max(0, (edge - 10) / 4);
    const level = valleyHeight(CEMETERY.x, CEMETERY.z);
    return level + (natural - level) * t * t * (3 - 2 * t);
  }
  // A level pad keeps the office and porch flush with the new hillside.
  const officeEdge = Math.max(Math.abs(x - MUHTAR.x), Math.abs(z - MUHTAR.z));
  if (officeEdge < 10) {
    const t = Math.max(0, (officeEdge - 6) / 4);
    const level = valleyHeight(MUHTAR.x, MUHTAR.z);
    return level + (natural - level) * t * t * (3 - 2 * t);
  }
  for (const b of homePads) {
    const dx = x - b.x,
      dz = z - b.z,
      d2 = dx * dx + dz * dz;
    if (d2 < 64) {
      const t = Math.max(0, (Math.sqrt(d2) - 4.55) / 3.45);
      return b.y + (natural - b.y) * t * t * (3 - 2 * t);
    }
  }
  return natural;
}
// Raised exterior floors are not hills: leave the terrain mesh flat underneath.
const porchPads = [
  { x1:-7.8, x2:-6.3, z1:-12.1, z2:-8.9, y:groundHeightAt(-10.8,-10.5)+.14 },
  { x1:MUHTAR.x-5, x2:MUHTAR.x-3.2, z1:MUHTAR.z-1.8, z2:MUHTAR.z+1.8, y:groundHeightAt(MUHTAR.x,MUHTAR.z)+.14 },
  { x1:-7.1, x2:-4.9, z1:-2.03, z2:2.63, y:groundHeightAt(-10.5,6)+.25 },
  { x1:-7.12, x2:-6.17, z1:5, z2:7, y:groundHeightAt(-10.5,6)+.15 },
];
export function exteriorFloorAt(x: number, z: number) {
  for (const pad of porchPads) {
    if (x>=pad.x1 && x<=pad.x2 && z>=pad.z1 && z<=pad.z2) return pad.y;
  }
  return groundHeightAt(x,z);
}

export interface TerrainHandles {
  streamWater: THREE.Mesh;
  colliders: BoxCollider[];
  dispose: () => void;
}

export function buildMountainTerrainAndForest(
  scene: THREE.Scene,
  textures: VillageTextures,
  cutStone: THREE.MeshStandardMaterial,
  allocation: Allocation,
): TerrainHandles {
  const disposables: Array<{ dispose: () => void }> = [];
  const colliders: BoxCollider[] = [];

  // 1. Valley Terrain Mesh (340m x 340m)
  const minimal = allocation === 'minimum',
    compact = allocation !== 'full';
  const size = minimal ? 252 : 340;
  // Preserve grid spacing in the walkable valley; discard distant mountain rings, not doorstep precision.
  const segs = minimal ? 78 : 104;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    pos.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();
  // Muted grassy slopes outside the earthen village, inspired by the wooded
  // uplands; the soil textures and surveyed pads still drive the ground.
  const groundColors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const distance = Math.hypot(x * 0.85, z * 0.8);
    const green = THREE.MathUtils.smoothstep(distance, 14, 65) * (0.75 + 0.25 * Math.sin(x * 0.045 + z * 0.06));
    groundColors[i * 3] = 1 - 0.19 * green;
    groundColors[i * 3 + 1] = 1 - 0.07 * green;
    groundColors[i * 3 + 2] = 1 - 0.22 * green;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(groundColors, 3));

  const terrainMat = new THREE.MeshStandardMaterial({
    map: textures.ground,
    vertexColors: true,
    normalMap: textures.groundNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.94,
    metalness: 0.02,
    color: 0xb2a58c,
    roughnessMap: textures.groundRoughness,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.renderOrder = 8; // Early depth: buildings and opaque lane pixels cover most of this mesh.
  terrainMesh.matrixAutoUpdate = false;
  terrainMesh.updateMatrix();
  scene.add(terrainMesh);
  disposables.push(terrainGeo, terrainMat);

  // Match the triangles actually drawn on this tier. A road following only the analytic
  // ridge can disappear under the coarser rasterised slope between sample points.
  const surfaceY = (x: number, z: number) => {
    const cx = (x / size + 0.5) * segs,
      cz = (z / size + 0.5) * segs,
      ix = Math.floor(cx),
      iz = Math.floor(cz),
      u = cx - ix,
      v = cz - iz;
    const a = iz * (segs + 1) + ix,
      h = pos.getY(a),
      b = pos.getY(a + segs + 1),
      d = pos.getY(a + 1),
      c = pos.getY(a + segs + 2);
    return u + v < 1 ? h + v * (b - h) + u * (d - h) : c + (1 - u) * (b - c) + (1 - v) * (d - c);
  };
  // 2. Main Road + District Side Roads (shared wet cobblestone material)
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.road,
    normalMap: textures.roadNormal,
    normalScale: new THREE.Vector2(0.62, 0.62),
    roughnessMap: textures.roadRoughness,
    color: 0xb8a990,
    roughness: 0.88,
    metalness: 0.025,
    vertexColors: true,
    transparent: !minimal,
    depthWrite: minimal,
    alphaTest: minimal ? 0.34 : 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  disposables.push(roadMat);

  // Equal-size cobbles on the main lane and the much shorter branch paths.
  // A feathered, irregular shoulder reveals the underlying soil, rather than a ruler-straight seam.

  const dressLane = (geo: THREE.PlaneGeometry, width: number) => {
    const p = geo.attributes.position,
      uv = geo.attributes.uv;
    const color = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const lateral = uv.getX(i) - 0.5;
      const shoulder = Math.min(1, ((0.5 - Math.abs(lateral)) * width) / 0.68);
      const wheelRut = 0.12 * Math.exp(-Math.pow((Math.abs(lateral) * width - 0.77) / 0.23, 2));
      const shade = 0.91 + 0.08 * shoulder - wheelRut;
      color.set([shade, shade * 0.992, shade * 0.98, shoulder], i * 4);
      uv.setXY(i, p.getX(i) / 3.4, p.getZ(i) / 3.4);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(color, 4));
  };

  // Main North-South Road (z: -48..42)
  const mainRoadGeo = new THREE.PlaneGeometry(4.6, 90, 10, 72);
  mainRoadGeo.rotateX(-Math.PI / 2);
  const mrPos = mainRoadGeo.attributes.position;
  for (let i = 0; i < mrPos.count; i++) {
    const rx = mrPos.getX(i);
    const rz = mrPos.getZ(i) - 3;
    const curveOffset = mainRoadX(rz);
    const worldX =
      rx + curveOffset + Math.pow(Math.abs(rx) / 2.3, 3) * 0.14 * Math.sin(rz * 1.8 + rx * 2);
    mrPos.setX(i, worldX);
    mrPos.setZ(i, rz);
    mrPos.setY(i, surfaceY(worldX, rz) + 0.045);
  }
  dressLane(mainRoadGeo, 4.6);
  mainRoadGeo.computeVertexNormals();
  const mainRoadMesh = new THREE.Mesh(mainRoadGeo, roadMat);
  mainRoadMesh.receiveShadow = true;
  mainRoadMesh.matrixAutoUpdate = false;
  mainRoadMesh.updateMatrix();
  scene.add(mainRoadMesh);
  disposables.push(mainRoadGeo);

  // Helper to build branch paths
  const buildSideRoad = (startX: number, startZ: number, endX: number, endZ: number, width: number) => {
    const len = Math.hypot(endX - startX, endZ - startZ);
    const outer =
      Math.abs(startX) > 37 || Math.abs(startZ) > 36 || Math.abs(endX) > 37 || Math.abs(endZ) > 36;
    const segLen = Math.max(4, Math.ceil(len * (outer ? 0.65 : 1.4)));
    const geo = new THREE.PlaneGeometry(width, len, outer ? 4 : 6, segLen);
    geo.rotateX(-Math.PI / 2);
    const angle = Math.atan2(endX - startX, endZ - startZ);
    const cx = (startX + endX) * 0.5;
    const cz = (startZ + endZ) * 0.5;

    const p = geo.attributes.position;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    for (let i = 0; i < p.count; i++) {
      const lz = p.getZ(i);
      const lateral = p.getX(i);
      const widthVariation = 0.87 + 0.13 * Math.sin(lz * 0.35 + cx * 0.1);
      const lx =
        lateral * widthVariation + Math.pow((2 * Math.abs(lateral)) / width, 3) * 0.13 * Math.sin(lz * 1.7 + lateral * 2);
      const wx = cx + lx * cosA + lz * sinA;
      const wz = cz - lx * sinA + lz * cosA;
      p.setX(i, wx);
      p.setZ(i, wz);
      p.setY(i, surfaceY(wx, wz) + 0.052);
    }
    dressLane(geo, width);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, roadMat);
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    scene.add(m);
    disposables.push(geo);
  };

  for (const lane of [...CORE_LANES, ...OUTER_LANES]) buildSideRoad(...lane);

  // 2c. Mountain Stream Water along x ≈ -24
  const streamGeo = new THREE.PlaneGeometry(4.4, 172, 6, 80);
  streamGeo.rotateX(-Math.PI / 2);
  const sPos = streamGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i);
    const sz = sPos.getZ(i) - 4;
    const sc = -24 + Math.sin(sz * 0.07) * 1.4;
    sPos.setX(i, sx + sc);
    sPos.setZ(i, sz);
    sPos.setY(i, -0.26);
  }
  streamGeo.computeVertexNormals();
  const streamMat = new THREE.MeshStandardMaterial({
    color: 0x162730,
    roughness: 0.14,
    metalness: 0.35,
    envMapIntensity: 1.5,
  });
  const streamWater = new THREE.Mesh(streamGeo, streamMat);
  streamWater.receiveShadow = true;
  streamWater.matrixAutoUpdate = false;
  streamWater.updateMatrix();
  scene.add(streamWater);
  disposables.push(streamGeo, streamMat);

  // Deterministic PRNG for organic dressing
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  // 2b. Roadside Cobble Curbs / Drainage Shoulder Stones (InstancedMesh)
  const curbGeo = new THREE.DodecahedronGeometry(0.24, 0);
  const curbEntries: Array<{
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
    ry: number;
  }> = [];
  for (let rz = -42; rz <= 36; rz += 1.05) {
    const center = mainRoadX(rz);
    for (const side of [-1, 1]) {
      if (side === -1 && ((rz > 1 && rz < 10.5) || (rz > -13.5 && rz < -7.5) || (rz > -34 && rz < -26)))
        continue;
      if (side === 1 && ((rz > 10.5 && rz < 22) || (rz > -29 && rz < -15))) continue;
      if (rand() < 0.64 || (side < 0 && Math.abs(rz - 14) < 0.65)) continue;
      const cx = center + side * 2.38 + (rand() - 0.5) * 0.75;
      const cz = rz + (rand() - 0.5) * 0.16;
      curbEntries.push({
        x: cx,
        y: groundHeightAt(cx, cz) + 0.04,
        z: cz,
        sx: 0.52 + rand() * 0.64,
        sy: 0.25 + rand() * 0.25,
        sz: 0.68 + rand() * 0.7,
        ry: rand() * Math.PI,
      });
    }
  }
  const curbs = new THREE.InstancedMesh(curbGeo, cutStone, curbEntries.length);
  curbs.receiveShadow = true;
  curbEntries.forEach((c, idx) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.rotation.set(0, c.ry, 0);
    dummy.scale.set(c.sx, c.sy, c.sz);
    dummy.updateMatrix();
    curbs.setMatrixAt(idx, dummy.matrix);
    const v = 0.45 + rand() * 0.28;
    tint.setRGB(v, v * 0.98, v * 0.94);
    curbs.setColorAt(idx, tint);
  });
  curbs.instanceMatrix.needsUpdate = true;
  if (curbs.instanceColor) curbs.instanceColor.needsUpdate = true;
  curbs.computeBoundingSphere();
  curbs.matrixAutoUpdate = false;
  curbs.updateMatrix();
  scene.add(curbs);
  disposables.push(curbs, curbGeo);

  // 3. Outlying black pines, with deliberate clearings for roads and inhabited buildings.
  const treeCoords: Array<{
    x: number;
    z: number;
    scale: number;
    rot: number;
    leanX: number;
    leanZ: number;
  }> = [];
  for (let i = 0; i < (minimal ? 160 : 560); i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 26 + rand() * 98;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    if (reservedGround(tx, tz)) continue;
    // Clear landmark foundations; reservedGround handles the new road survey.
    if (Math.abs(tx) < 16.5 && tz > -46 && tz < 38) continue;
    if (Math.hypot(tx - CLINIC.x, tz - CLINIC.z) < 11.5) continue; // Clinic pad
    if (Math.hypot(tx + 34, tz + 36) < 12.5) continue; // Cemetery hill
    if (Math.hypot(tx + 36, tz - 8) < 11.5) continue; // Mill pad
    if (Math.hypot(tx - 28, tz - 20) < 11.5) continue; // Crash bend
    if (Math.abs(tx + 24) < 3.8) continue; // Stream bed

    treeCoords.push({
      x: tx,
      z: tz,
      scale: 0.82 + rand() * 0.44,
      rot: rand() * Math.PI * 2,
      leanX: (rand() - 0.5) * 0.07,
      leanZ: (rand() - 0.5) * 0.07,
    });
  }

  for (const [x, z] of [
    [15, 7],
    [-16.4, -14],
    [14.9, -12.8],
    [4, -43],
    [25, 1],
    [29, -12],
    [-21, -16],
  ]) {
    // Older hand-placed trees may now be inside a relocated house or road.
    if (reservedGround(x, z) || Math.hypot(x - CLINIC.x, z - CLINIC.z) < 7.5 ||
        Math.hypot(x + 10.5, z - 6) < 7 || Math.hypot(x + 10.8, z + 10.5) < 5.5) continue;
    treeCoords.push({
      x,
      z,
      scale: 0.88 + rand() * 0.34,
      rot: rand() * Math.PI,
      leanX: 0.014,
      leanZ: -0.021,
    });
  }
  for (const tree of treeCoords) {
    // A narrow trunk, not the wide transparent billboard canopy, is solid.
    if (tree.x < -72 || tree.x > 76 || tree.z < -78 || tree.z > 62) continue;
    const r = 0.22 * tree.scale;
    colliders.push({ minX: tree.x - r, maxX: tree.x + r, minZ: tree.z - r, maxZ: tree.z + r });
  }
  // Two fixed crossed cutouts per tree: parallax as the player moves, one opaque/alpha-test
  // draw for the whole stand, no billboard sorting or extra point lights on the low tier.
  const plane = new THREE.PlaneGeometry(4.68, 8.72).translate(0, 4.36, 0);
  const cross = plane.clone().rotateY(Math.PI / 2);
  const pineGeo = mergeGeometries([plane, cross])!;
  plane.dispose();
  cross.dispose();
  const pineMat = new THREE.MeshLambertMaterial({
    color: 0xc1c7b7,
    side: THREE.DoubleSide,
    alphaTest: 0.32,
  });
  // Keep the same clearings and surveyed tree positions, but alternate conifer
  // and broad-leaf silhouettes instead of repeating one identical cutout.
  const pines = treeCoords.filter((_, i) => i % 4 !== 0);
  const oaks = treeCoords.filter((_, i) => i % 4 === 0);
  const forest = new THREE.InstancedMesh(pineGeo, pineMat, pines.length);
  forest.renderOrder = 9;
  forest.name = 'Karaçam korusu';
  forest.visible = false;
  const pineMap = new THREE.TextureLoader().load(surfaceUrl('karacam', compact), () => {
    forest.visible = true;
  });
  pineMap.colorSpace = THREE.SRGBColorSpace;
  pineMat.map = pineMap;
  pines.forEach((tree, i) => {
    dummy.position.set(tree.x, surfaceY(tree.x, tree.z) - 0.09, tree.z);
    dummy.rotation.set(tree.leanX, tree.rot, tree.leanZ);
    dummy.scale.set(tree.scale * (0.88 + rand() * 0.22), tree.scale, tree.scale);
    dummy.updateMatrix();
    forest.setMatrixAt(i, dummy.matrix);
    const shade = 0.73 + rand() * 0.27;
    tint.setRGB(shade, shade * 0.99, shade * 0.91);
    forest.setColorAt(i, tint);
  });
  forest.computeBoundingSphere();
  forest.matrixAutoUpdate = false;
  forest.updateMatrix();
  scene.add(forest);
  disposables.push(forest, pineGeo, pineMat, pineMap);

  // One double-crossed oak sprite draw on each quality tier. The alpha-tested
  // trunk has a real ground contact and never affects navigation or interactions.
  const oakPlane = new THREE.PlaneGeometry(12.2, 8.6).translate(0, 4.3, 0);
  const oakCross = oakPlane.clone().rotateY(Math.PI / 2);
  const oakGeo = mergeGeometries([oakPlane, oakCross])!;
  oakPlane.dispose(); oakCross.dispose();
  const oakMat = new THREE.MeshLambertMaterial({ color: 0xc2c0a9, side: THREE.DoubleSide, alphaTest: 0.35 });
  const oakForest = new THREE.InstancedMesh(oakGeo, oakMat, oaks.length);
  oakForest.name = 'Sonbahar meşeleri'; oakForest.visible = false;
  const oakMap = new THREE.TextureLoader().load(surfaceUrl('autumn-oak', compact), () => { oakForest.visible = true; });
  oakMap.colorSpace = THREE.SRGBColorSpace;
  oakMat.map = oakMap;
  oaks.forEach((tree, i) => {
    dummy.position.set(tree.x, surfaceY(tree.x, tree.z) - 0.05, tree.z);
    dummy.rotation.set(tree.leanX, tree.rot, tree.leanZ);
    dummy.scale.setScalar(tree.scale * 0.9); dummy.updateMatrix();
    oakForest.setMatrixAt(i, dummy.matrix);
    const shade = 0.72 + rand() * 0.2;
    tint.setRGB(shade, shade * 0.98, shade * 0.86); oakForest.setColorAt(i, tint);
  });
  oakForest.instanceMatrix.needsUpdate = true;
  oakForest.computeBoundingSphere(); oakForest.matrixAutoUpdate = false; oakForest.updateMatrix();
  scene.add(oakForest);
  disposables.push(oakForest, oakGeo, oakMat, oakMap);

  // 4. Instanced Mossy Mountain Boulders along edges, stream banks & slopes
  const rockGeo = new THREE.IcosahedronGeometry(0.65, minimal ? 0 : 1);
  const rockVertices = rockGeo.attributes.position;
  for (let i = 0; i < rockVertices.count; i++) {
    const x = rockVertices.getX(i), y = rockVertices.getY(i), z = rockVertices.getZ(i);
    const crag = 1 + 0.12 * Math.sin(x * 9 + z * 4) * Math.cos(y * 7 - z * 6);
    rockVertices.setXYZ(i, x * crag, y * crag, z * crag);
  }
  rockGeo.computeVertexNormals();
  const rockData: Array<{ x: number; z: number; sx: number; sy: number; sz: number; ry: number }> = [];
  for (let i = 0; i < 110; i++) {
    const rx = -48 + rand() * 90;
    const rz = -50 + rand() * 90;
    if (reservedGround(rx, rz)) continue;
    if (Math.abs(rx) < 4.5 || Math.hypot(rx - 4.8, rz - 12.5) < 2.5) continue;
    if (Math.abs(rx + 10.5) < 5.5 && Math.abs(rz - 6.0) < 5.5) continue;
    if (Math.abs(rx + 10.8) < 5.0 && Math.abs(rz + 10.5) < 4.5) continue;
    if (Math.abs(rx - MUHTAR.x) < 5.0 && Math.abs(rz - MUHTAR.z) < 4.5) continue;
    if (Math.hypot(rx - CLINIC.x, rz - CLINIC.z) < 7.5) continue;
    if (Math.hypot(rx + 36, rz - 8) < 7.5) continue;
    if (Math.hypot(rx + 34, rz + 36) < 8.5) continue;
    if (Math.hypot(rx - 28, rz - 20) < 7.5) continue;
    rockData.push({
      x: rx,
      z: rz,
      sx: 0.38 + rand() * 0.72,
      sy: 0.28 + rand() * 0.38,
      sz: 0.38 + rand() * 0.68,
      ry: rand() * Math.PI * 2,
    });
  }
  for (const rock of rockData) {
    // Conservative rotated footprint keeps the visible boulders solid without
    // blocking the cleared road or turning little stones into giant walls.
    const c = Math.abs(Math.cos(rock.ry)), n = Math.abs(Math.sin(rock.ry));
    const rx = 0.48 * (rock.sx * c + rock.sz * n);
    const rz = 0.48 * (rock.sx * n + rock.sz * c);
    colliders.push({ minX: rock.x - rx, maxX: rock.x + rx, minZ: rock.z - rz, maxZ: rock.z + rz });
  }
  const rocks = new THREE.InstancedMesh(rockGeo, cutStone, rockData.length);
  rocks.name = 'Küçük çevre kayaları';
  rocks.castShadow = false;
  rocks.receiveShadow = true;
  rockData.forEach((r, idx) => {
    const gy = surfaceY(r.x, r.z);
    dummy.position.set(r.x, gy + r.sy * 0.25, r.z);
    dummy.rotation.set((rand() - 0.5) * 0.3, r.ry, (rand() - 0.5) * 0.3);
    dummy.scale.set(r.sx, r.sy, r.sz);
    dummy.updateMatrix();
    rocks.setMatrixAt(idx, dummy.matrix);
    const s = 0.51 + rand() * 0.26;
    tint.setRGB(s * 0.94, s, s * 0.9);
    rocks.setColorAt(idx, tint);
  });
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  rocks.matrixAutoUpdate = false;
  rocks.updateMatrix();
  scene.add(rocks);
  disposables.push(rocks, rockGeo);

  // Late-autumn grass tussocks. Folded, bent blades have volume even edge-on;
  // the whole patch is instanced, with no alpha sorting or per-stem draw calls.
  const blades: number[] = [],
    bladeColor: number[] = [];
  for (let i = 0; i < (minimal ? 8 : 26); i++) {
    const angle = rand() * Math.PI * 2,
      x = (rand() - 0.5) * 0.37,
      z = (rand() - 0.5) * 0.37;
    const dx = Math.sin(angle),
      dz = Math.cos(angle),
      h = 0.16 + rand() * 0.35,
      s = 0.009 + rand() * 0.013;
    const l = [x - dz * s, 0, z + dx * s],
      r = [x + dz * s, 0, z - dx * s];
    const fold = [x + dx * 0.06, h * 0.56, z + dz * 0.06],
      tip = [x + dx * h * 0.57, h, z + dz * h * 0.57];
    const edge = [x + dz * s + dx * 0.04, h * 0.52, z - dx * s + dz * 0.04];
    blades.push(...l, ...r, ...fold, ...r, ...edge, ...fold, ...fold, ...edge, ...tip);
    const shade = 0.65 + rand() * 0.35;
    for (let j = 0; j < 9; j++) bladeColor.push(0.45 * shade, 0.4 * shade, 0.23 * shade);
  }
  const shrubGeo = new THREE.BufferGeometry();
  shrubGeo.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3));
  shrubGeo.setAttribute('color', new THREE.Float32BufferAttribute(bladeColor, 3));
  shrubGeo.computeVertexNormals();
  const shrubMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const shrubData: Array<{ x: number; z: number; s: number }> = [];
  for (let i = 0; i < (minimal ? 54 : 150); i++) {
    const sx = -44 + rand() * 82;
    const sz = -46 + rand() * 84;
    if (reservedGround(sx, sz)) continue;
    if (Math.abs(sx) < 3.6) continue;
    if (Math.abs(sx + 10.5) < 4.5 && Math.abs(sz - 6.0) < 4.5) continue;
    if (Math.abs(sx + 10.8) < 4.0 && Math.abs(sz + 10.5) < 4.0) continue;
    if (Math.abs(sx - MUHTAR.x) < 4.2 && Math.abs(sz - MUHTAR.z) < 4.2) continue;
    if (Math.hypot(sx - CLINIC.x, sz - CLINIC.z) < 6.0) continue;
    if (Math.hypot(sx + 36, sz - 8) < 5.5) continue;
    if (Math.hypot(sx + 34, sz + 36) < 6.5) continue;
    shrubData.push({ x: sx, z: sz, s: 0.65 + rand() * 0.95 });
  }
  for (const [x, z] of [
    [-4.01, 13],
    [-4.13, 15.1],
    [-4.06, 16.2],
    [4.1, 11.2],
    [5.21, 13.8],
    [4.12, -9.2],
    [-6.65, 9.6],
  ]) {
    shrubData.push({ x, z, s: 0.8 + rand() * 0.3 });
  }
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubData.length);
  shrubData.forEach((sh, idx) => {
    const gy = surfaceY(sh.x, sh.z);
    dummy.position.set(sh.x, gy - 0.04, sh.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(sh.s * 1.15, sh.s * 0.78, sh.s);
    dummy.updateMatrix();
    shrubs.setMatrixAt(idx, dummy.matrix);
    const g = 0.75 + rand() * 0.4;
    tint.setRGB(0.8 * g, g, 0.75 * g);
    shrubs.setColorAt(idx, tint);
  });
  shrubs.instanceMatrix.needsUpdate = true;
  if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
  shrubs.computeBoundingSphere();
  shrubs.matrixAutoUpdate = false;
  shrubs.updateMatrix();
  scene.add(shrubs);
  disposables.push(shrubs, shrubGeo, shrubMat);

  // Low winter scrub: forked twig silhouettes and irregular clumps, instanced
  // only on the same cleared ground as the existing grass, never on a doorway.
  const twigParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const twig = new THREE.CylinderGeometry(0.012, 0.028, 0.55 + (i % 3) * 0.1, 5);
    const a = i * Math.PI * 2 / 7;
    twig.translate(0, 0.29, 0);
    twig.rotateZ(0.30 + (i % 3) * 0.12);
    twig.rotateY(a);
    twigParts.push(twig);
  }
  const twigGeo = mergeGeometries(twigParts)!;
  twigParts.forEach(g => g.dispose());
  const twigMat = new THREE.MeshLambertMaterial({ color: 0x51483a });
  const scrubPoints = shrubData.filter((_, i) => i % 3 === 0);
  const scrub = new THREE.InstancedMesh(twigGeo, twigMat, scrubPoints.length);
  scrubPoints.forEach((p, i) => {
    dummy.position.set(p.x, surfaceY(p.x, p.z) - 0.025, p.z);
    dummy.rotation.set(0, (i * 2.399) % (Math.PI * 2), 0);
    dummy.scale.set(0.7 + p.s * 0.35, 0.65 + p.s * 0.4, 0.7 + p.s * 0.35);
    dummy.updateMatrix(); scrub.setMatrixAt(i, dummy.matrix);
  });
  scrub.instanceMatrix.needsUpdate = true;
  scrub.computeBoundingSphere(); scrub.matrixAutoUpdate = false; scrub.updateMatrix();
  scene.add(scrub);
  disposables.push(scrub, twigGeo, twigMat);

  return {
    streamWater,
    colliders,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
