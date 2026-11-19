import * as THREE from 'three';
import { createDermanliTerrain, dermanliSurfaceHeight } from './dermanliTerrain';
import { DERMANLI_PATHS, DERMANLI_SITES as S, distanceToPath, type Point } from './dermanliMap';
import { loadVillageTextures } from './textures';
import { VillageCraft, block, pitchedRoof } from './villageCraft';
import { MOSQUE_GRAVES } from './cemetery';
import { createMosqueAndGasilhane, createKaraBasma, createSisGozcusu, createCopperEwerAndSoap, createMuhtarHouse, createVillageBench, createWatermillAndBridge, createGraveyardCluster } from './models';
import { buildHome, homeCollider, type HomeSpec } from './homes';
import { NightArt, watcherFigure } from './nightArt';
import {ResidentVisual} from './residentVisual';
import {createModelLoader} from './modelLoader';
import {RESIDENT_MEMORIES, type MemoryId} from './dermanliCharacters';
import { funeralFigure } from './funerary';
import {createHorrorFigures,disposeHorrorFigures} from './horrorFigures';
import {surfaceUrl} from './quality';
import {WorkshopAssets} from './workshopAssets';
import { BELL_SYMBOLS } from './dermanliBell';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import { translateColliders, type BoxCollider } from './collision';

export interface NewTarget { id: string; label: string; x: number; z: number; radius: number }
export function createDermanliWorld(scene: THREE.Scene) {
  const textures = loadVillageTextures(2, true);
  const terrain = createDermanliTerrain(textures); scene.add(terrain.root);
  const craft = new VillageCraft(textures,'DERMANLI'), art = new NightArt(true, () => {});
  const colliders: BoxCollider[] = [], occluders: BoxCollider[] = [], targets: NewTarget[] = [], homes: ReturnType<typeof buildHome>['home'][] = [];
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
  gasil.group.position.set(S.gasilhane[0], dermanliSurfaceHeight(...S.gasilhane), S.gasilhane[1]); objects.add(gasil.group);
  gasil.ceilingLight.color.set(0x91b9dc);gasil.ceilingLight.intensity=5;
  const slabBody=funeralFigure(art,'arif',false); gasil.deceasedGroup.add(slabBody);
  art.near('arif',S.gasilhane[0],S.gasilhane[1],25);
  gasil.doorPivot.rotation.y = -Math.PI * .52; gasil.mosqueDoorPivot.rotation.y = -Math.PI * .52;
  const gasilWalls=translateColliders({x:S.gasilhane[0],z:S.gasilhane[1]}, [
    {minX:-3.6,maxX:3.6,minZ:-3.45,maxZ:-2.95},{minX:-3.6,maxX:3.6,minZ:4.15,maxZ:4.65},
    {minX:-3.65,maxX:-3.15,minZ:-3.4,maxZ:4.6},{minX:3.15,maxX:3.65,minZ:-3.4,maxZ:-.8},
    {minX:3.15,maxX:3.65,minZ:.8,maxZ:4.6},
    {minX:-3.5,maxX:-3.3,minZ:-8.1,maxZ:-3.4},{minX:-3.5,maxX:3.5,minZ:-8.1,maxZ:-7.9},
    {minX:-3.5,maxX:3.5,minZ:-3.5,maxZ:-3.3},{minX:3.2,maxX:3.5,minZ:-8,maxZ:-6.45},
    {minX:3.2,maxX:3.5,minZ:-4.95,maxZ:-3.4},
  ]);
  colliders.push(...gasilWalls,...translateColliders({x:S.gasilhane[0],z:S.gasilhane[1]},[{minX:-1.25,maxX:1.25,minZ:-.65,maxZ:.65}]));
  // Low furniture blocks movement but does not obscure the view.
  occluders.push(...gasilWalls);
  // Retain the detailed previous muhtarlık interior in the new square.
  const office=createMuhtarHouse(textures,craft);
  office.group.position.set(S.office[0],dermanliSurfaceHeight(...S.office),S.office[1]);office.doorPivot.rotation.y=Math.PI*.56;objects.add(office.group);
  const officeWalls=translateColliders({x:S.office[0],z:S.office[1]},[
    {minX:-3.4,maxX:3.4,minZ:-3.25,maxZ:-2.75},{minX:-3.4,maxX:3.4,minZ:2.75,maxZ:3.25},
    {minX:2.95,maxX:3.45,minZ:-3.2,maxZ:3.2},{minX:-3.45,maxX:-2.95,minZ:-3.2,maxZ:-.8},
    {minX:-3.45,maxX:-2.95,minZ:.8,maxZ:3.2},
  ]);
  colliders.push(...officeWalls,...translateColliders({x:S.office[0],z:S.office[1]},[{minX:.6,maxX:1.9,minZ:-1.3,maxZ:.9}]));
  occluders.push(...officeWalls);
  target('mosque','Cami · İmamın notu',[S.mosque[0]+3.8,S.mosque[1]-1.1],1.8);
  box(.05,.45,.34,S.gasilhane[0]+3.56,1.35,S.gasilhane[1]-6.8,mat(0xbfb49a));
  target('office','Muhtarlık · Kayıt defteri',[S.office[0]+.4,S.office[1]+1.4],1.6);
  const [gx,gz]=S.gasilhane;
  target('slab','Teneşir', [gx,gz], 2.05);
  target('candle','Sabır mumu', [gx-1.35,gz-.75], 1.7);
  const stations = [
    ['soap','Sabun','sabun',-2.7,-2.35], ['ewer','İbrik','ibrik',-2.7,2.3],
    ['camphor','Kâfur','kafur',1.8,-2.35], ['shroud','Kefen','kefen',.1,-2.35],
  ] as const;
  const stationMeshes:Record<string,THREE.Object3D>={};
  for(const [id,label,type,x,z] of stations) {
    const item=createCopperEwerAndSoap(type); item.position.set(gx+x,.85,gz+z); objects.add(item);stationMeshes[id]=item;
    target(id,label,[gx+x,gz+z],1.65);
  }
  target('bucket','Kirli su kovası',[gx+.25,gz+1.05],1.5);
  target('drain','Gider',[gx-1.9,gz+2.0],1.3);
  target('discard','Kirli suyu dışarı dök',[gx+5,gz+4],1.2);
  target('arrival','Cenazeyi al',[gx+5,gz],1.6);
  target('forest','Orman yolu · Ayrıl',[-56.4,21.6],2.7);
  const bucket=cylinderPlaceholder();
  function cylinderPlaceholder() {
    const g=new THREE.CylinderGeometry(.24,.18,.38,12,1,true); ownGeometry.push(g);
    const b=new THREE.Mesh(g,craft.metal); b.position.set(gx+.25,.3,gz+1.05);objects.add(b);return b;
  }
  stationMeshes.bucket=bucket;
  const bed=box(2,.15,.75,gx+5,.75,gz,wood);
  const arrivalBody = new THREE.Group();
  const arrivalUnwrapped=funeralFigure(art,'arif',false),arrivalWrapped=funeralFigure(art,'yolcu',false);
  arrivalBody.add(arrivalUnwrapped,arrivalWrapped);arrivalBody.position.set(gx+5,.84,gz);objects.add(arrivalBody);
  art.near('yolcu',gx,gz,25);
  void bed;

  const addHome = (site: Point, id: string, number: number, w = 6.5, d = 5) => {
    const spec: HomeSpec = {x:site[0],z:site[1],rotY:0,w,d,h:3,style:number%2 ? 'himis' : 'tas'};
    const {home,walls} = buildHome(spec,number,dermanliSurfaceHeight(...site),craft,id === 'school' ? 'school' : id === 'home' ? 'gassal' : 'home');
    home.door.rotation.y = -Math.PI*.5; homes.push(home); objects.add(home.root); colliders.push(...walls);occluders.push(...walls.slice(0,5));
    // The opened door leaf projects into the yard; do not let players stand inside its mesh.
    const leafWidth=id === 'school' || id === 'home' ? 2 : 1.45;
    const openDoor=homeCollider(spec,-leafWidth/2,d/2+leafWidth/2,.14,leafWidth);colliders.push(openDoor);occluders.push(openDoor);
    if(id !== 'school' && id !== 'home') target(id, id === 'coffee' ? 'Kahvehane · Eski ilan' : 'Terk edilmiş ev', [site[0],site[1]+d/2+1.0],2.6);
  };
  addHome(S.gassalHome,'home',0,7,5); addHome(S.school,'school',1,8,6);
  // The gassal's room is empty of residents: a cot, rug and writing table tell his story.
  const [hx,hz]=S.gassalHome,hy=dermanliSurfaceHeight(hx,hz);
  box(1.36,.3,2.15,hx-2.42,hy+.22,hz-.45,craft.wood);
  box(1.22,.17,2.0,hx-2.42,hy+.46,hz-.45,craft.lime[0]);
  box(1.22,.08,1.18,hx-2.42,hy+.58,hz-.02,craft.kilim);
  box(.72,.15,.38,hx-2.42,hy+.63,hz-1.17,craft.lime[1]);
  colliders.push({minX:hx-3.1,maxX:hx-1.74,minZ:hz-1.53,maxZ:hz+.63});
  box(1.55,.1,.78,hx+1.8,hy+.78,hz-1.65,craft.wood);
  for(const dx of [-.65,.65])for(const dz of [-.28,.28])box(.09,.72,.09,hx+1.8+dx,hy+.36,hz-1.65+dz,craft.wood);
  colliders.push({minX:hx+1.025,maxX:hx+2.575,minZ:hz-2.04,maxZ:hz-1.26});
  const paper=mat(0xd6c6a0),ink=mat(0x4d4030);
  box(.58,.045,.42,hx+1.62,hy+.86,hz-1.58,paper);
  box(.54,.014,.018,hx+1.62,hy+.89,hz-1.68,ink);
  box(.42,.014,.018,hx+1.56,hy+.89,hz-1.59,ink);
  box(.44,.014,.018,hx+1.57,hy+.89,hz-1.5,ink);
  target('home','Gassalın evi · Günlük',[hx+1.62,hz-1.58],1.8);
  box(1.5,.015,.9,hx,hy+.09,hz+.25,craft.kilim);
  box(1.2,.1,.25,hx-2.65,hy+1.8,hz-2.28,craft.wood);
  for(let i=0;i<3;i++)box(.16,.32,.17,hx-3.02+i*.19,hy+2.01,hz-2.28,craft.shutters[i%craft.shutters.length]);

  const coffeeSite=S.coffee;addHome(coffeeSite,'coffee',8,7,5);
  S.abandonedHomes.forEach((p,i)=>addHome(p,`abandoned${i}`,i+3));
  const coffeeCanvas=document.createElement('canvas');coffeeCanvas.width=512;coffeeCanvas.height=128;
  const coffeeContext=coffeeCanvas.getContext('2d');if(coffeeContext){coffeeContext.fillStyle='#3e3024';coffeeContext.fillRect(0,0,512,128);coffeeContext.fillStyle='#dfcfaa';coffeeContext.font='bold 52px serif';coffeeContext.textAlign='center';coffeeContext.fillText('KÖY KAHVEHANESİ',256,82);}
  const coffeeTexture=new THREE.CanvasTexture(coffeeCanvas);coffeeTexture.colorSpace=THREE.SRGBColorSpace;
  const coffeeSignMaterial=new THREE.MeshStandardMaterial({map:coffeeTexture,roughness:1});ownMaterial.push(coffeeSignMaterial);
  const coffeeSignGeometry=new THREE.PlaneGeometry(3,.55);ownGeometry.push(coffeeSignGeometry);const coffeeSign=new THREE.Mesh(coffeeSignGeometry,coffeeSignMaterial);coffeeSign.position.set(coffeeSite[0],2.48,coffeeSite[1]+2.63);objects.add(coffeeSign);
  const homeLight=new THREE.PointLight(0xffb15c,4,12,1.7);homeLight.position.set(S.gassalHome[0],2.1,S.gassalHome[1]);objects.add(homeLight);
  const emptyHomeGlow=new THREE.MeshBasicMaterial({color:0xd29952});ownMaterial.push(emptyHomeGlow);
  const emptyHomeWindows=S.abandonedHomes.map(([x,z])=>{
    const window=box(.55,.68,.02,x+1.85,1.67,z+2.61,emptyHomeGlow);window.visible=false;return window;
  });
  const emptyHomeLight=new THREE.PointLight(0xffa354,0,5,2);objects.add(emptyHomeLight);
  // Detailed walk-in watermill from the previous village, relocated to the Dermanlı stream.
  const millAndBridge=createWatermillAndBridge(textures,'stone');
  const [mx,mz]=S.mill,my=dermanliSurfaceHeight(mx,mz);
  millAndBridge.millGroup.position.set(mx,my,mz);millAndBridge.doorPivot.rotation.y=-Math.PI/2;objects.add(millAndBridge.millGroup);
  const millWalls=translateColliders({x:mx,z:mz},[
    {minX:-3.3,maxX:-2.85,minZ:-3.05,maxZ:3.05},{minX:-3.2,maxX:3.2,minZ:-3.1,maxZ:-2.7},
    {minX:-3.2,maxX:3.2,minZ:2.7,maxZ:3.1},{minX:2.9,maxX:3.3,minZ:-3,maxZ:-.8},
    {minX:2.9,maxX:3.3,minZ:.8,maxZ:3},
  ]);colliders.push(...millWalls);occluders.push(...millWalls);
  const millFurniture=translateColliders({x:mx,z:mz},[
    {minX:-2,maxX:-.6,minZ:-1.8,maxZ:-.4},{minX:-2.1,maxX:-.9,minZ:.65,maxZ:1.55},
    {minX:3.15,maxX:4.2,minZ:1.2,maxZ:3.3},{minX:1.55,maxX:3.1,minZ:-.86,maxZ:-.7},
  ]);colliders.push(...millFurniture);occluders.push(millFurniture[3]);
  target('mill','Değirmen · Defter',[mx-1.5,mz+1.1],1.6);
  const wheel=millAndBridge.wheelPivot;
  // A narrow water channel leads from the wheel to the larger stream.
  const channelGeo=new THREE.PlaneGeometry(8.4,1.25);ownGeometry.push(channelGeo);
  const channel=new THREE.Mesh(channelGeo,craft.water);channel.rotation.x=-Math.PI/2;channel.position.set(mx+8,dermanliSurfaceHeight(mx+8,mz+2.2)+.07,mz+2.2);objects.add(channel);
  // The physical positions provide the symbol-to-bell mapping; the sequence is
  // written separately in the gassal's journal, and varies by saved seed.
  const bellCanvas=document.createElement('canvas');bellCanvas.width=768;bellCanvas.height=256;
  const bellContext=bellCanvas.getContext('2d');
  if(bellContext){bellContext.fillStyle='#dcc7a1';bellContext.fillRect(0,0,768,256);bellContext.fillStyle='#241d15';bellContext.font='bold 74px serif';BELL_SYMBOLS.forEach((label,i)=>bellContext.fillText(label,40+i*256,155));}
  const bellTexture=new THREE.CanvasTexture(bellCanvas);bellTexture.colorSpace=THREE.SRGBColorSpace;
  const bellMaterial=new THREE.MeshStandardMaterial({map:bellTexture,roughness:1});ownMaterial.push(bellMaterial);
  // A freestanding rack beside the building keeps the doorway and its collider clear.
  const bellX=S.school[0]-6.4,bellZ=S.school[1]+3;
  box(3.5,.65,.12,bellX,2.1,bellZ-.25,bellMaterial);
  for(const x of [-1.6,1.6])box(.12,2.2,.12,bellX+x,1.1,bellZ-.25,wood);
  for(let i=0;i<3;i++){
    const x=bellX-1.1+i*1.1,z=bellZ;
    const g=new THREE.CylinderGeometry(.16,.28,.4,12);ownGeometry.push(g);const bell=new THREE.Mesh(g,craft.metal);bell.position.set(x,1.45,z);objects.add(bell);
    target(`bell_${i}`,`Okul çanı · ${BELL_SYMBOLS[i]}`,[x,z],.95);
  }
  const boardCanvas=document.createElement('canvas');boardCanvas.width=512;boardCanvas.height=256;
  const boardContext=boardCanvas.getContext('2d');
  if(boardContext){boardContext.fillStyle='#25372e';boardContext.fillRect(0,0,512,256);boardContext.fillStyle='#c8c9b6';boardContext.font='30px serif';boardContext.fillText('Kapı açılınca',45,95);boardContext.fillText('anneme gideceğim.',45,145);boardContext.fillText('— Elif',320,205);}
  const boardTexture=new THREE.CanvasTexture(boardCanvas);boardTexture.colorSpace=THREE.SRGBColorSpace;
  const boardMat=new THREE.MeshStandardMaterial({map:boardTexture,roughness:1});ownMaterial.push(boardMat);
  const [sx,sz]=S.school,sy=dermanliSurfaceHeight(sx,sz);
  // The board is a single inward-facing surface, avoiding stretched edge textures.
  box(3.16,1.56,.07,sx,sy+1.8,sz-2.88,wood);
  const boardGeometry=new THREE.PlaneGeometry(3,1.4);ownGeometry.push(boardGeometry);
  const board=new THREE.Mesh(boardGeometry,boardMat);board.position.set(sx,sy+1.8,sz-2.83);objects.add(board);
  box(3.15,.09,.16,sx,sy+1.03,sz-2.77,wood);
  // Two rows of old classroom desks leave a clear aisle from the doorway.
  for(const x of [-2.35,2.35])for(const z of [-.75,1.15]){
    box(1.45,.1,.62,sx+x,sy+.76,sz+z,craft.wood);
    for(const dx of [-.61,.61])for(const dz of [-.24,.24])box(.08,.7,.08,sx+x+dx,sy+.36,sz+z+dz,craft.wood);
    box(1.45,.09,.32,sx+x,sy+.42,sz+z+.62,craft.wood);
    for(const dx of [-.6,.6])box(.08,.39,.25,sx+x+dx,sy+.2,sz+z+.62,craft.wood);
    colliders.push({minX:sx+x-.73,maxX:sx+x+.73,minZ:sz+z-.31,maxZ:sz+z+.8});
  }
  // Locked record cabinet is inside, beside the blackboard.
  box(.9,1.3,.42,sx+2.7,sy+.68,sz-2.7,craft.wood);
  box(.06,.06,.07,sx+2.55,sy+.7,sz-2.47,craft.metal);
  colliders.push({minX:sx+2.25,maxX:sx+3.15,minZ:sz-2.91,maxZ:sz-2.49});
  target('school','Eski okul · Kilitli dolap',[sx+2.7,sz-2.47],2.15);
  const schoolSignCanvas=document.createElement('canvas');schoolSignCanvas.width=512;schoolSignCanvas.height=128;
  const schoolSignContext=schoolSignCanvas.getContext('2d');if(schoolSignContext){schoolSignContext.fillStyle='#4d3929';schoolSignContext.fillRect(0,0,512,128);schoolSignContext.fillStyle='#e1d5bb';schoolSignContext.textAlign='center';schoolSignContext.font='bold 48px serif';schoolSignContext.fillText('DERMANLI İLKOKULU',256,80);}
  const schoolSignTexture=new THREE.CanvasTexture(schoolSignCanvas);schoolSignTexture.colorSpace=THREE.SRGBColorSpace;
  const schoolSignMaterial=new THREE.MeshStandardMaterial({map:schoolSignTexture,roughness:1});ownMaterial.push(schoolSignMaterial);
  const schoolSignGeometry=new THREE.PlaneGeometry(2.7,.65);ownGeometry.push(schoolSignGeometry);
  const schoolSign=new THREE.Mesh(schoolSignGeometry,schoolSignMaterial);schoolSign.position.set(sx,sy+2.5,sz+3.1);objects.add(schoolSign);
  // Reuse the detailed old-world hayrat and furnishings rather than primitive cylinders.
  const detailGeometry=new Set<THREE.BufferGeometry>();
  const millMaterials=new Set<THREE.Material>();
  const ownDetails=(group:THREE.Object3D)=>group.traverse(o=>{if(o instanceof THREE.Mesh)detailGeometry.add(o.geometry);});
  for(const group of [millAndBridge.millGroup,millAndBridge.bridgeGroup]){ownDetails(group);group.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])millMaterials.add(m);});}
  // A single-storey timber barn, with a wide, permanently open entrance and no residents.
  const [ax,az]=S.barn,ay=dermanliSurfaceHeight(ax,az),barn=new THREE.Group();barn.position.set(ax,ay,az);barn.name='Ahır';objects.add(barn);
  block(barn,craft.masonry,7,.16,5,0,.03,0,2);
  block(barn,craft.wood,7,2.9,.2,0,1.45,-2.5,1.5);
  for(const x of [-3.5,3.5])block(barn,craft.wood,.2,2.9,5,x,1.45,0,1.5);
  for(const x of [-2.35,2.35])block(barn,craft.wood,2.3,2.9,.2,x,1.45,2.5,1.5);
  block(barn,craft.wood,2.4,.65,.2,0,2.575,2.5,1.5);
  block(barn,craft.wood,7,.1,5,0,2.84,0,1.5);
  pitchedRoof(barn,craft.roofVariants[1],craft.wood,7.5,5.5,2.9,1.0,1.0);
  for(const x of [-3.35,3.35]){
    block(barn,craft.wood,.18,2.9,.18,x,1.45,2.64);
    // Each door leaf is swung open along the exterior, clear of the entrance.
    block(barn,craft.wood,.12,2.2,1.2,x<0?-1.2:1.2,1.1,3.15,1.5);
  }
  const hayCanvas=document.createElement('canvas');hayCanvas.width=256;hayCanvas.height=256;
  const hayContext=hayCanvas.getContext('2d');if(hayContext){
    hayContext.fillStyle='#76663a';hayContext.fillRect(0,0,256,256);
    for(let i=0;i<900;i++){const x=(i*73)%256,y=(i*137)%256;hayContext.strokeStyle=i%3===0?'#aa995b':i%3===1?'#5f5431':'#8b7b48';hayContext.lineWidth=1;hayContext.beginPath();hayContext.moveTo(x,y);hayContext.lineTo(x+8+(i%9),y+((i%7)-3));hayContext.stroke();}
  }
  const hayTexture=new THREE.CanvasTexture(hayCanvas);hayTexture.colorSpace=THREE.SRGBColorSpace;
  const hay=new THREE.MeshStandardMaterial({map:hayTexture,roughness:1}),hayBand=mat(0x5c4b2e);ownMaterial.push(hay);
  for(const [x,z] of [[-2.35,-1.65],[-2.35,-.62],[2.45,-1.65]] as const){
    block(barn,hay,1.1,.65,.85,x,.34,z);
    for(const dx of [-.3,.3])block(barn,hayBand,.03,.66,.87,x+dx,.34,z);
    colliders.push({minX:ax+x-.55,maxX:ax+x+.55,minZ:az+z-.43,maxZ:az+z+.43});
  }
  block(barn,craft.wood,1.25,.18,.6,1.9,.57,1.0,1.2);
  for(const x of [1.38,2.42])block(barn,craft.wood,.12,.56,.12,x,.28,1.0);
  block(barn,paper,.45,.035,.33,1.9,.68,1.0);
  colliders.push({minX:ax+1.275,maxX:ax+2.525,minZ:az+.7,maxZ:az+1.3});
  const barnWalls=translateColliders({x:ax,z:az},[
    {minX:-3.6,maxX:-3.4,minZ:-2.6,maxZ:2.6},{minX:3.4,maxX:3.6,minZ:-2.6,maxZ:2.6},
    {minX:-3.6,maxX:3.6,minZ:-2.6,maxZ:-2.4},{minX:-3.6,maxX:-1.2,minZ:2.4,maxZ:2.6},
    {minX:1.2,maxX:3.6,minZ:2.4,maxZ:2.6},
  ]);colliders.push(...barnWalls);occluders.push(...barnWalls);
  for(const x of [-1.2,1.2])colliders.push({minX:ax+x-.06,maxX:ax+x+.06,minZ:az+2.55,maxZ:az+3.75});
  target('barn','Ahır · Hasat kaydı',[ax+1.9,az+1],1.65);ownDetails(barn);

  for(const [x,z,angle] of [[-10.25,16.3,0],[-7.75,16.3,0]] as const){const bench=createVillageBench(craft);bench.position.set(x,dermanliSurfaceHeight(x,z),z);bench.rotation.y=angle;objects.add(bench);ownDetails(bench);colliders.push({minX:x-.9,maxX:x+.9,minZ:z-.3,maxZ:z+.3});}
  const coffeeTable=box(1.1,.09,.72,coffeeSite[0],.77,coffeeSite[1]-.8,craft.wood);
  for(const dx of [-.45,.45])for(const dz of [-.25,.25])box(.09,.72,.09,coffeeSite[0]+dx,.36,coffeeSite[1]-.8+dz,craft.wood);
  void coffeeTable;colliders.push({minX:coffeeSite[0]-.55,maxX:coffeeSite[0]+.55,minZ:coffeeSite[1]-1.16,maxZ:coffeeSite[1]-.44});
  const fountain=craft.fountain(false);fountain.position.set(S.square[0],dermanliSurfaceHeight(...S.square),S.square[1]);objects.add(fountain);ownDetails(fountain);
  colliders.push({minX:S.square[0]-1.25,maxX:S.square[0]+1.25,minZ:S.square[1]-.75,maxZ:S.square[1]+.95});
  const fountainWaterGeo=new THREE.PlaneGeometry(1.74,.7);ownGeometry.push(fountainWaterGeo);
  const fountainWater=new THREE.Mesh(fountainWaterGeo,craft.water);fountainWater.rotation.x=-Math.PI/2;fountainWater.position.set(S.square[0],.436,S.square[1]+.18);fountainWater.visible=false;objects.add(fountainWater);
  for(const [x,z,angle] of [[-3.4,15.1,0],[3.3,9.8,Math.PI]] as const){const bench=createVillageBench(craft);bench.position.set(x,dermanliSurfaceHeight(x,z),z);bench.rotation.y=angle;objects.add(bench);ownDetails(bench);colliders.push({minX:x-.9,maxX:x+.9,minZ:z-.3,maxZ:z+.3});}
  // An old broad tree marks the square without blocking the north-south road.
  const squareTreeX=-5.2,squareTreeZ=7.4,squareTreeY=dermanliSurfaceHeight(squareTreeX,squareTreeZ);
  const oakPlane=new THREE.PlaneGeometry(12.2,8.6).translate(0,4.3,0),oakCross=oakPlane.clone().rotateY(Math.PI/2);
  const oakGeometry=mergeGeometries([oakPlane,oakCross])!;oakPlane.dispose();oakCross.dispose();ownGeometry.push(oakGeometry);
  const oakMaterial=new THREE.MeshLambertMaterial({color:0xc2c0a9,side:THREE.DoubleSide,alphaTest:.35});ownMaterial.push(oakMaterial);
  const treeFallback=new THREE.Group();treeFallback.position.set(squareTreeX,squareTreeY,squareTreeZ);objects.add(treeFallback);
  const trunkGeo=new THREE.CylinderGeometry(.32,.52,4,9),crownGeo=new THREE.SphereGeometry(2.8,12,8);ownGeometry.push(trunkGeo,crownGeo);
  const trunk=new THREE.Mesh(trunkGeo,wood),crown=new THREE.Mesh(crownGeo,foliage);trunk.position.y=2;crown.position.y=5;crown.scale.set(1.15,.72,1);treeFallback.add(trunk,crown);
  const oakMap=new THREE.TextureLoader().load(surfaceUrl('autumn-oak',true),()=>{squareTree.visible=true;treeFallback.visible=false;});oakMap.colorSpace=THREE.SRGBColorSpace;oakMaterial.map=oakMap;
  const squareTree=new THREE.Mesh(oakGeometry,oakMaterial);squareTree.position.set(squareTreeX,squareTreeY-.05,squareTreeZ);squareTree.visible=false;objects.add(squareTree);
  colliders.push({minX:squareTreeX-.4,maxX:squareTreeX+.4,minZ:squareTreeZ-.4,maxZ:squareTreeZ+.4});
  // The west-path well has a hollow rim, dark opening, timber frame and rope.
  const [wx,wz]=S.well,wy=dermanliSurfaceHeight(wx,wz),well=new THREE.Group();well.position.set(wx,wy,wz);objects.add(well);
  const wellWall=new THREE.CylinderGeometry(.92,.97,.82,16,1,true),wellRim=new THREE.TorusGeometry(.79,.14,8,16),wellHole=new THREE.CircleGeometry(.67,16);
  ownGeometry.push(wellWall,wellRim,wellHole);
  const wall=new THREE.Mesh(wellWall,craft.masonry);wall.position.y=.41;well.add(wall);
  const rim=new THREE.Mesh(wellRim,craft.masonry);rim.rotation.x=Math.PI/2;rim.position.y=.83;well.add(rim);
  const hole=new THREE.Mesh(wellHole,dark);hole.rotation.x=-Math.PI/2;hole.position.y=.65;well.add(hole);
  for(const x of [-.85,.85])box(.13,1.8,.13,wx+x,wy+.9,wz,wood);
  box(1.85,.15,.15,wx,wy+1.8,wz,wood);box(.025,1.05,.025,wx,wy+1.15,wz,craft.metal);
  colliders.push({minX:wx-1,maxX:wx+1,minZ:wz-1,maxZ:wz+1});target('well','Kuyu · Kayıt',[wx+1.6,wz],2.4);
  // Reuse the previous textured fountain asset when available; the solid fallback stays until then.
  const workshop=new WorkshopAssets();void workshop.load('minimum',(id)=>{if(id==='hayrat')craft.install(workshop,'hayrat');});
  const [bx,bz]=S.bridge;millAndBridge.bridgeGroup.position.set(bx,dermanliSurfaceHeight(bx,bz),bz);objects.add(millAndBridge.bridgeGroup);
  for(const side of [-1,1])colliders.push({minX:bx-3.4,maxX:bx+3.4,minZ:bz+side*1.5-.08,maxZ:bz+side*1.5+.08});
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
  // The previous village cast appears only outdoors as memories; homes remain empty.
  const residentLoader=createModelLoader();
  const residentPositions:Record<MemoryId,Point>={bekci:[S.square[0]-4,S.square[1]+4],serife:[S.well[0]+3,S.well[1]+3],kenan:[S.office[0]-5,S.office[1]+4],idris:[S.cemetery[0]+9,S.cemetery[1]+9]};
  const residents=(Object.keys(RESIDENT_MEMORIES) as MemoryId[]).map(id=>{
    const [x,z]=residentPositions[id],visual=new ResidentVisual(id,residentLoader,undefined,true);
    visual.group.position.set(x,dermanliSurfaceHeight(x,z),z);visual.group.visible=false;objects.add(visual.group);
    target(`memory_${id}`,`${RESIDENT_MEMORIES[id].name} · Anı`,[x,z],2);
    return {id,visual,x,z};
  });
  // Hacı Süleyman is a separate final tableau, never an NPC in a house.
  const master=new THREE.Group();master.position.set(gx-1.9,0,gz+.9);master.rotation.y=Math.PI/2;
  const robeGeo=new THREE.CylinderGeometry(.3,.43,1.3,12),headGeo=new THREE.SphereGeometry(.2,12,10),armGeo=new THREE.CapsuleGeometry(.07,.55,4,8);
  ownGeometry.push(robeGeo,headGeo,armGeo);
  const robe=new THREE.Mesh(robeGeo,spiritMaterial);robe.position.y=.83;master.add(robe);
  const head=new THREE.Mesh(headGeo,spiritMaterial);head.position.y=1.7;master.add(head);
  for(const side of [-1,1]){const arm=new THREE.Group();arm.name=side<0?'masterLeft':'masterRight';arm.position.set(side*.32,1.3,0);const sleeve=new THREE.Mesh(armGeo,spiritMaterial);sleeve.position.set(0,-.32,0);arm.add(sleeve);master.add(arm);}
  master.visible=false;objects.add(master);

  const [fx,fz]=S.field,fy=dermanliSurfaceHeight(fx,fz);
  // Earth ridges replace the wooden planks; dried stalks remain sparse and passable.
  box(30,.035,21,fx,fy+.025,fz,field);
  const furrow=mat(0x403b2c),straw=mat(0x776c49);
  for(let z=-9;z<=9;z+=1.5)box(29,.045,.32,fx,fy+.065,fz+z,furrow);
  const stalkGeometry=new THREE.ConeGeometry(.035,.65,4);ownGeometry.push(stalkGeometry);
  const stalks=new THREE.InstancedMesh(stalkGeometry,straw,260),stalkPose=new THREE.Object3D();
  for(let i=0;i<260;i++){const col=i%20,row=Math.floor(i/20),x=fx-13.8+col*1.45+Math.sin(i*7)*.18,z=fz-9+row*1.5+Math.cos(i*3)*.16;stalkPose.position.set(x,dermanliSurfaceHeight(x,z)+.38,z);stalkPose.rotation.z=Math.sin(i*5)*.12;stalkPose.updateMatrix();stalks.setMatrixAt(i,stalkPose.matrix);}objects.add(stalks);
  const [cx,cz] = S.cemetery,cy=dermanliSurfaceHeight(cx,cz);
  // Old carved headstones and raised stone plinths, arranged around a clear burial aisle.
  for(const dx of [-7,7])for(const dz of [-5,2,7]){
    const graves=createGraveyardCluster(textures);graves.position.set(cx+dx,cy,cz+dz);objects.add(graves);ownDetails(graves);
    for(const grave of MOSQUE_GRAVES)colliders.push({minX:cx+dx+grave.x-.42,maxX:cx+dx+grave.x+.42,minZ:cz+dz+grave.z-.82,maxZ:cz+dz+grave.z+.82});
  }
  // Low stone perimeter with a south gate, rather than a thin wooden rectangle.
  const cemeteryWall=(w:number,d:number,x:number,z:number)=>{
    const wall=block(objects,craft.masonry,w,1.05,d,x,cy+.48,z,1.8);ownGeometry.push(wall.geometry);
    const coping=block(objects,craft.limestone,w+.05,.11,d+.08,x,cy+1.06,z,1.4);ownGeometry.push(coping.geometry);
    colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  };
  for(const x of [-13.5,13.5])cemeteryWall(.45,23.4,cx+x,cz);
  cemeteryWall(27,.45,cx,cz-11.7);
  for(const x of [-7.75,7.75])cemeteryWall(11.5,.45,cx+x,cz+11.7);
  // Short gateposts mark the opening without obstructing carrying a body.
  for(const x of [-2.18,2.18]){
    box(.48,1.6,.48,cx+x,cy+.8,cz+11.7,craft.masonry);
    box(.58,.12,.58,cx+x,cy+1.66,cz+11.7,craft.limestone);
    colliders.push({minX:cx+x-.24,maxX:cx+x+.24,minZ:cz+11.46,maxZ:cz+11.94});
  }
  // A small ledger stand marks the burial interaction without closing the central aisle.
  box(.55,.75,.55,cx+1.35,cy+.375,cz+7.1,craft.masonry);
  box(.52,.08,.38,cx+1.35,cy+.79,cz+7.1,wood);
  box(.44,.035,.31,cx+1.35,cy+.85,cz+7.1,paper);
  colliders.push({minX:cx+1.075,maxX:cx+1.625,minZ:cz+6.825,maxZ:cz+7.375});
  target('cemetery','Mezarlık · İsimler', [cx,cz+7], 2.6);
  // Five modest fresh-earth markers track completed burials, outside the stone fence.
  const moundGeometry=new THREE.SphereGeometry(1,14,8);ownGeometry.push(moundGeometry);
  const moundMaterial=mat(0x403229);
  const graveMounds=Array.from({length:5},(_,i)=>{
    const mound=new THREE.Mesh(moundGeometry,moundMaterial);const x=cx-16,z=cz-8+i*4;
    mound.position.set(x,dermanliSurfaceHeight(x,z)+.06,z);mound.scale.set(1.25,.3,.7);mound.visible=false;objects.add(mound);return mound;
  });
  for(const x of [-2.4,2.4]) {box(.8,2.8,.8,S.entrance[0]+x,1.4,S.entrance[1],stone);colliders.push({minX:S.entrance[0]+x-.4,maxX:S.entrance[0]+x+.4,minZ:S.entrance[1]-.4,maxZ:S.entrance[1]+.4});}
  target('bridge','Taş köprü',S.bridge,3);
  // Grove with deterministic placement; preserve clearances for every path and building.
  const treeG = new THREE.ConeGeometry(1.55,5,7), trunkG = new THREE.CylinderGeometry(.23,.36,2,7); ownGeometry.push(treeG,trunkG);
  let seed=7; const random=()=>{seed=(seed*16807)%2147483647; return (seed-1)/2147483646;};
  const sites: Point[] = [coffeeSite,S.gasilhane,S.school,S.mill,S.cemetery,S.square,S.gassalHome,S.office,S.well,S.barn,S.field,S.bridge,...S.abandonedHomes];
  const coords: Point[]=[];
  for(let i=0;i<1300 && coords.length<260;i++) {
    const x=(random()-.5)*170,z=(random()-.5)*220;
    if((Math.abs(x-fx)<15.5 && Math.abs(z-fz)<11) || (Math.abs(x-cx)<17 && Math.abs(z-cz)<14) || sites.some(p=>Math.hypot(x-p[0],z-p[1])<9) || DERMANLI_PATHS.some(p=>distanceToPath(x,z,p)<p.width/2+2)) continue;
    coords.push([x,z]);
  }
  const trees=new THREE.InstancedMesh(treeG,foliage,coords.length), trunks=new THREE.InstancedMesh(trunkG,wood,coords.length), dummy=new THREE.Object3D();
  const plane=new THREE.PlaneGeometry(4.68,8.72).translate(0,4.36,0), cross=plane.clone().rotateY(Math.PI/2);
  const pineGeometry=mergeGeometries([plane,cross])!;plane.dispose();cross.dispose();ownGeometry.push(pineGeometry);
  const pineMaterial=new THREE.MeshLambertMaterial({color:0xb2bbae,side:THREE.DoubleSide,alphaTest:.32});ownMaterial.push(pineMaterial);
  const pines=new THREE.InstancedMesh(pineGeometry,pineMaterial,coords.length);pines.visible=false;
  const pineMap=new THREE.TextureLoader().load(surfaceUrl('karacam',true),()=>{pines.visible=true;trees.visible=false;trunks.visible=false;});pineMap.colorSpace=THREE.SRGBColorSpace;pineMaterial.map=pineMap;
  coords.forEach(([x,z],i)=>{const y=dermanliSurfaceHeight(x,z);dummy.position.set(x,y,z);dummy.rotation.y=random()*6.28;dummy.scale.setScalar(.8+random()*.4);dummy.updateMatrix();pines.setMatrixAt(i,dummy.matrix);colliders.push({minX:x-.25,maxX:x+.25,minZ:z-.25,maxZ:z+.25});});objects.add(pines);
  coords.forEach(([x,z],i)=>{ const y=dermanliSurfaceHeight(x,z); dummy.position.set(x,y+3.8,z); dummy.rotation.y=random()*6.28; dummy.scale.setScalar(.75+random()*.6); dummy.updateMatrix(); trees.setMatrixAt(i,dummy.matrix); dummy.position.y=y+1; dummy.scale.setScalar(1); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix); }); objects.add(trees,trunks);
  const figures=createHorrorFigures(); for(const figure of figures){figure.visible=false;objects.add(figure);}
  // The original animated models load on demand; solid figures remain while loading fails.
  const pursuer=watcherFigure(art,'karabasma',createKaraBasma().root);
  const scare=watcherFigure(art,'sis-gozcusu',createSisGozcusu());
  pursuer.root.visible=false;scare.root.visible=false;objects.add(pursuer.root,scare.root);
  art.near('sis-gozcusu',gx,gz,25);
  return {targets,colliders,occluders,stationMeshes,gasil,homes,apparition:scare.root,pursuer,scare,figures,arrivalBody,arrivalUnwrapped,arrivalWrapped,slabBody,wheel,homeLight,fountain,squareTree,emptyHomeWindows,emptyHomeLight,fountainWater,graveMounds,elif,riza,master,residents,updateArt(x:number,z:number){art.approach({x,z});}, loadThreatArt(){return Promise.all([art.request('karabasma'),art.request('sis-gozcusu')]);}, dispose(){ workshop.dispose();detailGeometry.forEach(g=>g.dispose());millMaterials.forEach(m=>m.dispose());oakMap.dispose();hayTexture.dispose();coffeeTexture.dispose();residents.forEach(r=>r.visual.dispose());disposeHorrorFigures(figures); bellTexture.dispose(); boardTexture.dispose(); schoolSignTexture.dispose(); pineMap.dispose(); terrain.dispose(); art.dispose(); craft.dispose(); textures.disposeAll(); ownGeometry.forEach(g=>g.dispose()); ownMaterial.forEach(m=>m.dispose()); scene.remove(objects); }};
}
