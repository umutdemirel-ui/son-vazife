# Güvenlik incelemesi · 23 Kasım 2026

Bu oyun statik istemci kodudur; uygulama sunucusu, giriş hesabı veya API anahtarı gerektirmez. Kaynakta `eval`, `new Function`, `dangerouslySetInnerHTML`, doğrudan `innerHTML` ve dış ağ `fetch` kullanımı aranmıştır. Bu arama ve aşağıdaki testler kapsamlı bir güvenlik denetimi veya açıksızlık garantisi değildir.

## Kayıtlar

Tarayıcı kaydı güvenilir değildir. Okuyucu JSON boyutunu, sürümü, bölüm aralığını, sayısal konumu, hayatta kalma sayaçlarını, dizi alanlarını ve NPC bayrakları/güven değerlerinin temel türlerini doğrular; bozuk kayıt reddedilir. Bu yerel doğrulama oyun kayıtlarının hileye karşı korunması değildir. Kayıtlar aynı tarayıcıdaki diğer kodlar tarafından değiştirilebilir.

## Bağımlılık durumu

Önceki `npm audit` notu, Bun kilidinden ayrı oluşturulmuş geçici bir npm çözümlemesini inceliyordu; depodaki `bun.lock` denetimi değildi. Notta anılan [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/ghsa-fc5q-39xc-vjpf) GitHub Advisory Database tarafından **18 Kasım 2026'da geri çekildi**; kayıt, bunun bir güvenlik sorunu olmadığı gerekçesiyle geri çekildiğini bildiriyor. Bu nedenle eski “5 yüksek uyarı” bulgusu güncel bir açık olarak raporlanmamalı. Kilitte Vite araç zincirinin kullandığı `picomatch` 4.0.7 bulunuyor. Bu not kilit dosyası üzerinde yeniden üretilmiş bir tam bağımlılık denetimi değildir. Vite geliştirme sunucusunu internette güvenilmeyen kullanıcılara açmayın; dağıtımda üretilmiş `dist/` statik dosyalarını sunun.
