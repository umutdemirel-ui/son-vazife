# Güvenlik incelemesi · 18 Kasım 2026

Bu oyun statik istemci kodudur; uygulama sunucusu, giriş hesabı veya API anahtarı gerektirmez. Kaynakta `eval`, `new Function`, `dangerouslySetInnerHTML`, doğrudan `innerHTML` ve dış ağ `fetch` kullanımı aranmıştır. Bu arama ve aşağıdaki testler kapsamlı bir güvenlik denetimi veya açıksızlık garantisi değildir.

## Kayıtlar

Tarayıcı kaydı güvenilir değildir. Okuyucu JSON boyutunu, sürümü, bölüm aralığını, sayısal konumu, hayatta kalma sayaçlarını, dizi alanlarını ve NPC bayrakları/güven değerlerinin temel türlerini doğrular; bozuk kayıt reddedilir. Bu yerel doğrulama oyun kayıtlarının hileye karşı korunması değildir. Kayıtlar aynı tarayıcıdaki diğer kodlar tarafından değiştirilebilir.

## Bağımlılık uyarısı

Geçici bir dizinde `package.json` için `npm install --package-lock-only --ignore-scripts` ile **yeni çözümleme** oluşturulup `npm audit --omit=dev` çalıştırıldı; bu depodaki Bun kilidinin birebir denetimi değildir. Sonuç 5 yüksek uyarı gösterdi; hepsi Vite araç zincirindeki **picomatch ≤4.0.7** ve bağımlı paketlere ilişkindir ([GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)). Kayıt defterinde bu kontrolde mevcut en yeni `picomatch` 4.0.7 idi; güvenli bir yeni sürüm görünmediğinden zorla kırıcı veya doğrulanmamış bir sürüme geçilmedi. Vite geliştirme sunucusunu internette güvenilmeyen kullanıcılara açmayın; dağıtımda üretilmiş `dist/` statik dosyalarını sunun. Geliştirme önizlemesi yalnızca ihtiyaç duyulduğunda kullanılmalıdır. Bildirimi ve kilidi düzenli yeniden kontrol edin.
