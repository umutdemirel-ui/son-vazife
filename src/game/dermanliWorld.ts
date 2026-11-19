import * as THREE from 'three';
import { createDermanliTerrain } from './dermanliTerrain';
import { DERMANLI_PATHS, DERMANLI_SITES as S, dermanliHeight, distanceToPath, type Point } from './dermanliMap';
import { loadVillageTextures } from './textures';
import { VillageCraft } from './villageCraft';
import { createMosqueAndGasilhane, createKaraBasma } from './models';
import { buildHome, type HomeSpec } from './homes';
import { NightArt } from './nightArt';
import { translateColliders, type BoxCollider } from './collision';

export interface NewTarget { id: string; label: string; x: number; z: number; radius: number }
export function createDermanliWorld(scene: THREE.Scene) {
  const terrain = createDermanliTerrain(); scene.add(terrain.root);
  const textures = loadVillageTextures(2, true), craft = new VillageCraft(textures), art = new NightArt(true, () => {});
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
  gasil.doorPivot.rotation.y = -Math.PI * .52; gasil.mosqueDoorPivot.rotation.y = -Math.PI * .52;
  colliders.push(...translateColliders({x:S.gasilhane[0],z:S.gasilhane[1]}, [
    {minX:-3.6,maxX:3.6,minZ:-3.45,maxZ:-2.95},{minX:-3.6,maxX:3.6,minZ:4.15,maxZ:4.65},
    {minX:-3.65,maxX:-3.15,minZ:-3.4,maxZ:4.6},{minX:3.15,maxX:3.65,minZ:-3.4,maxZ:-.8},
    {minX:3.15,maxX:3.65,minZ:.8,maxZ:4.6},{minX:-1.25,maxX:1.25,minZ:-.65,maxZ:.65},
    {minX:-3.5,maxX:-3.3,minZ:-8.1,maxZ:-3.4},{minX:-3.5,maxX:3.5,minZ:-8.1,maxZ:-7.9},
    {minX:-3.5,maxX:3.5,minZ:-3.5,maxZ:-3.3},{minX:3.2,maxX:3.5,minZ:-8,maxZ:-6.45},
    {minX:3.2,maxX:3.5,minZ:-4.95,maxZ:-3.4},
  ]));
  target('gasil','Gasilhane · Teneşir', [S.gasilhane[0]+1.9,S.gasilhane[1]], 2.4);
  const addHome = (site: Point, id: string, number: number, w = 6.5, d = 5) => {
    const spec: HomeSpec = {x:site[0],z:site[1],rotY:0,w,d,h:3,style:number%2 ? 'himis' : 'tas'};
    const {home,walls} = buildHome(spec,number,dermanliHeight(...site),craft);
    home.door.rotation.y = -Math.PI*.52; homes.push(home); objects.add(home.root); colliders.push(...walls);
    target(id, id === 'home' ? 'Gassalın evi · Günlük' : id === 'school' ? 'Eski okul · Tahta' : id === 'mill' ? 'Değirmen · Defter' : 'Terk edilmiş ev', [site[0],site[1]+d/2+1.0],2.6);
  };
  addHome(S.gassalHome,'home',0,7,5); addHome(S.school,'school',1,8,6); addHome(S.mill,'mill',2,6,5);
  S.abandonedHomes.forEach((p,i)=>addHome(p,`abandoned${i}`,i+3));
  addHome(S.barn,'barn',7,7,5);
  // Fountain, well, bridge, cemetery, field and entrance form recognisable navigation landmarks.
  const cylinder = (radius:number,height:number,p:Point,m:THREE.Material,y=height/2) => {
    const g=new THREE.CylinderGeometry(radius,radius,height,16); ownGeometry.push(g); const mesh=new THREE.Mesh(g,m); mesh.position.set(p[0],dermanliHeight(...p)+y,p[1]); objects.add(mesh); return mesh;
  };
  cylinder(1.7,.65,S.square,stone); cylinder(1,.9,S.well,stone);
  colliders.push({minX:S.well[0]-1,maxX:S.well[0]+1,minZ:S.well[1]-1,maxZ:S.well[1]+1}); target('well','Kuyu · Kayıt', [S.well[0]+1.6,S.well[1]],2.4);
  const [bx,bz] = S.bridge; box(7,.35,2.8,bx,.2,bz,stone); for (const side of [-1,1]) box(7,.85,.15,bx,.66,bz+side*1.3,stone);
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
  const sites: Point[] = [S.gasilhane,S.school,S.mill,S.cemetery,S.square,S.gassalHome,S.well,S.barn,S.field,S.bridge,...S.abandonedHomes];
  const coords: Point[]=[];
  for(let i=0;i<1300 && coords.length<260;i++) {
    const x=(random()-.5)*170,z=(random()-.5)*220;
    if(sites.some(p=>Math.hypot(x-p[0],z-p[1])<9) || DERMANLI_PATHS.some(p=>distanceToPath(x,z,p)<p.width/2+2)) continue;
    coords.push([x,z]);
  }
  const trees=new THREE.InstancedMesh(treeG,foliage,coords.length), trunks=new THREE.InstancedMesh(trunkG,wood,coords.length), dummy=new THREE.Object3D();
  coords.forEach(([x,z],i)=>{ const y=dermanliHeight(x,z); dummy.position.set(x,y+3.8,z); dummy.rotation.y=random()*6.28; dummy.scale.setScalar(.75+random()*.6); dummy.updateMatrix(); trees.setMatrixAt(i,dummy.matrix); dummy.position.y=y+1; dummy.scale.setScalar(1); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix); }); objects.add(trees,trunks);
  const apparition=createKaraBasma().root; apparition.position.set(-1000,0,-1000); objects.add(apparition);
  return {targets,colliders,gasil,homes,apparition, dispose(){ terrain.dispose(); art.dispose(); craft.dispose(); textures.disposeAll(); ownGeometry.forEach(g=>g.dispose()); ownMaterial.forEach(m=>m.dispose()); scene.remove(objects); }};
}
