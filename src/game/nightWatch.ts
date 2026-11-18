import type { ClueDocument, GameAct } from './types';

/** Each entry is a real object. The filed entries themselves are the checkpoint; there is no second quest counter to drift out of sync with the notebook. */
export const NIGHT_ORDER = [
  'night_tag',
  'night_roll',
  'night_bell',
  'night_bag',
  'night_ticket',
  'night_signal',
  'night_spool',
  'night_relay',
  'night_line',
  'night_register',
  'night_memorial',
  'night_verdict',
  'night_drawing',
  'night_echo',
  'night_call',
] as const;
export type NightId = (typeof NIGHT_ORDER)[number];
export const NIGHT_TITLES = {
  6: 'BÖLÜM VI · BOŞ SIRALAR',
  7: 'BÖLÜM VII · SON PERON',
  8: 'BÖLÜM VIII · KAPANMAYAN HAT',
} as const;
interface Page {
  act: 6 | 7 | 8;
  folio: string;
  title: string;
  place: string;
  objective: string;
  prompt: string;
  text: string;
  entry: string;
  kind: 'report' | 'select' | 'sequence' | 'decision';
  action: string;
  choices?: readonly string[];
  answer?: readonly number[];
  hint?: string;
}
export const PAGES: Record<NightId, Page> = {
  night_tag: {
    act: 6,
    folio: 'N / 01',
    title: 'İpli etiket',
    place: 'Gasilhane · Yolcu sedyesi',
    objective: 'Gasilhanede güney duvarındaki yolcu sedyesine bak. Bilete bağlı etiketi çöz.',
    prompt: 'Yolcunun nakil fişini çevir',
    text: 'İdris iki sedyeyi teslim etmiş. Yolcunun ayak ucundaki etiket, kapatılmış köy mektebinin kartonundan kesilmiş. Arkasında bir çocuk el yazısı var: “Öğretmenim, son zilden sonra istasyonda bekleyeceğim.” Tarih: 16 Kasım 1973.',
    entry:
      'Nakil etiketinin arkasındaki yazı yirmi yıllık. Mektepteki nöbetçi öğretmenin yoklama defterini bulmalıyım.',
    kind: 'report',
    action: 'Etiketi deftere iliştir',
  },
  night_roll: {
    act: 6,
    folio: 'M / 02',
    title: 'Yoklamadan sonra',
    place: 'Sarı Mektep · Öğretmen masası',
    objective:
      'Sağlık ocağının yanından kuzeydoğuya çıkan Mektep Yolu’nu izle. Derslikte öğretmen masasını bul.',
    prompt: 'Öğretmenin yoklamasını oku',
    text: 'Son sayfada isimler değil, zil işaretleri var. “Tek kısa: ders başı. İki uzun: yangın. Kısa, uzun, kısa: kayıp yolcu. Bu son işareti duyan hademe avludaki bez çantayı açar.” Kapıya asılı çanın ipi, rüzgâr olmadığı hâlde sallanıyor.',
    entry: 'Kayıp yolcu çağrısı: kısa — uzun — kısa. Mektep kapısının sağındaki avlu çanında çalınacak.',
    kind: 'report',
    action: 'Zil işaretlerini kopyala',
  },
  night_bell: {
    act: 6,
    folio: 'M / 03',
    title: 'Avlu çanı',
    place: 'Sarı Mektep · Revak',
    objective: 'Mektebin önündeki pirinç çanda yoklamadaki kayıp yolcu çağrısını çal.',
    prompt: 'Çanın ipini tut',
    text: 'İpi çekip hemen bırakırsan kısa, biraz beklersen uzun bir ses duyuluyor. Son yoklamadaki kayıp yolcu çağrısını tekrarla. Üçüncü vuruştan sonra dinle.',
    entry:
      'Avluda üç vuruş yankılandı. Cevap, karanlık sınıftaki raftan geldi: bez çantanın tokası düştü.',
    kind: 'sequence',
    choices: ['Kısa', 'Uzun'],
    answer: [0, 1, 0],
    action: 'Yankıyı dinle',
    hint: 'Yoklama kenarına yazılan çağrı kısa, uzun, kısa idi.',
  },
  night_bag: {
    act: 6,
    folio: 'M / 04',
    title: 'Hademenin bez çantası',
    place: 'Sarı Mektep · Derslik rafı',
    objective: 'Dersliğe dön. Tahtanın sağındaki çantadan istasyon biletini çıkar.',
    prompt: 'Bez çantayı aç',
    text: 'Bozuk paraların arasında ikiye katlanmış bir peron bileti var. Saat hanesinin üstünde tren mührü değil, küçük bir minibüs resmi duruyor; kenarda iki çentik var. Eşikteki ayak izleri doğuya, kapalı istasyona dönmüş.',
    entry:
      'Çantadaki bilette minibüs resmi ve iki çentik var. Gişedeki dipkoçanlarla karşılaştır.',
    kind: 'report',
    action: 'Peron biletini sakla',
  },
  night_ticket: {
    act: 7,
    folio: 'İ / 05',
    title: 'Gişe cetveli',
    place: 'Kuzdağ İstasyonu · Bekleme salonu',
    objective:
      'Doğu yolunu güneye, kapalı istasyona kadar takip et. Gişe masasındaki dipkoçanları incele.',
    prompt: 'Gişe cetvelini karşılaştır',
    text: '19.10 / Peron I: kömür vagonu, tek yuvarlak delik. 22.40 / Peron II: karayolu aktarması, iki çentik. 22.42 / Peron III: tarifede sefer yok; satırı farklı mürekkeple birisi sonradan doldurmuş. Dipkoçanı seçmeden önce çantadaki bilete tekrar bak.',
    entry:
      'Gişe cetvelindeki saat ve peron satırları, çantadaki biletle karşılaştırılmalı.',
    kind: 'select',
    choices: ['I · Kömür vagonu', 'II · Karayolu aktarması', 'III · İlave sefer'],
    answer: [1],
    action: 'Eşleşen koçanı ayır',
    hint: 'Biletteki taşıt ve iki çentik yalnızca aktarma satırında birlikte geçiyor.',
  },
  night_signal: {
    act: 7,
    folio: 'İ / 06',
    title: 'Peron göstergesi',
    place: 'İstasyon · Doğu peronu',
    objective: 'Peronun doğu ucunda mum sönükken eğil. Kırmızı kolu cetveldeki gerçek perona getir.',
    prompt: 'Peron işaretini değiştir',
    text: 'Levhada üç çizik var. Kolu yolcunun gerçekten indiği perona bırakırsan gişe kayıt makinesi o hattı okuyacak. Gözcü traverslerin öbür ucunda; sığınağın bekleme salonu.',
    entry: 'Peron II açık. Bekleme salonundan bant makaralarının dönme sesi geliyor.',
    kind: 'select',
    choices: ['I', 'II', 'III'],
    answer: [1],
    action: 'Kolu kilitle',
    hint: 'Gişe cetvelindeki karayolu aktarması II numaralı peronda.',
  },
  night_spool: {
    act: 7,
    folio: 'İ / 07',
    title: 'Son anons',
    place: 'İstasyon · Kayıt makinesi',
    objective: 'Bekleme salonundaki çift makaralı kayıt makinesine dön ve son anonsu çöz.',
    prompt: 'Son anons bandını sar',
    text: 'Bantta istasyon şefinin sesi var: “Önce evin abonesini, sonra yolun kilometresini, en son harici hattı bağla. Gasilhane altı. Viraj on dört. Hariç sıfır. Dere dağıtım kutusundaki sarı örgü hat hâlâ sağlam.” Ardından, az önce avluda çaldığın zil duyuluyor.',
    entry:
      'Santral bağlantı sırası: 06 → 14 → 00. Önce değirmenin güneybatısındaki dağıtım kutusunda sarı örgü çifti seç.',
    kind: 'report',
    action: 'Anonsu yazıya geçir',
  },
  night_relay: {
    act: 8,
    folio: 'S / 08',
    title: 'Dere dağıtım kutusu',
    place: 'Değirmen–Santral servis yolu',
    objective:
      'Değirmenin güneybatısına, servis yolunun kıvrımındaki dağıtım kutusuna git. İstasyon bandındaki hattı bul.',
    prompt: 'Dağıtım kutusunu incele',
    text: 'Yağmurdan etiketler silinmiş. Üç eski abone kordonu var: biri beyaz bez, biri sarı örgü, biri kömür karası. İstasyon şefinin sağlam dediği çifti dinleme mandalına al.',
    entry: 'Sarı çiftte çevir sesi var. Servis yolunu güneye izleyip Sırt Santrali’ndeki panoya git.',
    kind: 'select',
    choices: ['Beyaz bez', 'Kömür karası', 'Sarı örgü'],
    answer: [2],
    action: 'Hattı dinle',
    hint: 'Bantta şef “sarı örgü” diyordu. Elektrik değil, eski bir abone hattı.',
  },
  night_line: {
    act: 8,
    folio: 'S / 09',
    title: 'Gece santrali',
    place: 'Sırt Santrali · Bağlantı panosu',
    objective: 'Servis yolundan Sırt Santrali’ne çık. Panoda üç aboneyi anons sırasıyla bağla.',
    prompt: 'Santral panosuna geç',
    text: 'Masadaki karta göre 00 hariç, 06 gasilhane, 14 viraj. Bantta yerler bir sıra hâlinde okunmuştu. Yanlış bağlarsan yalnızca kendi nefesini duyarsın.',
    entry:
      'Hat açıldı, ancak karşıdaki ses cevap vermeden aile yoklamasını hatırlattı. Mektepteki pencereye dönmeliyim.',
    kind: 'sequence',
    choices: ['00', '06', '14'],
    answer: [1, 2, 0],
    action: 'Çevir sesini sınayıp bağla',
    hint: 'Şefin sırası ev, yol, hariçti: 06, 14, 00.',
  },
  night_register: {
    act: 8, folio: 'M / 10', title: 'Silinen hane',
    place: 'Sarı Mektep · Sınıf penceresi',
    objective: 'Telefonu açmadan mektebe dön. Sınıf penceresindeki aile yoklamasını incele.',
    prompt: 'Aile yoklamasını oku',
    text: 'Öğretmenin ikinci listesinde üç kişi aynı haneye yazılmış: anne Elif, baba Kemal, çocuk Derya. Derya adının üstü çizilmemiş; yalnızca hanenin adresi değiştirilmiş. Kenardaki not: “Defne ağacının altında üç değil, iki taş.”',
    entry: 'Derya yoklamadan silinmemiş; hane başka yere taşınmış. Mezarlıktaki iki taşın yanındaki bakım defterini bul.',
    kind: 'report', action: 'Yoklamayı deftere iliştir',
  },
  night_memorial: {
    act: 8, folio: 'Z / 11', title: 'İki taş',
    place: 'Mezarlık · Avlu',
    objective: 'Mezarlık avlusunda iki taşın yanındaki bakım defterini incele.',
    prompt: 'Mezarlık defterini aç',
    text: 'İdris iki taşı Kemal ve Elif için dikmiş. Defterde Derya için ölüm kaydı yok. Sayfanın altına “İki taş, üç isim değil. Son tanık kayıt makinesindeki ikinci bantta” yazmış. Listede kaç kişi için ölüm kaydı var?',
    entry: 'İki mezar kaydı var; Derya’nın ölümü belgelenmemiş. İstasyondaki ikinci bant son tanığı saklıyor.',
    kind: 'select', choices: ['Bir kişi', 'İki kişi', 'Üç kişi'], answer: [1],
    action: 'Kayıtları karşılaştır', hint: 'Bakım defterinde yalnızca Kemal ve Elif adına taş bulunuyor.',
  },
  night_verdict: {
    act: 8, folio: 'İ / 12', title: 'İkinci bant',
    place: 'İstasyon · Bekleme salonu',
    objective: 'İstasyona dön ve bekleme salonundaki ikinci bandı dinle.',
    prompt: 'İkinci bandı dinle',
    text: 'Bantta yetişkin bir kadın konuşuyor: “Ben Derya. O gece trene binmedim; beni hastaneye götürdüler. Ailemin adı kayıtlardan silinmesin.” Ardından Kenan’ın sesi: “Tarihi değiştirdim, ama ölüm kaydını uydurmadım.” Şimdi bildirilecek olan ne?',
    entry: 'Derya tanıktı; ailesinin iki mezarı ve değiştirilmiş adres tek başına onun ölümünü kanıtlamıyor. Mektepteki çizimi yeniden incele.',
    kind: 'select', choices: ['Üçü de trende öldü', 'İki mezar ve sağ kalan tanık', 'Hiç kayıt yok'], answer: [1],
    action: 'Tanıklığı kaydet', hint: 'Mezarlık defterinde iki ölüm kaydı, bantta Derya’nın kendi sesi var.',
  },
  night_drawing: {
    act: 8, folio: 'M / 13', title: 'Boş sıradaki resim',
    place: 'Sarı Mektep · Pencere sırası',
    objective: 'Mektebe dön. Pencere sırasındaki çizimi, tanığın sesiyle karşılaştır.',
    prompt: 'Sıradaki çizimi çevir',
    text: 'Sıraya kazınmış üç çubuk insanın yanında yalnız iki taş var. Kâğıdın arkasında Derya’nın yazısı: “Babam aradığında hat iki kez kesildi. Biri üçüncü kez benim adımla konuştu.” Çizimde kaç taş var?',
    entry: 'Çizimde iki taş var; üçüncü sesin kaynağı santraldeki kesinti kaydında aranmalı.',
    kind: 'select', choices: ['Bir taş', 'İki taş', 'Üç taş'], answer: [1],
    action: 'Çizimi karşılaştır', hint: 'Derya iki taşı, üç kişiden ayrı çizmiş.',
  },
  night_echo: {
    act: 8, folio: 'S / 14', title: 'Üçüncü ses',
    place: 'Sırt Santrali · Servis masası',
    objective: 'Santrale dön ve servis masasındaki kesinti kaydını oku.',
    prompt: 'Kesinti kaydını incele',
    text: 'Teknisyenin notunda 06 hattının iki kez koptuğu, üçüncü aramanın hiçbir aboneye bağlanmadığı yazıyor. Buna rağmen ahizeden bir çocuk sesi duyulmuş: “Kapıyı açma, ben hâlâ sıradayım.” Şimdi bile hat açık; karşı tarafta biri senin nefes alışını taklit ediyor. Hangi hat kesilmişti?',
    entry: '06 hattı iki kez kesilmiş; üçüncü sesin kaynağı kayıtlarda yok. Son çağrıda yalnız kanıtlanmış isimleri bildir.',
    kind: 'select', choices: ['00', '06', '14'], answer: [1],
    action: 'Kesintiyi kaydet', hint: 'Gasilhanenin numarası 06 idi.',
  },
  night_call: {
    act: 8,
    folio: 'G / 15',
    title: 'Şafak hattı',
    place: 'Gasilhane · Kabul telefonu',
    objective: 'Meydana dön. Gasilhane kapısının iç yanındaki telefondan son çağrıya cevap ver.',
    prompt: 'Ahizeyi kaldır',
    text: 'Hat ilk kez boş değil. İlçe memuru adını soruyor. Masada üç teslim fişi, cebinde 1973 tarihli bir bilet var. Bu kez hatta ne kalacağı sana bağlı.',
    entry: 'Gece hattının başında son karar verildi.',
    kind: 'decision',
    choices: ['Mühürlü dosyaları ilçeye bildir', 'İsimleri söylemeden vedalaş'],
    action: 'Ahizeyi bırak',
  },
};
export const NIGHT_CLUES: ClueDocument[] = NIGHT_ORDER.map((id) => ({
  id,
  title: PAGES[id].title,
  subtitle: PAGES[id].place,
  body: PAGES[id].entry,
  discovered: false,
}));
export function nextNightPage(found: (id: NightId) => boolean): NightId | undefined {
  return NIGHT_ORDER.find((id) => !found(id));
}
export function nightAct(found: (id: NightId) => boolean): GameAct {
  return PAGES[nextNightPage(found) ?? 'night_call'].act;
}
export function isNightId(id: string): id is NightId {
  return Object.hasOwn(PAGES, id);
}
/** A saved per-playthrough variant; the symbol is on the stretcher tag, its codebook is at school. */
const bellPatterns = [[0, 1, 0], [1, 0, 1], [0, 0, 1], [1, 1, 0]] as const;
const marks = ['daire', 'üçgen', 'kare', 'yıldız'] as const;
const sequences = [[1, 2, 0], [2, 0, 1], [0, 1, 2], [1, 0, 2]] as const;
export function nightPageFor(id: NightId, seed: number): Page {
  const n = ((seed % 4) + 4) % 4;
  const page = PAGES[id];
  if (id === 'night_tag') return { ...page,
    text: `${page.text} Etiketin köşesine bir ${marks[n]} çizilmiş. Öğretmen bu işaretin hangi çağrıya ait olduğunu biliyordu.`,
    entry: `Yolcunun etiketindeki işaret: ${marks[n]}. Mektepteki yoklama ve çağrı anahtarını bul.` };
  if (id === 'night_roll') {
    const table = marks.map((mark, i) => `${mark}: ${bellPatterns[i].map(v => v ? '—' : '•').join(' ')}`).join(' / ');
    return { ...page, text: `Yoklamanın kenarında bir çağrı anahtarı var: ${table}. Altında “nokta kısa, çizgi uzun” yazıyor. Çağrıyı seçmek için yolcunun etiketindeki işareti hatırla.`,
      entry: `Çağrı anahtarı: ${table}. Nokta kısa, çizgi uzun; etiketin işareti hangi satırın seçileceğini gösteriyor.` };
  }
  if (id === 'night_bell') return { ...page, answer: bellPatterns[n], hint: undefined };
  if (id === 'night_spool') {
    const labels = ['harici hat', 'gasilhane', 'viraj'];
    const order = sequences[n].map(i => labels[i]).join(' → ');
    return { ...page, text: `Bantta şef kesik kesik konuşuyor: “${order}.” Sonra “Sağlam kordon, eski düğün kuşağının rengi” diyor. Ardından avludaki zil duyuluyor.`,
      entry: `Banttaki yer sırası: ${order}. Sağlam kordon eski düğün kuşağının renginde.` };
  }
  if (id === 'night_line') return { ...page, answer: sequences[n], hint: undefined };
  return page;
}
export function correctPage(id: NightId, input: readonly number[], seed = 0) {
  const page = nightPageFor(id, seed);
  if (page.kind === 'decision') return input.length === 1 && (input[0] === 0 || input[0] === 1);
  const expected = page.answer ?? [];
  return expected.length === input.length && expected.every((v, i) => v === input[i]);
}

export const FIELD_NOTES = {
  seyir_tahta: {
    title: 'Tahtadaki son tarih',
    subtitle: 'Sarı Mektep · Kara tahta',
    body: 'Tebeşirle 16 Kasım yazılmış. Altında bir çocuğun çizdiği köy ve bir işaret var. Yeni bir tarih için hiç yer silinmemiş.',
  },
  seyir_sef: {
    title: 'Saati durmuş memur',
    subtitle: 'Son peron · Şapkalı nöbetçi',
    body: 'Şefin yüzü bir saat kadranı. Saniye kolu yok, akrep ile yelkovan 22.42’de. Ağzı olmadan konuştu: “İki çentik, ikinci peron. O gece trene binen olmadı.”',
  },
  seyir_peron: {
    title: 'İptal levhası',
    subtitle: 'Kuzdağ İstasyonu · Peron',
    body: 'Hattın Kasım 1973’te yolcu trafiğine kapandığı yazılı. O günden sonra anlatılan tren sesleri tarifeye ait olamaz.',
  },
  seyir_abone: {
    title: 'Son abone',
    subtitle: 'Sırt Santrali · Duvar levhası',
    body: 'Kapıdaki eski şebeke kartında en son sökülecek telefon işaretlenmiş: gasilhane, 06. İlk nöbetimde çalan telefon bu hat üzerindeydi.',
  },
} as const;
export const FIELD_CLUES: ClueDocument[] = Object.entries(FIELD_NOTES).map(([id, n]) => ({
  id,
  ...n,
  discovered: false,
}));
export function nightStealthPrompt(id: NightId, crouched: boolean, lit: boolean) {
  return id === 'night_signal' && (!crouched || lit)
    ? 'Gözcü peronda. Işığı söndür [F] ve eğil [C]; sonra kolu kullan.'
    : null;
}
