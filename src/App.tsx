import { lazy, Suspense, useState } from 'react';
import { LoadingVillage } from './components/LoadingVillage';
import { TitleScreen } from './components/TitleScreen';
const DermanliSession = lazy(() => import('./DermanliSession'));
export default function App() {
  const [session,setSession]=useState<{resume:boolean}|null>(null);
  if(!session)return <TitleScreen onLaunch={resume=>setSession({resume})}/>;
  return <Suspense fallback={<LoadingVillage onExit={()=>setSession(null)} />}><DermanliSession resume={session.resume} onExit={()=>setSession(null)}/></Suspense>;
}
