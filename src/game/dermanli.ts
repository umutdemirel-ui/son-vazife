import { isEvening, survivalDay } from './survival';

/** User-provided story draft, implemented as collectable records on the existing map.
 * These records are deliberately separate from the legacy eight-chapter quest. */
export const DERMANLI_RECORDS = [
  { id: 'dermanli_mektup', title: 'Ustadan gelen mektup', subtitle: 'Eski köy evi · Mektup', x: -10.3, z: -11.5, y: 1.05,
    body: 'Halil, köyde tamamlanmamış vazifeler var. Gasilhaneyi aç, her ismi kaydet. — Hacı Süleyman. Halil el yazısını tanıyor; ustasının yıllar önce öldüğünü de biliyor.' },
  { id: 'dermanli_hutbe', title: 'Yarım kalan hutbe', subtitle: 'Cami · Eski kayıt', x: -11.7, z: 0.5, y: 0.95,
    body: 'Kara humma ev ev dolaşırken imam, isimleri eksik bir cenaze listesi hazırlamış. Son satır boş bırakılmış; sayfanın altında okuldan söz eden bir işaret var.' },
  { id: 'dermanli_degirmen', title: 'Değirmencinin defteri', subtitle: 'Değirmen · Hasat kaydı', x: -36.5, z: 7, y: 1.0,
    body: 'Hasat bozulmuş, ambar kapatılmış. Değirmenci hastalığın nereden geldiğini bilmiyor; yalnızca yardım isteyen mektupların cevapsız kaldığını yazmış.' },
  { id: 'dermanli_okul', title: 'Elif’in tahtası', subtitle: 'Eski okul · Tebeşir izi', x: 42.7, z: -65.5, y: 1.1,
    body: '“Kapı açılınca anneme gideceğim.” Altına küçük bir el aynı sözcüğü tekrar tekrar yazmış: Elif. Dışarıdan çakılan tahtaların izleri kapı kasasında kalmış.' },
  { id: 'dermanli_kuyu', title: 'Toprak kaydı', subtitle: 'Kuyu · Katlanmış kâğıt', x: -3.1, z: -10.5, y: 1.15,
    body: 'Mezarlığın dışındaki toprağa bırakılan isimlerin yanında ne yıkama ne de kefen kaydı var. Süleyman’ın notu: “Korku vazifeyi yarım bıraktı. İsimleri unutmayın.”' },
] as const;

/** A single location cue per night is chosen at a time; repeated frames cannot retrigger it. */
export const DERMANLI_EVENTS = [
  { id: 'gasil', x: -10.5, z: 6, radius: 3, minNight: 1, text: 'Teneşirin yanından hafif bir su sesi geliyor. Musluk kapalı.' },
  { id: 'meydan', x: 4.8, z: 12.5, radius: 4, minNight: 1, text: 'Sessiz meydanda çeşmeden bir an su sesi duyuluyor.' },
  { id: 'cami', x: -10.5, z: 0, radius: 3, minNight: 2, text: 'Caminin içinden, boş bir odada sürüklenen kumaşın sesi yükseliyor.' },
  { id: 'ev', x: -10.8, z: -10.5, radius: 4, minNight: 2, text: 'Terk edilmiş evin penceresinde bir ışık yanıp sönüyor.' },
  { id: 'kuyu', x: -3.1, z: -10.5, radius: 3, minNight: 2, text: 'Kuyunun içinden bir fısıltı geliyor; sözleri seçilmiyor.' },
  { id: 'degirmen', x: -36, z: 8, radius: 5, minNight: 3, text: 'Değirmen çarkı karanlıkta kendiliğinden dönüyor.' },
  { id: 'okul', x: 43, z: -65, radius: 6, minNight: 4, text: 'Boş sınıftan tebeşirin tahtaya değme sesi geliyor.' },
  { id: 'mezarlik', x: -34, z: -36, radius: 7, minNight: 5, text: 'Mezarlığın dışındaki taze toprağa yağmur vuruyor.' },
] as const;
export function nearbyStoryEvent(seconds: number, x: number, z: number, seen: ReadonlySet<string>) {
  if (!isEvening(seconds)) return null;
  const night = Math.min(5, survivalDay(seconds));
  for (const event of DERMANLI_EVENTS) {
    const key = `${night}:${event.id}`;
    if (night >= event.minNight && !seen.has(key) && Math.hypot(x - event.x, z - event.z) < event.radius)
      return { key, event };
  }
  return null;
}
