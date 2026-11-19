import * as THREE from 'three';
import { createDermanliTerrain } from './dermanliTerrain';
import { DERMANLI_PATHS, DERMANLI_SITES as S, dermanliHeight, distanceToPath, type Point } from './dermanliMap';
import { loadVillageTextures } from './textures';
import { VillageCraft } from './villageCraft';
import { createMosqueAndGasilhane, createKaraBasma, createCopperEwerAndSoap, createMuhtarHouse } from './models';
import { buildHome, type HomeSpec } from './homes';
import { NightArt } from './nightArt';
import { funeralFigure } from './funerary';
import {createHorrorFigures,disposeHorrorFigures} from './horrorFigures';
import {surfaceUrl} from './quality';
import { BELL_SYMBOLS } from './dermanliBell';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import { translateColliders, type BoxCollider } from './collision';

export interface NewTarget { id: string; label: string; x: number; z: number; radius: number }
export function createDermanliWorld(scene: THREE.Scene) {
  const textures = loadVillageTextures(2, true);
  const terrain = createDermanliTerrain(textures); scene.add(terrain.root);
  const craft = new VillageCraft(textures), art = new NightArt(true, () => {});
  const colliders: BoxCollider[] = [], targets: NewTarget[] = [], homes: ReturnType<typeof buildHome>['home'][] = [];
  const objects = new THREE.Group(); scene.add(objects);
  const ownGeometry: THREE.BufferGeometry[] = [], ownMaterial: THREE.Material[] = [];
  const mat = (c: number) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: .95 }); ownMaterial.push(m); return m; };
  const stone = mat(0x6b6a61), wood = mat(0x584636), roof = mat(0x4b3730), dark = mat(0x242d24), foliage = mat(0x293b2c), field = mat(0x534b35);
  const box = (w: number,h: number,d: number,x: number,y: number,z: number,m: THREE.Material) => {
    const g = new THREE.BoxGeometry(w,h,d); ownGeometry.push(g); const mesh = new THREE.Mesh(g,m); mesh.position.set(x,y,z); objects.add(mesh); return mesh;
  };
  const target = (id: string,label: string,p: Point,radius = 2.1) => targets.push({ id,label,x:p[0],z:p[1],radius });
  // Existing detailed, walk-in gasilhane: its local origin is the wash slab.
  const gasil = createMosqueAndGasilhane(textures, craft, art);
  gasil.group.position.set(S.gasilhane[0], dermanliHeight(...S.gasilhane), S.gasilhane[1]); objects.add(gasil.group);
  gasil.ceilingLight.color.set(0x91b9dc);gasil.ceilingLight.intensity=5;
  const slabBody=funeralFigure(art,'arif',false); gasil.deceasedGroup.add(slabBody);
  art.near('arif',S.gasilhane[0],S.gasilhane[1],25);
  gasil.doorPivot.rotation.y = -Math.PI * .52; gasil.mosqueDoorPivot.rotation.y = -Math.PI * .52;
  colliders.push(...translateColliders({x:S.gasilhane[0],z:S.gasilhane[1]}, [
    {minX:-3.6,maxX:3.6,minZ:-3.45,maxZ:-2.95},{minX:-3.6,maxX:3.6,minZ:4.15,maxZ:4.65},
    {minX:-3.65,maxX:-3.15,minZ:-3.4,maxZ:4.6},{minX:3.15,maxX:3.65,minZ:-3.4,maxZ:-.8},
    {minX:3.15,maxX:3.65,minZ:.8,maxZ:4.6},{minX:-1.25,maxX:1.25,minZ:-.65,maxZ:.65},
    {minX:-3.5,maxX:-3.3,minZ:-8.1,maxZ:-3.4},{minX:-3.5,maxX:3.5,minZ:-8.1,maxZ:-7.9},
    {minX:-3.5,maxX:3.5,minZ:-3.5,maxZ:-3.3},{minX:3.2,maxX:3.5,minZ:-8,maxZ:-6.45},
    {minX:3.2,maxX:3.5,minZ:-4.95,maxZ:-3.4},
  ]));
  // Retain the detailed previous muhtarlık interior in the new square.
  const office=createMuhtarHouse(textures,craft);
  office.group.position.set(S.office[0],dermanliHeight(...S.office),S.office[1]);office.doorPivot.rotation.y=Math.PI*.56;objects.add(office.group);
  colliders.push(...translateColliders({x:S.office[0],z:S.office[1]},[
    {minX:-3.4,maxX:3.4,minZ:-3.25,maxZ:-2.75},{minX:-3.4,maxX:3.4,minZ:2.75,maxZ:3.25},
    {minX:2.95,maxX:3.45,minZ:-3.2,maxZ:3.2},{minX:-3.45,maxX:-2.95,minZ:-3.2,maxZ:-.8},
    {minX:-3.45,maxX:-2.95,minZ:.8,maxZ:3.2},{minX:.6,maxX:1.9,minZ:-1.3,maxZ:.9},
  ]));
  target('mosque','Cami · İmamın notu',[S.gasilhane[0]+3.8,S.gasilhane[1]-6.8],1.8);
  box(.05,.45,.34,S.gasilhane[0]+3.56,1.35,S.gasilhane[1]-6.8,mat(0xbfb49a));
  target('office','Muhtarlık · Kayıt defteri',[S.office[0]+.4,S.office[1]+1.4],1.6);
  const [gx,gz]=S.gasilhane;
  target('slab','Teneşir', [gx,gz], 2.05);
  target('candle','Sabır mumu', [gx-1.35,gz-.75], 1.7);
  const stations = [
    ['soap','Sabun','sabun',-2.7,-2.35], ['ewer','İbrik','ibrik',-2.7,2.3],
    ['camphor','Kâfur','kafur',1.8,-2.35], ['shroud','Kefen','kefen',.1,-2.35],
  ] as const;
  for(const [id,label,type,x,z] of stations) {
    const item=createCopperEwerAndSoap(type); item.position.set(gx+x,.85,gz+z); objects.add(item);
    target(id,label,[gx+x,gz+z],1.65);
  }
  target('bucket','Kirli su kovası',[gx+.25,gz+1.05],1.5);
  target('drain','Gider',[gx+2.5,gz+2.8],1.3);
  target('discard','Kirli suyu dışarı dök',[gx+5,gz+4],1.2);
  target('arrival','Cenazeyi al',[gx+5,gz],1.6);
  target('forest','Orman yolu · Ayrıl',[-56.4,21.6],2.7);
  const bucket=cylinderPlaceholder();
  function cylinderPlaceholder() {
    const g=new THREE.CylinderGeometry(.24,.18,.38,12,1,true); ownGeometry.push(g);
    const b=new THREE.Mesh(g,craft.metal); b.position.set(gx+.25,.3,gz+1.05);objects.add(b);return b;
  }
  void bucket;
  const bed=box(2,.15,.75,gx+5,.75,gz,wood);
  const arrivalBody = new THREE.Group();
  const arrivalUnwrapped=funeralFigure(art,'arif',false),arrivalWrapped=funeralFigure(art,'yolcu',false);
  arrivalBody.add(arrivalUnwrapped,arrivalWrapped);arrivalBody.position.set(gx+5,.84,gz);objects.add(arrivalBody);
  art.near('yolcu',gx,gz,25);
  void bed;

  const addHome = (site: Point, id: string, number: number, w = 6.5, d = 5) => {
    const spec: HomeSpec = {x:site[0],z:site[1],rotY:0,w,d,h:3,style:number%2 ? 'himis' : 'tas'};
    const {home,walls} = buildHome(spec,number,dermanliHeight(...site),craft);
    home.door.rotation.y = -Math.PI*.52; homes.push(home); objects.add(home.root); colliders.push(...walls);
    target(id, id === 'home' ? 'Gassalın evi · Günlük' : id === 'school' ? 'Eski okul · Tahta ve dolap' : id === 'mill' ? 'Değirmen · Defter' : 'Terk edilmiş ev', [site[0],site[1]+d/2+1.0],2.6);
  };
  addHome(S.gassalHome,'home',0,7,5); addHome(S.school,'school',1,8,6); addHome(S.mill,'mill',2,6,5);
  S.abandonedHomes.forEach((p,i)=>addHome(p,`abandoned${i}`,i+3));
  const homeLight=new THREE.PointLight(0xffb15c,4,12,1.7);homeLight.position.set(S.gassalHome[0],2.1,S.gassalHome[1]);objects.add(homeLight);
  addHome(S.barn,'barn',7,7,5);
  // A wheel on the mill and a chalkboard inside the school make both landmarks legible at close range.
  const wheel=new THREE.Group();wheel.position.set(S.mill[0]+3.2,1.9,S.mill[1]-.5);
  const wheelGeo=new THREE.TorusGeometry(1.5,.12,8,24);ownGeometry.push(wheelGeo);
  wheel.add(new THREE.Mesh(wheelGeo,wood));
  for(let angle=0;angle<Math.PI;angle+=Math.PI/4){const g=new THREE.BoxGeometry(3,.12,.12);ownGeometry.push(g);const spoke=new THREE.Mesh(g,wood);spoke.rotation.z=angle;wheel.add(spoke);}
  wheel.rotation.y=Math.PI/2;objects.add(wheel);
  // The physical positions provide the symbol-to-bell mapping; the sequence is
  // written separately in the gassal's journal, and varies by saved seed.
  const bellCanvas=document.createElement('canvas');bellCanvas.width=768;bellCanvas.height=256;
  const bellContext=bellCanvas.getContext('2d');
  if(bellContext){bellContext.fillStyle='#dcc7a1';bellContext.fillRect(0,0,768,256);bellContext.fillStyle='#241d15';bellContext.font='bold 74px serif';BELL_SYMBOLS.forEach((label,i)=>bellContext.fillText(label,40+i*256,155));}
  const bellTexture=new THREE.CanvasTexture(bellCanvas);bellTexture.colorSpace=THREE.SRGBColorSpace;
  const bellMaterial=new THREE.MeshStandardMaterial({map:bellTexture,roughness:1});ownMaterial.push(bellMaterial);
  box(6.6,.7,.07,S.school[0],2.0,S.school[1]+3.08,bellMaterial);
  for(let i=0;i<3;i++){
    const x=S.school[0]-2.1+i*2.1,z=S.school[1]+3.55;
    const g=new THREE.CylinderGeometry(.16,.28,.4,12);ownGeometry.push(g);const bell=new THREE.Mesh(g,craft.metal);bell.position.set(x,1.45,z);objects.add(bell);
    target(`bell_${i}`,`Okul çanı · ${BELL_SYMBOLS[i]}`,[x,z],1.25);
  }
  const boardCanvas=document.createElement('canvas');boardCanvas.width=512;boardCanvas.height=256;
  const boardContext=boardCanvas.getContext('2d');
  if(boardContext){boardContext.fillStyle='#25372e';boardContext.fillRect(0,0,512,256);boardContext.fillStyle='#c8c9b6';boardContext.font='30px serif';boardContext.fillText('Kapı açılınca',45,95);boardContext.fillText('anneme gideceğim.',45,145);boardContext.fillText('— Elif',320,205);}
  const boardTexture=new THREE.CanvasTexture(boardCanvas);boardTexture.colorSpace=THREE.SRGBColorSpace;
  const boardMat=new THREE.MeshStandardMaterial({map:boardTexture,roughness:1});ownMaterial.push(boardMat);
  box(3,1.4,.08,S.school[0],1.8,S.school[1]-2.88,boardMat);
  // Small compartment beside the entrance is where the unlocked record is found.
  box(.8,.75,.25,S.school[0]+1.15,.85,S.school[1]+3.15,wood);
  box(.06,.06,.06,S.school[0]+1.38,.85,S.school[1]+3.3,craft.metal);
  // Fountain, well, bridge, cemetery, field and entrance form recognisable navigation landmarks.
  const cylinder = (radius:number,height:number,p:Point,m:THREE.Material,y=height/2) => {
    const g=new THREE.CylinderGeometry(radius,radius,height,16); ownGeometry.push(g); const mesh=new THREE.Mesh(g,m); mesh.position.set(p[0],dermanliHeight(...p)+y,p[1]); objects.add(mesh); return mesh;
  };
  cylinder(1.7,.65,S.square,stone); cylinder(1,.9,S.well,stone);
  colliders.push({minX:S.well[0]-1,maxX:S.well[0]+1,minZ:S.well[1]-1,maxZ:S.well[1]+1}); target('well','Kuyu · Kayıt', [S.well[0]+1.6,S.well[1]],2.4);
  const [bx,bz] = S.bridge; box(7,.35,2.8,bx,.2,bz,stone); for (const side of [-1,1]) box(7,.85,.15,bx,.66,bz+side*1.3,stone);
  // These are outdoor memories, not residents inside houses.
  const spiritMaterial=new THREE.MeshStandardMaterial({color:0xbfc6c1,roughness:.9,transparent:true,opacity:.52,depthWrite:false});ownMaterial.push(spiritMaterial);
  const makeSpirit=(x:number,z:number,scale:number)=>{
    const group=new THREE.Group(); group.position.set(x,0,z);group.scale.setScalar(scale);
    const bodyGeo=new THREE.ConeGeometry(.34,1.1,10),headGeo=new THREE.SphereGeometry(.19,12,10);ownGeometry.push(bodyGeo,headGeo);
    const body=new THREE.Mesh(bodyGeo,spiritMaterial);body.position.y=.65;const head=new THREE.Mesh(headGeo,spiritMaterial);head.position.y=1.38;
    group.add(body,head);group.visible=false;objects.add(group);return group;
  };
  const elif=makeSpirit(S.school[0]+5,S.school[1]+4,.75),riza=makeSpirit(S.square[0]-4,S.square[1]-3,1.15);
  target('elif','Elif ile konuş',[S.school[0]+5,S.school[1]+4],2.2);
  target('riza','Muhtar Rıza ile konuş',[S.square[0]-4,S.square[1]-3],2.2);
  // Hacı Süleyman is a separate final tableau, never an NPC in a house.
  const master=new THREE.Group();master.position.set(gx-1.9,0,gz+.9);master.rotation.y=Math.PI/2;
  const robeGeo=new THREE.CylinderGeometry(.3,.43,1.3,12),headGeo=new THREE.SphereGeometry(.2,12,10),armGeo=new THREE.CapsuleGeometry(.07,.55,4,8);
  ownGeometry.push(robeGeo,headGeo,armGeo);
  const robe=new THREE.Mesh(robeGeo,spiritMaterial);robe.position.y=.83;master.add(robe);
  const head=new THREE.Mesh(headGeo,spiritMaterial);head.position.y=1.7;master.add(head);
  for(const side of [-1,1]){const arm=new THREE.Group();arm.name=side<0?'masterLeft':'masterRight';arm.position.set(side*.32,1.3,0);const sleeve=new THREE.Mesh(armGeo,spiritMaterial);sleeve.position.set(0,-.32,0);arm.add(sleeve);master.add(arm);}
  master.visible=false;objects.add(master);

  const [fx,fz] = S.field; box(30,.08,21,fx,.04,fz,field); for(let i=-9;i<=9;i+=3) box(28,.12,.28,fx,.12,fz+i,wood);
  const [cx,cz] = S.cemetery;
  for(let x=-10;x<=10;x+=2.7) for(let z=-3;z<=8;z+=2.8) { if (Math.abs(x)<1.5) continue; box(.7,.9,.16,cx+x,.45,cz+z,stone); }
  for (const x of [-13.5,13.5]) box(.22,1,23.4,cx+x,.5,cz,wood);
  box(27,1,.22,cx,.5,cz-11.7,wood); box(11.5,1,.22,cx-7.75,.5,cz+11.7,wood); box(11.5,1,.22,cx+7.75,.5,cz+11.7,wood);
  target('cemetery','Mezarlık · İsimler', [cx,cz+7], 2.6);
  for(const x of [-2.4,2.4]) box(.8,2.8,.8,S.entrance[0]+x,1.4,S.entrance[1],stone);
  target('bridge','Taş köprü',S.bridge,3);
  // Grove with deterministic placement; preserve clearances for every path and building.
  const treeG = new THREE.ConeGeometry(1.55,5,7), trunkG = new THREE.CylinderGeometry(.23,.36,2,7); ownGeometry.push(treeG,trunkG);
  let seed=7; const random=()=>{seed=(seed*16807)%2147483647; return (seed-1)/2147483646;};
  const sites: Point[] = [S.gasilhane,S.school,S.mill,S.cemetery,S.square,S.gassalHome,S.office,S.well,S.barn,S.field,S.bridge,...S.abandonedHomes];
  const coords: Point[]=[];
  for(let i=0;i<1300 && coords.length<260;i++) {
    const x=(random()-.5)*170,z=(random()-.5)*220;
    if(sites.some(p=>Math.hypot(x-p[0],z-p[1])<9) || DERMANLI_PATHS.some(p=>distanceToPath(x,z,p)<p.width/2+2)) continue;
    coords.push([x,z]);
  }
  const trees=new THREE.InstancedMesh(treeG,foliage,coords.length), trunks=new THREE.InstancedMesh(trunkG,wood,coords.length), dummy=new THREE.Object3D();
  const plane=new THREE.PlaneGeometry(4.68,8.72).translate(0,4.36,0), cross=plane.clone().rotateY(Math.PI/2);
  const pineGeometry=mergeGeometries([plane,cross])!;plane.dispose();cross.dispose();ownGeometry.push(pineGeometry);
  const pineMaterial=new THREE.MeshLambertMaterial({color:0xb2bbae,side:THREE.DoubleSide,alphaTest:.32});ownMaterial.push(pineMaterial);
  const pines=new THREE.InstancedMesh(pineGeometry,pineMaterial,coords.length);pines.visible=false;
  const pineMap=new THREE.TextureLoader().load(surfaceUrl('karacam',true),()=>{pines.visible=true;trees.visible=false;trunks.visible=false;});pineMap.colorSpace=THREE.SRGBColorSpace;pineMaterial.map=pineMap;
  coords.forEach(([x,z],i)=>{const y=dermanliHeight(x,z);dummy.position.set(x,y,z);dummy.rotation.y=random()*6.28;dummy.scale.setScalar(.8+random()*.4);dummy.updateMatrix();pines.setMatrixAt(i,dummy.matrix);colliders.push({minX:x-.25,maxX:x+.25,minZ:z-.25,maxZ:z+.25});});objects.add(pines);
  coords.forEach(([x,z],i)=>{ const y=dermanliHeight(x,z); dummy.position.set(x,y+3.8,z); dummy.rotation.y=random()*6.28; dummy.scale.setScalar(.75+random()*.6); dummy.updateMatrix(); trees.setMatrixAt(i,dummy.matrix); dummy.position.y=y+1; dummy.scale.setScalar(1); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix); }); objects.add(trees,trunks);
  const figures=createHorrorFigures(); for(const figure of figures){figure.visible=false;objects.add(figure);}
  const apparition=createKaraBasma().root; apparition.position.set(-1000,0,-1000); objects.add(apparition);
  return {targets,colliders,gasil,homes,apparition,figures,arrivalBody,arrivalUnwrapped,arrivalWrapped,slabBody,wheel,homeLight,elif,riza,master,updateArt(x:number,z:number){art.approach({x,z});}, dispose(){ disposeHorrorFigures(figures); bellTexture.dispose(); boardTexture.dispose(); pineMap.dispose(); terrain.dispose(); art.dispose(); craft.dispose(); textures.disposeAll(); ownGeometry.forEach(g=>g.dispose()); ownMaterial.forEach(m=>m.dispose()); scene.remove(objects); }};
}
