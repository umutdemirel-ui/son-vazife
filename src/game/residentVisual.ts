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
  const g = new THREE.Group(); g.name = 'standing-fallback';
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

/** A seated offline fallback has its hips on the same bench as the skinned model. */
function waitingSeatedFigure(id: NpcId) {
  const g=new THREE.Group(),cloth=finish(wardrobe[id].coat),dark=finish(0x383832),skin=finish(0xb99c81);g.name='seated-fallback';
  const torso=mesh(g,new THREE.CylinderGeometry(.21,.23,.67,12),cloth,0,.93,0);torso.scale.z=.74;
  mesh(g,new THREE.SphereGeometry(.12,12,9),skin,0,1.41,0).scale.y=1.22;
  mesh(g,new THREE.SphereGeometry(.126,12,9),dark,0,1.47,-.01).scale.set(1,.6,1);
  for(const side of [-1,1]){
    const thigh=mesh(g,new THREE.CapsuleGeometry(.085,.30,3,9),dark,side*.105,.48,.20);thigh.rotation.x=Math.PI/2;
    mesh(g,new THREE.CapsuleGeometry(.075,.24,3,9),dark,side*.105,.27,.40);
    const shoe=mesh(g,new THREE.SphereGeometry(.09,9,7),dark,side*.105,.07,.44);shoe.scale.set(.9,.6,1.4);
    const arm=mesh(g,new THREE.CapsuleGeometry(.068,.4,3,9),cloth,side*.23,.95,0);arm.rotation.z=side*.1;
    mesh(g,new THREE.SphereGeometry(.055,9,6),skin,side*.25,.68,.02);
  }
  bakeStaticChildrenByMaterial(g);return g;
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


export type ResidentOutfit = 'coffee-apron' | 'flat-cap' | 'wool-scarf' | 'headscarf' | 'farm-vest' | 'mill-apron';

/** Small individual garments sit on the rig, so idle animation and seated poses still work. */
function dressResident(root:THREE.Object3D, outfit:ResidentOutfit, seated:boolean, rigged:boolean) {
  const spine=rigged?root.getObjectByName('Spine'):root;
  const head=rigged?root.getObjectByName('Head'):root;
  const cloth=(color:number)=>finish(color);
  if((outfit==='coffee-apron'||outfit==='mill-apron'||outfit==='farm-vest')&&spine){
    const material=cloth(outfit==='coffee-apron'?0xb3aa92:outfit==='mill-apron'?0x747364:0x615043);
    const garment=new THREE.Group();garment.name=`outfit-${outfit}`;
    // Rig offsets are relative to Spine; the fallback uses full figure coordinates.
    garment.position.set(0,rigged ? .02 : (seated ? .88 : 1.05),.19);
    material.side=THREE.DoubleSide;
    const panel=(points:readonly (readonly [number,number])[])=>{
      const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const point of points.slice(1))shape.lineTo(...point);shape.closePath();
      const part=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);part.castShadow=true;garment.add(part);
    };
    if(outfit==='farm-vest'){
      // Separate tapered lapels leave the original textured shirt visible.
      for(const side of [-1,1])panel([[side*.03,-.22],[side*.18,-.22],[side*.18,.13],[side*.14,.23],[side*.09,.23],[side*.03,.08]]);
      for(const y of [-.14,-.03,.08])mesh(garment,new THREE.SphereGeometry(.012,6,6),finish(0xb5a58a),0,y,.01);
    } else {
      panel([[-.19,-.30],[.19,-.30],[.17,.12],[.12,.25],[-.12,.25],[-.17,.12]]);
      for(const side of [-1,1])mesh(garment,new THREE.BoxGeometry(.035,.17,.025),material,side*.105,.30,-.01);
      mesh(garment,new THREE.BoxGeometry(.20,.10,.012),cloth(outfit==='coffee-apron'?0x99907e:0x5e5e52),0,-.12,.012);
    }
    spine.add(garment);
  }
  if(outfit==='wool-scarf'&&spine){
    const garment=new THREE.Group();garment.name='outfit-wool-scarf';garment.position.set(0,rigged ? .37 : (seated ? 1.25 : 1.42),0);
    const material=cloth(0x785549);
    mesh(garment,new THREE.CylinderGeometry(.16,.16,.09,12),material,0,0,0);
    mesh(garment,new THREE.BoxGeometry(.11,.32,.04),material,.09,-.18,.155);spine.add(garment);
  }
  if((outfit==='flat-cap'||outfit==='headscarf')&&head){
    const garment=new THREE.Group();garment.name=`outfit-${outfit}`;garment.position.set(0,rigged ? .30 : (seated ? 1.60 : 1.80),0);
    const material=cloth(outfit==='flat-cap'?0x494b40:0x726d77);
    if(outfit==='flat-cap'){
      const cap=mesh(garment,new THREE.SphereGeometry(.155,12,8),material,0,0,0);cap.scale.set(1,.42,.91);
      mesh(garment,new THREE.CylinderGeometry(.16,.16,.025,12),material,0,-.035,.035);
    }else{
      const scarf=mesh(garment,new THREE.SphereGeometry(.145,12,10),material,0,-.10,-.10);scarf.scale.set(.96,1.05,.48);
      mesh(garment,new THREE.BoxGeometry(.14,.22,.035),material,0,-.27,-.13);
    }
    head.add(garment);
  }
}

/** Everyday objects distinguish villagers from one another. */
export function villageBelongings(outfit:ResidentOutfit) {
  const left=new THREE.Group(),right=new THREE.Group();
  const wood=finish(0x73563b),metal=finish(0x786b56,.35),cloth=finish(0xaaa18a),tea=finish(0x71351c,.1,.35);
  if(outfit==='farm-vest') {
    // A shallow woven basket, carried low by its arched handle.
    const basket=mesh(right,new THREE.CylinderGeometry(.14,.10,.18,12,1,true),wood,0,-.20,0);
    basket.rotation.z=.12;
    const handle=mesh(right,new THREE.TorusGeometry(.13,.012,6,16,Math.PI),wood,0,-.11,0);
    handle.rotation.z=0;
    for(const y of [-.27,-.21,-.15])mesh(right,new THREE.TorusGeometry(.12,.007,5,16),cloth,0,y,0).rotation.x=Math.PI/2;
  } else if(outfit==='mill-apron') {
    const sack=mesh(right,new THREE.SphereGeometry(.13,12,9),cloth,0,-.20,0);sack.scale.set(.9,1.2,.8);
    mesh(right,new THREE.CylinderGeometry(.025,.06,.07,8),cloth,0,-.06,0);
    mesh(right,new THREE.TorusGeometry(.05,.008,5,12),wood,0,-.09,0).rotation.x=Math.PI/2;
  } else if(outfit==='coffee-apron'||outfit==='flat-cap'||outfit==='wool-scarf') {
    // A tulip-shaped tea glass and a thin saucer.
    const glass=new THREE.LatheGeometry([new THREE.Vector2(.035,0),new THREE.Vector2(.045,.015),new THREE.Vector2(.035,.055),new THREE.Vector2(.05,.12)],12);
    mesh(right,glass,tea,0,-.18,0);
    mesh(right,new THREE.CylinderGeometry(.075,.075,.012,16),metal,0,-.185,0);
  } else if(outfit==='headscarf') {
    mesh(right,new THREE.CylinderGeometry(.013,.016,.68,8),wood,0,-.32,0);
    mesh(right,new THREE.SphereGeometry(.035,8,6),wood,0,.035,0);
  }
  // All geometries and materials are disposed with the parent visual, including
  // empty material instances which did not become part of the chosen object.
  const used=new Set<THREE.Material>();
  for(const group of [left,right])group.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])used.add(m);});
  for(const material of [wood,metal,cloth,tea])if(!used.has(material))material.dispose();
  return {left,right};
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
  private seated = false;

  constructor(
    id: NpcId,
    loader: ResidentLoader,
    onReady?: (root: THREE.Object3D) => void,
    compact = false,
    options: { seated?: boolean; props?: boolean; outfit?: ResidentOutfit } = {},
  ) {
    this.seated=!!options.seated;
    this.eyeHeight = wardrobe[id].height * (this.seated ? .72 : .92);
    this.group.name = `resident-${id}`;
    this.fallback = options.seated ? waitingSeatedFigure(id) : waitingFigure(id);
    if(options.outfit)dressResident(this.fallback,options.outfit,this.seated,false);
    const { left, right } = options.props === false ? (options.outfit ? villageBelongings(options.outfit) : {left:new THREE.Group(),right:new THREE.Group()}) : belongings(id);
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
        if(options.outfit)dressResident(scene,options.outfit,this.seated,true);
        this.group.add(scene);
        this.fallback!.removeFromParent();
        release(this.fallback!);
        this.fallback = null;
        onReady?.(scene);
        if(options.seated){
          // Rigid rig bones are transformed in place, with the pelvis lowered to the bench.
          const hips=scene.getObjectByName('Hips');if(hips)hips.position.y-=.42;
          for(const side of ['L','R']){const thigh=scene.getObjectByName(`Thigh${side}`),shin=scene.getObjectByName(`Shin${side}`);if(thigh)thigh.rotation.x=-Math.PI/2;if(shin)shin.rotation.x=Math.PI/2;}
        }else{
          this.mixer = new THREE.AnimationMixer(scene);
          this.idle = this.mixer.clipAction(idle).play();
          this.walk = this.mixer.clipAction(walk).setEffectiveWeight(0).play();
        }
      },
      undefined,
      () => {
        /* The dressed placeholder, equipment and dialogue target remain usable. */
      },
    );
  }

  update(dt: number, moving: boolean, distance: number, time: number) {
    if (this.fallback) {
      if(this.seated)return;
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
