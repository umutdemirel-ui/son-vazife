# Dermanlı: tamamlanan işler ve sıradaki adımlar

Oyun tamamlanmış sayılmaz. Ölü yıkama sistemi korunacak; oyun bitmeden production dağıtımı yapılmayacak. Evlerin içine NPC yerleştirilmeyecek; kullanıcının özellikle istediği kahvehane bunun istisnası.

## Tamamlanan ve doğrulanan alt işler

- [x] Kahvehane binasını yeniden kur; kahveci ve iki oturan müşteri ekle; rotaları ve mobilya desteklerini sına.
- [x] Değirmen çarkını gündüz/gece döndür ve duvar dokularını ölçekle.
- [x] Gassal evi, okul, terk evler ve gasilhanenin belirtilen cephelerinde gerçek camlı pencere açıklıkları oluştur.
- [x] Gasilhanede malzeme tezgâhlarını, dış sedyeyi ve örtülü girişi yerleştir; yıkama ve beş geceyi sına.
- [x] Masaüstü SwiftShader tarayıcıda gasilhaneyi düşük/yüksek ayarlarda içten ve dıştan incele; tezgâh desteklerini, camları ve istasyon rotalarını doğrula. Ön cephedeki gerilmiş kaplama düzeltildi.
- [x] Bu değişiklik sonrası çarpışmalı beş gece ve huzur, karanlık, kaçış sonlarını yeniden test et.
- [x] Kahvehane, gassal evi, okul, terk evler ve ahırdaki düzeltilen mobilyaların desteklerini sahnede test et.
- [x] Taş köprüye rampalar ekle; yüzey yüksekliğini ve oyuncunun rampada yürüyüşünü sına.
- [x] İki gece ruhunun ve iki animasyonlu korku modelinin tabanlarını düzelt; takipçiyi gerçek render döngüsünde sına.
- [x] Üç dış mekân köylüsü ekle; altı gündüz köylüsüne farklı giysi ayrıntıları ve ilerlemeye bağlı, kaydedilen konuşmalar ver.
- [x] Terk evdeki pencere gölgesini tetiklenme, görünme ve kayıt sonrası tekrar etmeme açısından sına.
- [x] Dördüncü gecedeki okul tebeşiri olayını gerçek tahtada animasyonla göster; yalnız içeriden bakıldığında tetiklenmesini ve kayıt sonrası tekrar etmemesini sına.
- [x] Fare yumuşatma ayarını menüden Dermanlı sahnesine bağla; menü, ters Y ve kayıt davranışını tarayıcıda sına.

## Kalan işler — sırayla, ölçülebilir alt görevler

1. **Gasilhane:**
   - [ ] Masaüstü yazılımsal tarayıcı dışında gerçek cihazlarda iç/dış görünüm ve yıkama istasyonlarını doğrula; bulguları düzelt.
   - [ ] Kullanıcı değerlendirmesini al; tasarım onaylanana kadar nihai kabul etme ve değişikliklerden sonra yıkama/son testlerini tekrarla.
2. **Haritanın zemin ve çarpışma taraması:**
   - [ ] Ağaçlar, mezarlık ve açık arazi eşyalarını gerçek araziye göre tara; doğrulanan hataları konum ve görsel testleriyle düzelt.
   - [ ] Diğer yapıların dış detayları ve karakterlerini destek yüzeylerine göre tara. Taşınan veya kasıtlı yüzen öğeleri yanlışlıkla sabitleme.
3. **NPC'ler:**
   - [ ] Yeniden kullanılan temel modellerin yerine özgün karakter görünümü tasarla; yedek model, animasyon ve kaynak temizliğini doğrula.
   - [ ] Eski karakterlerin kimliklerini ve yerlerini eski oyunla karşılaştır; gündüz/gece erişilebilirliği, diyalog ve kayıtları test et.
4. **Korku olayları:**
   - [ ] Kalan olayları tek tek tetik, yön/görünürlük, ses, tekrar ve kayıt açısından denetle; anlatılan görsel olayların gerçekten görünmesini sağla.
   - [ ] Eksik korku karakterlerini belirleyip ekle; çarpışma ve yıkama akışını bozmadıklarını sına.
5. **Yapılar ve dokular:**
   - [ ] Gassal evi, okul ve terk evlerin diğer cephelerini ayrı ayrı inceleyip düzelt.
   - [ ] Değirmenin kalan ayrıntıları ve diğer yapı cephelerini gözden geçir; doku, açıklık ve erişim testleri ekle.
6. **Eski oyun bütünlüğü:**
   - [ ] Eski menü ve karakterlerin eksik davranışlarını karşılaştırıp gider.
   - [ ] Kuzdağ hikâyesi, vakalar, zaman ve kayıt sistemleri ile Dermanlı akışının uyumunu incele; korunacak yıkama sistemiyle çakışmadan aktarım planını uygula. Eski kayıtları izinsiz silme veya yeni kayıtla karıştırma.
7. **Son doğrulama:**
   - [ ] Her büyük değişiklikte lint, test, build, çarpışmalı beş gece, ilgili görsel kontrol ve gerekiyorsa üç son/menü testlerini çalıştır.
   - [ ] Tüm bölgelerin ve farklı cihazların kontrolü tamamlanmadan oyunu bitmiş veya production'a hazır ilan etme.
