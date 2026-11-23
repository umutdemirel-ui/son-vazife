# Kuzdağ çevresi: mimari ve varlık iyileştirmesi

## İnceleme

Son Vazife, React 19 / Vite arayüzü ve Three.js ile oluşturulan, metre ölçeğinde oynanabilir bir köydür. `world.ts` yapıları, görev hedeflerini ve çarpışmaları kurar; `terrain.ts` yüksekliği, yolları ve bitki örtüsünü üretir. Kapı menteşeleri, etkileşim hedefleri, NPC yolları ve kayıt konumları görsel ağlardan ayrıdır. `homes.ts` içeri girilebilen 22 sıradan evi, `models.ts` cami, gasilhane, değirmen ve mezarlık gibi yerleri kurar; iki özel evle toplam 24 hane vardır. Uzak bölge ve gece varlıkları gerektiğinde GLB olarak yüklenir. `visibilityCells`, statik ağ birleştirme, örnekleme ve tam/küçük varlık paketleri düşük sistem profilinin parçasıdır.

Önceki görünümde birçok ev aynı cephe, çatı ve pencere düzenini tekrarlıyor; orman tek bir karaçam siluetinden oluşuyor; taş ve ot örnekleri arazi üçgenleri yerine analitik yükseklikten yerleştirildiği için eğimli noktalarda havada görünebiliyordu. Değirmen çarkı yalnızca halka ve kollardan, mezar taşları çoğunlukla dikdörtgenlerden oluşuyordu.

## Yapılanlar

- Hanelere paylaşılan çatı renkleri, alternatif toprak sıva, taş evlerde farklı üst kat kaplaması, farklı kepenk düzenleri, söveler, ahşap saçak ve toprağa gömülü taş temeller eklendi. Kapı yaprakları, ölçüler ve çarpışma çerçeveleri değiştirilmedi.
- Aynı açıklıklarda karaçam yanında ayrı bir geç sonbahar meşesi silueti kullanıldı. Bu ikisi hafif profilde de toplu örneklenir. Çalıların arasında hacimli, kuru dallar; taşlarda düzensiz yüzeyler ve farklı dönüş/ölçekler vardır. Bitki ve taşların konumu çizilen arazi üçgeninden örneklenir; ev merkezleri orman ve çalı temizleme hesabına katılır. Bunlar görsel detaydır; yeni hareket engeli oluşturmaz.
- Değirmenin geçici piramit çatısı kiremitli mahyalı çatıyla değişti; ikinci halka ve kanatlar mevcut hareketli çarkın parçasıdır. Mezarlık taşlarına yuvarlatılmış tepeler ve aşınmış oyma çizgiler eklendi. Mezar çarpışmaları ve mahzen kapısı değişmedi.
- Yeni meşe dokusu bu proje için üretilmiş kurmaca görselden `art/environment/oak.py` ile hazırlanır; harici kaynak indirilmedi. Tam ve kompakt WebP sürümleri yereldir. Mevcut CC0 dekor dönüştürme hattı ve diğer projeye özel referanslar için `art/README.md` dosyasına bakınız.

## Sınırlar ve doğrulama

Sahne yeniden tasarlanmadı; hikâye mekânları ve rotaları korunur. Meşe ve karaçam uzakta çapraz, alfa-testli düzlemlerdir; tam hacimli taranmış ağaç modelleri değillerdir. Kompakt profilde normal haritalar ve yüksek maliyetli süslemeler kapalıdır; bu nedenle bütün profiller fotogerçekçi görünüm garantisi vermez. Doku ve geometri çeşitliliği aynı kalitedeki taranmış kapsamlı varlık kütüphanesinin yerini tamamen tutmaz.

35 birim testi, TypeScript ve üretim derlemesi; tarayıcıda 24 ev, kapılar, çarpışmalar, kayıt ve sekiz bölümlük hikâye kontrolü çalıştırıldı. SwiftShader/Asgari profilde 384 × 240 sabit bakış ölçümünde meydan 81,1 ms medyan / 99,4 ms p90 (101 çizim), çeşme 71,1 / 82,1 ms (58 çizim), gasilhane 97,1 / 111,2 ms (70 çizim); serbest döngü 288 × 180'de 11,5 kare gönderimi/sn. Bu, donanım FPS garantisi değildir ve bu çevre sürümü için alınmış tek koşudur.
