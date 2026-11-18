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

### İsteğe bağlı yeniden üretim

Normal geliştirme/dağıtımda gerekmez. Python 3.11+, `numpy`, `scipy`, `Pillow` ile depo kökünden:

```sh
python art/residents/bake.py
python art/environment/grade.py
python art/environment/surfaces.py
python art/environment/houses.py
python art/environment/fountain.py
python art/environment/supplies.py
```

Dekor ve düşük çözünürlüklü karakter dönüşümü için Node 22.12+ ile **ayrı** bir araç dizini kullanılabilir (oyuna bağımlılık eklemeden):

```sh
npm install --prefix /tmp/kuzdag-art @gltf-transform/core@4.5.1 @gltf-transform/functions@4.5.1 @gltf-transform/extensions@4.5.1 meshoptimizer@1.3.0 sharp@0.35.5 mikktspace@1.1.1
cp art/environment/dressing.mjs art/residents/compact.mjs /tmp/kuzdag-art/
node /tmp/kuzdag-art/dressing.mjs
node /tmp/kuzdag-art/compact.mjs
```

[Çalışma zamanı bütçesi ve ölçüm yöntemi](../docs/performans.md).
