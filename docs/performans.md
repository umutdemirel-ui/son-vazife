# Kuzdağ: düşük sistem ölçümü

**Oynamak için:** Önce **Ayarlar → Görüntü kalitesi → Otomatik** seçilebilir. Zayıf bir cihazda doğrudan **Asgari** seçip köye girmek, yüksek çözünürlüklü varlıkları hiç indirmemenin yoludur. Ziyaret sırasında çizim kalitesi değişir; doku/model paketi bir sonraki köye girişte değişir. Menü, evraklar ve HUD, 3B sahnenin iç çözünürlüğünden bağımsızdır.

## Sekiz bölümlü gece nöbeti · güncel ölçüm

Aşağıda tarif edilen aynı SwiftShader ortamında, aynı yöntemle alındı. **Otomatik → Asgari**, sabit bakış 384 × 240; süre simülasyon, çizim ve bir pikselin geri okunmasını içerir. Medyan / p90 milisaniye:

| Kamera | Medyan / p90 | Çizim çağrısı | Üçgen |
|---|---:|---:|---:|
| Meydan (başlangıç) | 79,9 / 97,2 | 74 | 40.845 |
| Çeşme | 81,4 / 105,9 | 40 | 29.240 |
| Gasilhane (ilk dosya) | 93,4 / 105,9 | 61 | 31.022 |
| Gasilhane (iki nakilden sonra) | 115,2 / 134,6 | 67 | 34.982 |
| Sarı Mektep, derslik | 70,8 / 93,3 | 19 | 14.394 |
| Son peron, nöbetçi | 93,1 / 112,0 | 54 | 33.136 |
| Sırt Santrali, pano | 95,0 / 116,6 | 41 | 26.952 |

- **Başlangıç rotası:** Meydan–çeşme–gasilhane için 28 köy varlığı / 2.214.837 bayt (önceki atölye sürümünde 26 / 2.003.149). Yeni ziyaret sırasında Arif ve eşya atlası eklenir; uzak bina ve gece karakterleri menü maliyeti değildir.
- **Eşit piksel sayısı:** 760 × 475'te güncel meydan / çeşme / gasilhane medyanları 167,6 / 169,2 / 225,1 ms. Önceki `448109f` ölçümü 167,1 / 151,6 / 224,0 ms. Genişleme bedelsiz değil; özellikle çeşme kamerasında daha fazla sokak çiziliyor.
- **Serbest döngü:** 288 × 180'e uyarlanan çizicide meydanda 12,4, gece peronunda 10,7 kare gönderimi/sn. Bunlar donanım FPS'i veya asgari FPS vaadi değildir. Gece kamera deneyi ölçümden **önce** on küçük gece modelinin tamamını hazırlar; bu koşudaki 36 istek / 2.917.625 bayt açılış trafiği değildir. `public/` içeriği artık 16,2 MiB'dır.
- Ham çıktılar: [güncel başlangıç](perf/nobet-auto.json), [760 piksel](perf/nobet-760.json), [gece rotası](perf/nobet-gece.json).

**Oynanış ve varlık denetimi:** `scripts/check-night.mjs` gerçek tarayıcıda üç dosyayı, eski v2 kaydını, mektep–istasyon–santral zincirini, yanlış zil ve santral sırasını, takip/saklanmayı ve üç sonu sınar. Yolculuğu kısaltmak için bakış noktalarını taşır; duvarları, kapı eşiklerini, hedef ışınlarını, E tuşunu, diyalogları ve kayıt ekranlarını gerçek oyun üzerinden kullanır. İkinci koşuda on gece GLB isteğinin tamamı engellendi ve rota yine tamamlandı. Üretim paketinde **Devam et → harita → son telefon** akışı ayrıca denendi. Dağıtılan 48 GLB, Khronos doğrulayıcısında hata/uyarı vermedi.

## Önceki atölye sürümü: `89c6e62` → `448109f`

18 Kasım 2026; aynı Linux sanal makinesi, **2 vCPU**, işletim sistemine görünen **3,8 GiB RAM**, Chromium **153.0.8010.0**, WebGL 2 / ANGLE Vulkan **SwiftShader** (GPU yerine CPU ile çizim). 960 × 600 CSS piksel, DPR 1, yerel Vite, temiz tarayıcı oturumu. Bu bir **fiziksel ekran kartı testi veya RAM alt sınırı değildir**. WebGL 2 olmayan cihazda üç boyutlu bölüm açılmaz; menü, önsöz ve arşiv çalışır. Her cihazda 30/60 FPS garantisi yoktur.

Önceki sürüm `89c6e62`, aynı **Otomatik** tercihinde bu çizici için Düşük'ü seçiyordu; yeni sürüm Asgari'yi seçiyor. İki karşılaştırma yaptık:

1. **Aynı çizim çözünürlüğü:** Her iki sürümde 760 × 475; aşağıdaki süreler üç ısınma karesinden sonraki 11 örneğin medyanı ve p90'ı. Her örnekte simülasyon ve çizimden sonra bir piksel geri okunur; süre, yalnızca komut gönderimini değil GPU'nun o kare için çalışmasını ve geri okumayı da içerir. Bu duraklatmalı ölçüm normal oyun döngüsü değildir.
2. **Gerçek Otomatik davranışı:** Çözünürlüğe müdahale edilmez. Yeni sabit kamera örnekleri 384 × 240'ta başlar. Ardından serbest oyun döngüsünde yazılım çizicisinin tamamladığı işler geciktikçe iç çözünürlük bu makinede 288 × 180'e iner.

| Kamera | Önce: medyan / p90 (ms), 760 px | Sonra: medyan / p90 (ms), 760 px | Sonra: medyan (ms), Otomatik | Çizim çağrısı önce → sonra |
|---|---:|---:|---:|---:|
| Meydan, oyuncunun başlangıcı | 2.125,7 / 2.239,5 | 167,1 / 183,1 | 92,1 | 674 → 66 |
| Çeşme, eşyalara bakış | 585,6 / 651,4 | 151,6 / 197,0 | 76,0 | 62 → 31 |
| Gasilhane, tenesire bakış | 2.297,2 / 2.352,5 | 224,0 / 251,3 | 87,8 | 163 → 51 |

- **Meydanda serbest döngü:** 600 ms ısınmanın ardından 5,5 saniyede, render sayacına göre **0,9 → 11,1 kare gönderimi/sn**. Yeni sürümün ikinci koşusunda 13,3 ölçüldü. Bu değerler fiziksel ekran sunumu, simülasyon hızı veya bir oyun boyunca en düşük FPS değildir.
- **Soğuk oturumda köy varlıkları:** `/assets/` altındaki HTTP gövdeleri **14.545.296 → 2.003.149 bayt** (%86 azalma); istek **41 → 26**. JS/CSS, menü, önbellek ve HTTP başlıkları bu karşılaştırmada yoktur.
- **Kurulum:** Motor + yeni oyun çağrısı **948 → 231 ms** (ağ ve arka plandaki sanat yüklemeleri hariç). Üç kameradan sonra Three'nin bildirdiği GPU doku sayısı **52 → 25**, geometri sayısı **400 → 108**. Bunlar VRAM ölçümü değildir.
- Ham çıktılar: [önce](perf/89c6e62-auto.json), [sonra / Otomatik](perf/workshop-auto.json), [sonra / eşit piksel sayısı](perf/workshop-760.json).

## Maliyeti ne düşürdü?

- Sekiz hanede üç yerel, tek malzemeli bina ağı paylaşılır. Kiremit uçları, cumba, söveler ve gömme pencereler geometridir. Islak yalak, sabun rafı ve ibrik için ayrıca sahneyi yeniden kıran bir cam geçişi gerekmez.
- Asgari paket atlasları küçültür, dört tanığın daha hafif ama **aynı iskeletli ve animasyonlu** modellerini kullanır; normal/pürüz haritalarını veya on isteğe bağlı dekor modelini istemez. Düşük üç dekoru, üst paketler onu kullanır. Başarısız istekte kapı, eşya ve konuşma hedefleri çalışır.
- Fotoğrafik yüzeyler önceden hazırlanır. Tarayıcı açılırken yüz binlerce pikselden normal haritası hesaplamaz. 41 MiB'lık CC0 kaynakları dağıtım yerine atölyededir. `public/` bütünü **45,8 → 12,8 MiB**; bu disk ölçüsüdür, girişte indirilen miktar değildir.
- Hafif profillerde altı bölge yapısının uzaktaki dış kabuğu aynı geometri ve paylaşılan yüzey atlasıyla **birer çizimde** gösterilir. Yaklaşınca oynanabilir asıl yapı geri gelir. Görünürlük üst gruptadır: toplanmış eşya yeniden belirmez, kapı/çarpışma ve devriyeler değişmez.
- Asgari'de ışık köşelerde hesaplanır; inceleme ışığı, mum, gece ve sis korunur. Gölge haritası, yansıma ortamı, bloom ve ekran-sonrası geçişler yoktur. Arka planı yalnızca açıkta kalan piksellerde çizmek, gün içinde yağmuru hiç çizmemek ve uzaktaki dekorları elemek de maliyeti düşürür. Daha yüksek profillerde PBR yüzeyler korunur.

## Tekrarlamak

`npm run dev` açıkken Node.js, bir Chromium yürütülebiliri ve isteğe bağlı `playwright-core` gerekir. Bunlar **oyuncu bağımlılığı değildir**. Örneğin araçları ayrı bir klasöre kurarak:

```sh
npm install --prefix /tmp/kuzdag-perf playwright-core
export BROWSER=/path/to/chromium
export PLAYWRIGHT_MODULE=/tmp/kuzdag-perf/node_modules/playwright-core/index.mjs
node scripts/bench-village.mjs
SAMPLE_WIDTH=760 node scripts/bench-village.mjs
NIGHT=1 node scripts/bench-village.mjs  # Son üç bölümün sabit kameraları, peronda serbest döngü
node scripts/check-night.mjs
MISSING_ART=1 node scripts/check-night.mjs
```

`RESULT` JSON dosyası yazar, `VILLAGE_URL` Vite adresini seçer. Varsayılan yazılım çizicisidir; kendi bilgisayarında GPU denemesi için `GPU=native` kullan ve çıktıda gerçekten hangi çizicinin çalıştığını kontrol et. Aynı kameraları ve aynı cihazı karşılaştır. Sabit piksel ayarı yalnızca sabit kamera örneklerini etkiler, serbest döngüden önce sıfırlanır.

**Önceki atölye sürümünün oynanış kontrolü:** Asgari oturumda dört tanıkla konuşuldu, dört malzeme alındı, gasilhane kapısından yürünerek geçildi ve Arif'in kaydı mühürlenerek Mahmut'un dosyası açıldı. Düşük pakette `cumba`, `emanet` ve meşe dokusu istekleri bilerek başarısız kılındığında da aynı rota tamamlandı. Tam malzemeli yol ayrıca yazılım çizicisinde test için zorlandı: 15/15 atölye modeli yüklendi, Yüksek → Asgari → Dengeli geçişinde efekt hedefleri bırakılıp yeniden kuruldu. Bu son kontrol bir donanım FPS ölçümü değildir.
