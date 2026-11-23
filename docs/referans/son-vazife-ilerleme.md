# Son Vazife: Köy Haritası İlerleme Dosyası

Tarih: 19 Kasım 2026

## Dosya listesi (final)
| Dosya | İçerik |
|-------|--------|
| son-vazife-koy-haritasi.svg | Serbest dolaşım köy haritası (görsel) |
| son_vazife_blender_koy.py | Blender'da köyü üreten betik (arazi dahil) |
| son-vazife-olay-plani.md | Mekan ve gece bazlı paranormal olay planı |
| son-vazife-hikaye.md | Hikaye taslağı, karakterler ve finaller |
| son-vazife-ilerleme.md | Bu dosya |

## Proje özeti
- Oyun: Son Vazife (indie korku)
- Konu: Issız bir köyde gassallık yapan bir kişinin başından geçen paranormal olaylar
- Oyun şekli: Serbest dolaşım
- Durum: Proje epey ilerlemiş, mevcut köy haritası beğenilmemiş, oyuna uygun yeni bir harita isteniyor

## Yapılanlar

### Adım 1: İlk harita (doğrusal akışlı)
- Tek bir giriş yolundan meydana, oradan cami ve mezarlığa uzanan bir köy tasarlandı.
- Mekanlar: giriş kapısı, cami, gasilhane, mezarlık, meydan, gassal evi, terk evler, kuyu, eski okul, değirmen.
- Sorun: Yapı tek yola bağlı olduğu için serbest dolaşıma uygun değildi.

### Adım 2: Serbest dolaşıma göre yeniden tasarım (güncel sürüm)
- Köyü çevreleyen bir halka yol eklendi, böylece çıkmaz yok ve her yere birden fazla yönden ulaşılıyor.
- Merkezden dallanan patikalar: okul, kuyu, mezarlık, değirmen.
- İki gizli kestirme patika: gasilhane ile mezarlık arası, tarla ile gassal evi arası.
- Köyün dışına açılan alanlar: tarla ve ahır, taş köprü, orman yolu.
- Dere doğu sınırını çiziyor, köprü sonradan açılacak bir bölge olarak kullanılabilir.

### Adım 3: Blender betiği
- `son_vazife_blender_koy.py` hazırlandı: halka yol, patikalar, dere ve köprü, cami, gasilhane, gassal evi, terk evler, okul, değirmen, ahır, tarla, meydan, kuyu, mezarlık, ağaçlar, ışıklar, iki kamera ve etiketler.
- Betik gerçek Blender'da henüz denenmedi, sadece sahte bpy ile mantık testi yapıldı.

### Adım 4: Arazi yüksekliği
- Zemin düz plane'den tepelik araziye çevrildi: köy ve yollar düz, kenarlar yükseliyor, dere ve yol boyunca vadi oluşuyor.
- `HILL_HEIGHT` (varsayılan 12 m) ile yükseklik ayarlanır, 0 yapılırsa zemin düz olur.
- Kenar ağaçları araziye oturacak şekilde yerleştirilir.

### Adım 5: Olay planı taslağı
- `son-vazife-olay-plani.md` hazırlandı: çekirdek döngü, 5 gecelik yükseliş, 12 mekan için gündüz ve gece olayları, serbest dolaşım tetikleyicileri, ışık ve ses dili.
- Hikayenin gerçeği (köy neden ıssız) henüz belirlenmedi.

### Adım 6: Hikaye taslağı
- Kullanıcı hikayenin devamını Claude'dan istedi. `son-vazife-hikaye.md` hazırlandı: köyün gerçeği (salgın ve yıkanmadan gömülen ölüler), karakterler, 5 gecelik akış, üç final.
- Taslak Claude'un önerisidir, kullanıcı onayı ve düzenlemesi bekleniyor.

## Güncel mekan listesi
| No | Mekan | Not |
|----|-------|-----|
| 1 | Giriş kapısı | Köye tek giriş, sisle kapatılabilir |
| 2 | Cami | Merkezde, ses tabanlı korkular için uygun |
| 3 | Gasilhane (ana mekan) | Camiye bitişik, soğuk mavi ışık |
| 4 | Mezarlık (ana mekan) | Kuzeyde, çitli, ayrı patikayla ulaşılır |
| 5 | Meydan | Çeşme, çınar, harap kahvehane |
| 6 | Gassal evi (ana mekan) | Köyün tek ışıklı evi, sıcak sarı ışık |
| 7 | Terk evler | İpucu ve not yerleştirmeye uygun |
| 8 | Kuyu | Batı patikasında |
| 9 | Eski okul | Kuzeybatıda, izole |
| 10 | Değirmen | Kuzeydoğuda, dere kenarında |
| 11 | Tarla ve ahır | Güneydoğuda, köyün dışı |
| 12 | Orman yolu | Batıda, köyün sınırı |

## Tasarım notları
- Yön bulma: Minare, mezarlık çiti ve çınar gibi uzaktan görülen işaretler.
- Işık kontrastı: Gassal evinin sıcak ışığı ile gasilhanenin soğuk ışığı.
- Tekrar ziyaret: Aynı mekanlar gündüz ve gece farklı olaylarla yeniden ziyaret edilebilir.
- Kestirmeler: Gece korkuyu artıran kısa yollar olarak kullanılabilir.

## Sıradaki olası adımlar
- Olayların hangi mekanda, hangi sırayla tetikleneceğini planlamak
- Gasilhane ve gassal evinin iç mekan planlarını çizmek
- Gündüz ve gece döngüsüne göre mekan değişimlerini belirlemek
- Betiği Blender'da çalıştırıp çıkan hataları düzeltmek
- Haritayı oyun motorundaki ölçeğe ve kamera yapısına göre uyarlamak
