import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CloudFog, Crosshair, Focus, Headphones, MapPin, Maximize, Minimize, Mountain, Play, RotateCcw, UserRound, VolumeX } from 'lucide-react';
import { ARCHIVE } from '../archive';
import { HorrorAudioEngine } from '../game/audio';
import { clearDermanliSave, readDermanliSave } from '../game/dermanliSave';
import { readControls, readMuted, storeControls, storeMuted } from '../game/preferences';
import type { ControlSettings } from '../game/types';
import { ArchivePrint } from './ArchivePrint';
import { ArchivePanel, ControlsPanel, RestartPanel, SettingsPanel } from './MenuPanels';

type Panel = 'archive' | 'controls' | 'settings' | 'restart' | null;
export function TitleScreen({onLaunch}:{onLaunch:(resume:boolean)=>void}) {
  const [panel,setPanel]=useState<Panel>(null),[photo,setPhoto]=useState(0),[controls,setControls]=useState(readControls),[muted,setMuted]=useState(readMuted),[fullscreen,setFullscreen]=useState(Boolean(document.fullscreenElement)),[notice,setNotice]=useState('');
  const [save]=useState(readDermanliSave);
  const audio=useRef<HorrorAudioEngine|null>(null);
  function wakeAudio(){if(!audio.current)audio.current=new HorrorAudioEngine();audio.current.setMuted(muted||document.hidden);audio.current.init();}
  useEffect(()=>{const sync=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',sync);return()=>{document.removeEventListener('fullscreenchange',sync);audio.current?.dispose();audio.current=null;};},[]);
  useEffect(()=>{const sync=()=>audio.current?.setMuted(muted||document.hidden);sync();document.addEventListener('visibilitychange',sync);return()=>document.removeEventListener('visibilitychange',sync);},[muted]);
  useEffect(()=>{if(!notice)return;const t=window.setTimeout(()=>setNotice(''),4500);return()=>window.clearTimeout(t);},[notice]);
  function toggleMute(){const value=!muted;audio.current?.setMuted(value);setMuted(value);storeMuted(value);}
  function update(patch:Partial<ControlSettings>){const next={...controls,...patch};setControls(next);storeControls(next);}
  function openPanel(next:Panel){audio.current?.playPaperFlip();setPanel(next);}
  function photoBy(by:number){audio.current?.playPaperFlip();setPhoto(i=>(i+by+ARCHIVE.length)%ARCHIVE.length);}
  function startNew(){clearDermanliSave();onLaunch(false);}
  async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setNotice('Tarayıcın bu görünümde tam ekrana izin vermiyor.');}}
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||panel)return;if(e.code==='KeyM'){wakeAudio();toggleMute();return;}if(e.target instanceof HTMLElement&&e.target.closest('button,input,select,textarea,a,[contenteditable="true"]'))return;if(e.code==='Enter'||e.code==='Space'){e.preventDefault();wakeAudio();if(save)onLaunch(true);else startNew();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
  return <div className="sv-shell" onPointerDownCapture={wakeAudio} onKeyDownCapture={wakeAudio}>
    <header className="menu-header">
      <button className="brand" aria-label="Dermanlı Arşivi · Ana menü" onClick={()=>setPanel(null)}><img width="36" height="41" src="/mark.svg" alt=""/><span><b>DERMANLI</b><small>KÖY ARŞİVİ</small></span></button>
      <nav aria-label="Oyun menüsü" className="main-nav"><button className={!panel?'active':''} aria-current={!panel?'page':undefined} onClick={()=>setPanel(null)}>Ana menü</button><button className={panel==='archive'?'active':''} onClick={()=>openPanel('archive')}>Köy arşivi</button><button className={panel==='settings'?'active':''} onClick={()=>openPanel('settings')}>Ayarlar</button></nav>
      <div className="header-tools"><button className="sound-button" aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={!muted} onClick={toggleMute}>{muted?<VolumeX size={17}/>:<span className="equalizer" aria-hidden="true"><i/><i/><i/><i/><i/></span>}<span>{muted?'Ses kapalı':'Ses açık'}</span></button><span className="tool-divider"/><button className="fullscreen-button" onClick={()=>void toggleFullscreen()} aria-label={fullscreen?'Tam ekrandan çık':'Tam ekran'} title={fullscreen?'Tam ekrandan çık':'Tam ekran'}>{fullscreen?<Minimize size={18}/>:<Maximize size={18}/>}</button></div>
    </header>
    <main className="title-stage"><div className="stage-art" aria-hidden="true"/><div className="stage-shade" aria-hidden="true"/><div className="hero-grid"><section className="hero-copy" aria-labelledby="game-title"><p className="kicker hero-kicker"><i/>ANADOLU PSİKOLOJİK KORKU</p><h1 id="game-title" className="game-title" aria-label="Son Vazife"><span className="title-son">SON</span> <span className="title-vazife">VAZİFE</span></h1><div className="genre-row"><span><Focus size={15}/>Birinci şahıs</span><i/><span><UserRound size={14}/>Tek oyunculu</span></div><p className="story-intro">Ustanın mektubu seni ıssız Dermanlı’ya çağırıyor. Gündüz köyü keşfet; gece unutulmuş isimlerin son vazifesini tamamla.</p><div className="hero-actions"><button className="menu-button primary" onClick={()=>save?onLaunch(true):startNew()}><Play size={15} fill="currentColor" strokeWidth={1}/>{save?'DEVAM ET':'KÖYE GİR'}<ArrowRight size={16} className="cta-arrow"/></button><button className="menu-button secondary" onClick={()=>openPanel('controls')}><BookOpen size={17}/>Nasıl oynanır?</button></div>{save&&<div className="resume-meta"><span>{save.ritual.night}. VAZİFE · DERMANLI</span><button onClick={()=>openPanel('restart')}><RotateCcw size={12}/>Yeni oyun</button></div>}</section><ArchivePrint index={photo} change={photoBy} onInspect={()=>openPanel('archive')}/></div><div className="scene-id" aria-hidden="true"><span/><Crosshair size={12}/>MEKÂN 01 <i>/</i> GASİLHANE</div></main>
    <footer className="field-footer"><dl className="field-readings"><div><MapPin/><dt>Konum</dt><dd>Dermanlı Köyü, Anadolu</dd></div><div><Mountain/><dt>Arazi</dt><dd>Dağ köyü</dd></div><div><CloudFog/><dt>Hava durumu</dt><dd>Sisli</dd></div></dl><div className="headphone-note"><Headphones size={20}/><span>Kulaklıkla oynamanız önerilir.</span></div></footer>
    {notice&&<p role="status" className="menu-toast">{notice}</p>}
    {panel==='archive'&&<ArchivePanel index={photo} onSelect={i=>{audio.current?.playPaperFlip();setPhoto(i);}} onClose={()=>setPanel(null)}/>}
    {panel==='settings'&&<SettingsPanel controls={controls} update={update} muted={muted} toggleMute={toggleMute} onClose={()=>setPanel(null)}/>}
    {panel==='controls'&&<ControlsPanel onClose={()=>setPanel(null)}/>}
    {panel==='restart'&&<RestartPanel onClose={()=>setPanel(null)} onStart={startNew}/>}
  </div>;
}
