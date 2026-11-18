# Kuzdağ atölyesi

Buradaki dosyalar çalışma kaynaklarıdır. Oyuncunun tarayıcısı Python, yüz tespiti ya da bir görsel üretim servisi çalıştırmaz.

## Köy sakinleri

- `residents/reference/`: Bu oyun için üretilmiş kurmaca karakter referansları; arşiv fotoğrafı değildir. `face-relief.json` bu referanslardan çevrimdışı çıkarılan yüz derinlik örnekleridir (MediaPipe Face Mesh). Ölçüler, genişliği 390 piksele indirgenmiş ön görünümlere göredir.
- `residents/profiles.py`: Her kişinin baş, gövde, kol, bacak ve giysi kesitleri; boyu, eklem konumları ve adım süresi. Ön ve arka yüzeyler ayrı dokulanır. Hasan ve Şerife'nin arka referansları vardır; Kenan ve İdris'in arka panelleri kendi kumaş örneklerinden ve ceket kıvrımlarından yapılır.
- `residents/bake.py`: Kapalı hacimli tek bir gövde ağı, ağırlıklı iskelet, `Idle` ve `Walk` döngülerini `public/assets/residents/<id>.glb` içine yazar. Yüzler ve giysiler aynı yerel atlasta; gövde metre cinsinden, taban `y=0`, ileri yön `+Z`. Oyunda fener, baston, dosya ve kürek `HandR` / `HandL` kemiklerine takılır. Diyalog hedefi bu kemiklere değil devriye köküne bağlıdır.

## Çevre ve eşyalar

- `environment/reference/`: Bu oyun için üretilmiş kurmaca cephe ve malzeme referanslarıdır, gerçek yapıların taraması değildir. Bunlar oyuncuya gönderilmez.
- `environment/houses.py`: Üç ev tipinin ölçülmüş cephe kesitleri. Derinlik alanından cumba, girintili pencere/kapı, kepenk, yan ve arka duvarlar çıkar; çatı dört eğim, saçak, kiremit dudağı, mahya ve bacadan oluşur. Her hanede bir indeksli GLB yüzeyi. Numaralar, birinci hanenin kilimi ve çarpışma kabuğu dünyada ayrıca yerleşir.
- `environment/fountain.py`: Oyuk kemer, tek tek kesme taşlar ve içi boş su yalağı. Oyun pirinç musluğu, suyu, emaye kitabeyi ve eşya noktalarını ekler. `supplies.py` kapaklı ibriğin gövde kesitlerini, kıvrık kulp ve içi boş ağzını; defterin cilt/sayfalarını, üç kat bez ve yuvarlatılmış sabunu modeller. Dört eşya `emanet.glb` içinde bir atlası paylaşır ama ayrı toplanabilir.
- `environment/meshkit.py` metre ölçeğinde, +Z ön cepheli, JPEG atlaslı, indeksli statik glTF yazar. Tam ve küçük paketler aynı yerleşime oturur. Küçük pakette eşya eğrileri daha az üçgene sahiptir.
- `environment/cc0/`: Depoda önceden bulunan CC0 kaynakları, artık `public/` dışında. `grade.py` ilk renk düzenlemesini; `surfaces.py` meşe, kireç, seramik, iç kapı, su, uzak yüzey atlası ve hafif çözünürlükleri hazırlar. Taş, pencere, kapı ve karaçamın önceki yerel görselleri de kullanılır. Renk dokuları sRGB, normal/pürüz verisi doğrusaldır. Gasilhanenin kapı boşluğu üç ayrı duvar panelidir; boyalı kapı yüzü menteşe üzerinde açılır.
- `environment/dressing.mjs` kullanılan on CC0 dekoru daha küçük, bağımsız glTF'lere dönüştürür. Sundurma fenerinin tüm sahneyi yeniden çizdiren kırılma geçişini kaldırır. `residents/compact.mjs` düşük bellek için tanıkların daha küçük kopyalarını hazırlar; konuşma hedefleri, el kemikleri ve iki animasyon korunur.

## Gece nöbeti

- `night/reference/`: Kara Basma ile Sis Gözcüsü için ayrı ön/arka görünümler; üç cenaze, mektep, istasyon ve santral için toplam on kurmaca referans. Oyun bu kaynak JPEG’leri indirmez.
- `night/bake.py`: Her devriyenin pelerini, başlığı, kolları ve çizmeleri ayrı kesitlerden modellenir. Kumaş rengi fotoğraf sınırının dışına taşırılır; yürürken kol ve etek aralıklarında stüdyo fonu görünmez. Baş, omuz ve ayak hareketleri çalışma zamanında eklem noktalarından verilir. Teneşirdeki bedenlerin başı −X tarafındadır. Peştemal aynı yüzeye oturur; son kefen, bedeni ve peştemalı **değiştirir**, üzerlerine üçüncü bir model eklemez. Yolcu etiketi ayrı parçadır. Mektep ve istasyon cephelerindeki kapı geçitleri gerçek boşluktur.
- `night/evidence.py`: Yazılı kara tahta, kumaş heybe, çift makaralı kayıt cihazı, döner kadranlı telefon ve avlu çanı tek atlasta, beş bağımsız ağdır. Kumaş, ahşap ve pirinç örnekleri mevcut referanslardan; yazılar ve kadranlar çevrimdışı çizilir.
- `night/dispatcher.py`: Peron Şefi’nin üniformasını, saat yüzlü başını ve işaret levhalı kolunu modeller. Kadran 22.42’yi gösterir. Baş ve kol kendi yerel eksenlerinde hareket eder; şef son anons bittiğinde perondan kaybolur. Saha notu hikâyeyi bitirmek için zorunlu değildir.
- `public/assets/night/` ve `compact/`: **10’ar GLB**. Küçük paketin tamamı 914.476 bayt; her şey başlangıçta yüklenmez. Vaka ve görev durumu modellere değil sabit sahne köklerine bağlıdır. Eksik modelde cenaze, figür veya eşya yerel yedek şekille görünür; etkileşimler kaybolmaz.

Mezarlıkta kullanılan CC0 `dead_tree` dik bir ağaç değil, yatık bir gövdedir. Boyunu Y eksenine göre ölçeklemek yüksek ayarda gövdenin mahzenden geçmesine yol açıyordu. Yerleştirme artık en uzun ekseni kullanır. Muhtarlıkta da taranmış lamba gelince basit lamba gizlenir; iki defter örneğinden yalnızca kapalı olanı masaya oturur.

### İsteğe bağlı yeniden üretim

Normal geliştirme/dağıtımda gerekmez. Python 3.11+, `numpy`, `scipy`, `Pillow` ile depo kökünden:

```sh
python art/residents/bake.py
python art/environment/grade.py
python art/environment/surfaces.py
python art/environment/houses.py
python art/environment/fountain.py
python art/environment/supplies.py
python art/night/bake.py
python art/night/evidence.py
python art/night/dispatcher.py
```

Gece atlaslarındaki yazılar için atölye makinesinde DejaVu Sans, Serif ve Sans Mono yazı tipleri bulunmalıdır. Oyuncunun cihazında bu gereksinim yoktur.

Dekor ve düşük çözünürlüklü karakter dönüşümü için Node 22.12+ ile **ayrı** bir araç dizini kullanılabilir (oyuna bağımlılık eklemeden):

```sh
npm install --prefix /tmp/kuzdag-art @gltf-transform/core@4.5.1 @gltf-transform/functions@4.5.1 @gltf-transform/extensions@4.5.1 meshoptimizer@1.3.0 sharp@0.35.5 mikktspace@1.1.1
cp art/environment/dressing.mjs art/residents/compact.mjs /tmp/kuzdag-art/
node /tmp/kuzdag-art/dressing.mjs
node /tmp/kuzdag-art/compact.mjs
```

[Çalışma zamanı bütçesi ve ölçüm yöntemi](../docs/performans.md).
