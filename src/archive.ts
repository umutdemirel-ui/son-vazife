export interface ArchiveEntry {
  title: string;
  image: string;
  alt: string;
  category: string;
  caption: string;
  description: string;
  note: string;
}

// The four prints can be inspected before play; none gives away a case solution.
export const ARCHIVE: ArchiveEntry[] = [
  {
    title: 'Kuzdağ Köyü',
    image: '/assets/archive/kuzdag.jpg',
    alt: 'Dağların arasında, dar bir sokağa bakan eski ahşap köy evleri.',
    category: 'Yerleşim',
    caption: 'Anadolu, Kasım 1993',
    description:
      'Minibüsün son durağı. Meydandaki çeşmeden su akıyor, ama karşısındaki üç evin bacası da soğuk. Köyün yeni gassalını bekleyen tek kişi, anahtarları taşıyan bekçi.',
    note: 'Gece gelen cenazelerle ilgili soru sorma.',
  },
  {
    title: 'Gasilhane',
    image: '/assets/archive/gasilhane.jpg',
    alt: 'Tek ampulle aydınlanan taş bir odada boş teneşir ve bakır ibrik.',
    category: 'İç mekân',
    caption: 'Cami avlusu, 1993',
    description:
      'İbrik taşın sağında, temiz bezler soldaki dolapta. Senden önce çalışan gassal odasını yarın dönecekmiş gibi bırakmış. Kapının arkasında bir tek anahtar eksik.',
    note: 'Çıkarken ışığı kapatmıştım. Buna eminim.',
  },
  {
    title: 'Eski Mezarlık',
    image: '/assets/archive/mezarlik.jpg',
    alt: 'Sisli bir yamaçta serviler arasında eski mezar taşları ve demir bir kapı.',
    category: 'Dış mekân',
    caption: 'Kuzey yamacı, 1993',
    description:
      'Yokuşun sonunda demir bir kapı var. Taşların bazıları okunmayacak kadar eski. Yalnızca birinin üzerindeki harfler yeni kazınmış; altındaki tarihse yirmi yıl öncesine ait.',
    note: 'Defterde yazan herkes burada yatmıyor.',
  },
  {
    title: 'Muhtarlık Odası',
    image: '/assets/archive/defter.jpg',
    alt: 'Eski bir ahşap masada açık kayıt defteri, dolma kalem ve çevirmeli telefon.',
    category: 'Kayıt odası',
    caption: 'Köy meydanı, 1993',
    description:
      'Raflarda her yıl için bir cilt ayrılmış. Bazı yılların sırtında etiket yok. Masanın çekmecesinde kurumuş bir ıstampa, hemen yanında hâlâ ıslak bir mühür duruyor.',
    note: 'Telefonun hattını geçen kış sökmüşlerdi.',
  },
];

export const serial = (n: number, length = 2) => String(n).padStart(length, '0');
