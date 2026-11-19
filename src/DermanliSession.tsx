import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createDermanliWorld } from './game/dermanliWorld';
import { DERMANLI_SITES as S, dermanliHeight } from './game/dermanliMap';
import { pushOutsideBox } from './game/collision';
import { createWorkHands, armSwing } from './game/handRig';
import { HorrorAudioEngine } from './game/audio';
import { newRitual, interactRitual, leaveUnwatched, ritualObjective, NAMES } from './game/dermanliRitual';
import { readDermanliSave, writeDermanliSave } from './game/dermanliSave';
import { isNight, nextEvent } from './game/dermanliEvents';
import { createCopperEwerAndSoap } from './game/models';
import { DermanliThreat } from './game/dermanliThreat';

const notes: Record<string,string> = {
  home: 'Hacı Süleyman’ın günlüğü: “Köyde tamamlanmamış vazifeler var. İsimlerini unutma.”',
  school: 'Tahtada silik bir yazı var: “Kapı açılınca anneme gideceğim.” Altına Elif adı yazılmış.',
  mill: 'Değirmencinin defteri, bozulmuş hasattan ve cevapsız kalan yardım çağrılarından söz ediyor.',
  well: 'Kuyunun yanında bulunan kayıtta mezarlık dışına gömülen isimler var.',
  cemetery: 'Taşların arasındaki liste eksik. Bazı isimlerin yanında ne yıkama ne de kefen kaydı var.',
  bridge: 'Köprü sisin içinde kayboluyor. Halil, bu yolu daha önce yürümüş gibi hissediyor.',
  barn: 'Ahır sessiz; çürümüş samanın arasında eski bir hasat kaydı bulunuyor.',
  abandoned0: 'Terk edilmiş evdeki masada boş bir mektup zarfı var.', abandoned1: 'Pencereler içeriden tahtalarla kapatılmış.',
  abandoned2: 'Burası yıllardır boş. Bir tabak masada kalmış.', abandoned3: 'Yerde eski, okunaksız bir takvim var.',
  gasil: 'Gasilhanenin içi soğuk. Teneşir ve malzemeler yerlerinde; burası son vazifenin merkezi.',
};
interface Hud { prompt:string; caption:string; place:string; count:number; locked:boolean; objective:string; held:string; ending:string; hits:number; clues:string[] }
const initial: Hud={prompt:'',caption:'Ustanın mektubu seni Dermanlı’ya getirdi. Gassal evini ve gasilhaneyi bul.',place:'Dermanlı Köyü',count:0,locked:false,objective:'Gasilhane önündeki sedyeye git.',held:'',ending:'',hits:0,clues:[]};

export default function DermanliSession({onExit,resume}:{onExit:()=>void;resume:boolean}) {
  const mount=useRef<HTMLDivElement>(null), [hud,setHud]=useState<Hud>(initial), [failed,setFailed]=useState(false), [notebook,setNotebook]=useState(false), [muted,setMuted]=useState(false);
  useEffect(()=>{
    const host=mount.current; if(!host)return;
    let renderer: THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); } catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.setClearColor(0x465255); host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x465255); scene.fog=new THREE.FogExp2(0x465255,.018);
    scene.add(new THREE.HemisphereLight(0xb7c8d2,0x535248,1.8)); const sun=new THREE.DirectionalLight(0xd9d3b8,1.6); sun.position.set(25,45,10); scene.add(sun);
    const world=createDermanliWorld(scene);
    const camera=new THREE.PerspectiveCamera(72,host.clientWidth/host.clientHeight,.08,210); camera.rotation.order='YXZ'; scene.add(camera);
    const hands=createWorkHands(); hands.position.set(0,-.29,-.65); camera.add(hands);
    const audio=new HorrorAudioEngine();
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
    let elapsed=saved?.elapsed??0, nextCue=0, hits=saved?.hits??0, nextRandomScare=75+Math.random()*45; const threat=new DermanliThreat(); const seenEvents=new Set(saved?.events??[]);
    const pos={x:saved?.x??S.entrance[0],z:saved?.z??S.entrance[1]+2}; let yaw=saved?.yaw??0, pitch=saved?.pitch??0, phase=0, last=performance.now(), frame=0, locked=false, caption=initial.caption, captionUntil=performance.now()+12000, lastUi=0, lastSave=performance.now(), scareUntil=0;
    const save=()=>writeDermanliSave({version:1,ritual,x:pos.x,z:pos.z,yaw,pitch,elapsed,events:[...seenEvents],hits});
    const keys=new Set<string>();
    const onMove=(e:MouseEvent)=>{if(!locked)return; yaw-=e.movementX*.0022; pitch=Math.max(-1.3,Math.min(1.3,pitch-e.movementY*.0022));};
    const onLock=()=>{locked=document.pointerLockElement===renderer.domElement; if(!locked)keys.clear();};
    const target=()=>world.targets.map(t=>{const dx=t.x-pos.x,dz=t.z-pos.z,dist=Math.hypot(dx,dz);return {...t,dist,dot:dist<.1?1:(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/dist};})
      .filter(t=>t.dist<t.radius && t.dot>.45 && (t.id!=='discard'||ritual.held==='bucket') && (t.id!=='forest'||ritual.body!=='burialCarry'))
      .sort((a,b)=>(a.dist+(1-a.dot)*2)-(b.dist+(1-b.dot)*2))[0];
    // Development-only end-to-end helper: move to a collision-free viewpoint but
    // exercise the same aiming, keyboard input and save path as a player.
    if(import.meta.env.DEV){
      const debug = {
        state: () => JSON.parse(JSON.stringify(ritual)),
        scanReachability: () => {
          const minX=-90,maxX=90,minZ=-105,maxZ=105,w=maxX-minX+1,h=maxZ-minZ+1;
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
        goToTarget: (id:string) => {
          const t=world.targets.find(item=>item.id===id); if(!t) return false;
          const previous={...pos,yaw};
          for(const distance of [.55,.85,1.1,1.35,1.65,2.1]) for(let i=0;i<32;i++) {
            if(distance>=t.radius) continue;
            const a=i*Math.PI/16; const candidate={x:t.x+Math.cos(a)*distance,z:t.z+Math.sin(a)*distance};
            const resolved={...candidate}; for(const c of world.colliders)pushOutsideBox(resolved,c,.32);
            if(Math.hypot(resolved.x-candidate.x,resolved.z-candidate.z)>.01)continue;
            pos.x=candidate.x;pos.z=candidate.z;yaw=Math.atan2(pos.x-t.x,pos.z-t.z);
            if(target()?.id===id)return true;
          }
          pos.x=previous.x;pos.z=previous.z;yaw=previous.yaw;return false;
        },
      };
      (window as unknown as {__dermanliTest?:typeof debug}).__dermanliTest=debug;
    }
    const onKey=(e:KeyboardEvent)=>{
      if(['KeyW','KeyA','KeyS','KeyD','Space','ControlLeft','ControlRight','KeyC'].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if(e.code==='KeyN'&&!e.repeat){setNotebook(v=>!v);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}
      if(e.code==='KeyM'&&!e.repeat){audio.setMuted(!audio.isMuted());setMuted(audio.isMuted());}
      if(e.code==='KeyE' && !e.repeat && locked){const t=target();if(t){
        const action=interactRitual(ritual,t.id);
        if(notes[t.id] && !ritual.clues.includes(t.id)) ritual.clues.push(t.id);
        caption=action || notes[t.id] || ''; captionUntil=performance.now()+9000;
        if(t.id==='candle')audio.playCandleToggle(ritual.candle);else if(t.id==='slab'&&ritual.stage===4)audio.playWaterPour();else audio.playPaperFlip();
        save(); if(ritual.ending && document.pointerLockElement===renderer.domElement)document.exitPointerLock();
      }}
    };
    const onUp=(e:KeyboardEvent)=>keys.delete(e.code);
    const onClick=()=>{audio.init(); if(!ritual.ending && document.pointerLockElement!==renderer.domElement) void renderer.domElement.requestPointerLock();};
    const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};
    document.addEventListener('mousemove',onMove); document.addEventListener('pointerlockchange',onLock); window.addEventListener('keydown',onKey); window.addEventListener('keyup',onUp); window.addEventListener('resize',resize); renderer.domElement.addEventListener('click',onClick);
    function animate(now:number){
      const dt=Math.min(.05,(now-last)/1000);last=now;
      if(locked&&!ritual.ending) elapsed+=dt;
      const night=isNight(elapsed);
      sun.intensity=night?.46:1.6;
      (scene.background as THREE.Color).set(night?0x1c2930:0x465255);
      if(scene.fog instanceof THREE.FogExp2){scene.fog.color.copy(scene.background as THREE.Color);scene.fog.density=night?.023+ritual.night*.001:.018;}
      if(locked&&night&&!ritual.ending&&now>nextCue){const event=nextEvent(ritual.night,pos.x,pos.z,yaw,seenEvents);if(event){seenEvents.add(`${ritual.night}:${event.id}`);caption=event.text;captionUntil=now+6500;nextCue=now+30000;if(event.sound==='water')audio.playWaterPour();else if(event.sound==='whisper')audio.playWhisper();else if(event.sound==='knock')audio.playWindowKnock();else audio.playFloorboardCreak();save();}}
      let forward=0,side=0; if(locked){forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));side=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));}
      const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight'), crouch=keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyC');
      const len=Math.hypot(forward,side), speed=(crouch?1.55:sprint?5.1:2.8); if(len){forward/=len;side/=len;pos.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt;pos.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
        pos.x=Math.max(-90,Math.min(90,pos.x));pos.z=Math.max(-105,Math.min(105,pos.z)); for(const c of world.colliders)pushOutsideBox(pos,c,.32);phase+=dt*(sprint?12:8);}
      camera.position.set(pos.x,dermanliHeight(pos.x,pos.z)+(crouch?1.1:1.68),pos.z);camera.rotation.set(pitch,yaw,0);
      if(locked && Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])>8 && leaveUnwatched(ritual)){caption='Sabır mumu yanmadan uzaklaştın. Arkanda bir hareket duyuluyor.';captionUntil=now+7000;audio.playViolationSting();scareUntil=now+1100;save();}
      const safe=Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<7 || Math.hypot(pos.x-S.gassalHome[0],pos.z-S.gassalHome[1])<5;
      const result=locked?threat.tick(dt,night&&ritual.night>=2&&!ritual.ending,safe,{...pos,yaw},world.colliders):'none';
      const pursuer=world.figures[0];pursuer.visible=threat.active;
      if(threat.active){pursuer.position.set(threat.x,dermanliHeight(threat.x,threat.z),threat.z);pursuer.rotation.y=Math.atan2(pos.x-threat.x,pos.z-threat.z);const head=pursuer.getObjectByName('scare-head');if(head)head.rotation.z=Math.sin(elapsed*3)*.08;}
      if(result==='hit'){hits=Math.min(3,hits+1);scareUntil=now+1200;audio.playViolationSting();caption='Bir gölge sana çarptı. Uzaklaş!';captionUntil=now+5000;if(hits===3){ritual.ending='dark';caption='Halil gücünü kaybetti; köyün sessizliği onu içine aldı.';if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}save();}
      if(locked&&night&&!safe&&!ritual.ending&&elapsed>=nextRandomScare){scareUntil=now+850;audio.playWhisper(.7);nextRandomScare=elapsed+75+Math.random()*60;}
      world.gasil.vigilFlame.visible=ritual.candle;world.gasil.vigilLight.intensity=ritual.candle?1.8:0;
      world.updateArt(pos.x,pos.z);
      if(night)world.wheel.rotation.z+=dt*.5;
      world.homeLight.intensity=night ? 4.5+Math.sin(elapsed*11)*.12 : 1.5;
      world.slabBody.visible=ritual.body==='slab'&&ritual.stage<6;world.slabBody.rotation.z=ritual.risen?-Math.PI/2:0;
      world.apparition.visible=now<scareUntil; if(world.apparition.visible){world.apparition.position.set(pos.x-Math.sin(yaw)*1.8,dermanliHeight(pos.x,pos.z),pos.z-Math.cos(yaw)*1.8);world.apparition.rotation.y=yaw+Math.PI;}
      world.gasil.pestemalMesh.visible=ritual.body==='slab'&&ritual.stage<6;world.gasil.kefenWrapGroup.visible=ritual.body==='slab'&&ritual.stage===6;
      world.gasil.basinWaterMesh.visible=ritual.dirty;
      world.arrivalBody.visible=ritual.body==='arrival';
      if(ritual.body==='carrying'||ritual.body==='burialCarry') {world.arrivalBody.visible=true;world.arrivalBody.position.set(pos.x-Math.sin(yaw)*.75,camera.position.y-.55,pos.z-Math.cos(yaw)*.75);world.arrivalBody.rotation.set(0,yaw,Math.PI/2);}
      else {world.arrivalBody.position.set(S.gasilhane[0]+5,1.04,S.gasilhane[1]);world.arrivalBody.rotation.set(0,0,Math.PI/2);}
      if(locked&&now-lastSave>15000){lastSave=now;save();}
      for(const [name,item] of Object.entries(handItems))item.visible=ritual.held===name;
      if(locked&&len)audio.playFootstep(Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<4,elapsed);
      audio.updateAmbience({time:elapsed,isIndoors:Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])<4,rainIntensity:night?.15:0,dread:night?ritual.night/8:0,danger:0});
      const swing=armSwing(phase,len?speed:0,sprint,false); hands.rotation.z=swing.swing*.09;hands.position.y=-.29+swing.bounce*.012;
      renderer.render(scene,camera);
      if(now-lastUi>150){lastUi=now; const t=target(); if(now>captionUntil)caption='';setHud({prompt:t?`E · ${t.label}`:'',caption,place:`DERMANLI · ${ritual.night}. VAZİFE · ${night?'GECE':'GÜNDÜZ'} · ${NAMES[ritual.night-1]}`,count:ritual.clues.length,locked,objective:ritualObjective(ritual),held:ritual.held==='empty'?'Boş eller':({soap:'Sabun',ewer:'İbrik',bucket:'Kirli su kovası',camphor:'Kâfur',shroud:'Kefen'} as const)[ritual.held],ending:ritual.ending??'',hits,clues:[...ritual.clues]});}
      frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
    return ()=>{if(import.meta.env.DEV) delete (window as unknown as {__dermanliTest?:unknown}).__dermanliTest;save();cancelAnimationFrame(frame); document.removeEventListener('mousemove',onMove);document.removeEventListener('pointerlockchange',onLock);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('click',onClick);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();audio.dispose();world.dispose();for(const item of Object.values(handItems))item.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});hands.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});renderer.dispose();renderer.domElement.remove();};
  },[resume]);
  return <div style={{position:'absolute',inset:0,background:'#111'}}><div ref={mount} style={{position:'absolute',inset:0}}/>
    <div style={{position:'absolute',top:24,left:26,textShadow:'0 2px 6px black',pointerEvents:'none'}}><b>{hud.place}</b><div style={{fontSize:12,opacity:.8}}>Keşfedilen kayıtlar: {hud.count} · {hud.held} · Dayanıklılık: {3-hud.hits}/3</div><div style={{maxWidth:380,marginTop:8,fontSize:13}}>{hud.objective}</div></div>
    <button onClick={onExit} style={{position:'absolute',right:20,top:20,padding:'8px 12px',background:'#171917bb',color:'#eee',border:'1px solid #85877a',cursor:'pointer'}}>Menü</button>
    <div style={{position:'absolute',top:20,right:110,fontSize:12,opacity:.75,pointerEvents:'none'}}>{muted?'Ses kapalı · M':'N: defter · M: ses'}</div>
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',color:'#fff'}}>·</div>
    {hud.prompt && <div style={{position:'absolute',bottom:100,width:'100%',textAlign:'center',textShadow:'0 2px 5px black',pointerEvents:'none'}}>{hud.prompt}</div>}
    {hud.caption && <div style={{position:'absolute',bottom:36,left:'15%',width:'70%',textAlign:'center',background:'#121712bd',padding:'12px',pointerEvents:'none'}}>{hud.caption}</div>}
    {notebook && !hud.ending && <div style={{position:'absolute',inset:'10% 20%',overflowY:'auto',padding:24,background:'#ded4bd',color:'#28291f',boxShadow:'0 8px 40px #000',zIndex:2}}><button onClick={()=>setNotebook(false)} style={{float:'right',cursor:'pointer'}}>Kapat</button><h2>Halil’in Defteri</h2><p>Bulduğun kayıtlar burada saklanır.</p>{hud.clues.length===0?<p>Henüz kayıt bulunmadı.</p>:hud.clues.map(id=><p key={id} style={{borderBottom:'1px solid #a69b80',paddingBottom:10}}>{notes[id]}</p>)}</div>}
    {hud.ending && <div style={{position:'absolute',top:'28%',left:'50%',transform:'translateX(-50%)',padding:24,background:'#101510ef',textAlign:'center',width:'min(80%,500px)'}}><h2>{hud.ending==='peace'?'HUZUR':hud.ending==='dark'?'KARANLIK':'KAÇIŞ'}</h2><p>{hud.ending==='peace'?'Halil köye gelirken köprüde öldüğünü hatırlar. Son vazife kendisidir. Hacı Süleyman belirir; çırağını uğurlarken sis dağılır ve sabah doğar.':hud.ending==='dark'?'Halil köprüde öldüğünü hatırlar; eksik vazifelerin ağırlığı onu köyün yeni sessiz gassalı yapar.':'Orman yolu yeniden köy kapısına çıkıyor. Aynı yol, aynı sis: köy bir sonraki gassalı bekliyor.'}</p><button onClick={onExit}>Menüye dön</button></div>}
    {!hud.locked && !hud.ending && !notebook && <div style={{position:'absolute',top:'35%',left:'50%',transform:'translateX(-50%)',padding:20,background:'#111d',textAlign:'center',pointerEvents:'none'}}>{failed?'3D sahnesi başlatılamadı.':'Oyuna dönmek için görüntüye tıkla'}<br/><small>WASD: hareket · Shift: koş · Ctrl/C: çömel · E: incele · N: defter · M: ses · Esc: fareyi bırak</small></div>}
  </div>;
}
