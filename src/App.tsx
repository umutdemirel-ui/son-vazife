import { lazy, Suspense, useState } from 'react';
import { LoadingVillage } from './components/LoadingVillage';
import { TitleScreen } from './components/TitleScreen';
const DermanliSession = lazy(() => import('./DermanliSession'));
const VillageSession = lazy(() => import('./VillageSession'));
export default function App() {
  const [session,setSession]=useState<{mode:'dermanli'|'kuzdag';resume:boolean}|null>(null);
  if(!session)return <TitleScreen onLaunch={resume=>setSession({mode:'dermanli',resume})} onLegacy={resume=>setSession({mode:'kuzdag',resume})}/>;
  return <Suspense fallback={<LoadingVillage onExit={()=>setSession(null)} />}>{session.mode==='dermanli'
    ? <DermanliSession resume={session.resume} onExit={()=>setSession(null)}/>
    : <VillageSession session={{resume:session.resume,registryFiled:false}} onExit={()=>setSession(null)}/>}</Suspense>;
}
