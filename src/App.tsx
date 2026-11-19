import { lazy, Suspense, useState } from 'react';
import { LoadingVillage } from './components/LoadingVillage';
const DermanliSession = lazy(() => import('./DermanliSession'));
export default function App() {
  const [playing,setPlaying]=useState(false);
  if(playing) return <Suspense fallback={<LoadingVillage onExit={()=>setPlaying(false)} />}><DermanliSession onExit={()=>setPlaying(false)} /></Suspense>;
  return <main style={{height:'100%',display:'grid',placeItems:'center',background:'radial-gradient(ellipse at center,#343d38,#101512 75%)',color:'#e5ddca',textAlign:'center'}}><div style={{maxWidth:600,padding:24}}>
    <p style={{letterSpacing:'.4em',fontSize:12}}>DERMANLI KÖYÜ</p><h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(48px,8vw,90px)',margin:'10px 0'}}>Son Vazife</h1>
    <p>Ustanın mektubu seni ıssız bir köye çağırıyor. Unutulmuş isimlerin izini sür.</p>
    <p style={{fontSize:13,opacity:.72}}>Yeni harita geliştirme sürümü · Görevler ve finaller henüz tamamlanmadı.</p>
    <button onClick={()=>setPlaying(true)} style={{marginTop:20,padding:'14px 36px',border:'1px solid #b2a98e',background:'#292d27',color:'#eee5d2',cursor:'pointer',letterSpacing:'.15em'}}>KÖYE GİR</button>
  </div></main>;
}
