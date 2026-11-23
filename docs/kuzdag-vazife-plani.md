# Kuzdağ ve gassallık akışı

Kullanıcının yeni yönü: Dermanlı köyü tamamen kaldırılacak; beğenilen gassallık akışı Kuzdağ'ın kendi haritasına ve hikâyesine uyarlanacak. Mevcut Kuzdağ kayıtları ve tarayıcıda kalmış diğer kayıtlar silinmez veya sessizce dönüştürülmez.

## Yapılanlar
- Yeni oyunda ilk cenaze gasilhane önündeki sedyede başlar; oyuncu onu alıp teneşire yerleştirir, ardından ilk teslim dosyasını açar. Taşıma durumu kaydedilir; eski kayıtlarda alan yoksa cenaze önceki gibi teneşirde kabul edilir.
- Başlangıç tek Kuzdağ oturumuna yönlendirildi; Dermanlı sahnesi ve ona özgü kaynak dosyaları kaldırıldı. Kuzdağ sahnesine eklenmiş Dermanlı hikâye notları ve olayları kaldırıldı.
- Kuzdağ'ın mevcut yıkama noktalarında sabır mumu, araç seçimi, F basılıyken A/D ile dönüşümlü yıkama ve durulama için F basılı tutma kullanılıyor.
- Kuzdağ kayıt biçimine eski kayıtlarda zorunlu olmayan, sınırları denetlenen ayrı bir gassallık durumu eklendi; mevcut vaka ilerlemesiyle karıştırılmıyor. Kâfur/kefen istasyonları ve mezarlık işareti sahnede hazırlandı ancak akış etkinleştirilene kadar gizli.
- Kuzdağ hikâyesinde ilk cenaze nakledildikten sonra dış sedyeden ek gassallık vazifesi başlatılabilir. Cenazeyi alma, teneşire koyma, mum, sabun, elle yıkama, temiz su, kirli su, kâfur, kefen, taşıma ve defin işlemleri sahnedeki noktalara bağlandı; dört defin sonraki sabahı açar, beşinci vazifeyi bitirir. İşlemler Kuzdağ kaydındaki ayrı alana yazılır.
- Kullanılmayan Dermanlı gasilhane yerleşim dalı ve ilgili duvar modülü kaldırıldı; Kuzdağ yerleşimi korunuyor.
- Önceki ritüelin taşınabilir durum mantığı `src/game/funeralDuty.ts` içinde Kuzdağ hikâyesini zorla sonlandırmayacak şekilde ayrıldı; `scrubbing.ts` elle yıkamanın durumunu taşıyor.

## Son kontroller
- Derleme, TypeScript kontrolü ve 67 birim testi geçti. Gölge alanı oyuncuyu takip eder; asgari grafikte yerel ışık büyük yüzeylerde artık piksel düzeyinde hesaplanır. Dört kalite seviyesi tarayıcıda shader hatası olmadan işlendi.
- Otomatik tarayıcı senaryoları Kuzdağ açılışı ve kayıt korumasını; üç vaka, sekiz bölüm ve üç sonu; beş vazifenin sahne hedefleri ve klavye ile tamamlanmasını kontrol etti. Vazife senaryosu etkileşimlerde ışınlanma kullanır. Buna ek olarak, çarpışma alanında tüm görev hedefleri arası bağlantı örneklendi ve cenazeyi taşıyarak açık gasilhane kapısından iki yönlü yürüyüş denendi.
- Cenaze taşınırken koşma engellendi ve hız eski cenaze nakliyle eşitlendi. Bir yıkama sahnesi otomatik görüntüyle kontrol edildi; bu, tam görsel değerlendirme yerine geçmez.
- 23 Kasım 2026: `codex/kuzdag-survey-map` dalındaki köy haritası üretime yayımlandı. Canlı tarayıcıda yeni oturumun açılışı, defter haritası, ilk cenazeyi alma, açık kapıdan gasilhaneye taşıma ve teneşire bırakma gerçek yürüyüşle denendi. Bu akışta tarayıcı konsolunda hata veya uyarı görülmedi.
- 23 Kasım 2026: Gölge haritası artık Three.js'in desteklenen `PCFShadowMap` türünü kullanıyor. Canlı tarayıcıda asgari, düşük, dengeli, yüksek ve otomatik kalite seçimleri denendi; konsola hata veya uyarı yazılmadı. Test, TypeScript ve üretim derlemesi aynı Vercel derlemesinde başarılı oldu.
- 23 Kasım 2026: Gerçek oyun akışında ilk cenaze dış sedyeden alındı, açık gasilhane kapısından taşındı, teneşire bırakıldı ve ilk teslim dosyası mühürlendi. Ardından hazırlık eşyalarından defter alındı. Test kaydı yalnızca dal önizlemesinde tutuldu.
- 23 Kasım 2026: Fareyle bakış hareketinden sonra ekranda kalan “Bakış için tıkla veya sürükle” ipucu düzeltildi. Dal önizlemesinde sürükleme ile kamera hareket ettirildi, ipucunun kapandığı ve konsolun hatasız kaldığı doğrulandı.
- 23 Kasım 2026: Commit `9a33bd1` Vercel üretim dağıtımı `dpl_8RJsM61JpCtit1pYqVgKLSGuzZJH` ile `son-vazife.vercel.app` adresine yayımlandı. Üretim adresi HTTP 200 döndü ve canlı giriş ekranı açıldı. Bu dağıtımda 67/67 test geçti, TypeScript denetimi ve derleme tamamlandı; derleyici mevcut büyük oyun paketi için boyut uyarısı verdi.
- 23 Kasım 2026: Köy haritası baştan, giriş ekranındaki 1993 arşiv baskısı estetiğine uyacak biçimde çizildi: sepya arazi, dağ sırtı, çam ormanı, izohipsler, dere, ölçülü yol ağı, çatı/yer işaretleri, keşif damgaları, yön oku ve oyuncu yönü. Dal önizlemesinde dar ve geniş görünümde açılıp kontrol edildi; ilk denemede yakalanan eksik sağlık ocağı koordinatı içe aktarımı düzeltildi. Commit `a53c8d8` production'a `dpl_Gdq1vErN4zvgbR4NGoj8wwkfAnwj` dağıtımıyla yayımlandı; 67/67 test, TypeScript denetimi ve Vite derlemesi geçti. Canlı alias `son-vazife.vercel.app` yeni sürüme bağlandı.

## Kalanlar
- Önsözden son perona kadar baştan sona doğal oyun yürüyüşü henüz tamamlanmadı; gerçek yürüyüş ilk teslim ve hazırlık hedefinin ilk eşyasına kadar geldi. Otomatik senaryo daha sonraki vaka, vazife ve finalleri ışınlanmayla kapsıyor.
- Farklı cihazlarda ve çözünürlüklerde kontrol ile sahnenin tam görsel değerlendirmesi henüz yapılmadı.
