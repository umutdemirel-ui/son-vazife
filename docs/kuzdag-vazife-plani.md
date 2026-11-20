# Kuzdağ ve gassallık akışı

Kullanıcının yeni yönü: Dermanlı köyü tamamen kaldırılacak; beğenilen gassallık akışı Kuzdağ'ın kendi haritasına ve hikâyesine uyarlanacak. Mevcut Kuzdağ kayıtları ve tarayıcıda kalmış diğer kayıtlar silinmez veya sessizce dönüştürülmez.

## Yapılanlar
- Başlangıç tek Kuzdağ oturumuna yönlendirildi; Dermanlı sahnesi ve ona özgü kaynak dosyaları kaldırıldı. Kuzdağ sahnesine eklenmiş Dermanlı hikâye notları ve olayları kaldırıldı.
- Kuzdağ'ın mevcut yıkama noktalarında sabır mumu, araç seçimi, F basılıyken A/D ile dönüşümlü yıkama ve durulama için F basılı tutma kullanılıyor.
- Kuzdağ kayıt biçimine eski kayıtlarda zorunlu olmayan, sınırları denetlenen ayrı bir gassallık durumu eklendi; mevcut vaka ilerlemesiyle karıştırılmıyor. Kâfur/kefen istasyonları ve mezarlık işareti sahnede hazırlandı ancak akış etkinleştirilene kadar gizli.
- Kuzdağ hikâyesinde ilk cenaze nakledildikten sonra dış sedyeden ek gassallık vazifesi başlatılabilir. Cenazeyi alma, teneşire koyma, mum, sabun, elle yıkama, temiz su, kirli su, kâfur, kefen, taşıma ve defin işlemleri sahnedeki noktalara bağlandı; dört defin sonraki sabahı açar, beşinci vazifeyi bitirir. İşlemler Kuzdağ kaydındaki ayrı alana yazılır.
- Kullanılmayan Dermanlı gasilhane yerleşim dalı ve ilgili duvar modülü kaldırıldı; Kuzdağ yerleşimi korunuyor.
- Önceki ritüelin taşınabilir durum mantığı `src/game/funeralDuty.ts` içinde Kuzdağ hikâyesini zorla sonlandırmayacak şekilde ayrıldı; `scrubbing.ts` elle yıkamanın durumunu taşıyor.

## Son kontroller
- Derleme, TypeScript kontrolü ve 66 birim testi geçti.
- Otomatik tarayıcı senaryoları Kuzdağ açılışı ve kayıt korumasını; üç vaka, sekiz bölüm ve üç sonu; beş vazifenin sahne hedefleri ve klavye ile tamamlanmasını kontrol etti. Vazife senaryosu sahneye ışınlanma kullanır; yürüyüş ve görsel kaliteyi doğrulamaz.

## Kalanlar
- Vazifelerin doğal yürüyüşle erişimini, görsel akışı ve kullanıcı arayüzünü son kez incele; yıkama görsellerini beğenilen sürümle karşılaştır.
- Son kontroller ve oyun tamamlanmadan production deploy yapma.
