import * as THREE from 'three';
import type { Spirit } from './dermanliCharacters';

/** Outdoor memories use distinct, complete silhouettes; no loading or resident is placed in a house. */
export function createDermanliSpirit(id: Spirit) {
  const root = new THREE.Group(); root.name = `spirit-${id}`;
  const figure = new THREE.Group(); figure.name = 'figure'; root.add(figure);
  const materials = [0x989d96, 0x706e65, 0xb5b3a4, 0x555750].map(color =>
    new THREE.MeshStandardMaterial({color, roughness: 1, transparent: true, opacity: .82, depthWrite: false}));
  const [clothes, dark, skin, hair] = materials;
  const add = (name:string, geometry:THREE.BufferGeometry, material:THREE.Material, x:number,y:number,z:number) => {
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,y,z);figure.add(mesh);return mesh;
  };
  const isChild=id==='elif';
  // The figures share proportions only; clothing, hair and facial details identify them.
  const torso=add('torso',new THREE.CylinderGeometry(.19,.24,.62,12),clothes,0,1.13,0);torso.scale.z=.72;
  if(isChild){
    const skirt=add('dress',new THREE.CylinderGeometry(.21,.39,.66,12),clothes,0,.66,0);skirt.scale.z=.8;
    add('collar',new THREE.CylinderGeometry(.13,.18,.08,12),skin,0,1.44,.02);
  }else{
    for(const x of [-.095,.095])add('lapel',new THREE.BoxGeometry(.055,.46,.035),dark,x,1.16,.15).rotation.z=x*1.2;
    add('shirt',new THREE.BoxGeometry(.10,.48,.025),skin,0,1.17,.16);
    add('belt',new THREE.BoxGeometry(.39,.06,.30),dark,0,.84,0);
  }
  for(const side of [-1,1]){
    const leg=add('leg',new THREE.CapsuleGeometry(.075,.49,4,8),dark,side*.105,.37,0);if(isChild)leg.scale.set(.8,.78,.8);
    const shoe=add('shoe',new THREE.SphereGeometry(.09,10,7),dark,side*.105,.075,.045);shoe.scale.set(.9,.6,1.4);
    const arm=add(side<0?'left-arm':'right-arm',new THREE.CapsuleGeometry(.07,.46,4,8),clothes,side*.27,1.12,0);arm.rotation.z=side*.1;
    add('hand',new THREE.SphereGeometry(.065,10,8),skin,side*.30,.79,0).scale.set(.8,1.2,.8);
  }
  add('neck',new THREE.CylinderGeometry(.07,.08,.14,10),skin,0,1.49,0);
  const head=add('head',new THREE.SphereGeometry(.145,16,12),skin,0,1.67,0);head.scale.set(.9,1.16,.88);
  const cap=add('hair',new THREE.SphereGeometry(.148,16,10),hair,0,1.73,-.016);cap.scale.set(.95,.67,.87);
  for(const x of [-.052,.052])add('eye',new THREE.SphereGeometry(.012,8,6),dark,x,1.69,.119);
  if(isChild){
    for(const x of [-.14,.14]){const braid=add('braid',new THREE.CapsuleGeometry(.038,.19,3,8),hair,x,1.55,-.035);braid.rotation.z=x*.8;}
    figure.scale.setScalar(.73);
  } else {
    const hat=add('hat',new THREE.CylinderGeometry(.13,.17,.1,12),dark,0,1.83,0);hat.scale.z=.85;
    const brim=add('hat-brim',new THREE.CylinderGeometry(.19,.19,.025,12),dark,0,1.78,.025);brim.scale.z=.8;
    const moustache=add('moustache',new THREE.SphereGeometry(.06,12,8),hair,0,1.62,.12);moustache.scale.set(1,.23,.24);
  }
  root.visible=false;
  return root;
}

export function disposeDermanliSpirits(roots: readonly THREE.Object3D[]) {
  const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
  for(const root of roots)root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
