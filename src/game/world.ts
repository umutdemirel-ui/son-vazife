import { buildHome, type Home } from './homes';
import { CEMETERY, CEMETERY_GRAVES } from './cemetery';
import { receivingBay, STRETCHERS } from './funerary';
import { NightArt, watcherFigure } from './nightArt';
import { CLINIC, MUHTAR, CORE_HOME_CENTRES, OUTER_HOMES, type Outpost } from './valley';
import { buildOutposts } from './outposts';
import { bakeStaticChildrenByMaterial } from './meshBatch';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { houseFootprint, translateColliders, type BoxCollider } from './collision';
import { ResidentVisual } from './residentVisual';
import { VillageCraft, type HouseStyle } from './villageCraft';
import { AutopsyBodyRefs, createAutopsyCadaverOverlay } from './autopsy';
import {
  BUILD_KIT,
  type KitId,
  type DressingId,
  type ModelId,
  type WorkshopAssets,
} from './workshopAssets';
import type { Allocation, RenderTier } from './quality';
import { distantShell, shellMaterial } from './distantShell';
import { VisibilityCells } from './visibilityCells';
import {
  AbandonedHouseRefs,
  CemeteryCryptRefs,
  ClinicRefs,
  createAbandonedHouse,
  createCemeteryHillAndCrypt,
  createClayJug,
  createClinicBuilding,
  createCopperEwerAndSoap,
  createDistrictSignpost,
  createFirewoodStack,
  createKaraBasma,
  createMosqueAndGasilhane,
  createMuhtarHouse,
  createSisGozcusu,
  createStreetLamp,
  createUtilityPole,
  createVillageBench,
  createWatermillAndBridge,
  createWreckedMinibus,
  GasilhaneRefs,
  MillAndBridgeRefs,
  MuhtarRefs,
  WreckedMinibusRefs,
} from './models';
import { NpcRuntimeActor, VILLAGE_NPCS } from './npcs';
import { buildMountainTerrainAndForest, exteriorFloorAt, groundHeightAt } from './terrain';
import { VillageTextures } from './textures';
import { AutopsyCaseId, NpcId } from './types';

export interface InteractableTarget {
  id: string;
  mesh: THREE.Object3D;
  worldPos: THREE.Vector3;
  maxDist: number;
  label: () => string | null;
}

export interface VirtualPointLight {
  light: THREE.PointLight;
  anchor: THREE.Object3D;
  worldPos: THREE.Vector3;
  distSq: number;
}

export interface WorldHandles {
  colliders: BoxCollider[];
  homes: Home[];
  outpostDoors: Record<Outpost, { pivot: THREE.Group; open: boolean; collider: BoxCollider }>;
  interactables: InteractableTarget[];
  interactableMeshes: THREE.Object3D[];
  itemMeshes: Record<string, THREE.Object3D>;
  gasil: GasilhaneRefs;
  muhtar: MuhtarRefs;
  abandoned: AbandonedHouseRefs;
  clinic: ClinicRefs;
  millAndBridge: MillAndBridgeRefs;
  cemetery: CemeteryCryptRefs;
  crashSite: WreckedMinibusRefs;
  gasilAutopsy: AutopsyBodyRefs;
  autopsyBodies: Record<AutopsyCaseId, AutopsyBodyRefs>;
  autopsyLights: {
    examLight: THREE.PointLight;
    flashLight: THREE.PointLight;
    anchors: Record<AutopsyCaseId, { examAnchor: THREE.Object3D; flashAnchor: THREE.Object3D }>;
  };
  npcs: Record<NpcId, NpcRuntimeActor>;
  karaBasma: ReturnType<typeof watcherFigure>;
  nightArt: NightArt;
  receiving: ReturnType<typeof receivingBay>;
  transportBed: THREE.Group;
  keeper: ReturnType<typeof buildOutposts>['keeper'];
  setSignal: (aligned: boolean) => void;
  poseWatchers: (time: number, karaFollows: boolean, mistFollows: boolean) => void;
  sisGozcusu: THREE.Group;
  streetLights: Array<{
    light: THREE.PointLight;
    bulbMat: THREE.MeshStandardMaterial;
    baseIntensity: number;
  }>;
  virtualLights: VirtualPointLight[];
  worldLightPool: THREE.PointLight[];
  apertureLights: { window: THREE.MeshBasicMaterial; officeDoor: THREE.MeshBasicMaterial };
  sunKeyLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  moonMesh: THREE.Mesh;
  horizon: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  mistSprites: THREE.Sprite[];
  rainPoints: THREE.Points;
  rainGeo: THREE.BufferGeometry;
  rainUniforms: {
    uTime: { value: number };
    uPlayerPos: { value: THREE.Vector3 };
    uOpacity: { value: number };
    uSpeed: { value: number };
  };
  applyModel: (assets: WorkshopAssets, id: ModelId) => void;
  updateDetail: (eye: THREE.Vector3, tier: RenderTier) => void;
  dispose: () => void;
}

export function buildVillageWorld(
  scene: THREE.Scene,
  textures: VillageTextures,
  getLabel: (id: string) => string | null,
  allocation: Allocation,
  residentReady: (root: THREE.Object3D) => void,
): WorldHandles {
  const disposables: Array<{ dispose: () => void }> = [];
  const craft = new VillageCraft(textures);
  const cells = new VisibilityCells();
  const nightArt = new NightArt(allocation !== 'full', residentReady);
  disposables.push(nightArt);
  disposables.push(craft);
  const colliders: BoxCollider[] = [];
  const interactables: InteractableTarget[] = [];
  const itemMeshes: Record<string, THREE.Object3D> = {};

  // 1. Lighting Rig (Warm/Cool contrast + FogExp2)
  const hemiLight = new THREE.HemisphereLight(0xb0bac5, 0x796b58, 1.18);
  scene.add(hemiLight);

  const sunKeyLight = new THREE.DirectionalLight(0xe6c19d, 1.15);
  sunKeyLight.position.set(18, 26, 22);
  sunKeyLight.castShadow = true;
  sunKeyLight.shadow.mapSize.set(1024, 1024);
  sunKeyLight.shadow.camera.left = -36;
  sunKeyLight.shadow.camera.right = 36;
  sunKeyLight.shadow.camera.top = 36;
  sunKeyLight.shadow.camera.bottom = -36;
  sunKeyLight.shadow.camera.near = 2;
  sunKeyLight.shadow.camera.far = 90;
  sunKeyLight.shadow.bias = -0.0005;
  sunKeyLight.shadow.normalBias = 0.02;
  scene.add(sunKeyLight);

  scene.background = new THREE.Color(0x59656c);
  scene.fog = new THREE.FogExp2(0x59656c, 0.023);

  // A camera-centred horizon retains the silhouettes of the surrounding valley,
  // even on the low tier where distant geometry is clipped. No parallax on walking.
  const skyMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    toneMapped: false,
  });
  // Draw the panorama only into uncovered pixels, including in a window of a walk-in room.
  skyMaterial.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n gl_Position.z=gl_Position.w;',
    );
  };
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(59, allocation === 'minimum' ? 24 : 48, allocation === 'minimum' ? 8 : 18),
    skyMaterial,
  );
  horizon.renderOrder = 1000;
  horizon.frustumCulled = false;
  horizon.visible = false;
  const skyPhoto = new THREE.TextureLoader().load('/assets/archive/horizon.jpg', () => {
    horizon.visible = true;
  });
  skyPhoto.colorSpace = THREE.SRGBColorSpace;
  skyPhoto.wrapS = THREE.MirroredRepeatWrapping;
  skyPhoto.repeat.x = 2;
  skyMaterial.map = skyPhoto;
  skyMaterial.color.setScalar(0.65);
  scene.add(horizon);
  disposables.push(horizon.geometry, skyMaterial, skyPhoto);

  // Subtle distant Moon in sky
  const moonGeo = new THREE.CircleGeometry(2.8, 24);
  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xdce4ee,
    fog: false,
    transparent: true,
    opacity: 0.78,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(-34, 42, -74);
  moonMesh.lookAt(0, 2, 0);
  moonMesh.updateMatrix();
  moonMesh.matrixAutoUpdate = false;
  scene.add(moonMesh);
  disposables.push(moonGeo, moonMat);

  // 2. Expanded 5-District Terrain & Instanced Pine Forest
  const terrainHandle = buildMountainTerrainAndForest(scene, textures, craft.limestone, allocation);
  disposables.push(terrainHandle);
  colliders.push(...terrainHandle.colliders);

  // 3. Mosque & Gasilhane Complex at (-10.5, y, 6.0)
  const gasilPos = new THREE.Vector3(-10.5, groundHeightAt(-10.5, 6.0), 6.0);
  const gasil = createMosqueAndGasilhane(textures, craft, nightArt);
  gasil.group.position.copy(gasilPos);
  cells.add(scene, gasil.group, 34, 55);

  // Case I Forensic Overlay aligned directly onto Gasilhane Tenesir Slab
  const gasilAutopsy = createAutopsyCadaverOverlay('case_arif', nightArt, -0.862);
  gasil.deceasedGroup.add(gasilAutopsy.group);
  nightArt.near('arif', gasilPos.x, gasilPos.z, 22);
  nightArt.near('mahmut', CLINIC.x, CLINIC.z, 23);
  nightArt.near('yolcu', -34, -36, 22);
  const receiving = receivingBay(gasil.group, nightArt, craft);
  for (const { x, z } of Object.values(STRETCHERS))
    colliders.push({
      minX: gasilPos.x + x - 1.08,
      maxX: gasilPos.x + x + 1.08,
      minZ: gasilPos.z + z - 0.36,
      maxZ: gasilPos.z + z + 0.36,
    });

  // Independent outdoor transfer stretcher, clear of the entrance and village lane.
  const transportBed = new THREE.Group();
  transportBed.position.set(-4.4, groundHeightAt(-4.4, 3.7), 3.7);
  const bedMaterials = [craft.wood, craft.metal];
  const bedPart = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); transportBed.add(mesh); disposables.push(mesh.geometry);
  };
  bedPart(2.05, 0.12, 0.8, 0, 0.72, 0, bedMaterials[0]);
  for (const x of [-0.8, 0.8]) for (const z of [-0.3, 0.3]) bedPart(0.07, 0.7, 0.07, x, 0.35, z, bedMaterials[1]);
  cells.add(scene, transportBed, 30, 50);
  colliders.push({ minX: -5.425, maxX: -3.375, minZ: 3.3, maxZ: 4.1 });

  colliders.push(...translateColliders(gasilPos, [
    { minX: -3.6, maxX: 3.6, minZ: -3.45, maxZ: -2.95 }, // Gasil North
    { minX: -3.6, maxX: 3.6, minZ: 2.95, maxZ: 3.45 }, // Gasil South
    { minX: -3.65, maxX: -3.15, minZ: -3.4, maxZ: 3.4 }, // Gasil West
    { minX: 3.15, maxX: 3.65, minZ: -3.4, maxZ: -0.8 }, // Gasil East-North
    { minX: 3.15, maxX: 3.65, minZ: 0.8, maxZ: 3.4 }, // Gasil East-South
    { minX: -1.25, maxX: 1.25, minZ: -0.65, maxZ: 0.65 }, // Marble Tenesir Slab
    { minX: -3.5, maxX: -3.3, minZ: -8.1, maxZ: -3.4 }, // Mosque west
    { minX: -3.5, maxX: 3.5, minZ: -8.1, maxZ: -7.9 }, // Mosque north
    { minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: -3.3 }, // Mosque south
    { minX: 3.2, maxX: 3.5, minZ: -8.0, maxZ: -6.45 },
    { minX: 3.2, maxX: 3.5, minZ: -4.95, maxZ: -3.4 },
  ]));
  // The only burial ground is the designated cemetery; the square and mosque
  // forecourt are kept free of graves and their former colliders.

  // 4. Walk-in Abandoned Village House (Eski Köy Evi) at (-10.8, y, -10.5)
  const abandonedPos = new THREE.Vector3(-10.8, groundHeightAt(-10.8, -10.5), -10.5);
  const abandoned = createAbandonedHouse(textures, craft);
  abandoned.group.position.copy(abandonedPos);
  cells.add(scene, abandoned.group, 28, 49);

  colliders.push(...translateColliders(abandonedPos, [
    { minX: -3.15, maxX: 3.15, minZ: -3.0, maxZ: -2.5 },
    { minX: -3.15, maxX: 3.15, minZ: 2.5, maxZ: 3.0 },
    { minX: -3.2, maxX: -2.7, minZ: -3.0, maxZ: 3.0 },
    { minX: 2.75, maxX: 3.25, minZ: -3.0, maxZ: -0.8 },
    { minX: 2.75, maxX: 3.25, minZ: 0.8, maxZ: 3.0 },
    { minX: -1.9, maxX: -0.7, minZ: -0.4, maxZ: 1.2 },
  ]));
  // 5. Muhtar's office on the upper village slope.
  const muhtarPos = new THREE.Vector3(MUHTAR.x, groundHeightAt(MUHTAR.x, MUHTAR.z), MUHTAR.z);
  const muhtar = createMuhtarHouse(textures, craft);
  muhtar.group.position.copy(muhtarPos);
  cells.add(scene, muhtar.group, 28, 49);

  // Two inexpensive floor projections suggest light entering actual openings.
  // They cast no light or shadows, and never add another real-time light source.
  const apertureGeometry = new THREE.PlaneGeometry(1.8, 1.25);
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const edge = Math.min(x, y, 31 - x, 31 - y) / 6;
    const i = (y * 32 + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
    pixels[i + 3] = Math.round(255 * Math.min(1, edge));
  }
  const apertureTexture = new THREE.DataTexture(pixels, 32, 32, THREE.RGBAFormat);
  apertureTexture.magFilter = THREE.LinearFilter;
  apertureTexture.minFilter = THREE.LinearFilter;
  apertureTexture.needsUpdate = true;
  const windowLight = new THREE.MeshBasicMaterial({ map: apertureTexture, color: 0x9daab0, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  const doorLight = new THREE.MeshBasicMaterial({ map: apertureTexture, color: 0xb6ad97, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  const windowPatch = new THREE.Mesh(apertureGeometry, windowLight);
  windowPatch.rotation.x = -Math.PI / 2;
  windowPatch.position.set(-2.25, 0.166, 0);
  gasil.group.add(windowPatch);
  const doorPatch = new THREE.Mesh(apertureGeometry, doorLight);
  doorPatch.rotation.x = -Math.PI / 2;
  doorPatch.position.set(-2.35, 0.18, 0);
  muhtar.group.add(doorPatch);
  disposables.push(apertureGeometry, apertureTexture, windowLight, doorLight);

  colliders.push(...translateColliders(muhtarPos, [
    { minX: -3.4, maxX: 3.4, minZ: -3.25, maxZ: -2.75 },
    { minX: -3.4, maxX: 3.4, minZ: 2.75, maxZ: 3.25 },
    { minX: 2.95, maxX: 3.45, minZ: -3.2, maxZ: 3.2 },
    { minX: -3.45, maxX: -2.95, minZ: -3.2, maxZ: -0.8 },
    { minX: -3.45, maxX: -2.95, minZ: 0.8, maxZ: 3.2 },
    { minX: 0.6, maxX: 1.9, minZ: -1.3, maxZ: 0.9 },
  ]));
  // 5b. Sağlık Ocağı, on the east hillside.
  const clinicPos = new THREE.Vector3(CLINIC.x, groundHeightAt(CLINIC.x, CLINIC.z), CLINIC.z);
  const clinic = createClinicBuilding(textures, craft, nightArt);
  clinic.group.position.copy(clinicPos);
  cells.add(scene, clinic.group, 26, 48);

  colliders.push(...translateColliders(clinicPos, [
    { minX: -3.9, maxX: 3.9, minZ: -3.5, maxZ: -3.05 }, // Clinic North
    { minX: -3.9, maxX: 3.9, minZ: 3.05, maxZ: 3.5 }, // Clinic South
    { minX: 3.45, maxX: 3.95, minZ: -3.4, maxZ: 3.4 }, // Clinic East
    { minX: -3.95, maxX: -3.45, minZ: -3.4, maxZ: -0.8 }, // Clinic West-North
    { minX: -3.95, maxX: -3.45, minZ: 0.8, maxZ: 3.4 }, // Clinic West-South
    { minX: -0.75, maxX: 1.55, minZ: -0.55, maxZ: 0.55 }, // Autopsy table
    { minX: -0.6, maxX: 1.6, minZ: -3.1, maxZ: -2.5 }, // Medical shelf
  ]));
  // 5c. Dere Köprüsü & Eski Su Değirmeni (District III: West Stream & Mill)
  const millAndBridge = createWatermillAndBridge(textures);
  const bridgePos = new THREE.Vector3(-24.0, 0.05, 8.0);
  millAndBridge.bridgeGroup.position.copy(bridgePos);
  cells.add(scene, millAndBridge.bridgeGroup, 28, 51);

  const millPos = new THREE.Vector3(-36.0, groundHeightAt(-36.0, 8.0), 8.0);
  millAndBridge.millGroup.position.copy(millPos);
  cells.add(scene, millAndBridge.millGroup, 28, 51);

  colliders.push(
    // Bridge railings (North & South)
    { minX: -27.4, maxX: -20.6, minZ: 6.28, maxZ: 6.56 },
    { minX: -27.4, maxX: -20.6, minZ: 9.44, maxZ: 9.72 },
    // Watermill walls (Doorway on East wall x=-32.9, z: 7.2..8.8)
    { minX: -39.3, maxX: -38.85, minZ: 4.95, maxZ: 11.05 }, // Mill West
    { minX: -39.2, maxX: -32.8, minZ: 4.9, maxZ: 5.35 }, // Mill North
    { minX: -39.2, maxX: -32.8, minZ: 10.65, maxZ: 11.1 }, // Mill South
    { minX: -33.1, maxX: -32.7, minZ: 5.0, maxZ: 7.2 }, // Mill East-North
    { minX: -33.1, maxX: -32.7, minZ: 8.8, maxZ: 11.0 }, // Mill East-South
    { minX: -38.1, maxX: -36.5, minZ: 6.1, maxZ: 7.7 }, // Millstone
    { minX: -38.1, maxX: -36.8, minZ: 8.6, maxZ: 9.6 }, // Crate desk
  );

  // 5d. Mezarlık Tepesi & Taş Mahzen (District IV: Northwest Cemetery Hill) at (-34.0, y, -36.0)
  const cemPos = new THREE.Vector3(-34.0, groundHeightAt(-34.0, -36.0), -36.0);
  const cemetery = createCemeteryHillAndCrypt(textures, nightArt);
  cemetery.group.position.copy(cemPos);
  cells.add(scene, cemetery.group, 26, 50);

  // Match the physical grave plinths; leave the paths and crypt doorway clear.
  for (const [x, z] of CEMETERY_GRAVES) {
    colliders.push(houseFootprint(CEMETERY.x + x, CEMETERY.z + z, 0.52, 1.35, 0));
  }

  // Crypt local center (1.6, 0, -3.2) => world (-32.4, y, -39.2), cw=4.6, cd=4.8
  colliders.push(...translateColliders(cemPos, [
    { minX: -6.35, maxX: 6.3, minZ: -6.75, maxZ: -6.25 }, // Outer North fence
    { minX: -6.45, maxX: -5.95, minZ: -6.5, maxZ: 6.5 }, // Outer West fence
    { minX: -0.8, maxX: 4.0, minZ: -5.8, maxZ: -5.4 }, // Crypt Back North
    { minX: -0.9, maxX: -0.5, minZ: -5.65, maxZ: -0.75 }, // Crypt West
    { minX: 3.7, maxX: 4.1, minZ: -5.65, maxZ: -0.75 }, // Crypt East
    { minX: -0.8, maxX: 0.85, minZ: -1.0, maxZ: -0.6 }, // Crypt South-West
    { minX: 2.35, maxX: 4.0, minZ: -1.0, maxZ: -0.6 }, // Crypt South-East
    { minX: 0.45, maxX: 2.75, minZ: -4.08, maxZ: -3.02 }, // Basalt slab
  ]));
  // 5e. Viraj Kaza Alanı (District V: Southeast Wrecked Minibus) at (28.0, y, 20.0)
  const crashPos = new THREE.Vector3(28.0, groundHeightAt(28.0, 20.0), 20.0);
  const crashSite = createWreckedMinibus(textures);
  crashSite.group.position.copy(crashPos);
  cells.add(scene, crashSite.group, 24, 43);
  colliders.push({ minX: 26.2, maxX: 30.6, minZ: 18.8, maxZ: 22.4 });

  // 6. Flanking & Perimeter Village Houses + Stone Courtyard Walls
  const houseConfigs: {
    x: number;
    z: number;
    rotY: number;
    w: number;
    d: number;
    h: number;
    style: HouseStyle;
  }[] = [
    { x: CORE_HOME_CENTRES[0][0], z: CORE_HOME_CENTRES[0][1], rotY: -Math.PI / 2, w: 6.2, d: 5.4, h: 4.3, style: 'cumba' },
    { x: CORE_HOME_CENTRES[1][0], z: CORE_HOME_CENTRES[1][1], rotY: Math.PI / 2, w: 5.6, d: 4.8, h: 3.9, style: 'himis' },
    { x: CORE_HOME_CENTRES[2][0], z: CORE_HOME_CENTRES[2][1], rotY: -Math.PI / 2 + 0.08, w: 5.8, d: 5.0, h: 4.0, style: 'tas' },
    { x: CORE_HOME_CENTRES[3][0], z: CORE_HOME_CENTRES[3][1], rotY: Math.PI / 2 - 0.12, w: 6.0, d: 5.2, h: 4.1, style: 'cumba' },
    { x: CORE_HOME_CENTRES[4][0], z: CORE_HOME_CENTRES[4][1], rotY: -Math.PI * 0.6, w: 6.4, d: 5.4, h: 4.2, style: 'tas' },
    { x: CORE_HOME_CENTRES[5][0], z: CORE_HOME_CENTRES[5][1], rotY: Math.PI * 0.45, w: 5.8, d: 5.0, h: 4.0, style: 'himis' },
    { x: CORE_HOME_CENTRES[6][0], z: CORE_HOME_CENTRES[6][1], rotY: -Math.PI * 0.25, w: 6.0, d: 5.2, h: 4.1, style: 'himis' },
    { x: CORE_HOME_CENTRES[7][0], z: CORE_HOME_CENTRES[7][1], rotY: Math.PI * 0.35, w: 5.8, d: 5.0, h: 4.0, style: 'tas' },
  ];
  OUTER_HOMES.forEach(([x, z, rotY], i) =>
    houseConfigs.push({
      x,
      z,
      rotY,
      w: 5.2 + (i % 3) * 0.4,
      d: 4.3 + (i % 2) * 0.3,
      h: 3.7 + (i % 3) * 0.25,
      style: (['himis', 'tas', 'cumba'] as const)[i % 3],
    }),
  );
  const homes: Home[] = [];
  houseConfigs.forEach((hc, i) => {
    const { home, walls } = buildHome(hc, i + 1, groundHeightAt(hc.x, hc.z), craft);
    homes.push(home);
    const houseGeometries = new Set<THREE.BufferGeometry>();
    const collectHouse = (node: THREE.Object3D) => {
      if (node instanceof THREE.Mesh) houseGeometries.add(node.geometry);
      node.children.forEach(collectHouse);
    };
    collectHouse(home.root);
    disposables.push({ dispose: () => houseGeometries.forEach(g => g.dispose()) });
    cells.add(scene, home.root, 34, 58);
    colliders.push(...walls);
  });

  const stoneWallMat = new THREE.MeshStandardMaterial({
    map: textures.stone,
    normalMap: textures.stoneNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughness: 0.9,
  });
  disposables.push(stoneWallMat);
  // Village Storytelling Micro-Props & District Signposts
  [
    { x: -10.4, z: 9.65, rot: 0 },
    { x: -10.8, z: -7.25, rot: 0 },
    { x: 7.5, z: 4.2, rot: Math.PI / 2 },
  ].forEach((fw) => {
    const stack = createFirewoodStack(textures);
    stack.position.set(fw.x, groundHeightAt(fw.x, fw.z), fw.z);
    stack.rotation.y = fw.rot;
    cells.add(scene, stack, 14, 25);
  });

  (
    [
      { x: 1.5, z: -49, rot: 0.2, text: 'MUHTARLIK' },
      { x: -3.1, z: 10.5, rot: 0.3, text: '←  DEĞİRMEN' },
      { x: 2.8, z: -23.0, rot: -0.4, text: 'SAĞLIK OCAĞI' },
      { x: -2.6, z: -28.0, rot: 0.45, text: 'MEZARLIK  ←' },
      { x: 3.1, z: 15.2, rot: -0.35, text: 'ÇEŞME  →' },
    ] as const
  ).forEach((sp) => {
    const post = createDistrictSignpost(craft, sp.text);
    post.position.set(sp.x, groundHeightAt(sp.x, sp.z), sp.z);
    post.rotation.y = sp.rot;
    cells.add(scene, post, 19, 33);
  });

  const mosqueBench = createVillageBench(craft);
  mosqueBench.position.set(-4.35, groundHeightAt(-4.35, 1.8), 1.8);
  mosqueBench.rotation.y = Math.PI / 2;
  cells.add(scene, mosqueBench, 19, 30);
  colliders.push({ minX: -4.7, maxX: -4.0, minZ: 0.9, maxZ: 2.7 });

  const fountainBench = createVillageBench(craft);
  fountainBench.position.set(4.5, groundHeightAt(4.5, 15.1), 15.1);
  fountainBench.rotation.y = -Math.PI / 2;
  cells.add(scene, fountainBench, 19, 30);
  colliders.push({ minX: 4.15, maxX: 4.85, minZ: 14.2, maxZ: 16.0 });

  const jug1 = createClayJug(textures);
  jug1.position.set(4.06, groundHeightAt(4.06, 13.7), 13.7);
  const jug2 = createClayJug(textures);
  jug2.position.set(abandonedPos.x + 3.55, abandonedPos.y + 0.14, abandonedPos.z + 1.15);
  cells.add(scene, jug1, 13, 24);
  cells.add(scene, jug2, 13, 24);

  // 7. Village Entrance Sign ("KUZDAĞ KÖYÜ - RAKIM 1480 m")
  const signGroup = new THREE.Group();
  const signX = -3.6;
  const signZ = 20.8;
  signGroup.position.set(signX, groundHeightAt(signX, signZ), signZ);
  signGroup.rotation.y = 0.35;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3b4045, roughness: 0.6, metalness: 0.7 });
  const signMat = new THREE.MeshStandardMaterial({ map: textures.sign, roughness: 0.45 });
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), postMat);
  postL.position.set(-0.65, 1.1, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), postMat);
  postR.position.set(0.65, 1.1, 0);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.06), signMat);
  board.position.set(0, 1.95, 0);
  signGroup.add(postL, postR, board);
  signGroup.updateMatrixWorld(true);
  signGroup.traverse((o) => {
    o.matrixAutoUpdate = false;
  });
  scene.add(signGroup);
  disposables.push(postMat, signMat);

  // 8. Stone Village Fountain (Çeşme) at (4.8, y, 12.5)
  const fountainPos = new THREE.Vector3(4.8, groundHeightAt(4.8, 12.5), 12.5);
  const fountain = craft.fountain();
  fountain.position.copy(fountainPos);
  fountain.rotation.y = -Math.PI / 2;
  fountain.updateMatrix();
  fountain.matrixAutoUpdate = false;
  cells.add(scene, fountain, 32, 55);
  colliders.push({ minX: 4.0, maxX: 5.6, minZ: 11.2, maxZ: 13.8 });

  // A low open stone well, separate from the usable fountain and its evidence.
  const well = new THREE.Group();
  const wellX = -3.1, wellZ = -10.5;
  well.position.set(wellX, groundHeightAt(wellX, wellZ), wellZ);
  const wellGeo = new THREE.CylinderGeometry(0.92, 0.97, 0.82, 12, 1, true);
  const wellTopGeo = new THREE.TorusGeometry(0.77, 0.17, 8, 12);
  const wellDarkGeo = new THREE.CircleGeometry(0.68, 12);
  const wellWood = new THREE.MeshStandardMaterial({ color: 0x4e3e2e, roughness: 0.98 });
  const wellDark = new THREE.MeshBasicMaterial({ color: 0x151713 });
  const wall = new THREE.Mesh(wellGeo, stoneWallMat); wall.position.y = 0.41;
  const rim = new THREE.Mesh(wellTopGeo, stoneWallMat); rim.rotation.x = Math.PI / 2; rim.position.y = 0.83;
  const hole = new THREE.Mesh(wellDarkGeo, wellDark); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.67;
  well.add(wall, rim, hole);
  const postGeo = new THREE.BoxGeometry(0.12, 1.45, 0.12);
  for (const x of [-0.85, 0.85]) { const post = new THREE.Mesh(postGeo, wellWood); post.position.set(x, 1.1, 0); well.add(post); }
  const crossGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.85, 8);
  const cross = new THREE.Mesh(crossGeo, wellWood); cross.rotation.z = Math.PI / 2; cross.position.y = 1.75; well.add(cross);
  cells.add(scene, well, 28, 45);
  colliders.push({ minX: wellX - 0.94, maxX: wellX + 0.94, minZ: wellZ - 0.94, maxZ: wellZ + 0.94 });
  disposables.push(wellGeo, wellTopGeo, wellDarkGeo, postGeo, crossGeo, wellWood, wellDark);

  // 9. Exterior Yard Drain near Gasilhane (Rule 2 Trap)
  const yardDrainGroup = new THREE.Group();
  const ydX = -5.4;
  const ydZ = 8.6;
  yardDrainGroup.position.set(ydX, groundHeightAt(ydX, ydZ) + 0.03, ydZ);
  const ydRim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.85), stoneWallMat);
  const ydHole = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.16, 0.54),
    new THREE.MeshStandardMaterial({ color: 0x090b0b, roughness: 0.9 }),
  );
  yardDrainGroup.add(ydRim, ydHole);
  yardDrainGroup.updateMatrixWorld(true);
  yardDrainGroup.traverse((o) => {
    o.matrixAutoUpdate = false;
  });
  cells.add(scene, yardDrainGroup, 16, 24);

  // 10. Street Lamps across all 5 Districts + Overhead Utility Poles
  const streetLights: WorldHandles['streetLights'] = [];
  [
    { x: -4.2, z: 6.2, rot: 0, base: 6.8 },
    { x: 4.1, z: -12.2, rot: Math.PI, base: 6.6 },
    { x: 3.9, z: 17.5, rot: Math.PI, base: 5.4 },
    { x: -4.0, z: -17.5, rot: 0, base: 5.2 },
    { x: 13.5, z: -24.5, rot: -Math.PI / 2, base: 5.6 }, // Clinic road
    { x: CLINIC.x - 5.2, z: CLINIC.z - 1.5, rot: 0, base: 6.0 }, // Clinic courtyard
    { x: -19.5, z: 6.0, rot: Math.PI / 2, base: 5.2 }, // Bridge head
    { x: -26.5, z: -33.2, rot: 0.3, base: 4.8 }, // Cemetery hill approach
    { x: 46.7, z: -54.2, rot: 0, base: 4.5 }, // Mektep yard
    { x: 54.1, z: 32.3, rot: 1.15, base: 5.4 }, // Last platform
    { x: -50.7, z: 46.8, rot: -0.52, base: 4.1 }, // Reach of the switchboard lamp
    { x: 22.0, z: 18.2, rot: -0.4, base: 5.0 }, // Crash bend approach
  ].forEach((lp) => {
    const sl = createStreetLamp();
    sl.group.position.set(lp.x, groundHeightAt(lp.x, lp.z), lp.z);
    sl.group.rotation.y = lp.rot;
    sl.light.intensity = lp.base;
    cells.add(scene, sl.group, 28, 47);
    streetLights.push({ light: sl.light, bulbMat: sl.bulbMat, baseIntensity: lp.base });
  });

  // The square is an older hamlet, not a modern avenue of utility poles.
  // Wires remain available at the distant exchange, not across the central view.
  const poleCoords: { x: number; z: number; rot: number }[] = [];
  const poleTops: THREE.Vector3[] = [];
  poleCoords.forEach((pc) => {
    const { group, wireAttachY } = createUtilityPole(textures);
    const py = groundHeightAt(pc.x, pc.z);
    group.position.set(pc.x, py, pc.z);
    group.rotation.y = pc.rot;
    cells.add(scene, group, 23, 39);
    poleTops.push(new THREE.Vector3(pc.x, py + wireAttachY, pc.z));
    colliders.push({ minX: pc.x - 0.25, maxX: pc.x + 0.25, minZ: pc.z - 0.25, maxZ: pc.z + 0.25 });
  });

  const wiring = new THREE.Group();
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.7, metalness: 0.3 });
  disposables.push(cableMat);
  for (let i = 0; i < poleTops.length - 1; i++) {
    const a = poleTops[i];
    const b = poleTops[i + 1];
    [-0.45, 0.45].forEach((offset) => {
      const p0 = new THREE.Vector3(a.x + offset, a.y, a.z);
      const p2 = new THREE.Vector3(b.x + offset, b.y, b.z);
      const mid = p0.clone().lerp(p2, 0.5);
      mid.y -= 0.78;
      const cableGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([p0, mid, p2]),
        14,
        0.016,
        4,
        false,
      );
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.updateMatrix();
      cable.matrixAutoUpdate = false;
      wiring.add(cable);
      disposables.push(cableGeo);
    });
  }

  bakeStaticChildrenByMaterial(wiring);
  scene.add(wiring);
  // 11. Wooden Crate beside Gasilhane entrance
  const crateMesh = craft.chest(0.75, 0.65, 0.75);
  crateMesh.position.set(-6.1, groundHeightAt(-6.1, 4.4), 4.4);
  cells.add(scene, crateMesh, 18, 28);

  // 12. Collectible Supplies
  const defterMesh = craft.mount('emanet', 'defter', createCopperEwerAndSoap('defter'), true);
  defterMesh.position.set(-6.1, groundHeightAt(-6.1, 4.4) + 0.66, 4.4);
  defterMesh.rotation.y = 0.4;
  scene.add(defterMesh);
  itemMeshes['item_defter'] = defterMesh;

  const kefenMesh = craft.mount('emanet', 'kefen', createCopperEwerAndSoap('kefen'), true);
  kefenMesh.position.set(gasilPos.x + 4.2, gasilPos.y + 0.81, gasilPos.z - 6.2);
  scene.add(kefenMesh);
  itemMeshes['item_kefen'] = kefenMesh;

  const sabunMesh = craft.mount('emanet', 'sabun', createCopperEwerAndSoap('sabun'), true);
  sabunMesh.position.set(fountainPos.x - 0.1, fountainPos.y + 1.2, fountainPos.z + 0.72);
  scene.add(sabunMesh);
  itemMeshes['item_sabun'] = sabunMesh;

  const ibrikMesh = craft.mount('emanet', 'ibrik', createCopperEwerAndSoap('ibrik'), true);
  ibrikMesh.position.set(fountainPos.x - 0.68, fountainPos.y + 0.56, fountainPos.z - 0.25);
  ibrikMesh.rotation.y = -Math.PI * 0.39; // handle and pouring lip read in profile from the lane
  scene.add(ibrikMesh);
  itemMeshes['item_ibrik'] = ibrikMesh;

  itemMeshes['item_gulsuyu'] = abandoned.gulsuyuProp;
  itemMeshes['item_kafur'] = muhtar.camphorJar;
  itemMeshes['item_mill_toxin'] = millAndBridge.herbPatch;

  // 13. Register Interactables
  const registerTarget = (
    id: string,
    worldPos: THREE.Vector3,
    size: [number, number, number],
    maxDist = 3.2,
    parent?: THREE.Object3D,
  ) => {
    const hitGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxy = new THREE.Mesh(hitGeo, hitMat);
    proxy.position.copy(worldPos);
    proxy.userData.interactId = id;
    proxy.userData.targetIndex = interactables.length;
    proxy.layers.set(1);
    (parent ?? scene).add(proxy);
    disposables.push(hitGeo, hitMat);
    interactables.push({
      id,
      mesh: proxy,
      worldPos: worldPos.clone(),
      maxDist,
      label: () => getLabel(id),
    });
  };

  homes.forEach((home, i) => {
    registerTarget(`home_door_${i}`, new THREE.Vector3(0.72, 1.05, 0), [1.4, 2.1, 0.3], 2.7, home.door);
  });

  registerTarget(
    'item_defter',
    defterMesh.position.clone().add(new THREE.Vector3(0, 0.12, 0)),
    [0.6, 0.5, 0.6],
  );
  registerTarget(
    'item_kefen',
    kefenMesh.position.clone().add(new THREE.Vector3(0, 0.15, 0)),
    [0.7, 0.55, 0.6],
  );
  registerTarget(
    'item_sabun',
    sabunMesh.position.clone().add(new THREE.Vector3(0, 0.12, 0)),
    [0.55, 0.45, 0.55],
  );
  registerTarget(
    'item_ibrik',
    ibrikMesh.position.clone().add(new THREE.Vector3(0, 0.22, 0)),
    [0.55, 0.6, 0.55],
  );
  registerTarget(
    'item_mill_toxin',
    new THREE.Vector3(millPos.x + 4.9, millPos.y + 0.32, millPos.z - 1.8),
    [0.9, 0.7, 0.9],
    3.3,
  );

  registerTarget('mosque_door', new THREE.Vector3(-7.1, gasilPos.y + 1.2, 0.3), [0.4, 2.2, 1.5], 3.0);
  registerTarget(
    'gasil_door',
    new THREE.Vector3(gasilPos.x + 3.4, gasilPos.y + 1.25, gasilPos.z),
    [0.6, 2.2, 1.5],
    3.1,
  );
  registerTarget('transport_bed', new THREE.Vector3(-4.4, transportBed.position.y + 0.8, 3.7), [2.05, 0.5, 0.8], 2.8);
  registerTarget(
    'tenesir_slab',
    new THREE.Vector3(gasilPos.x, gasilPos.y + 1.05, gasilPos.z),
    [2.4, 0.9, 1.2],
    3.4,
  );
  registerTarget(
    'gasil_shutter',
    new THREE.Vector3(gasilPos.x - 3.25, gasilPos.y + 2.0, gasilPos.z),
    [0.6, 1.3, 1.9],
    4.2,
  );
  registerTarget(
    'gasil_drain',
    new THREE.Vector3(gasilPos.x - 1.9, gasilPos.y + 0.35, gasilPos.z + 2.0),
    [0.9, 0.7, 0.9],
    3.2,
  );
  registerTarget(
    'vigil_candle',
    new THREE.Vector3(gasilPos.x - 1.35, gasilPos.y + 1.1, gasilPos.z - 0.75),
    [0.6, 1.2, 0.6],
    3.2,
  );
  registerTarget(
    'yard_drain',
    new THREE.Vector3(ydX, groundHeightAt(ydX, ydZ) + 0.35, ydZ),
    [1.0, 0.8, 1.0],
    3.2,
  );

  // Eski Köy Evi targets
  registerTarget(
    'abandoned_door',
    new THREE.Vector3(abandonedPos.x + 3.0, abandonedPos.y + 1.2, abandonedPos.z),
    [0.6, 2.2, 1.5],
    3.1,
  );
  registerTarget(
    'clue_serife_letter',
    new THREE.Vector3(abandonedPos.x - 1.15, abandonedPos.y + 1.0, abandonedPos.z + 0.52),
    [0.6, 0.4, 0.6],
    3.0,
  );
  registerTarget(
    'item_gulsuyu',
    new THREE.Vector3(abandonedPos.x + 0.6, abandonedPos.y + 0.85, abandonedPos.z - 2.15),
    [0.65, 0.6, 0.65],
    3.1,
  );

  // Muhtar targets
  registerTarget(
    'muhtar_door',
    new THREE.Vector3(muhtarPos.x - 3.2, muhtarPos.y + 1.2, muhtarPos.z),
    [0.6, 2.2, 1.5],
    3.1,
  );
  registerTarget(
    'clue_muhtar_note',
    new THREE.Vector3(muhtarPos.x + 0.98, muhtarPos.y + 1.05, muhtarPos.z + 0.12),
    [0.6, 0.4, 0.6],
    3.0,
  );
  registerTarget(
    'clue_crash_report',
    new THREE.Vector3(muhtarPos.x + 1.02, muhtarPos.y + 1.05, muhtarPos.z + 0.62),
    [0.6, 0.4, 0.6],
    3.0,
  );
  registerTarget(
    'item_kafur',
    new THREE.Vector3(muhtarPos.x + 1.05, muhtarPos.y + 1.1, muhtarPos.z - 0.45),
    [0.55, 0.5, 0.55],
    3.0,
  );
  registerTarget(
    'clue_photo',
    new THREE.Vector3(muhtarPos.x + 0.4, muhtarPos.y + 1.85, muhtarPos.z - 2.8),
    [1.0, 1.0, 0.4],
    3.4,
  );

  // Sağlık Ocağı targets
  registerTarget(
    'clinic_door',
    new THREE.Vector3(clinicPos.x - 3.7, clinicPos.y + 1.2, clinicPos.z),
    [0.6, 2.2, 1.5],
    3.2,
  );
  registerTarget(
    'autopsy_case_mahmut',
    new THREE.Vector3(clinicPos.x + 0.4, clinicPos.y + 1.1, clinicPos.z),
    [2.3, 0.8, 1.1],
    3.4,
  );

  // Eski Su Değirmeni targets
  registerTarget(
    'mill_door',
    new THREE.Vector3(millPos.x + 3.1, millPos.y + 1.2, millPos.z),
    [0.6, 2.2, 1.5],
    3.2,
  );
  registerTarget(
    'clue_mill_ledger',
    new THREE.Vector3(millPos.x - 1.5, millPos.y + 1.0, millPos.z + 1.1),
    [0.7, 0.45, 0.7],
    3.1,
  );

  // Mezarlık Taş Mahzen targets (Crypt local center +1.6, 0, -3.2)
  registerTarget(
    'crypt_door',
    new THREE.Vector3(cemPos.x + 1.6, cemPos.y + 1.15, cemPos.z - 0.8),
    [1.5, 2.2, 0.6],
    3.2,
  );
  registerTarget(
    'autopsy_case_unknown',
    new THREE.Vector3(cemPos.x + 1.6, cemPos.y + 1.05, cemPos.z - 3.55),
    [2.2, 0.85, 1.05],
    3.4,
  );

  // İdris's weathered maintenance book, on its own low stone stand in the cemetery.
  const memorialBook = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.42), craft.wood);
  memorialBook.position.set(-30.8, cemPos.y + 0.65, -31.1);
  const memorialStand = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.61, 0.55), craft.masonry);
  memorialStand.position.set(-30.8, cemPos.y + 0.305, -31.1);
  scene.add(memorialStand, memorialBook);
  disposables.push(memorialBook.geometry, memorialStand.geometry);
  registerTarget('night_memorial', memorialBook.position.clone(), [0.7, 0.45, 0.55], 2.8);
  const sealBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.5), craft.wood);
  sealBox.position.set(-28.9, cemPos.y + 0.21, -31.1);
  scene.add(sealBox); disposables.push(sealBox.geometry);
  registerTarget('night_seal', sealBox.position.clone(), [0.7, 0.6, 0.6], 2.8);

  // Viraj Kaza Alanı targets
  registerTarget(
    'clue_crash_manifest',
    new THREE.Vector3(crashPos.x - 2.2, crashPos.y + 0.25, crashPos.z + 1.35),
    [0.8, 0.45, 0.8],
    3.3,
  );

  const { setSignal, keeper, doors: outpostDoors } = buildOutposts(
    scene,
    craft,
    nightArt,
    cells,
    colliders,
    registerTarget,
    disposables,
  );
  for (const [id, at] of Object.entries(STRETCHERS))
    registerTarget(
      id === 'yolcu' ? 'night_tag' : 'receiving_mahmut',
      new THREE.Vector3(gasilPos.x + at.x, gasilPos.y + 0.97, gasilPos.z + at.z),
      [1.98, 0.52, 0.72],
      2.65,
    );

  // A swung-open door must not leave its E hitbox in the middle of an empty doorway.
  for (const [id, hinge] of [
    ['gasil_door', gasil.doorPivot],
    ['mosque_door', gasil.mosqueDoorPivot],
    ['clinic_door', clinic.doorPivot],
    ['abandoned_door', abandoned.doorPivot],
    ['muhtar_door', muhtar.doorPivot],
    ['mill_door', millAndBridge.doorPivot],
    ['crypt_door', cemetery.doorPivot],
  ] as const) {
    const target = interactables.find((t) => t.id === id)!;
    hinge.attach(target.mesh);
  }
  // 14. Villager NPCs (4 interactive patrolling/standing residents)
  const residentLoader = new GLTFLoader();
  const npcs = {} as Record<NpcId, NpcRuntimeActor>;
  (Object.keys(VILLAGE_NPCS) as NpcId[]).forEach((npcId) => {
    const def = VILLAGE_NPCS[npcId];
    const startWp = def.waypoints[0];
    const startPos = new THREE.Vector3(startWp.x, exteriorFloorAt(startWp.x, startWp.z), startWp.z);
    const root = new THREE.Group();
    root.position.copy(startPos);

    const visual = new ResidentVisual(npcId, residentLoader, residentReady, allocation !== 'full');
    root.add(visual.group);
    disposables.push(visual);
    cells.add(scene, root, 22, 36, true);

    // Attach raycast proxy directly to NPC root so it follows patrol movement automatically
    registerTarget(`npc_${npcId}`, new THREE.Vector3(0, 1.05, 0), [0.85, 1.9, 0.85], 3.8, root);

    npcs[npcId] = {
      def,
      root,
      visual,
      waypointIndex: 0,
      pauseTimer: 2.0,
      pos: startPos,
      yaw: 0,
      spokenNodes: new Set<string>(),
      trust: 50,
    };
  });

  // 15. Night Threats: Kara Basma & Sis Gözcüsü
  const karaBasma = watcherFigure(nightArt, 'karabasma', createKaraBasma().root);
  karaBasma.root.position.set(1.5, groundHeightAt(1.5, -6), -6);
  karaBasma.root.visible = false;
  scene.add(karaBasma.root);

  const mistWatcher = watcherFigure(nightArt, 'sis-gozcusu', createSisGozcusu());
  const sisGozcusu = mistWatcher.root;
  sisGozcusu.position.set(-22, groundHeightAt(-22, -16), -16);
  sisGozcusu.visible = false;
  scene.add(sisGozcusu);

  // 16. Drifting Ground Mist Wisps across Expanded Valley
  const mistSprites: THREE.Sprite[] = [];
  const mistMat = new THREE.SpriteMaterial({
    map: textures.mistSprite,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  disposables.push(mistMat);

  const mistLocations = [
    [-6, 1.1, 16],
    [3, 1.0, 8],
    [-11, 1.1, -4.5],
    [1, 1.1, -8],
    [-2, 1.2, -16],
    [6, 1.1, -21],
    [20, 1.2, -26],
    [-24, 0.9, 4],
    [-33, 1.3, -32],
    [24, 1.1, 18],
  ];
  mistLocations.forEach(([mx, my, mz]) => {
    const sp = new THREE.Sprite(mistMat);
    sp.position.set(mx, groundHeightAt(mx, mz) + my, mz);
    sp.scale.set(9.8, 3.3, 1);
    sp.userData.baseX = mx;
    scene.add(sp);
    mistSprites.push(sp);
  });

  // 17. GPU-Driven Rain Particles (zero CPU per-frame vertex upload)
  const rainCount = 1450;
  const rainPositions = new Float32Array(rainCount * 3);
  const rainPhases = new Float32Array(rainCount);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 30;
    rainPositions[i * 3 + 1] = Math.random() * 14;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    rainPhases[i] = Math.random();
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeo.setAttribute('aPhase', new THREE.BufferAttribute(rainPhases, 1));
  const rainUniforms = {
    uTime: { value: 0 },
    uPlayerPos: { value: new THREE.Vector3() },
    uOpacity: { value: 0 },
    uSpeed: { value: 12 },
  };
  const rainMat = new THREE.ShaderMaterial({
    uniforms: rainUniforms,
    vertexShader: `
      uniform float uTime;
      uniform vec3 uPlayerPos;
      uniform float uSpeed;
      attribute float aPhase;
      varying float vAlpha;
      void main() {
        float y = mod(position.y - uTime * uSpeed + aPhase * 14.0, 14.0);
        float relX = mod(position.x - uPlayerPos.x + 15.0, 30.0) - 15.0;
        float relZ = mod(position.z - uPlayerPos.z + 15.0, 30.0) - 15.0;
        vec3 worldPos = vec3(uPlayerPos.x + relX, uPlayerPos.y - 2.0 + y, uPlayerPos.z + relZ);
        vAlpha = smoothstep(0.0, 1.2, y) * (1.0 - smoothstep(12.2, 14.0, y));
        vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
        gl_PointSize = clamp(24.0 / max(1.0, -mvPosition.z), 1.5, 4.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = dot(c * vec2(2.2, 0.7), c * vec2(2.2, 0.7));
        if (d > 0.25) discard;
        gl_FragColor = vec4(0.67, 0.73, 0.78, uOpacity * vAlpha * (1.0 - d * 3.5));
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.frustumCulled = false;
  scene.add(rainPoints);
  disposables.push(rainGeo, rainMat);

  // 17b. Virtualize all PointLights into a fixed 4-light pool + 2 shared autopsy lights.
  // Keeping a constant PointLight count in scene eliminates runtime GLSL shader recompiles
  // and reduces per-pixel PBR shading cost by ~4x on low-end GPUs.
  const detachToAnchor = (light: THREE.PointLight): THREE.Object3D => {
    const anchor = new THREE.Object3D();
    anchor.position.copy(light.position);
    const parent = light.parent;
    if (parent) {
      parent.add(anchor);
      parent.remove(light);
    }
    return anchor;
  };

  const autopsyAnchors: Record<
    AutopsyCaseId,
    { examAnchor: THREE.Object3D; flashAnchor: THREE.Object3D }
  > = {
    case_arif: {
      examAnchor: detachToAnchor(gasilAutopsy.examLight),
      flashAnchor: detachToAnchor(gasilAutopsy.flashLight),
    },
    case_mahmut: {
      examAnchor: detachToAnchor(clinic.autopsyBody.examLight),
      flashAnchor: detachToAnchor(clinic.autopsyBody.flashLight),
    },
    case_unknown: {
      examAnchor: detachToAnchor(cemetery.autopsyBody.examLight),
      flashAnchor: detachToAnchor(cemetery.autopsyBody.flashLight),
    },
  };

  const sharedAutopsyExamLight = new THREE.PointLight(0xfff3de, 0, 4.2, 1.6);
  sharedAutopsyExamLight.visible = true;
  scene.add(sharedAutopsyExamLight);

  const sharedAutopsyFlashLight = new THREE.PointLight(0xe8f4ff, 0, 5.6, 1.4);
  sharedAutopsyFlashLight.visible = true;
  scene.add(sharedAutopsyFlashLight);

  const rawScenePointLights: THREE.PointLight[] = [];
  scene.traverse((obj) => {
    if (
      obj instanceof THREE.PointLight &&
      obj !== sharedAutopsyExamLight &&
      obj !== sharedAutopsyFlashLight
    ) {
      rawScenePointLights.push(obj);
    }
  });

  const virtualLights: VirtualPointLight[] = rawScenePointLights.map((light) => {
    const anchor = detachToAnchor(light);
    return {
      light,
      anchor,
      worldPos: new THREE.Vector3(),
      distSq: 0,
    };
  });

  const worldLightPool: THREE.PointLight[] = [];
  for (let i = 0; i < 4; i++) {
    const poolLight = new THREE.PointLight(0xffbe73, 0, 12, 1.6);
    poolLight.visible = true;
    scene.add(poolLight);
    worldLightPool.push(poolLight);
  }

  let shellFinish: THREE.MeshBasicMaterial | undefined;
  if (allocation !== 'full') {
    const atlas = new THREE.TextureLoader().load('/assets/village/compact/dis-kabuk.webp');
    atlas.colorSpace = THREE.SRGBColorSpace;
    shellFinish = shellMaterial(atlas);
    disposables.push(atlas, shellFinish);
    const skip = new Set<THREE.Object3D>([
      gasil.deceasedGroup,
      clinic.autopsyBody.group,
      cemetery.autopsyBody.group,
      gasil.windowShadowFigure,
    ]);
    for (const root of [
      gasil.group,
      abandoned.group,
      muhtar.group,
      clinic.group,
      millAndBridge.millGroup,
      cemetery.group,
    ]) {
      const shell = distantShell(root, shellFinish, skip);
      cells.addShell(root, shell);
      disposables.push(shell.geometry);
    }
  }
  const interactableMeshes = interactables.map((item) => item.mesh);

  // Optional dressing has no collision or narrative authority. Only load the chosen manifest.
  const applyModel = (assets: WorkshopAssets, loaded: ModelId) => {
    if ((BUILD_KIT as readonly string[]).includes(loaded)) {
      craft.install(assets, loaded as KitId);
      return;
    }
    const placeProp = (
      id: DressingId,
      size: number,
      x: number,
      y: number,
      z: number,
      rotY = 0,
      castShadow = true,
    ) => {
      if (id !== loaded) return;
      const m = assets.dressing(id, size, castShadow);
      if (!m) return;
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      m.updateMatrixWorld(true);
      m.traverse((obj) => {
        obj.matrixAutoUpdate = false;
      });
      cells.add(scene, m, 14, 25);
      // Only load-bearing ground objects block movement; small handheld props
      // remain reachable and do not become invisible walls.
      if (id === 'dead_tree' || id === 'rock') {
        const radius = id === 'dead_tree' ? 0.22 : size * 0.30;
        colliders.push({ minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius });
      }
      return m;
    };

    // Lanterns on porches & bridge posts
    placeProp('lantern', 0.44, gasilPos.x + 3.85, gasilPos.y + 0.16, gasilPos.z - 1.35, 0.4, false);
    placeProp('lantern', 0.44, clinicPos.x - 4.1, clinicPos.y + 0.14, clinicPos.z - 1.0, 0.2, false);
    placeProp('lantern', 0.46, millPos.x + 3.45, millPos.y + 0.14, millPos.z + 1.2, -0.3, false);
    placeProp('lantern', 0.46, cemPos.x + 0.3, cemPos.y + 0.1, cemPos.z - 0.6, 0.1, false);

    // Muhtar & Abandoned House interior furniture props
    placeProp('cabinet', 1.95, muhtarPos.x - 1.6, muhtarPos.y + 0.16, muhtarPos.z - 2.35, 0, true);
    const scannedLamp = placeProp(
      'desk_lamp',
      0.46,
      muhtarPos.x + 1.45,
      muhtarPos.y + 0.99,
      muhtarPos.z - 0.85,
      -0.6,
      false,
    );
    if (scannedLamp) muhtar.deskLampFallback.visible = false;
    placeProp('binder', 0.34, muhtarPos.x + 1.51, muhtarPos.y + 0.986, muhtarPos.z + 0.17, 0.2, false);
    placeProp(
      'chair',
      0.88,
      abandonedPos.x - 0.45,
      abandonedPos.y + 0.16,
      abandonedPos.z + 0.45,
      -1.3,
      false,
    );
    placeProp('candleholders', 0.26, gasilPos.x + 1.5, gasilPos.y + 1.06, gasilPos.z - 2.8, 0.2, false);

    // Barrels & Crates around Mill & Courtyard
    placeProp('barrel', 0.92, millPos.x - 2.2, millPos.y + 0.16, millPos.z - 2.1, 0.3, true);
    placeProp('barrel', 0.92, millPos.x - 1.2, millPos.y + 0.16, millPos.z - 2.2, 1.1, true);
    placeProp(
      'crate',
      0.72,
      millPos.x + 4.2,
      groundHeightAt(millPos.x + 4.2, millPos.z + 2.4),
      millPos.z + 2.4,
      0.5,
      true,
    );
    placeProp('crate', 0.67, -6.37, groundHeightAt(-6.37, 8.15), 8.15, Math.PI / 2, true);

    // Dead tree trunks & boulders around Cemetery & Crash Bend
    placeProp('dead_tree', 4.6, -28.0, groundHeightAt(-28.0, -39.5), -39.5, 0.4, true);
    placeProp('dead_tree', 4.2, -38.5, groundHeightAt(-38.5, -31.0), -31.0, 1.7, true);
    placeProp('rock', 0.65, 25.0, groundHeightAt(25.0, 23.0), 23.0, 0.8, false);
    placeProp('rock', 0.55, -20.5, groundHeightAt(-20.5, 4.5), 4.5, 1.9, false);
  };

  return {
    colliders,
    homes,
    outpostDoors,
    interactables,
    interactableMeshes,
    itemMeshes,
    gasil,
    muhtar,
    abandoned,
    clinic,
    millAndBridge,
    cemetery,
    crashSite,
    gasilAutopsy,
    transportBed,
    autopsyBodies: {
      case_arif: gasilAutopsy,
      case_mahmut: clinic.autopsyBody,
      case_unknown: cemetery.autopsyBody,
    },
    autopsyLights: {
      examLight: sharedAutopsyExamLight,
      flashLight: sharedAutopsyFlashLight,
      anchors: autopsyAnchors,
    },
    npcs,
    karaBasma,
    nightArt,
    receiving,
    setSignal,
    keeper,
    poseWatchers: (t, kara, mist) => {
      karaBasma.pose(t, kara);
      mistWatcher.pose(t + 0.8, mist);
    },
    sisGozcusu,
    streetLights,
    virtualLights,
    worldLightPool,
    apertureLights: { window: windowLight, officeDoor: doorLight },
    sunKeyLight,
    hemiLight,
    moonMesh,
    horizon,
    mistSprites,
    rainPoints,
    rainGeo,
    rainUniforms,
    applyModel,
    updateDetail: (eye, tier) => {
      cells.update(eye, tier);
      nightArt.approach(eye);
      shellFinish?.color.setScalar(0.64 * hemiLight.intensity + 0.22 * sunKeyLight.intensity);
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}