/** @license SPDX-License-Identifier: Apache-2.0 */
import { lazy, Suspense, useState } from 'react';
import { LoadingVillage } from './components/LoadingVillage';
import { TitleScreen } from './components/TitleScreen';
import type { VillageLaunch } from './game/firstWatch';

// Looking through photographs or playing the first watch doesn't require a GPU
// or the village's model library. The WebGL session owns its entire lifetime.
const VillageSession = lazy(() => import('./VillageSession'));

export default function App() {
  const [session, setSession] = useState<VillageLaunch | null>(null);
  const exit = () => setSession(null);
  if (!session) return <TitleScreen onLaunch={setSession} />;
  return (
    <Suspense fallback={<LoadingVillage onExit={exit} />}>
      <VillageSession session={session} onExit={exit} />
    </Suspense>
  );
}
