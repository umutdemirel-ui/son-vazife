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
    title: 'Dermanlı Köyü',
    image: '/assets/archive/kuzdag.jpg',
    alt: 'Dağların arasında, dar bir sokağa bakan eski ahşap köy evleri.',
    category: 'Yerleşim',
    caption: 'Anadolu, Kasım 1993',
    description:
      'Gassal Halil ustasının mektubuyla ıssız Dermanlı’ya gelir. Meydan, evler ve çevresindeki yollar sessizliğe gömülmüştür.',
    note: 'Gece gelen cenazelerle ilgili soru sorma.',
  },
  {
    title: 'Gasilhane',
    image: '/assets/archive/gasilhane.jpg',
    alt: 'Tek ampulle aydınlanan taş bir odada boş teneşir ve bakır ibrik.',
    category: 'İç mekân',
    caption: 'Cami avlusu, 1993',
    description:
      'Teneşir ve malzemeler yerlerinde. Her gece yarım kalmış bir son vazife bu odada tamamlanmayı bekler.',
    note: 'Çıkarken ışığı kapatmıştım. Buna eminim.',
  },
  {
    title: 'Eski Mezarlık',
    image: '/assets/archive/mezarlik.jpg',
    alt: 'Sisli bir yamaçta serviler arasında eski mezar taşları ve demir bir kapı.',
    category: 'Dış mekân',
    caption: 'Kuzey yamacı, 1993',
    description:
      'Kuzeydeki mezarlıkta eski taşların arasından bir yol geçer. Yıpranmış kayıtlar bazı isimlerin eksik olduğunu düşündürür.',
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
