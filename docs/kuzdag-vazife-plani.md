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

## Kalanlar
- Baştan sona doğal oyun yürüyüşü, farklı cihazlar ve tam görsel değerlendirme henüz yapılmadı; kullanıcı cihaz/tasarım değerlendirmesini şimdilik erteledi.
- Son kontroller ve oyun tamamlanmadan production deploy yapma.
