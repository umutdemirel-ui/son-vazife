# Kuzdağ ve gassallık akışı

Kullanıcının yeni yönü: Dermanlı köyü tamamen kaldırılacak; beğenilen gassallık akışı Kuzdağ'ın kendi haritasına ve hikâyesine uyarlanacak. Mevcut Kuzdağ kayıtları ve tarayıcıda kalmış diğer kayıtlar silinmez veya sessizce dönüştürülmez.

## Yapılanlar
- Başlangıç tek Kuzdağ oturumuna yönlendirildi; Dermanlı sahnesi ve ona özgü kaynak dosyaları kaldırıldı. Kuzdağ sahnesine eklenmiş Dermanlı hikâye notları ve olayları kaldırıldı.
- Kuzdağ'ın mevcut yıkama noktalarında sabır mumu, araç seçimi, F basılıyken A/D ile dönüşümlü yıkama ve durulama için F basılı tutma kullanılıyor.
- Kuzdağ kayıt biçimine eski kayıtlarda zorunlu olmayan, sınırları denetlenen ayrı bir gassallık durumu eklendi; mevcut vaka ilerlemesiyle karıştırılmıyor. Kâfur/kefen istasyonları ve mezarlık işareti sahnede hazırlandı ancak akış etkinleştirilene kadar gizli.
- Kuzdağ hikâyesinde ilk cenaze nakledildikten sonra dış sedyeden ek gassallık vazifesi başlatılabilir. Cenazeyi alma, teneşire koyma, mum, sabun, elle yıkama, temiz su, kirli su, kâfur, kefen, taşıma ve defin işlemleri sahnedeki noktalara bağlandı; dört defin sonraki sabahı açar, beşinci vazifeyi bitirir. İşlemler Kuzdağ kaydındaki ayrı alana yazılır.
- Önceki ritüelin taşınabilir durum mantığı `src/game/funeralDuty.ts` içinde Kuzdağ hikâyesini zorla sonlandırmayacak şekilde ayrıldı; `scrubbing.ts` elle yıkamanın durumunu taşıyor.

## Kalanlar
- Uygulanan beş vazifenin sahne yerleşimi, erişim, el/cenaze görselleri, kayıt ve mevcut üç vaka ile uyumu henüz doğrulanmadı.
- Kuzdağ'daki mekân, görev ve kullanıcı arayüzü üzerindeki diğer yeni köy kalıntılarını gözden geçir. Yıkama görsellerini ve etkileşim sırasını beğenilen sürümle eşleştir.
- Kullanıcının daha önce istediği gibi şimdilik doğrulama çalıştırılmadı. İleride son kontroller geçmeden production deploy yapma.
