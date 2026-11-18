/** Each household has its own names and a piece of local testimony. */
const families = [
  ['Yılmaz', 'Murat', 'Sevil', 'Ece'], ['Aydın', 'Cemal', 'Nermin', 'Ali'],
  ['Kaya', 'Osman', 'Emine', 'Elif'], ['Demir', 'Mehmet', 'Ayşe', 'Can'],
  ['Yıldız', 'İsmail', 'Hatice', 'Zeynep'], ['Koç', 'Hasan', 'Gül', 'Deniz'],
  ['Çelik', 'Salih', 'Fatma', 'Eren'], ['Şahin', 'Mustafa', 'Meryem', 'Dilek'],
  ['Arslan', 'Halil', 'Zehra', 'Selim'], ['Kurt', 'Musa', 'Gönül', 'Aylin'],
  ['Öztürk', 'İbrahim', 'Nazan', 'Barış'], ['Aksoy', 'Fikret', 'Hacer', 'Pınar'],
  ['Polat', 'Nihat', 'Saniye', 'Emre'], ['Bulut', 'Rıza', 'Sema', 'Leyla'],
  ['Keskin', 'Hüseyin', 'Nur', 'Yusuf'], ['Doğan', 'Harun', 'Kadriye', 'Melek'],
  ['Er', 'Selahattin', 'Perihan', 'Aslı'], ['Güneş', 'Vedat', 'Nuran', 'Kaan'],
  ['Taş', 'Mahir', 'Tülay', 'Duru'], ['Avcı', 'Adem', 'Rabia', 'Cihan'],
  ['Özkan', 'Kamil', 'Naime', 'Esra'], ['Tekin', 'Orhan', 'Seher', 'Mert'],
  ['Özdemir', 'Necati', 'Havva', 'Işıl'], ['Karaca', 'Tahir', 'Belgin', 'Sibel'],
] as const;
const early = [
  'Akşam olunca kapıyı örtüyoruz. Meydanda bir zil daha çalarsa kimse dışarı çıkmasın.',
  'Babam eski defterleri saklar. Bazı tarihler sonradan değiştirilmiş, ama sebebini bilmiyorum.',
  'Pencerede bir gölge gördüm. Annem perdeleri kapatınca gölge içeriden vurdu.',
  'Çeşme durunca komşularımızla suyu paylaştık. Fakat kovaların biri sabaha kadar kendiliğinden doldu.',
  'Dün gece yoldan bir minibüs geçtiğini sandım. Lastik izi yoktu, ama içeriden zil duyuluyordu.',
  'Ninem, isimleri deftere eksiksiz yazarsak yolun bizi geri getireceğini söylerdi.',
  'İdris akşam taşları saydı. Birini eksik bulduğunda mahzenin kapısını tekrar kilitledi.',
  'Santral direğinden ses geliyor. Telefonumuz yıllardır sökük, ama annem arayanı tanıdığını söylüyor.',
];
const late = [
  'O gece istasyona gidenler vardı; tren gördüğünü söyleyenlerin hepsi aynı saati ezberlemiş.',
  'Mezarlıkta iki taş var. Yoklamadaki üçüncü isim için bir mezar gördüğümü hatırlamıyorum.',
  'Kayıt makinesindeki sesi tanıyorum. Büyükler sesin sahibinin adını söylemiyor.',
  'Kenan adresi değiştirdiğini söylemiş. Adresin değişmesi, o evde yaşayanların öldüğü anlamına gelmez.',
  'İstasyondaki biletin kenarını hatırla: iki çentik. Yanlış perona gidersen hat yine kapanır.',
  'İdris taşlara değil, bakım defterindeki isimlere bakmanı isterdi. Toprak bazen yanlış hikâye anlatır.',
  'Gece duyduğumuz zilin kaydı mektepten eski. Biri o sesi banttan yeniden çalmış olabilir.',
  'Telefon çalınca önce kim olduğunu sor. Karşıdaki, senden önce ölen birinin adını verebilir.',
];
export function familyName(home: number, member: number) {
  const f = families[home % families.length];
  return `${f[member + 1]} ${f[0]}`;
}
export function familyTestimony(home: number, member: number, act: number) {
  return (act >= 6 ? late : early)[(home * 3 + member) % early.length];
}
