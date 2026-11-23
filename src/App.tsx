import { lazy, Suspense, useState } from 'react';
import { LoadingVillage } from './components/LoadingVillage';
import { TitleScreen } from './components/TitleScreen';
const VillageSession = lazy(() => import('./VillageSession'));
export default function App() {
  const [session,setSession]=useState<{resume:boolean}|null>(null);
  if(!session)return <TitleScreen onLaunch={resume=>setSession({resume})}/>;
  return <Suspense fallback={<LoadingVillage onExit={()=>setSession(null)} />}><VillageSession session={{resume:session.resume,registryFiled:false}} onExit={()=>setSession(null)}/></Suspense>;
}
