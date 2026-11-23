import type { AutopsyCaseId } from './types';

interface RegisterField {
  label: string;
  options: string[];
  answer: string;
}
interface DeliveryFile {
  number: string;
  documents: [string, string][];
  fields: [RegisterField, RegisterField];
  note: string;
}

/** A gassal records the clinician's findings; the player need not perform an examination. */
export const DELIVERY_FILES: Record<AutopsyCaseId, DeliveryFile> = {
  case_arif: {
    number: '071',
    documents: [
      [
        'İmzalı hekim raporu',
        '15 Kasım, saat 21.30. Hacı Arif Efendi, hane 06. Raporda dere suyu ve yabancı bir madde saptandığı, ölümün doğal olmadığı yazılı. İlçe hekiminin imzası okunuyor.',
      ],
      [
        'İmzasız teslim pusulası',
        '“Gece yarısı. Kalbi durmuş.” Saatin üstü çizilmiş. Getirenin imzası yerine iki kez basılmış bir muhtarlık mührü var.',
      ],
    ],
    fields: [
      { label: 'Doğrulanabilen ölüm saati', options: ['00.00', '21.30', '01.15'], answer: '21.30' },
      {
        label: 'Kayda esas belge',
        options: ['Teslim pusulası', 'Köy söylentisi', 'İmzalı hekim raporu'],
        answer: 'İmzalı hekim raporu',
      },
    ],
    note: 'Resmî raporla teslim pusulası uyuşmuyor. Mühürlü dosyayı meydandaki Bekçi Hasan’a göster.',
  },
  case_mahmut: {
    number: '072',
    documents: [
      [
        'Sağlık ocağı cetveli',
        'Şoför Mahmut’un satırında ölüm saati 21.15. Kenar notu: “Çay fincanı tahlile gönderildi.” Bu satırın mürekkebi öteki kayıtlardan daha soluk.',
      ],
      [
        'Viraj kaza tutanağı',
        'Jandarma 14. kilometredeki minibüs kazasını 22.40’ta kaydetmiş. Sürücünün hanesine sonradan “Mahmut” yazılmış.',
      ],
    ],
    fields: [
      {
        label: 'Önce gerçekleşen olay',
        options: ['Minibüs kazası', 'Mahmut’un ölümü', 'İkisi aynı anda'],
        answer: 'Mahmut’un ölümü',
      },
      {
        label: 'İki saat arasındaki fark',
        options: ['25 dakika', '65 dakika', '85 dakika'],
        answer: '85 dakika',
      },
    ],
    note: 'Şoför kazadan önce ölmüş. Cetveli defterine aldın; değirmencinin defterinde aynı el yazısını ara.',
  },
  case_unknown: {
    number: '073',
    documents: [
      [
        'Yolcu listesi',
        'Son koltuğun karşısında isim yok. Kâğıtta kalan tek iz, 22.42 damgalı bir biletin karbon kopyası.',
      ],
      [
        'Emanet zarfı',
        'Zarfta camı çatlamış bir saat var. Akrep ve yelkovan 22.42’de durmuş. Kimlik belgesi teslim edilmemiş. Saati cebindekinden ayıramıyorsun.',
      ],
    ],
    fields: [
      {
        label: 'Kimlik hanesine geçirilecek kayıt',
        options: ['Hacı Arif Efendi', 'Kimliği belirsiz yolcu', 'Şoför Mahmut'],
        answer: 'Kimliği belirsiz yolcu',
      },
      {
        label: 'Bileti doğrulayan emanet',
        options: ['Mühürlü pusula', 'Pirinç anahtar', '22.42’de duran saat'],
        answer: '22.42’de duran saat',
      },
    ],
    note: 'Yolcuyu isimsiz kaydettin. Biletin neden tanıdık geldiğini artık biliyorsun. Muhtarlıkta kalan son tutanağa bak.',
  },
};

export function validDelivery(caseId: AutopsyCaseId, answers: readonly string[]) {
  const fields = DELIVERY_FILES[caseId].fields;
  return (
    answers.length === fields.length && fields.every((field, i) => answers[i] === field.answer)
  );
}
