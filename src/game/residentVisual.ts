import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { NpcId } from './types';
import { bakeStaticChildrenByMaterial } from './meshBatch';

export type ResidentModel = Pick<GLTF, 'scene' | 'animations'>;
export type ResidentLoader = Pick<THREE.Loader<ResidentModel>, 'load'>;

// Same silhouette, sockets and props on both renderer tiers. Only decoration uses the CC0 loader.
const wardrobe = {
  bekci: { height: 1.74, coat: 0x374350, grip: 0.75 },
  serife: { height: 1.55, coat: 0x694450, grip: 0.68 },
  kenan: { height: 1.79, coat: 0x7f6249, grip: 0.79 },
  idris: { height: 1.68, coat: 0x595d46, grip: 0.71 },
} satisfies Record<NpcId, { height: number; coat: number; grip: number }>;

function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function finish(color: number, metalness = 0, roughness = 0.91) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

/** A readable figure even during/offline after a failed model request. No point light is hidden with it. */
function waitingFigure(id: NpcId) {
  const g = new THREE.Group();
  const cloth = finish(wardrobe[id].coat),
    dark = finish(0x383832),
    skin = finish(0xb99c81);
  const length = id === 'serife' ? 0.75 : 0.81;
  for (const sign of [-1, 1]) {
    mesh(g, new THREE.CapsuleGeometry(0.085, length - 0.17, 3, 9), dark, sign * 0.105, length / 2 + 0.06, 0);
    const shoe = mesh(g, new THREE.SphereGeometry(0.1, 9, 7), dark, sign * 0.11, 0.065, 0.04);
    shoe.scale.set(0.91, 0.61, 1.5);
    mesh(g, new THREE.CapsuleGeometry(0.068, 0.44, 3, 9), cloth, sign * 0.225, 1.16, 0).rotation.z =
      sign * 0.1;
    mesh(g, new THREE.SphereGeometry(0.056, 9, 6), skin, sign * 0.252, 0.858, 0.02).scale.y = 1.4;
  }
  mesh(g, new THREE.CylinderGeometry(0.21, 0.226, 0.67, 12), cloth, 0, 1.125, 0).scale.z = 0.74;
  if (id === 'serife') mesh(g, new THREE.CylinderGeometry(0.18, 0.244, 0.66, 14), dark, 0, 0.62, 0);
  mesh(g, new THREE.SphereGeometry(0.119, 12, 9), skin, 0, 1.6, 0.01).scale.y = 1.24;
  const hair = mesh(
    g,
    new THREE.SphereGeometry(0.127, 12, 9),
    id === 'serife' ? finish(0xc6bca3) : dark,
    0,
    1.666,
    -0.015,
  );
  hair.scale.set(1, id === 'serife' ? 0.89 : 0.66, 1.03);
  if (id === 'bekci')
    mesh(g, new THREE.SphereGeometry(0.112, 12, 6), dark, 0, 1.674, 0.059).scale.set(1, 0.22, 1);
  g.scale.setScalar(wardrobe[id].height / 1.75);
  bakeStaticChildrenByMaterial(g);
  return g;
}

/** Origins are the centres of the palms; light pooling replaces the light with an anchor here. */
function belongings(id: NpcId) {
  const right = new THREE.Group(),
    left = new THREE.Group();
  const wood = finish(0x63513b),
    iron = finish(0x555450, 0.38, 0.67);
  if (id === 'serife') {
    const hook = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.014, -0.64, 0.035),
      new THREE.Vector3(-0.014, -0.09, 0.026),
      new THREE.Vector3(0.002, 0.013, 0.025),
      new THREE.Vector3(0.015, 0.03, 0.066),
      new THREE.Vector3(0.015, 0.002, 0.086),
    ]);
    mesh(right, new THREE.TubeGeometry(hook, 16, 0.013, 7, false), wood, 0, 0, 0);
    mesh(right, new THREE.CylinderGeometry(0.015, 0.012, 0.047, 8), iron, -0.014, -0.633, 0.035);
  } else {
    const brass = finish(0x857152, 0.48, 0.57);
    const handle = mesh(right, new THREE.TorusGeometry(0.066, 0.006, 6, 18), iron, 0, -0.05, 0.025);
    handle.scale.y = 1.12;
    const glass = new THREE.MeshStandardMaterial({
      color: 0xe4c897,
      emissive: 0xf39a42,
      emissiveIntensity: 0.62,
      roughness: 0.38,
    });
    mesh(
      right,
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.046, -0.257),
          new THREE.Vector2(0.063, -0.224),
          new THREE.Vector2(0.05, -0.159),
          new THREE.Vector2(0.037, -0.143),
        ],
        12,
      ),
      glass,
      0,
      0,
      0.025,
    );
    mesh(right, new THREE.CylinderGeometry(0.056, 0.071, 0.044, 12), brass, 0, -0.272, 0.025);
    mesh(right, new THREE.CylinderGeometry(0.032, 0.067, 0.047, 12), iron, 0, -0.131, 0.025);
    for (const s of [-1, 1])
      mesh(right, new THREE.CylinderGeometry(0.005, 0.006, 0.14, 6), iron, s * 0.06, -0.2, 0.025);
    const light = new THREE.PointLight(0xffbd73, 1.25, 6.4, 1.7);
    light.position.set(0, -0.19, 0.045);
    right.add(light);
  }
  if (id === 'idris') {
    mesh(left, new THREE.CylinderGeometry(0.013, 0.017, 1.01, 8), wood, 0, -0.035, 0.022);
    const blade = new THREE.Shape();
    blade.moveTo(-0.092, 0.09);
    blade.lineTo(0.092, 0.09);
    blade.lineTo(0.073, -0.068);
    blade.quadraticCurveTo(0.04, -0.115, 0, -0.136);
    blade.quadraticCurveTo(-0.072, -0.09, -0.078, -0.056);
    blade.closePath();
    mesh(
      left,
      new THREE.ExtrudeGeometry(blade, { depth: 0.012, bevelEnabled: false }),
      iron,
      0.001,
      -0.565,
      0.018,
    );
    left.rotation.z = 0.15;
  } else if (id === 'kenan') {
    // Twine-bound evrak dosyası tucked against the left leg.
    const folder = finish(0x856d4f),
      paper = finish(0xc3bba0);
    mesh(left, new THREE.BoxGeometry(0.035, 0.25, 0.31), paper, 0.016, -0.096, 0.015);
    for (const x of [-0.006, 0.039])
      mesh(left, new THREE.BoxGeometry(0.009, 0.258, 0.323), folder, x, -0.096, 0.014);
    mesh(left, new THREE.BoxGeometry(0.055, 0.024, 0.327), iron, 0.016, -0.063, 0.014);
  }
  bakeStaticChildrenByMaterial(left);
  bakeStaticChildrenByMaterial(right);
  return { right, left };
}

function release(root: THREE.Object3D) {
  const mats = new Set<THREE.Material>(),
    geos = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    geos.add(obj.geometry);
    for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) mats.add(m);
    if (obj instanceof THREE.SkinnedMesh) obj.skeleton.dispose();
  });
  geos.forEach((g) => g.dispose());
  mats.forEach((m) => {
    if (m instanceof THREE.MeshStandardMaterial && m.map) {
      const image = m.map.image as { close?: () => void } | undefined;
      m.map.dispose();
      image?.close?.();
    }
    m.dispose();
  });
}

export class ResidentVisual {
  readonly group = new THREE.Group();
  readonly eyeHeight: number;
  private fallback: THREE.Group | null;
  private mixer: THREE.AnimationMixer | null = null;
  private idle?: THREE.AnimationAction;
  private walk?: THREE.AnimationAction;
  private animTime = 0;
  private disposed = false;

  constructor(
    id: NpcId,
    loader: ResidentLoader,
    onReady?: (root: THREE.Object3D) => void,
    compact = false,
  ) {
    this.eyeHeight = wardrobe[id].height * 0.92;
    this.group.name = `resident-${id}`;
    this.fallback = waitingFigure(id);
    const { left, right } = belongings(id);
    const grip = wardrobe[id].grip;
    left.position.set(0.245, grip, 0);
    right.position.set(-0.245, grip, 0);
    this.group.add(this.fallback, left, right);
    // Soft contact under the soles also works when dynamic shadows are disabled.
    const sole = new THREE.CircleGeometry(0.3, 20);
    const rgba = new Float32Array(sole.attributes.position.count * 4);
    rgba[3] = 0.4; // black at the centre; zero alpha at the outer vertices
    sole.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
    const shade = new THREE.Mesh(
      sole,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    shade.rotation.x = -Math.PI / 2;
    shade.scale.y = 0.68;
    shade.position.y = 0.014;
    shade.renderOrder = 1;
    this.group.add(shade);
    loader.load(
      `/assets/residents/${compact ? 'compact/' : ''}${id}.glb`,
      ({ scene, animations }) => {
        if (this.disposed) {
          release(scene);
          return;
        }
        const l = scene.getObjectByName('HandL'),
          r = scene.getObjectByName('HandR');
        const idle = THREE.AnimationClip.findByName(animations, 'Idle');
        const walk = THREE.AnimationClip.findByName(animations, 'Walk');
        if (!l || !r || !idle || !walk) {
          release(scene);
          return;
        }
        l.add(left);
        r.add(right);
        left.position.set(0, 0, 0.012);
        right.position.set(0, 0, 0.012);
        scene.traverse((o) => {
          if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true;
        });
        this.group.add(scene);
        this.fallback!.removeFromParent();
        release(this.fallback!);
        this.fallback = null;
        onReady?.(scene);
        this.mixer = new THREE.AnimationMixer(scene);
        this.idle = this.mixer.clipAction(idle).play();
        this.walk = this.mixer.clipAction(walk).setEffectiveWeight(0).play();
      },
      undefined,
      () => {
        /* The dressed placeholder, equipment and dialogue target remain usable. */
      },
    );
  }

  update(dt: number, moving: boolean, distance: number, time: number) {
    if (this.fallback) {
      this.fallback.position.y = moving
        ? 0.023 * Math.abs(Math.sin(time * 6))
        : 0.003 * Math.sin(time * 2);
      return;
    }
    if (!this.mixer || distance > 42) return;
    this.animTime += dt;
    if (distance > 18 && this.animTime < 0.065) return;
    const w = THREE.MathUtils.damp(this.walk!.getEffectiveWeight(), moving ? 1 : 0, 7, this.animTime);
    this.walk!.setEffectiveWeight(w);
    this.idle!.setEffectiveWeight(1 - w);
    this.mixer.update(this.animTime);
    this.animTime = 0;
  }

  dispose() {
    this.disposed = true;
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }
    release(this.group);
    this.group.clear();
  }
}
