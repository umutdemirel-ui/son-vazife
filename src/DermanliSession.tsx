import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createDermanliWorld } from './game/dermanliWorld';
import { DERMANLI_SITES as S, DERMANLI_BOUNDS as B } from './game/dermanliMap';
import { dermanliSurfaceHeight } from './game/dermanliTerrain';
import { dermanliWalkingHeight } from './game/dermanliBridge';
import {applyLookDelta,advanceLook} from './game/dermanliLook';
import {MOSQUE_GRAVES} from './game/cemetery';
import {PINE_SPRITE_HEIGHT,OAK_SPRITE_HEIGHT} from './game/dermanliGrove';
import { pushOutsideBox } from './game/collision';
import {moveDermanliPlayer} from './game/dermanliMovement';
import {wallBetween} from './game/nightPatrol';
import { createWorkHands, armSwing } from './game/handRig';
import { HorrorAudioEngine } from './game/audio';
import { newRitual, interactRitual, leaveUnwatched, ritualObjective, workProblem, NAMES } from './game/dermanliRitual';
import { readDermanliSave, writeDermanliSave } from './game/dermanliSave';
import { DAY_SECONDS, isNight, nextDawn, nextEvent, advanceVillageClock, villageNightVisuals } from './game/dermanliEvents';
import { createCopperEwerAndSoap } from './game/models';
import { DermanliThreat } from './game/dermanliThreat';
import { newBell, bellHint, ringBell } from './game/dermanliBell';
import {spiritAvailable,SPIRIT_LINES,memoryAvailable,RESIDENT_MEMORIES,COFFEE_RESIDENTS,coffeeResidentAvailable,OUTDOOR_RESIDENTS,outdoorResidentAvailable,villagerConversation,VILLAGER_FOLLOWUP_NOTES} from './game/dermanliCharacters';
import {canReadClue,SCHOOL_LOCKED} from './game/dermanliClues';
import {readControls,readMuted,storeMuted} from './game/preferences';
import {DermanliMapPanel} from './components/DermanliMapPanel';
import {DermanliEnding} from './components/DermanliEnding';
import {ENDING_BEATS} from './game/dermanliEndings';
import type {Ending} from './game/dermanliRitual';
import {isScrubbing,newScrub,scrubStroke,SCRUB_STROKES} from './game/dermanliWashing';

const notes: Record<string,string> = {
  home: 'Hacı Süleyman’ın günlüğü: “Kara humma kapıya dayandığında hastaları okula taşıdılar. Yardım geleceğini söylediler; bekledik. Ben her ölüye son vazifeyi borç bildim. İsimlerini unutma.”',
  school: 'Tahtada silik bir yazı var: “Kapı açılınca anneme gideceğim.” Altına Elif adı yazılmış. Kapının üzerindeki çiviler tahtaların dışarıdan çakıldığını gösteriyor.',
  mosque: 'İmamın notu: “Kara humma sebebiyle cenazeleri toplayamadık. İsimler bu listede kalsın; bir gün her biri için dua edilsin.” Listenin sonunda birkaç satır boş bırakılmış.',
  mill: 'Değirmencinin defteri, bozulmuş hasattan ve cevapsız kalan yardım çağrılarından söz ediyor.',
  office: 'Muhtarlık defteri: “Hastalar okulda tutulacak. Yardım gelene kadar kapı açılmayacak.” Sonraki sayfada yardım çağrıları ve Muhtar Rıza’nın titrek el yazısıyla “Gelen olmadı” notu var.',
  well: 'Kuyunun yanında bulunan defterde mezarlık dışına gömülen isimler var. Sayfanın kenarında “Korkudan yaklaşamadık” yazıyor.',
  cemetery: 'Taşların arasındaki liste eksik. Bazı isimlerin yanında ne yıkama ne de kefen kaydı var; mezarlık duvarının dışında da işaretsiz toprak uzanıyor.',
  bridge: 'Köprü sisin içinde kayboluyor. Halil, bu yolu daha önce yürümüş gibi hissediyor.',
  coffee: 'Kahvehanede boş çay bardakları ve duvarda sararmış bir ilan kaldı. Sıralar ve masalar sanki biraz önce bırakılmış gibi.',
  barn: 'Ahır sessiz; çürümüş samanın arasında eski bir hasat kaydı bulunuyor.',
  abandoned0: 'Terk edilmiş evdeki masada boş bir mektup zarfı var.', abandoned1: 'Pencereler içeriden tahtalarla kapatılmış.',
  abandoned2: 'Burası yıllardır boş. Bir tabak masada kalmış.', abandoned3: 'Yerde eski, okunaksız bir takvim var.',
  ...SPIRIT_LINES,
  ...VILLAGER_FOLLOWUP_NOTES,
  ...Object.fromEntries(Object.entries(COFFEE_RESIDENTS).map(([id,n])=>[`coffee_${id}`,n.line])),
  ...Object.fromEntries(Object.entries(OUTDOOR_RESIDENTS).map(([id,n])=>[`villager_${id}`,n.line])),
  ...Object.fromEntries(Object.entries(RESIDENT_MEMORIES).map(([id,m])=>[`memory_${id}`,m.line])),
  gasil: 'Gasilhanenin içi soğuk. Teneşir ve malzemeler yerlerinde; burası son vazifenin merkezi.',
};
interface Hud { prompt:string; caption:string; place:string; count:number; locked:boolean; objective:string; held:string; ending:string; hits:number; clues:string[]; bellHint:string; bellSolved:boolean; x:number; z:number; yaw:number }
const initial: Hud={prompt:'',caption:'Ustanın mektubu seni Dermanlı’ya getirdi. Gassal evini ve gasilhaneyi bul.',place:'Dermanlı Köyü',count:0,locked:false,objective:'Gasilhane önündeki sedyeye git.',held:'',ending:'',hits:0,clues:[],bellHint:'',bellSolved:false,x:S.entrance[0],z:S.entrance[1]+2,yaw:0};

export default function DermanliSession({onExit,resume}:{onExit:()=>void;resume:boolean}) {
  const mount=useRef<HTMLDivElement>(null), [hud,setHud]=useState<Hud>(initial), [failed,setFailed]=useState(false), [notebook,setNotebook]=useState(false), [muted,setMuted]=useState(readMuted), [mapOpen,setMapOpen]=useState(false), [endingStage,setEndingStage]=useState(0);
  const endingStageRef=useRef(0);endingStageRef.current=endingStage;
  const overlayBlocked=useRef(false);overlayBlocked.current=notebook||mapOpen;
  useEffect(()=>{
    const host=mount.current; if(!host)return;
    let renderer: THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); } catch { setFailed(true); return; }
    const controls=readControls();
    const ratio=({minimum:.55,low:.8,medium:1,high:1.5,auto:1} as const)[controls.graphicsQuality];
    renderer.setPixelRatio(Math.min(devicePixelRatio,ratio)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.setClearColor(0x465255); host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x465255); scene.fog=new THREE.FogExp2(0x465255,.018);
    scene.add(new THREE.HemisphereLight(0xb7c8d2,0x535248,1.8)); const sun=new THREE.DirectionalLight(0xd9d3b8,1.6); sun.position.set(25,45,10); scene.add(sun);
    const world=createDermanliWorld(scene);
    const camera=new THREE.PerspectiveCamera(72,host.clientWidth/host.clientHeight,.08,210); camera.rotation.order='YXZ'; scene.add(camera);
    const hands=createWorkHands(); hands.position.set(0,-.29,-.65); camera.add(hands);
    const audio=new HorrorAudioEngine();audio.setMuted(readMuted());
    const handItems = {
      soap:createCopperEwerAndSoap('sabun'), ewer:createCopperEwerAndSoap('ibrik'),
      camphor:createCopperEwerAndSoap('kafur'), shroud:createCopperEwerAndSoap('kefen'),
      bucket:new THREE.Group(),
    };
    const heldBucket=new THREE.Mesh(new THREE.CylinderGeometry(.12,.09,.2,12,1,true),new THREE.MeshStandardMaterial({color:0x685d50,metalness:.5,roughness:.5}));
    handItems.bucket.add(heldBucket);
    for(const item of Object.values(handItems)){item.position.set(.22,-.25,-.58); item.visible=false;camera.add(item);}

    const saved=resume?readDermanliSave():null;
    const ritual=saved?.ritual??newRitual();
    const bell=saved?.bell??newBell(saved?0:undefined);
    let elapsed=saved?.elapsed??0, nextCue=0, hits=saved?.hits??0, nextRandomScare=(saved?.elapsed??0)+75+Math.random()*45; const threat=new DermanliThreat(); const seenEvents=new Set(saved?.events??[]);
    const pos={x:saved?.x??S.entrance[0],z:saved?.z??S.entrance[1]+2}; let yaw=saved?.yaw??0, pitch=saved?.pitch??0, phase=0, last=performance.now(), frame=0, locked=false, previousNight=isNight(elapsed), caption=initial.caption, captionUntil=performance.now()+12000, lastUi=0, lastSave=performance.now(), scareUntil=0, workUntil=0, workProgress=0, workStarted=0, workHeld=false, threatArtRequested=false, crouchToggled=false, windowShadowUntil=0, houseShadowUntil=0, schoolChalkUntil=0; let scrub=newScrub();
    let targetLook={yaw,pitch};
    const setYaw=(value:number)=>{yaw=value;targetLook.yaw=value;};
    const save=()=>writeDermanliSave({version:1,ritual,x:pos.x,z:pos.z,yaw,pitch,elapsed,events:[...seenEvents],hits,bell});
    // Establish the new-session save before the menu can be rendered again.
    save();
    const keys=new Set<string>();
    const onMove=(e:MouseEvent)=>{if(!locked)return;targetLook=applyLookDelta(targetLook,e.movementX,e.movementY,controls.mouseSensitivity,controls.invertY);if(!controls.lookSmoothing)({yaw,pitch}=targetLook);};
    const onLock=()=>{last=performance.now();locked=document.pointerLockElement===renderer.domElement; if(!locked){keys.clear();workHeld=false;workProgress=0;targetLook={yaw,pitch};}};
    const targetAt=(x:number,z:number,angle:number)=>world.targets.map(t=>{const dx=t.x-x,dz=t.z-z,dist=Math.hypot(dx,dz);return {...t,dist,dot:dist<.1?1:(dx*-Math.sin(angle)+dz*-Math.cos(angle))/dist};})
      .filter(t=>t.dist<t.radius && t.dot>.45 && (t.id!=='discard'||ritual.held==='bucket') && (t.id!=='drain'||(ritual.held==='bucket'&&ritual.dirty)) && (t.id!=='forest'||ritual.body!=='burialCarry') && ((t.id!=='elif'&&t.id!=='riza')||spiritAvailable(t.id,ritual.night,isNight(elapsed))) && (!t.id.startsWith('memory_')||memoryAvailable(ritual.night,isNight(elapsed))) && (!t.id.startsWith('coffee_')||coffeeResidentAvailable(isNight(elapsed))) && (!t.id.startsWith('villager_')||outdoorResidentAvailable(isNight(elapsed))))
      .filter(t=>!wallBetween(x,z,t.x,t.z,world.occluders,0))
      .sort((a,b)=>(a.dist+(1-a.dot)*2)-(b.dist+(1-b.dot)*2))[0];
    const target=()=>targetAt(pos.x,pos.z,yaw);
    // Development-only end-to-end helper: move to a collision-free viewpoint but
    // exercise the same aiming, keyboard input and save path as a player.
    if(import.meta.env.DEV){
      const debug = {
        state: () => JSON.parse(JSON.stringify(ritual)),
        clock: () => elapsed,
        renderInfo: () => ({quality:controls.graphicsQuality,pixelRatio:renderer.getPixelRatio(),width:renderer.domElement.width,height:renderer.domElement.height,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z}}),
        look: () => ({yaw,pitch,targetYaw:targetLook.yaw,targetPitch:targetLook.pitch,smoothing:controls.lookSmoothing,locked}),
        endingView: () => ({x:camera.position.x,y:camera.position.y,z:camera.position.z,master:world.master.visible}),
        targetFrom: (x:number,z:number,angle:number) => targetAt(x,z,angle)?.id ?? null,
        gasilhane: () => [...S.gasilhane],
        gassalHome: () => [...S.gassalHome],
        barn: () => [...S.barn],
        bridgeWalk: () => {
          const ray=new THREE.Raycaster(new THREE.Vector3(pos.x,10,pos.z),new THREE.Vector3(0,-1,0));
          world.bridge.updateWorldMatrix(true,true);world.bridgeRamps.updateWorldMatrix(true,true);
          const hit=ray.intersectObjects([world.bridge,world.bridgeRamps],true)[0];
          return {x:pos.x,z:pos.z,foot:camera.position.y-1.68,surface:hit?.point.y??null};
        },
        coffee: () => [...S.coffee],
        millWheel: () => world.wheel.rotation.x,
        abandonedHomes: () => S.abandonedHomes.map(p=>[...p]),
        approachNight: () => {elapsed=DAY_SECONDS/2-2;previousNight=false;},
        worldTools: () => Object.fromEntries(Object.entries(world.stationMeshes).map(([id,mesh])=>[id,mesh.visible])),
        stationSupport: () => {
          world.gasil.group.updateWorldMatrix(true,true);
          return Object.fromEntries(Object.entries(world.stationMeshes).map(([id,item])=>{
            const p=item.getWorldPosition(new THREE.Vector3());
            const base=p.y-(id==='bucket'?.19:0);
            const ray=new THREE.Raycaster(new THREE.Vector3(p.x,base+.02,p.z),new THREE.Vector3(0,-1,0),0,2);
            const hit=ray.intersectObject(world.gasil.group,true)[0];return [id,hit?base-hit.point.y:null];
          }));
        },
        mortuaryWindows: () => {
          const [x,z]=S.gasilhane,y=dermanliSurfaceHeight(x,z);world.gasil.group.updateWorldMatrix(true,true);
          return [-1.7,.63].map(dx=>{
            const ray=new THREE.Raycaster(new THREE.Vector3(x+dx+.13,y+2.31,z+5.2),new THREE.Vector3(0,0,-1),0,1.45);
            return ray.intersectObject(world.gasil.group,true).map(hit=>{const mesh=hit.object as THREE.Mesh,material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;return {distance:hit.distance,transparent:material.transparent,opacity:material.opacity};});
          });
        },
        outdoorCharacterAudit: () => {
          world.terrainGround.updateWorldMatrix(true,true);
          return [...world.outdoorResidents.map(r=>({id:r.id,visual:r.visual,x:r.x,z:r.z})),...world.residents.map(r=>({id:r.id,visual:r.visual,x:r.x,z:r.z}))].map(r=>{
            r.visual.group.updateWorldMatrix(true,true);
            const mesh:THREE.SkinnedMesh[]=[];r.visual.group.traverse(o=>{if(o instanceof THREE.SkinnedMesh)mesh.push(o);});
            const bounds=new THREE.Box3();for(const m of mesh)bounds.union(new THREE.Box3().setFromObject(m,true));
            const fallback=r.visual.group.getObjectByName('standing-fallback');
            const ground=new THREE.Raycaster(new THREE.Vector3(r.x,100,r.z),new THREE.Vector3(0,-1,0)).intersectObject(world.terrainGround,false)[0]?.point.y;
            const resolved={x:r.x,z:r.z};for(const c of world.colliders)pushOutsideBox(resolved,c,.3);
            return {id:r.id,x:r.x,z:r.z,visible:r.visual.group.visible,loaded:mesh.length>0,ground,root:r.visual.group.position.y,base:mesh.length?bounds.min.y:null,fallbackBase:fallback?new THREE.Box3().setFromObject(fallback,true).min.y:null,clearance:Math.hypot(resolved.x-r.x,resolved.z-r.z)};
          });
        },
        millExteriorAudit: () => {
          const {herb,channel,stream}=world.millExterior;
          world.terrainGround.updateWorldMatrix(true,true);stream.updateWorldMatrix(true,true);channel.updateWorldMatrix(true,true);herb.updateWorldMatrix(true,true);world.wheel.updateWorldMatrix(true,true);
          const down=new THREE.Vector3(0,-1,0);
          const hitAt=(object:THREE.Object3D,x:number,z:number)=>new THREE.Raycaster(new THREE.Vector3(x,10,z),down).intersectObject(object,false)[0]?.point.y;
          const stems=herb.children.filter(o=>o instanceof THREE.Mesh && o.geometry instanceof THREE.ConeGeometry).map(o=>{
            const p=o.getWorldPosition(new THREE.Vector3()),base=new THREE.Box3().setFromObject(o).min.y;
            return {ground:hitAt(world.terrainGround,p.x,p.z),base};
          });
          const [mx,mz]=S.mill;
          const samples=[3.9,6,8,10,12].map(dx=>({channel:hitAt(channel,mx+dx,mz+2.2),ground:hitAt(world.terrainGround,mx+dx,mz+2.2),stream:hitAt(stream,mx+dx,mz+2.2)}));
          const wheel=new THREE.Box3().setFromObject(world.wheel),water=new THREE.Box3().setFromObject(channel);
          return {stems,samples,wheelTouchesWater:wheel.intersectsBox(water),wheelRotation:world.wheel.rotation.x};
        },
        entranceBellAudit: () => {
          const {bellRack,entranceColumns,wayPost}=world;
          world.terrainGround.updateWorldMatrix(true,true);
          const groundAt=(x:number,z:number)=>new THREE.Raycaster(new THREE.Vector3(x,100,z),new THREE.Vector3(0,-1,0)).intersectObject(world.terrainGround,false)[0]?.point.y;
          const bounds=(o:THREE.Object3D)=>new THREE.Box3().setFromObject(o);
          const supports=[...entranceColumns,wayPost,...bellRack.posts].map(o=>{
            const p=o.getWorldPosition(new THREE.Vector3());return {ground:groundAt(p.x,p.z),base:bounds(o).min.y,
              collider:world.colliders.some(c=>!c.frame&&p.x>c.minX&&p.x<c.maxX&&p.z>c.minZ&&p.z<c.maxZ)};
          });
          const rail=bounds(bellRack.rail);
          const hangers=bellRack.hangers.map((o,i)=>{
            const h=bounds(o),b=bounds(bellRack.bells[i]);
            const target=world.targets.find(t=>t.id===`bell_${i}`)!;
            const approach={x:target.x,z:target.z+.8},after={...approach};for(const c of world.colliders)pushOutsideBox(after,c,.32);
            return {bottomGap:h.min.y-b.max.y,railGap:rail.min.y-h.max.y,connected:rail.intersectsBox(h),approachShift:Math.hypot(after.x-approach.x,after.z-approach.z),radius:target.radius};
          });
          const [x,z]=S.entrance;const gateSamples=Array.from({length:7},(_,i)=>{
            const start={x,z:z-5.5+i*.5},after={...start};for(const c of world.colliders)pushOutsideBox(after,c,.32);return Math.hypot(after.x-start.x,after.z-start.z);
          });
          return {supports,hangers,gateSamples};
        },
        squareWellAudit: () => {
          const {squareTree,treeFallback,squareBenches,well,fountain,fountainWater}=world;
          const image=(squareTree.material instanceof THREE.MeshLambertMaterial?squareTree.material.map?.image:undefined) as HTMLImageElement|undefined;
          if(!squareTree.visible||!image)return null;
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
          const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.drawImage(image,0,0);
          const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let last=-1;
          for(let y=canvas.height-1;y>=0&&last<0;y--)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>89){last=y;break;}
          world.terrainGround.updateWorldMatrix(true,true);
          const groundAt=(x:number,z:number)=>new THREE.Raycaster(new THREE.Vector3(x,100,z),new THREE.Vector3(0,-1,0)).intersectObject(world.terrainGround,false)[0]?.point.y;
          const hasCollider=(x:number,z:number)=>world.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
          const positions=[...squareBenches,well,fountain].map(o=>{
            const p=o.getWorldPosition(new THREE.Vector3()),ground=groundAt(p.x,p.z);
            return {x:p.x,z:p.z,ground,base:new THREE.Box3().setFromObject(o).min.y,collider:hasCollider(p.x,p.z)};
          });
          const p=squareTree.getWorldPosition(new THREE.Vector3()),ground=groundAt(p.x,p.z);
          const visibleBase=p.y+OAK_SPRITE_HEIGHT*(canvas.height-1-last+.5)/canvas.height;
          return {positions,treeGround:ground,treeGap:ground===undefined?null:visibleBase-ground,treeCollider:hasCollider(p.x,p.z),fallbackBase:new THREE.Box3().setFromObject(treeFallback).min.y,waterRelative:fountainWater.position.y-fountain.position.y};
        },
        fieldAudit: () => {
          const {base,rows,stalks}=world.field,matrix=new THREE.Matrix4(),vertex=new THREE.Vector3(),positions=stalks.geometry.getAttribute('position');
          base.updateWorldMatrix(true,true);rows.forEach(row=>row.updateWorldMatrix(true,true));stalks.updateWorldMatrix(true,false);
          let minGap=Infinity,maxGap=-Infinity,missing=0;
          for(let i=0;i<stalks.count;i++){
            stalks.getMatrixAt(i,matrix);matrix.premultiply(stalks.matrixWorld);
            let lowest=Infinity;for(let j=0;j<positions.count;j++){vertex.fromBufferAttribute(positions,j).applyMatrix4(matrix);lowest=Math.min(lowest,vertex.y);}
            const center=new THREE.Vector3().setFromMatrixPosition(matrix);
            const ray=new THREE.Raycaster(new THREE.Vector3(center.x,center.y+1,center.z),new THREE.Vector3(0,-1,0),0,3);
            const hit=ray.intersectObjects(rows,false)[0];if(!hit){missing++;continue;}
            const gap=lowest-hit.point.y;minGap=Math.min(minGap,gap);maxGap=Math.max(maxGap,gap);
          }
          const rowGaps=rows.map(row=>{
            const pos=row.getWorldPosition(new THREE.Vector3()),bounds=new THREE.Box3().setFromObject(row);
            const ray=new THREE.Raycaster(new THREE.Vector3(pos.x,bounds.min.y+.01,pos.z),new THREE.Vector3(0,-1,0),0,1);
            const hit=ray.intersectObject(base,false)[0];return hit?bounds.min.y-hit.point.y:null;
          });
          return {count:stalks.count,rowCount:rows.length,minGap,maxGap,missing,rowGaps};
        },
        groveCemeteryAudit: () => {
          const {pines,trunks,coords}=world.grove;
          const image=(pines.material instanceof THREE.MeshLambertMaterial?pines.material.map?.image:undefined) as HTMLImageElement|undefined;
          if(!pines.visible||!image)return null;
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
          const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.drawImage(image,0,0);
          const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let last=-1;
          for(let y=canvas.height-1;y>=0&&last<0;y--)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>82){last=y;break;}
          const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();
          const ray=new THREE.Raycaster();world.terrainGround.updateWorldMatrix(true,true);
          let maxGap=-Infinity,minGap=Infinity,maxFallbackError=0,missingColliders=0,missedGround=0;
          const samples:Array<{x:number;z:number;y:number;gap:number}>=[];
          coords.forEach(([x,z],i)=>{
            ray.set(new THREE.Vector3(x,100,z),new THREE.Vector3(0,-1,0));const ground=ray.intersectObject(world.terrainGround,false)[0];
            if(!ground){missedGround++;return;}
            pines.getMatrixAt(i,matrix);matrix.decompose(position,quaternion,scale);
            const visibleBase=position.y+PINE_SPRITE_HEIGHT*scale.y*(canvas.height-1-last)/canvas.height;
            const gap=visibleBase-ground.point.y;maxGap=Math.max(maxGap,gap);minGap=Math.min(minGap,gap);
            if(ground.point.y>1&&samples.length<4)samples.push({x,z,y:ground.point.y,gap});
            trunks.getMatrixAt(i,matrix);matrix.decompose(position,quaternion,scale);maxFallbackError=Math.max(maxFallbackError,Math.abs(position.y-1-ground.point.y));
            if(!world.colliders.some(c=>Math.abs(c.minX-(x-.25))<1e-7&&Math.abs(c.maxX-(x+.25))<1e-7&&Math.abs(c.minZ-(z-.25))<1e-7&&Math.abs(c.maxZ-(z+.25))<1e-7))missingColliders++;
          });
          const clusters=world.cemeteryClusters.map(g=>{const p=g.getWorldPosition(new THREE.Vector3()),bounds=new THREE.Box3().setFromObject(g);return {x:p.x,z:p.z,base:bounds.min.y,ground:dermanliSurfaceHeight(p.x,p.z)};});
          let missingGraves=0,maxGraveGroundDelta=0;
          for(const group of world.cemeteryClusters){const p=group.getWorldPosition(new THREE.Vector3());for(const grave of MOSQUE_GRAVES){
            const x=p.x+grave.x,z=p.z+grave.z;maxGraveGroundDelta=Math.max(maxGraveGroundDelta,Math.abs(dermanliSurfaceHeight(x,z)-p.y));
            if(!world.colliders.some(c=>Math.abs(c.minX-(x-.42))<1e-7&&Math.abs(c.maxX-(x+.42))<1e-7&&Math.abs(c.minZ-(z-.82))<1e-7&&Math.abs(c.maxZ-(z+.82))<1e-7))missingGraves++;
          }}
          const gate={x:S.cemetery[0],z:S.cemetery[1]+11.7},resolved={...gate};for(const wall of world.colliders)pushOutsideBox(resolved,wall,.32);
          const gateShift=Math.hypot(resolved.x-gate.x,resolved.z-gate.z);
          const mounds=world.graveMounds.map(m=>({x:m.position.x,z:m.position.z,center:m.position.y,ground:dermanliSurfaceHeight(m.position.x,m.position.z)}));
          return {count:coords.length,lastOpaqueRow:last,imageHeight:canvas.height,maxGap,minGap,maxFallbackError,missingColliders,missedGround,samples,clusters,mounds,missingGraves,maxGraveGroundDelta,gateShift};
        },
        squareArt: () => ({fountain:!!world.fountain.getObjectByName('hayrat'),tree:world.squareTree.visible}),
        visualState: () => ({mounds:world.graveMounds.filter(m=>m.visible).length,litWindows:world.emptyHomeWindows.filter(w=>w.visible).length,fountain:world.fountainWater.visible}),
        coffeeResidents: () => world.coffeeResidents.map(r=>({id:r.id,visible:r.visual.group.visible,seated:r.seated,loaded:!!r.visual.group.getObjectByName('HandL'),dressed:!!r.visual.group.getObjectByName(`outfit-${COFFEE_RESIDENTS[r.id].outfit}`)})),
        coffeeSupport: () => {
          world.coffeehouse.updateWorldMatrix(true,true);
          return world.coffeeSupports.map(item=>{
            const bounds=new THREE.Box3().setFromObject(item),center=bounds.getCenter(new THREE.Vector3());
            const ray=new THREE.Raycaster(new THREE.Vector3(center.x,bounds.min.y+.02,center.z),new THREE.Vector3(0,-1,0),0,1);
            const hit=ray.intersectObject(world.coffeehouse,true)[0];return hit?bounds.min.y-hit.point.y:null;
          });
        },
        homeSupport: () => world.homeSupports.map(({item,home})=>{
          const bounds=new THREE.Box3().setFromObject(item),center=bounds.getCenter(new THREE.Vector3());
          world.homes[home].root.updateWorldMatrix(true,true);
          const ray=new THREE.Raycaster(new THREE.Vector3(center.x,bounds.min.y+.01,center.z),new THREE.Vector3(0,-1,0),0,.5);
          const hit=ray.intersectObject(world.homes[home].root,true)[0];return hit?bounds.min.y-hit.point.y:null;
        }),
        extraSupport: () => {
          const check=(item:THREE.Object3D,support:THREE.Object3D)=>{
            const bounds=new THREE.Box3().setFromObject(item),center=bounds.getCenter(new THREE.Vector3());
            support.updateWorldMatrix(true,true);
            const ray=new THREE.Raycaster(new THREE.Vector3(center.x,bounds.min.y+.01,center.z),new THREE.Vector3(0,-1,0),0,.5);
            const hit=ray.intersectObject(support,true)[0];return hit?bounds.min.y-hit.point.y:null;
          };
          return {barn:world.barnSupports.map(item=>check(item,world.barnFloorMesh)),clues:world.clueSupports.map(({item,support})=>check(item,support))};
        },
        outdoorResidents: () => world.outdoorResidents.map(r=>{const p={x:r.x,z:r.z};for(const wall of world.colliders)pushOutsideBox(p,wall,.3);return {id:r.id,visible:r.visual.group.visible,loaded:!!r.visual.group.getObjectByName('HandL'),dressed:!!r.visual.group.getObjectByName(`outfit-${OUTDOOR_RESIDENTS[r.id].outfit}`),x:r.x,z:r.z,clearance:Math.hypot(p.x-r.x,p.z-r.z)};}),
        schoolChalk: () => ({visible:world.schoolChalk.visible,seen:seenEvents.has(`${ritual.night}:school`),progress:world.schoolChalkTrace.scale.x}),
        houseShadow: () => ({visible:world.figures[0].visible,seen:seenEvents.has(`${ritual.night}:house`),remaining:Math.max(0,houseShadowUntil-performance.now())}),
        spirits: () => ({elif:world.elif.visible,riza:world.riza.visible}),
        residentModels: () => world.residents.map(r=>({id:r.id,loaded:!!r.visual.group.getObjectByName('HandL')})),
        verifyThreatArt: async () => {await world.loadThreatArt();return {pursuer:!!world.pursuer.root.getObjectByName('Dokulu model'),scare:!!world.scare.root.getObjectByName('Dokulu model')};},
        primeThreat: () => {threat.x=pos.x+7;threat.z=pos.z;threat.active=true;},
        threatState: () => {
          const root=world.pursuer.root,visual=root.getObjectByName('Dokulu model'),vertex=new THREE.Vector3();let bottom=Infinity;
          root.updateWorldMatrix(true,true);
          for(const name of ['bootL','bootR']){const mesh=visual?.getObjectByName(name);if(mesh instanceof THREE.Mesh){const positions=mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){vertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);bottom=Math.min(bottom,vertex.y);}}}
          return {active:threat.active,visible:root.visible,loaded:!!visual,x:threat.x,z:threat.z,gap:Number.isFinite(bottom)?bottom-dermanliWalkingHeight(root.position.x,root.position.z):null};
        },
        advanceToNight: () => {if(!isNight(elapsed))elapsed=Math.floor(elapsed/DAY_SECONDS)*DAY_SECONDS+DAY_SECONDS/2;},
        scanReachability: () => {
          const {minX,maxX,minZ,maxZ}=B,w=maxX-minX+1,h=maxZ-minZ+1;
          const passable=new Uint8Array(w*h),visited=new Uint8Array(w*h),queue=new Int32Array(w*h);
          for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++){
            const p={x,z};for(const wall of world.colliders)pushOutsideBox(p,wall,.32);
            if(Math.hypot(p.x-x,p.z-z)<.001)passable[(z-minZ)*w+x-minX]=1;
          }
          const startZ=Math.round(S.entrance[1]+2),start=(startZ-minZ)*w-minX;
          let head=0,tail=0;queue[tail++]=start;visited[start]=1;
          while(head<tail){const at=queue[head++],x=at%w,z=Math.floor(at/w);
            for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=w||nz<0||nz>=h)continue;const n=nz*w+nx;if(passable[n]&&!visited[n]){visited[n]=1;queue[tail++]=n;}}
          }
          return world.targets.filter(t=>!(()=>{
            for(let dz=-Math.ceil(t.radius);dz<=Math.ceil(t.radius);dz++)for(let dx=-Math.ceil(t.radius);dx<=Math.ceil(t.radius);dx++){
              const x=Math.round(t.x)+dx,z=Math.round(t.z)+dz;if(x<minX||x>maxX||z<minZ||z>maxZ)continue;
              if(visited[(z-minZ)*w+x-minX]&&Math.hypot(x-t.x,z-t.z)<t.radius)return true;
            }return false;
          })()).map(t=>t.id);
        },
        walkToTarget: (id:string) => {
          const t=world.targets.find(item=>item.id===id);if(!t)return `unknown target ${id}`;
          const {minX,maxX,minZ,maxZ}=B,w=maxX-minX+1,h=maxZ-minZ+1,size=w*h;
          const index=(x:number,z:number)=>(z-minZ)*w+x-minX;
          const open=(x:number,z:number)=>{if(x<minX||x>=minX+w||z<minZ||z>=minZ+h)return false;const p={x,z};for(const c of world.colliders)pushOutsideBox(p,c,.32);return Math.hypot(p.x-x,p.z-z)<.005;};
          const clear=(x:number,z:number,tx:number,tz:number)=>{const p={x,z},dx=tx-x,dz=tz-z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.2));for(let i=0;i<n;i++)moveDermanliPlayer(p,dx/n,dz/n,world.colliders);return Math.hypot(p.x-tx,p.z-tz)<.02;};
          const startCandidates=[] as Array<{x:number;z:number;d:number}>;
          for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=Math.round(pos.x)+dx,z=Math.round(pos.z)+dz,d=Math.hypot(pos.x-x,pos.z-z);if(d<=2 && open(x,z) && clear(pos.x,pos.z,x,z))startCandidates.push({x,z,d});}
          startCandidates.sort((a,b)=>a.d-b.d);const start=startCandidates[0];if(!start)return `blocked start ${pos.x},${pos.z}`;
          const seen=new Uint8Array(size),queue=new Int32Array(size),parent=new Int32Array(size);parent.fill(-1);
          const first=index(start.x,start.z);seen[first]=1;let head=0,tail=0,end=-1;queue[tail++]=first;
          while(head<tail){const at=queue[head++],x=at%w+minX,z=Math.floor(at/w)+minZ;
            const d=Math.hypot(t.x-x,t.z-z);
            if(d<t.radius){const a=Math.atan2(x-t.x,z-t.z);if(targetAt(x,z,a)?.id===id){end=at;break;}}
            for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<minX||nx>=minX+w||nz<minZ||nz>=minZ+h)continue;const n=index(nx,nz);if(seen[n])continue;seen[n]=1;if(open(nx,nz)&&clear(x,z,nx,nz)){parent[n]=at;queue[tail++]=n;}}
          }
          if(end<0)return `unreachable ${id}`;
          const route=[] as number[];for(let at=end;at!==first;at=parent[at])route.push(at);route.reverse();
          const drive=(x:number,z:number)=>{const dx=x-pos.x,dz=z-pos.z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.2));for(let i=0;i<n;i++)moveDermanliPlayer(pos,dx/n,dz/n,world.colliders);};
          drive(start.x,start.z);for(const at of route)drive(at%w+minX,Math.floor(at/w)+minZ);
          setYaw(Math.atan2(pos.x-t.x,pos.z-t.z));return target()?.id===id?'ok':`aim failure ${id}`;
        },
        goToTarget: (id:string) => {
          const t=world.targets.find(item=>item.id===id); if(!t) return false;
          const previous={...pos,yaw};
          for(const distance of [.55,.85,1.1,1.35,1.65,2.1]) for(let i=0;i<32;i++) {
            if(distance>=t.radius) continue;
            const a=i*Math.PI/16; const candidate={x:t.x+Math.cos(a)*distance,z:t.z+Math.sin(a)*distance};
            const resolved={...candidate}; for(const c of world.colliders)pushOutsideBox(resolved,c,.32);
            if(Math.hypot(resolved.x-candidate.x,resolved.z-candidate.z)>.01)continue;
            pos.x=candidate.x;pos.z=candidate.z;setYaw(Math.atan2(pos.x-t.x,pos.z-t.z));
            if(target()?.id===id)return true;
          }
          pos.x=previous.x;pos.z=previous.z;setYaw(previous.yaw);return false;
        },
      };
      (window as unknown as {__dermanliTest?:typeof debug}).__dermanliTest=debug;
    }
    const finishWork=()=>{workHeld=false;workProgress=0;scrub=newScrub();caption=interactRitual(ritual,'slab',isNight(elapsed),true);captionUntil=performance.now()+4500;if(ritual.stage===4&&ritual.dirty)audio.playWaterPour();else audio.playPaperFlip();save();};
    const onKey=(e:KeyboardEvent)=>{
      if(['KeyW','KeyA','KeyS','KeyD','Space','ControlLeft','ControlRight','KeyC'].includes(e.code)) e.preventDefault();
      if(workHeld&&(e.code==='KeyA'||e.code==='KeyD')){
        if(!e.repeat&&locked&&!overlayBlocked.current&&target()?.id==='slab'&&isScrubbing(ritual.stage)){
          scrub=scrubStroke(scrub,e.code==='KeyA'?'left':'right');workProgress=scrub.strokes/SCRUB_STROKES*1.2;workUntil=performance.now()+450;
          if(scrub.strokes===SCRUB_STROKES)finishWork();
        }
        return;
      }
      keys.add(e.code);
      if(e.code==='KeyN'&&!e.repeat){setMapOpen(false);setNotebook(v=>!v);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}
      if(e.code==='KeyH'&&!e.repeat){setNotebook(false);setMapOpen(v=>!v);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}
      if(e.code==='KeyM'&&!e.repeat){audio.setMuted(!audio.isMuted());setMuted(audio.isMuted());storeMuted(audio.isMuted());}
      if(e.code==='KeyC'&&!e.repeat&&locked&&controls.crouchToggle)crouchToggled=!crouchToggled;
      if(e.code==='KeyF'&&!e.repeat&&locked&&!overlayBlocked.current&&target()?.id==='slab'&&ritual.body==='slab'&&ritual.stage<6){
        const problem=workProblem(ritual);
        if(problem){caption=problem;captionUntil=performance.now()+4500;}
        else if(!['KeyW','KeyA','KeyS','KeyD'].some(k=>keys.has(k))){workHeld=true;workProgress=0;scrub=newScrub();workStarted=performance.now();}
      }
      if(e.code==='KeyE' && !e.repeat && locked && !overlayBlocked.current){const t=target();if(t){
        const stageBefore=ritual.stage, soapedBefore=ritual.soaped, nightBefore=ritual.night;
        let action=interactRitual(ritual,t.id,isNight(elapsed));
        if(ritual.night>nightBefore){elapsed=nextDawn(elapsed);previousNight=false;}
        if(t.id==='slab'&&(stageBefore!==ritual.stage||soapedBefore!==ritual.soaped))workUntil=performance.now()+1500;
        if(t.id.startsWith('bell_')){
          const result=ringBell(bell,Number(t.id.slice(5)));audio.playSchoolBell(false);
          action=result==='pending'?'Ses avluda yankılandı.':result==='solved'?'Son sesle okuldaki dolaptan bir kilit sesi geldi.':result==='wrong'?'Çanların sesi sustu; sıra yeniden başladı.':'Çanların yankısı çoktan sustu.';
        }
        if(t.id==='home')action=`${notes.home} Okul avlusuyla ilgili bir satır: ${bellHint(bell.seed)}`;
        if(t.id==='school'&&!canReadClue(t.id,bell.solved))action=SCHOOL_LOCKED;
        const conversation=villagerConversation(t.id,ritual.night);
        const clueId=conversation?.key??t.id;
        if(notes[clueId] && canReadClue(t.id,bell.solved) && !ritual.clues.includes(clueId)) ritual.clues.push(clueId);
        caption=action || notes[clueId] || ''; captionUntil=performance.now()+9000;
        if(t.id.startsWith('bell_')){}else if(t.id==='candle')audio.playCandleToggle(ritual.candle);else if(t.id==='slab'&&ritual.stage===4)audio.playWaterPour();else audio.playPaperFlip();
        save(); if(ritual.ending && document.pointerLockElement===renderer.domElement)document.exitPointerLock();
      }}
    };
    const onUp=(e:KeyboardEvent)=>{keys.delete(e.code);if(e.code==='KeyF'){workHeld=false;workProgress=0;}};
    const onClick=()=>{audio.init(); if(!ritual.ending && !overlayBlocked.current && document.pointerLockElement!==renderer.domElement) void renderer.domElement.requestPointerLock();};
    const onVisibility=()=>{last=performance.now();audio.setMuted(document.hidden||readMuted());if(document.hidden){keys.clear();workHeld=false;workProgress=0;if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}};
    const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};
    document.addEventListener('mousemove',onMove); document.addEventListener('pointerlockchange',onLock); document.addEventListener('visibilitychange',onVisibility); window.addEventListener('keydown',onKey); window.addEventListener('keyup',onUp); window.addEventListener('resize',resize); renderer.domElement.addEventListener('click',onClick);
    function animate(now:number){
      const frameSeconds=Math.max(0,(now-last)/1000),dt=Math.min(.05,frameSeconds);last=now;
      elapsed=advanceVillageClock(elapsed,frameSeconds,locked&&!document.hidden&&!overlayBlocked.current&&!ritual.ending);
      const night=isNight(elapsed);
      if(workHeld){
        if(!locked||overlayBlocked.current||target()?.id!=='slab'||ritual.body!=='slab'||ritual.stage>=6||keys.has('KeyW')||keys.has('KeyA')||keys.has('KeyS')||keys.has('KeyD')){workHeld=false;workProgress=0;}
        else if(!isScrubbing(ritual.stage)){workProgress=(now-workStarted)/1000;workUntil=now+100;
          if(workProgress>=1.2)finishWork();
        }
      }

      if(locked && night!==previousNight && !ritual.ending){caption=night?(ritual.body==='arrival'?`${ritual.night}. gece çöktü. Gasilhanedeki sedyeyi kontrol et.`:`${ritual.night}. gece çöktü. Yarım kalan vazifene devam et.`):'Gün doğuyor; köyü keşfetmek için zamanın var.';captionUntil=now+7000;previousNight=night;}
      sun.intensity=night?.46:1.6;
      (scene.background as THREE.Color).set(night?0x1c2930:0x465255);
      if(scene.fog instanceof THREE.FogExp2){scene.fog.color.copy(scene.background as THREE.Color);scene.fog.density=night?.023+ritual.night*.001:.018;}
      if(locked&&night&&!ritual.ending&&now>nextCue){const event=nextEvent(ritual.night,pos.x,pos.z,yaw,seenEvents);if(event){if(event.id==='gasil'&&ritual.night>=2)windowShadowUntil=now+4500;if(event.id==='house')houseShadowUntil=now+4500;if(event.id==='school')schoolChalkUntil=now+4500;seenEvents.add(`${ritual.night}:${event.id}`);caption=event.text;captionUntil=now+6500;nextCue=now+30000;if(event.sound==='water')audio.playWaterPour();else if(event.sound==='whisper')audio.playWhisper();else if(event.sound==='knock')audio.playWindowKnock();else audio.playFloorboardCreak();save();}}
      if(locked)({yaw,pitch}=advanceLook({yaw,pitch},targetLook,dt,controls.lookSmoothing));
      let forward=0,side=0; if(locked&&!overlayBlocked.current){forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));side=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));}
      const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight'), crouch=keys.has('ControlLeft')||keys.has('ControlRight')||(controls.crouchToggle?crouchToggled:keys.has('KeyC'));
      const len=Math.hypot(forward,side), speed=(crouch?1.55:sprint?5.1:2.8); if(len){forward/=len;side/=len;moveDermanliPlayer(pos,(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt,world.colliders);phase+=dt*(sprint?12:8);}
      camera.position.set(pos.x,dermanliWalkingHeight(pos.x,pos.z)+(crouch?1.1:1.68),pos.z);camera.rotation.set(pitch,yaw,0);
      if(locked && Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])>8 && leaveUnwatched(ritual)){caption='Sabır mumu yanmadan uzaklaştın. Arkanda bir hareket duyuluyor.';captionUntil=now+7000;audio.playViolationSting();scareUntil=now+1100;save();}
      const safe=Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<7 || Math.hypot(pos.x-S.gassalHome[0],pos.z-S.gassalHome[1])<5;
      const result=locked?threat.tick(dt,night&&ritual.night>=2&&!ritual.ending,safe,{...pos,yaw},world.colliders):'none';
      const pursuer=world.pursuer.root;pursuer.visible=threat.active;
      if(!threatArtRequested&&(night||threat.active||now<scareUntil)){threatArtRequested=true;void world.loadThreatArt();}
      if(threat.active)world.pursuer.pose(elapsed,true);if(now<scareUntil)world.scare.pose(elapsed,false);
      if(threat.active){pursuer.position.set(threat.x,dermanliWalkingHeight(threat.x,threat.z),threat.z);pursuer.rotation.y=Math.atan2(pos.x-threat.x,pos.z-threat.z);}
      if(result==='hit'){hits=Math.min(3,hits+1);scareUntil=now+1200;audio.playViolationSting();caption='Bir gölge sana çarptı. Uzaklaş!';captionUntil=now+5000;if(hits===3){ritual.ending='dark';caption='Halil gücünü kaybetti; köyün sessizliği onu içine aldı.';if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}save();}
      if(locked&&night&&!safe&&!ritual.ending&&elapsed>=nextRandomScare){scareUntil=now+850;audio.playWhisper(.7);nextRandomScare=elapsed+75+Math.random()*60;}
      for(const [id,item] of Object.entries(world.stationMeshes))item.visible=ritual.held!==id;
      world.gasil.vigilFlame.visible=ritual.candle;world.gasil.vigilLight.intensity=ritual.candle?1.8:0;
      world.updateArt(pos.x,pos.z);
      world.wheel.rotation.x=(elapsed*.5)%(Math.PI*2);
      for(const r of world.residents){r.visual.group.visible=memoryAvailable(ritual.night,night)&&!ritual.ending;if(r.visual.group.visible){r.visual.group.rotation.y=Math.atan2(pos.x-r.x,pos.z-r.z);r.visual.update(dt,false,Math.hypot(pos.x-r.x,pos.z-r.z),elapsed);}}
      for(const r of world.coffeeResidents){r.visual.group.visible=coffeeResidentAvailable(night)&&!ritual.ending;if(r.visual.group.visible){if(!r.seated)r.visual.group.rotation.y=Math.atan2(pos.x-r.x,pos.z-r.z);r.visual.update(dt,false,Math.hypot(pos.x-r.x,pos.z-r.z),elapsed);}}
      for(const r of world.outdoorResidents){r.visual.group.visible=outdoorResidentAvailable(night)&&!ritual.ending;if(r.visual.group.visible){r.visual.group.rotation.y=Math.atan2(pos.x-r.x,pos.z-r.z);r.visual.update(dt,false,Math.hypot(pos.x-r.x,pos.z-r.z),elapsed);}}
      world.elif.visible=!ritual.ending&&spiritAvailable('elif',ritual.night,night);world.riza.visible=!ritual.ending&&spiritAvailable('riza',ritual.night,night);
      for(const spirit of [world.elif,world.riza])if(spirit.visible){spirit.position.y=dermanliSurfaceHeight(spirit.position.x,spirit.position.z);spirit.rotation.y=Math.atan2(pos.x-spirit.position.x,pos.z-spirit.position.z);}
      world.homeLight.intensity=night ? 4.5+Math.sin(elapsed*11)*.12 : 1.5;
      const visuals=villageNightVisuals(ritual.night,night,ritual.body==='done');
      world.graveMounds.forEach((m,i)=>{m.visible=i<visuals.completed;});
      world.emptyHomeWindows.forEach((w,i)=>{w.visible=i===visuals.litHome;});
      if(visuals.litHome>=0){const [x,z]=S.abandonedHomes[visuals.litHome];world.emptyHomeLight.position.set(x+2.125,dermanliSurfaceHeight(x,z)+1.7,z+2.9);world.emptyHomeLight.intensity=2.5+Math.sin(elapsed*5)*.2;}else world.emptyHomeLight.intensity=0;
      world.fountainWater.visible=visuals.fountainFlowing;
      world.gasil.windowShadowFigure.visible=night&&now<windowShadowUntil&&!ritual.ending;
      world.figures[0].visible=night&&now<houseShadowUntil&&!ritual.ending;
      world.schoolChalk.visible=night&&now<schoolChalkUntil&&!ritual.ending;
      if(world.schoolChalk.visible){
        const progress=Math.min(1,Math.max(.001,(4500-(schoolChalkUntil-now))/3000));
        world.schoolChalkTrace.scale.x=progress;world.schoolChalkTrace.position.x=-1+progress;
        world.schoolChalkPiece.position.x=-1+2*progress;
      }
      world.slabBody.visible=ritual.body==='slab'&&ritual.stage<6;world.slabBody.rotation.z=ritual.risen?-Math.PI/2:0;
      world.apparition.visible=now<scareUntil; if(world.apparition.visible){const sx=pos.x-Math.sin(yaw)*1.8,sz=pos.z-Math.cos(yaw)*1.8;world.apparition.position.set(sx,dermanliWalkingHeight(sx,sz),sz);world.apparition.rotation.y=yaw;}
      world.gasil.pestemalMesh.visible=ritual.body==='slab'&&ritual.stage<6;world.gasil.kefenWrapGroup.visible=ritual.body==='slab'&&ritual.stage===6;
      world.gasil.basinWaterMesh.visible=ritual.dirty;
      world.arrivalBody.visible=ritual.body==='arrival'&&night;
      world.arrivalUnwrapped.visible=ritual.body!=='burialCarry';world.arrivalWrapped.visible=ritual.body==='burialCarry';
      world.arrivalBody.scale.setScalar(ritual.night===4?.72:1);
      if(ritual.body==='carrying'||ritual.body==='burialCarry') {world.arrivalBody.visible=true;world.arrivalBody.position.set(pos.x-Math.sin(yaw)*.75,camera.position.y-.55,pos.z-Math.cos(yaw)*.75);world.arrivalBody.rotation.set(0,yaw,0);}
      else {world.arrivalBody.position.set(S.gasilhane[0]+5.5,dermanliSurfaceHeight(...S.gasilhane)+.84,S.gasilhane[1]+1.6);world.arrivalBody.rotation.set(0,0,0);}
      if(locked&&now-lastSave>15000){lastSave=now;save();}
      // Ending tableau is rendered in the same world, not just described by a menu.
      world.master.visible=ritual.ending==='peace' && ENDING_BEATS.peace[endingStageRef.current]?.scene==='mortuary';
      if(ritual.ending==='peace'){
        world.slabBody.visible=true;world.slabBody.rotation.z=0;world.gasil.pestemalMesh.visible=true;world.gasil.kefenWrapGroup.visible=false;
        if(ENDING_BEATS.peace[endingStageRef.current]?.scene==='bridge'){
          camera.position.set(S.bridge[0]-8,dermanliSurfaceHeight(S.bridge[0]-8,S.bridge[1])+1.8,S.bridge[1]);camera.lookAt(S.bridge[0]+7,1.3,S.bridge[1]);
        } else {camera.position.set(S.gasilhane[0]+2.55,1.65,S.gasilhane[1]+1.15);camera.lookAt(S.gasilhane[0]-.45,1.1,S.gasilhane[1]);}
        const left=world.master.getObjectByName('masterLeft'),right=world.master.getObjectByName('masterRight');
        if(left)left.rotation.x=-.8+Math.sin(now*.003)*.14;if(right)right.rotation.x=-.8-Math.sin(now*.003)*.14;
        sun.intensity=1.5;(scene.background as THREE.Color).set(0x9c9685);if(scene.fog instanceof THREE.FogExp2){scene.fog.color.copy(scene.background as THREE.Color);scene.fog.density=.009;}
      }else if(ritual.ending==='dark'){
        world.figures[1].visible=true;world.figures[1].position.set(pos.x-Math.sin(yaw)*2,dermanliSurfaceHeight(pos.x,pos.z),pos.z-Math.cos(yaw)*2);world.figures[1].rotation.y=yaw;
      }else if(ritual.ending==='escape'){
        camera.position.set(S.entrance[0],1.68,S.entrance[1]+2);camera.lookAt(S.entrance[0],1.5,S.entrance[1]-6);
      }
      hands.visible=!ritual.ending;
      for(const [name,item] of Object.entries(handItems))item.visible=!ritual.ending && ritual.held===name;
      if(locked&&len)audio.playFootstep(Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<4,elapsed);
      audio.updateAmbience({time:elapsed,isIndoors:Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<4,rainIntensity:night?.15:0,dread:night?ritual.night/8:0,danger:0});
      const swing=armSwing(phase,len?speed:0,sprint,false); hands.rotation.z=swing.swing*.09;hands.position.y=-.29+swing.bounce*.012;
      const working=now<workUntil;hands.position.z=working?-.68+Math.sin(now*.015)*.05:-.65;
      hands.children.forEach((hand,i)=>{hand.rotation.x=working?Math.sin(now*.015+i*Math.PI)*.18:0;});
      renderer.render(scene,camera);
      if(now-lastUi>150){lastUi=now; const t=target(); if(now>captionUntil)caption='';setHud({prompt:t?(t.id==='slab'&&ritual.body==='slab'&&ritual.stage<6?`${isScrubbing(ritual.stage)?"F basılıyken A / D ile sırayla yıka":"F tuşunu basılı tut"} · ${t.label}${workHeld?' · '+Math.min(100,Math.round(workProgress/1.2*100))+'%':''}`:`E · ${t.id==='arrival'&&!night?'Boş sedye':t.label}`):'',caption,place:`DERMANLI · ${ritual.night}. VAZİFE · ${night?'GECE':'GÜNDÜZ'}${night?' · '+NAMES[ritual.night-1]:''}`,count:ritual.clues.length,locked,objective:ritualObjective(ritual,night),held:ritual.held==='empty'?'Boş eller':({soap:'Sabun',ewer:'İbrik',bucket:'Kirli su kovası',camphor:'Kâfur',shroud:'Kefen'} as const)[ritual.held],ending:ritual.ending??'',hits,clues:[...ritual.clues],bellHint:bellHint(bell.seed),bellSolved:bell.solved,x:pos.x,z:pos.z,yaw});}
      frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
    return ()=>{if(import.meta.env.DEV) delete (window as unknown as {__dermanliTest?:unknown}).__dermanliTest;save();cancelAnimationFrame(frame); document.removeEventListener('mousemove',onMove);document.removeEventListener('pointerlockchange',onLock);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('click',onClick);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();audio.dispose();world.dispose();for(const item of Object.values(handItems))item.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});hands.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});renderer.dispose();renderer.domElement.remove();};
  },[resume]);
  return <div style={{position:'absolute',inset:0,background:'#111'}}><div ref={mount} style={{position:'absolute',inset:0}}/>
    {!hud.ending && <div style={{position:'absolute',top:24,left:26,textShadow:'0 2px 6px black',pointerEvents:'none'}}><b>{hud.place}</b><div style={{fontSize:12,opacity:.8}}>Keşfedilen kayıtlar: {hud.count} · {hud.held} · Dayanıklılık: {3-hud.hits}/3</div><div style={{maxWidth:380,marginTop:8,fontSize:13}}>{hud.objective}</div></div>}
    {!hud.ending && <button onClick={onExit} style={{position:'absolute',right:20,top:20,padding:'8px 12px',background:'#171917bb',color:'#eee',border:'1px solid #85877a',cursor:'pointer'}}>Menü</button>}
    {!hud.ending && <div style={{position:'absolute',top:20,right:110,fontSize:12,opacity:.75,pointerEvents:'none'}}>{muted?'Ses kapalı · M':'H: harita · N: defter · M: ses'}</div>}
    {!hud.ending && <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',color:'#fff'}}>·</div>}
    {hud.prompt && !hud.ending && <div style={{position:'absolute',bottom:100,width:'100%',textAlign:'center',textShadow:'0 2px 5px black',pointerEvents:'none'}}>{hud.prompt}</div>}
    {hud.caption && !hud.ending && <div style={{position:'absolute',bottom:36,left:'15%',width:'70%',textAlign:'center',background:'#121712bd',padding:'12px',pointerEvents:'none'}}>{hud.caption}</div>}
    {mapOpen && !hud.ending && <DermanliMapPanel x={hud.x} z={hud.z} yaw={hud.yaw} onClose={()=>setMapOpen(false)} />}
    {notebook && !hud.ending && <div style={{position:'absolute',inset:'10% 20%',overflowY:'auto',padding:24,background:'#ded4bd',color:'#28291f',boxShadow:'0 8px 40px #000',zIndex:2}}><button onClick={()=>setNotebook(false)} style={{float:'right',cursor:'pointer'}}>Kapat</button><h2>Halil’in Defteri</h2><p>Bulduğun kayıtlar burada saklanır.</p>{hud.clues.length===0?<p>Henüz kayıt bulunmadı.</p>:hud.clues.map(id=><p key={id} style={{borderBottom:'1px solid #a69b80',paddingBottom:10}}>{notes[id]} {id==='home' && <>Okul avlusuyla ilgili bir satır: {hud.bellHint}</>}</p>)}{hud.bellSolved && <p>Çanlar okul dolabının kilidini açtı.</p>}</div>}
    {hud.ending && <DermanliEnding ending={hud.ending as Ending} stage={endingStage} onStage={setEndingStage} onExit={onExit}/>}
    {!hud.locked && !hud.ending && !notebook && !mapOpen && <div style={{position:'absolute',top:'35%',left:'50%',transform:'translateX(-50%)',padding:20,background:'#111d',textAlign:'center',pointerEvents:'none'}}>{failed?'3D sahnesi başlatılamadı.':'Oyuna dönmek için görüntüye tıkla'}<br/><small>WASD: hareket · Shift: koş · Ctrl/C: çömel · E: incele · F + sırayla A/D: yıkama · F basılı: diğer işlemler · H: harita · N: defter · M: ses · Esc: fareyi bırak</small></div>}
  </div>;
}
