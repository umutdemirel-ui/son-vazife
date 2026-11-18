# Kuzdağ atölyesi

Buradaki dosyalar çalışma kaynaklarıdır. Oyuncunun tarayıcısı Python, yüz tespiti ya da bir görsel üretim servisi çalıştırmaz.

## Köy sakinleri

- `residents/reference/`: Bu oyun için üretilmiş kurmaca karakter referansları; arşiv fotoğrafı değildir. `face-relief.json` bu referanslardan çevrimdışı çıkarılan yüz derinlik örnekleridir (MediaPipe Face Mesh). Ölçüler, genişliği 390 piksele indirgenmiş ön görünümlere göredir.
- `residents/profiles.py`: Her kişinin baş, gövde, kol, bacak ve giysi kesitleri; boyu, eklem konumları ve adım süresi. Ön ve arka yüzeyler ayrı dokulanır. Hasan ve Şerife'nin arka referansları vardır; Kenan ve İdris'in arka panelleri kendi kumaş örneklerinden ve ceket kıvrımlarından yapılır.
- `residents/bake.py`: Kapalı hacimli tek bir gövde ağı, ağırlıklı iskelet, `Idle` ve `Walk` döngülerini `public/assets/residents/<id>.glb` içine yazar. Yüzler ve giysiler aynı yerel atlasta; gövde metre cinsinden, taban `y=0`, ileri yön `+Z`. Oyunda fener, baston, dosya ve kürek `HandR` / `HandL` kemiklerine takılır. Diyalog hedefi bu kemiklere değil devriye köküne bağlıdır.

## Çevre

- `public/assets/village/fieldstone*.webp`, `sash.webp`, `plank-door.webp` ve `karacam.webp` oyun için üretilen taş duvar, pencere, kapı ve ağaç görsellerinden hazırlanmıştır. Karaçamın boşlukları alfa kesitidir; ağaçlar tek seferde örneklenir.
- `environment/grade.py`, depodaki mevcut CC0 taş, ahşap, toprak, kiremit ve sıva kaynaklarından soluk yüzey renklerini hazırlar. Renk haritaları sRGB, normal/pürüzlülük haritaları doğrusaldır. Tabelaların Türkçe yazıları oyunda ortak bir emaye atlasına çizilir.
- `src/game/villageCraft.ts` haneleri ve çeşmeyi modeller. Gasilhane kapı yüzü hareketli menteşededir. Dış sıva ve ahşap pervazlar kapı boşluğunu kapatmaz; yalağın ön dudağı ve sabun rafı eşya yükseklikleriyle eşleşir.

İsteğe bağlı yeniden üretim (Python 3.11+, `numpy`, `scipy`, `Pillow`):

```sh
python art/residents/bake.py
python art/environment/grade.py
```

Normal geliştirme ve dağıtımda bunlar gerekmez; oyun hazır GLB ve WebP dosyalarını kullanır.
