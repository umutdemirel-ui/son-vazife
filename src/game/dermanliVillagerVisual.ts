import * as THREE from 'three';
import { villageBelongings, type ResidentOutfit } from './residentVisual';

/** The six daytime villagers have their own geometry, proportions and clothing.
 * Unlike the old village memories they do not load or reuse a Kuzdağ GLB. */
export type VillagerId = 'cemil' | 'salih' | 'ferit' | 'hatice' | 'osman' | 'ismail';
const CHARACTER:Record<VillagerId,{height:number; coat:number; shirt:number; trousers:number; skin:number; hair:number; outfit:ResidentOutfit; seated:boolean}>={
  cemil:{height:1.72,coat:0x574b3d,shirt:0xb1a890,trousers:0x383a35,skin:0xb2947c,hair:0x494037,outfit:'coffee-apron',seated:false},
  salih:{height:1.67,coat:0x515c4c,shirt:0x988c76,trousers:0x393b35,skin:0xb79c84,hair:0x5a554b,outfit:'flat-cap',seated:true},
  ferit:{height:1.75,coat:0x514b46,shirt:0x9b8f7b,trousers:0x45433c,skin:0xa98b71,hair:0x3d3933,outfit:'wool-scarf',seated:true},
  hatice:{height:1.54,coat:0x70645e,shirt:0xa99c87,trousers:0x4b454a,skin:0xb99c81,hair:0xaaa49b,outfit:'headscarf',seated:false},
  osman:{height:1.74,coat:0x675643,shirt:0xaaa18c,trousers:0x45483c,skin:0xa98c70,hair:0x4f453a,outfit:'farm-vest',seated:false},
  ismail:{height:1.70,coat:0x5d625b,shirt:0xada79a,trousers:0x42443e,skin:0xb99a7e,hair:0x453b32,outfit:'mill-apron',seated:false},
};

export class DermanliVillagerVisual {
  readonly group=new THREE.Group();
  private readonly figure=new THREE.Group();
  private readonly head=new THREE.Group();
  private readonly arms:THREE.Group[]=[];
  private readonly materials=new Set<THREE.Material>();
  private readonly geometries=new Set<THREE.BufferGeometry>();

  constructor(id:VillagerId) {
    const spec=CHARACTER[id], seated=spec.seated;
    this.group.name=`original-villager-${id}`;
    this.figure.name='original-villager-figure';this.group.add(this.figure);
    this.figure.userData.outfit=spec.outfit;
    const material=(color:number,roughness=.9)=>{const m=new THREE.MeshStandardMaterial({color,roughness});this.materials.add(m);return m;};
    const coat=material(spec.coat),shirt=material(spec.shirt),trousers=material(spec.trousers),skin=material(spec.skin),hair=material(spec.hair),black=material(0x282b29),shoe=material(0x37332c),button=material(0xafa28a),apron=material(id==='cemil'?0xc0b6a0:0x8c8a7b);
    const add=(parent:THREE.Object3D,geometry:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number)=>{
      this.geometries.add(geometry);const part=new THREE.Mesh(geometry,mat);part.position.set(x,y,z);part.castShadow=part.receiveShadow=true;parent.add(part);return part;
    };
    // Seated hips align to the .46 m coffeehouse bench. Standing dimensions are
    // scaled to each person's height, with the shoes always anchored at ground.
    const scale=spec.height/1.74;
    this.figure.scale.setScalar(seated?1:scale);
    const hip=seated ? .50 : .79, torsoY=hip+.34;
    const body=add(this.figure,new THREE.CylinderGeometry(.205,.24,.68,12),coat,0,torsoY,0);body.scale.z=.76;
    add(this.figure,new THREE.BoxGeometry(.18,.53,.027),shirt,0,torsoY+.01,.173);
    for(const side of [-1,1]){
      const lapel=add(this.figure,new THREE.BoxGeometry(.075,.47,.025),coat,side*.11,torsoY+.04,.18);lapel.rotation.z=side*.1;
      if(seated){
        const thigh=add(this.figure,new THREE.CapsuleGeometry(.085,.29,3,8),trousers,side*.105,.48,.18);thigh.rotation.x=Math.PI/2;
        add(this.figure,new THREE.CapsuleGeometry(.075,.24,3,8),trousers,side*.105,.27,.38);
        const foot=add(this.figure,new THREE.SphereGeometry(.09,10,7),shoe,side*.105,.055,.42);foot.scale.set(.95,.61,1.4);
      }else{
        add(this.figure,new THREE.CapsuleGeometry(.085,.57,3,8),trousers,side*.105,.38,0);
        const foot=add(this.figure,new THREE.SphereGeometry(.09,10,7),shoe,side*.105,.055,.045);foot.scale.set(.95,.61,1.4);
      }
      const arm=new THREE.Group();arm.position.set(side*.23,torsoY+.25,0);this.figure.add(arm);this.arms.push(arm);
      const sleeve=add(arm,new THREE.CapsuleGeometry(.071,.43,3,8),coat,side*.035,-.25,0);sleeve.rotation.z=side*.1;
      add(arm,new THREE.SphereGeometry(.058,10,8),skin,side*.07,-.55,.015).scale.y=1.2;
    }
    for(const y of [-.14,-.04,.06])add(this.figure,new THREE.SphereGeometry(.012,8,6),button,0,torsoY+y,.197);
    if(id==='hatice'){
      const skirt=add(this.figure,new THREE.CylinderGeometry(.22,.32,.67,14),coat,0,.53,0);skirt.scale.z=.85;
    }
    this.head.position.set(0,torsoY+.52,0);this.figure.add(this.head);
    add(this.head,new THREE.CylinderGeometry(.07,.08,.15,10),skin,0,-.06,0);
    const face=add(this.head,new THREE.SphereGeometry(.14,16,12),skin,0,.09,0);face.scale.set(.91,1.15,.88);
    const scalp=add(this.head,new THREE.SphereGeometry(.144,16,10),hair,0,.16,-.023);scalp.scale.set(.96,.66,.9);
    add(this.head,new THREE.SphereGeometry(.03,10,8),skin,0,.075,.118).scale.set(.7,1,.8);
    for(const side of [-1,1]){
      add(this.head,new THREE.SphereGeometry(.012,8,6),black,side*.052,.11,.12);
      const brow=add(this.head,new THREE.BoxGeometry(.045,.008,.008),hair,side*.052,.145,.116);brow.rotation.z=side*.08;
    }
    if(id!=='hatice'&&id!=='ismail'){
      const moustache=add(this.head,new THREE.SphereGeometry(.055,12,8),hair,0,.027,.12);moustache.scale.set(1,.23,.30);
    }
    if(id==='hatice'){
      const wrap=add(this.head,new THREE.SphereGeometry(.15,14,10),coat,0,.12,-.07);wrap.scale.set(1,1.05,.65);
      const tail=add(this.head,new THREE.BoxGeometry(.14,.24,.025),coat,0,-.12,-.15);tail.rotation.z=.12;
    } else if(id==='salih'||id==='osman') {
      const cap=add(this.head,new THREE.SphereGeometry(.15,12,8),coat,0,.23,0);cap.scale.set(1,.35,.9);
      add(this.head,new THREE.CylinderGeometry(.15,.15,.02,12),coat,0,.20,.035);
    }
    if(id==='ferit'){
      add(this.figure,new THREE.CylinderGeometry(.15,.15,.09,12),apron,0,torsoY+.36,0);
      add(this.figure,new THREE.BoxGeometry(.09,.27,.035),apron,.08,torsoY+.20,.17);
    }
    if(id==='cemil'||id==='ismail'){
      const cloth=add(this.figure,new THREE.BoxGeometry(.34,.49,.035),apron,0,hip+.16,.20);cloth.name=`${id}-apron`;
      add(this.figure,new THREE.BoxGeometry(.19,.09,.02),coat,0,hip+.06,.225);
      for(const side of [-1,1])add(this.figure,new THREE.BoxGeometry(.035,.19,.025),apron,side*.1,torsoY+.27,.19);
    }
    const {left,right}=villageBelongings(spec.outfit);
    // Hands are part of animated arms. Objects follow their owner's movement.
    left.position.set(-.07,-.55,.015);right.position.set(.07,-.55,.015);
    this.arms[0].add(left);this.arms[1].add(right);
    // Contact shadow lives outside the scaled figure and never blocks interaction.
    const shadowMat=new THREE.MeshBasicMaterial({color:0x11100d,transparent:true,opacity:.22,depthWrite:false});this.materials.add(shadowMat);
    const shadow=add(this.group,new THREE.CircleGeometry(.28,16),shadowMat,0,.012,0);shadow.rotation.x=-Math.PI/2;shadow.scale.y=.7;
  }

  update(_dt:number,_moving:boolean,distance:number,time:number) {
    if(distance>42)return;
    this.head.rotation.z=Math.sin(time*1.1)*.018;
    this.arms[0].rotation.z=Math.sin(time*1.3)*.025;
    this.arms[1].rotation.z=-Math.sin(time*1.3+.4)*.025;
  }
  dispose() {
    // Includes the separately created hand props; sets avoid double disposal.
    this.group.traverse(o=>{if(o instanceof THREE.Mesh){this.geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])this.materials.add(m);}});
    this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.group.clear();
  }
}
