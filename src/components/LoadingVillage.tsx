import { ArrowLeft, LoaderCircle } from 'lucide-react';

export function LoadingVillage({
  failed = false,
  onExit,
}: {
  failed?: boolean;
  onExit: () => void;
}) {
  return (
    <main className="village-loading">
      <div>
        <p className="kicker">
          <i />
          KUZDAĞ / KÖY MEYDANI
        </p>
        <h1>{failed ? 'Köy açılamadı' : 'Meydana doğru…'}</h1>
        {failed ? (
          <p>
            Üç boyutlu köy için WebGL 2 destekli bir tarayıcı ve donanım hızlandırma gerekir. İlk
            nöbeti ve köy arşivini üç boyutlu görüntü olmadan da açabilirsin.
          </p>
        ) : (
          <p className="loading-status">
            <LoaderCircle size={16} />
            Köy sahnesi hazırlanıyor
          </p>
        )}
        <button className="menu-button secondary" onClick={onExit}>
          <ArrowLeft size={16} />
          Ana menü
        </button>
      </div>
    </main>
  );
}
