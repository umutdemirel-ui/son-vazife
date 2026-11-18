# Son Vazife

**Kuzdağ Köyü, Kasım 1993.** Yeni gassalın ilk işi sıradan bir teslim fişini deftere geçirmek. Sorun, aynı kişinin aynı haneden yirmi yıl önce de uğurlanmış olması.

Türkçe, tek oyunculu bir tarayıcı korku oyunu. Bu prototip, köye varıştan şafağa uzanan bir nöbete odaklanır. Köy ve olaylar kurmacadır.

![Oyun içinden: Kuzdağ çeşmesinde dövme bakır ibrik, karşısında cumbalı hane ve taş ev.](docs/kuzdag-cesmesi.webp)

## Oynamak

- **Oyuna başla** ile ilk nöbete gir. Fişi eski kayıtlarla karşılaştır; telefon çalınca vereceğin karşılık sana kalmış. Önsöz atlanabilir.
- **Meydana çık** üç boyutlu keşfi başlatır. Bulduğun kayıt defterine taşınır ve Bekçi Hasan’la yeni bir konuşma seçeneği açar.
- Gasilhanede, sağlık ocağında ve taş mahzende **teslim dosyaları** var. Belgeleri karşılaştırıp iki alanı doğru doldurarak dosyayı mühürleyebilirsin. Adli inceleme tezgâhı alternatif bir yoldur; hikâyede ilerlemek için onu kullanmak gerekmez.
- Meydanı, değirmeni, mezarlığı ve virajı araştır; malzemeleri topla ve gasilhaneye dön. Köyün gerçekleri tanıklar, eşyalar ve çelişkili tutanaklarda saklı.
- **Köy arşivi** menüde dört fotoğraf ve kenar notu içerir. Oyun içindeki **defter** ise topladığın kanıtları, haritayı ve kendi notlarını tutar.

**Kontroller:** WASD ile yürü, fareyle bak, E ile etkileşime gir. Shift koşu, C eğilme, F mum, Tab defter/harita, M ses ve Esc duraklatmadır. Fare kilidi yoksa basılı tutup sürükle. Dokunmatikte sol hareket pedi ve sağ bakış alanı kullanılır.

Önsöz, köy ilerlemesi ve tercihler bu tarayıcıda saklanır. **Devam et** son kaydı açar. Menü ve önsöz WebGL gerektirmez; üç boyutlu keşif WebGL 2 gerektirir. Sesler Web Audio ile ilk kullanıcı etkileşiminden sonra üretilir.

### Düşük sistemde oynamak

**Ayarlar → Görüntü kalitesi → Asgari** seçip köye gir. Zayıf cihazlarda Otomatik de bu profili seçebilir. Yakındaki evler ve eşyalar üç boyutlu, tanıklar animasyonludur; kazanç uzak ayrıntılardan, daha küçük dokulardan ve daha az çizimden gelir. Yüksek çözünürlüklü paket Asgari oturumda indirilmez. [Ölçümler, test cihazı ve sınırlar](docs/performans.md).

## Çalıştırmak

```sh
bun install --frozen-lockfile
bun run dev
```

Node.js 22.12+ ile `npm install` ve `npm run dev` de kullanılabilir. Vite 3000 portunda açılır. Sunucu hesabı, harici font servisi veya API anahtarı gerekmez.

```sh
npm test        # Kayıtlar, evrak eşleştirmeleri, tanık konuşması ve tercihler
npm run lint    # TypeScript denetimi
npm run build   # Üretim çıktısı: dist/
```

## Varlıklar

`public/assets/archive/` altındaki sahne ve arşiv görselleri oyun için üretilmiştir. Yazı tipleri Türkçe karakterleri içeren yerel alt kümelerdir; lisansları `public/fonts/licenses/` içindedir. Atölyedeki kaynaklar menüde indirilmez: oyun `public/assets/workshop/` içindeki hazır modelleri ve `public/assets/village/` içindeki işlenmiş yüzeyleri kullanır.

Cumbalı, hımış ve taş haneler; kemerli hayrat çeşmesi, gasilhane girişi, tahta sandıklar, işlemeli bakır ibrik, ciltli defter, bağlı kefen ve sabun oyun dünyasının parçalarıdır. [Bekçi Hasan'la meydanda](docs/kuzdag-meydani.webp) karşılaşabilirsin; Şerife Nine, Katip Kenan ve Mezarcı İdris'in de ayrı iskeleti, kıyafeti ve eşyası vardır. Model kaynakları ve yeniden üretim için [Kuzdağ atölyesi](art/README.md).
