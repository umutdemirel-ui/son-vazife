import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createDermanliWorld } from './game/dermanliWorld';
import { DERMANLI_SITES as S, dermanliHeight } from './game/dermanliMap';
import { pushOutsideBox } from './game/collision';
import { createWorkHands, armSwing } from './game/handRig';
import { HorrorAudioEngine } from './game/audio';
import { newRitual, interactRitual, leaveUnwatched, ritualObjective, NAMES } from './game/dermanliRitual';
import { readDermanliSave, writeDermanliSave } from './game/dermanliSave';

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
interface Hud { prompt:string; caption:string; place:string; count:number; locked:boolean; objective:string; held:string; ending:string }
const initial: Hud={prompt:'',caption:'Ustanın mektubu seni Dermanlı’ya getirdi. Gassal evini ve gasilhaneyi bul.',place:'Dermanlı Köyü',count:0,locked:false,objective:'Gasilhane önündeki sedyeye git.',held:'',ending:''};

export default function DermanliSession({onExit,resume}:{onExit:()=>void;resume:boolean}) {
  const mount=useRef<HTMLDivElement>(null), [hud,setHud]=useState<Hud>(initial), [failed,setFailed]=useState(false);
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
    const saved=resume?readDermanliSave():null;
    const ritual=saved?.ritual??newRitual();
    const pos={x:saved?.x??S.entrance[0],z:saved?.z??S.entrance[1]+2}; let yaw=saved?.yaw??0, pitch=saved?.pitch??0, phase=0, last=performance.now(), frame=0, locked=false, caption=initial.caption, captionUntil=performance.now()+12000, lastUi=0, lastSave=performance.now(), scareUntil=0;
    const save=()=>writeDermanliSave({version:1,ritual,x:pos.x,z:pos.z,yaw,pitch});
    const keys=new Set<string>();
    const onMove=(e:MouseEvent)=>{if(!locked)return; yaw-=e.movementX*.0022; pitch=Math.max(-1.3,Math.min(1.3,pitch-e.movementY*.0022));};
    const onLock=()=>{locked=document.pointerLockElement===renderer.domElement; if(!locked)keys.clear();};
    const target=()=>world.targets.map(t=>{const dx=t.x-pos.x,dz=t.z-pos.z,dist=Math.hypot(dx,dz);return {...t,dist,dot:dist<.1?1:(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/dist};})
      .filter(t=>t.dist<t.radius && t.dot>.45 && (t.id!=='discard'||ritual.held==='bucket') && (t.id!=='forest'||ritual.body!=='burialCarry'))
      .sort((a,b)=>(a.dist+(1-a.dot)*2)-(b.dist+(1-b.dot)*2))[0];
    const onKey=(e:KeyboardEvent)=>{
      if(['KeyW','KeyA','KeyS','KeyD','Space','ControlLeft','ControlRight','KeyC'].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if(e.code==='KeyE' && !e.repeat && locked){const t=target();if(t){
        const action=interactRitual(ritual,t.id);
        if(notes[t.id] && !ritual.clues.includes(t.id)) ritual.clues.push(t.id);
        caption=action || notes[t.id] || ''; captionUntil=performance.now()+9000;
        if(t.id==='candle')audio.playCandleToggle(ritual.candle);else if(t.id==='slab'&&ritual.stage===4)audio.playWaterPour();else audio.playPaperFlip();
        save();
      }}
    };
    const onUp=(e:KeyboardEvent)=>keys.delete(e.code);
    const onClick=()=>{audio.init(); if(document.pointerLockElement!==renderer.domElement) void renderer.domElement.requestPointerLock();};
    const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};
    document.addEventListener('mousemove',onMove); document.addEventListener('pointerlockchange',onLock); window.addEventListener('keydown',onKey); window.addEventListener('keyup',onUp); window.addEventListener('resize',resize); renderer.domElement.addEventListener('click',onClick);
    function animate(now:number){
      const dt=Math.min(.05,(now-last)/1000);last=now;
      let forward=0,side=0; if(locked){forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));side=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));}
      const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight'), crouch=keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyC');
      const len=Math.hypot(forward,side), speed=(crouch?1.55:sprint?5.1:2.8); if(len){forward/=len;side/=len;pos.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt;pos.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
        pos.x=Math.max(-90,Math.min(90,pos.x));pos.z=Math.max(-105,Math.min(105,pos.z)); for(const c of world.colliders)pushOutsideBox(pos,c,.32);phase+=dt*(sprint?12:8);}
      camera.position.set(pos.x,dermanliHeight(pos.x,pos.z)+(crouch?1.1:1.68),pos.z);camera.rotation.set(pitch,yaw,0);
      if(locked && Math.hypot(pos.x-S.gasilhane[0],pos.z-S.gasilhane[1])>8 && leaveUnwatched(ritual)){caption='Sabır mumu yanmadan uzaklaştın. Arkanda bir hareket duyuluyor.';captionUntil=now+7000;audio.playViolationSting();scareUntil=now+1100;save();}
      world.gasil.vigilFlame.visible=ritual.candle;world.gasil.vigilLight.intensity=ritual.candle?1.8:0;
      world.updateArt(pos.x,pos.z);
      world.slabBody.visible=ritual.body==='slab'&&ritual.stage<6;world.slabBody.rotation.z=ritual.risen?-Math.PI/2:0;
      world.apparition.visible=now<scareUntil; if(world.apparition.visible){world.apparition.position.set(pos.x-Math.sin(yaw)*1.8,dermanliHeight(pos.x,pos.z),pos.z-Math.cos(yaw)*1.8);world.apparition.rotation.y=yaw+Math.PI;}
      world.gasil.pestemalMesh.visible=ritual.body==='slab'&&ritual.stage<6;world.gasil.kefenWrapGroup.visible=ritual.body==='slab'&&ritual.stage===6;
      world.gasil.basinWaterMesh.visible=ritual.dirty;
      world.arrivalBody.visible=ritual.body==='arrival';
      if(ritual.body==='carrying'||ritual.body==='burialCarry') {world.arrivalBody.visible=true;world.arrivalBody.position.set(pos.x-Math.sin(yaw)*.75,camera.position.y-.55,pos.z-Math.cos(yaw)*.75);world.arrivalBody.rotation.set(0,yaw,Math.PI/2);}
      else {world.arrivalBody.position.set(S.gasilhane[0]+5,1.04,S.gasilhane[1]);world.arrivalBody.rotation.set(0,0,Math.PI/2);}
      if(locked&&now-lastSave>15000){lastSave=now;save();}
      const swing=armSwing(phase,len?speed:0,sprint,false); hands.rotation.z=swing.swing*.09;hands.position.y=-.29+swing.bounce*.012;
      renderer.render(scene,camera);
      if(now-lastUi>150){lastUi=now; const t=target(); if(now>captionUntil)caption='';setHud({prompt:t?`E · ${t.label}`:'',caption,place:`DERMANLI · ${ritual.night}. GECE · ${NAMES[ritual.night-1]}`,count:ritual.clues.length,locked,objective:ritualObjective(ritual),held:ritual.held==='empty'?'Boş eller':({soap:'Sabun',ewer:'İbrik',bucket:'Kirli su kovası',camphor:'Kâfur',shroud:'Kefen'} as const)[ritual.held],ending:ritual.ending??''});}
      frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
    return ()=>{save();cancelAnimationFrame(frame); document.removeEventListener('mousemove',onMove);document.removeEventListener('pointerlockchange',onLock);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('click',onClick);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();audio.dispose();world.dispose();hands.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});renderer.dispose();renderer.domElement.remove();};
  },[resume]);
  return <div style={{position:'absolute',inset:0,background:'#111'}}><div ref={mount} style={{position:'absolute',inset:0}}/>
    <div style={{position:'absolute',top:24,left:26,textShadow:'0 2px 6px black',pointerEvents:'none'}}><b>{hud.place}</b><div style={{fontSize:12,opacity:.8}}>Keşfedilen kayıtlar: {hud.count} · {hud.held}</div><div style={{maxWidth:380,marginTop:8,fontSize:13}}>{hud.objective}</div></div>
    <button onClick={onExit} style={{position:'absolute',right:20,top:20,padding:'8px 12px',background:'#171917bb',color:'#eee',border:'1px solid #85877a',cursor:'pointer'}}>Menü</button>
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',color:'#fff'}}>·</div>
    {hud.prompt && <div style={{position:'absolute',bottom:100,width:'100%',textAlign:'center',textShadow:'0 2px 5px black',pointerEvents:'none'}}>{hud.prompt}</div>}
    {hud.caption && <div style={{position:'absolute',bottom:36,left:'15%',width:'70%',textAlign:'center',background:'#121712bd',padding:'12px',pointerEvents:'none'}}>{hud.caption}</div>}
    {hud.ending && <div style={{position:'absolute',top:'28%',left:'50%',transform:'translateX(-50%)',padding:24,background:'#101510ef',textAlign:'center',width:'min(80%,500px)'}}><h2>{hud.ending==='peace'?'HUZUR':hud.ending==='dark'?'KARANLIK':'KAÇIŞ'}</h2><p>{hud.ending==='peace'?'İsimler hatırlandı; sisin ardında sabah var.':hud.ending==='dark'?'Eksik vazifelerin ağırlığı köyde kaldı.':'Orman yolu yeniden köy kapısına çıkıyor.'}</p><button onClick={onExit}>Menüye dön</button></div>}
    {!hud.locked && !hud.ending && <div style={{position:'absolute',top:'35%',left:'50%',transform:'translateX(-50%)',padding:20,background:'#111d',textAlign:'center',pointerEvents:'none'}}>{failed?'3D sahnesi başlatılamadı.':'Oyuna dönmek için görüntüye tıkla'}<br/><small>WASD: hareket · Shift: koş · Ctrl/C: çömel · E: incele · Esc: fareyi bırak</small></div>}
  </div>;
}
