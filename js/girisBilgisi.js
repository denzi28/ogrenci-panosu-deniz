// Öğrenci giriş bilgileri: tek, anlatması kolay bir düzen.
//   Kullanıcı adı = çocuğun adı + okul numarası  (Ada Yıldız, 101 -> ada101). Türkçe harfler sadeleşir: Çağrı -> cagri.
//   Okul numarası yoksa sadece ad; aynı ad varsa sonuna 2, 3 ... eklenir.
//   Şifre = basit bir kelime + 4 rakam (kedi4827). Öğrenci "Profilim"den değiştirebilir; öğretmen her zaman güncelini görür.
//   Neden kelime + 4 rakam: kullanıcı adı tahmin edilebilir (sınıf arkadaşları okul numarasını bilir), güvenliği şifre taşır.
//   4 haneli sayı 9.000 olasılıktır; bu biçim bir milyondan fazla.
// Kurulum sihirbazı ve Öğrenciler bölümü aynı kuralı kullanır. Giriş kartları da buradan yazdırılır.
import { esc, yazdir } from './arayuz.js';
import { veliLinki, aktifSinifId } from './sinif.js';

export const DUZEN_ACIKLAMASI = 'Kullanıcı adı çocuğun adı ile okul numarasıdır (ör. ada101). Şifre bir kelime ile 4 rakamdır (ör. kedi4827). Öğrenci şifresini Profilim bölümünden değiştirebilir';

const TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
export const sadeYazi = (s) => String(s || '').replace(/[çğıİöşüÇĞÖŞÜ]/g, c => TR[c]).toLowerCase().replace(/[^a-z0-9]/g, '');

// kullanilanlar: küçük harfli kullanıcı adlarından oluşan Set (önerilen ad buna eklenir)
export function kullaniciAdiOner(ad, okulno = '', kullanilanlar = new Set()) {
    const ilk = sadeYazi(String(ad || '').trim().split(/\s+/)[0]) || 'ogrenci';
    const temel = `${ilk}${String(okulno || '').replace(/\D/g, '')}`;
    let aday = temel;
    for (let i = 2; kullanilanlar.has(aday); i++) aday = `${temel}${i}`;
    kullanilanlar.add(aday);
    return aday;
}

// Çocukların kolayca yazabileceği, Türkçe harf içermeyen kelimeler
const SIFRE_KELIMELERI = [
    'elma', 'armut', 'kiraz', 'erik', 'incir', 'ayva', 'limon', 'kavun', 'karpuz', 'muz', 'nar', 'mango',
    'hurma', 'kedi', 'aslan', 'kaplan', 'zebra', 'panda', 'tavsan', 'ayi', 'kartal', 'balina', 'yunus', 'ahtapot',
    'kanguru', 'penguen', 'papagan', 'tilki', 'sincap', 'kirpi', 'koala', 'tavuk', 'horoz', 'kaz', 'inek', 'koyun',
    'deve', 'fil', 'kurt', 'geyik', 'kunduz', 'foka', 'marti', 'leylek', 'serce', 'deniz', 'nehir', 'orman',
    'bulut', 'toprak', 'kaya', 'ada', 'vadi', 'tepe', 'papatya', 'lale', 'zambak', 'nergis', 'defne', 'yaprak',
    'dal', 'bahar', 'yaz', 'kalem', 'silgi', 'kitap', 'defter', 'masa', 'top', 'balon', 'kutu', 'pasta',
    'kek', 'simit', 'bisiklet', 'araba', 'tren', 'gemi', 'roket', 'kamyon', 'fener', 'saat', 'anahtar', 'pencere',
    'lamba', 'terlik', 'eldiven', 'ceket', 'harita', 'pusula', 'robot', 'davul', 'gitar', 'keman', 'zil', 'mavi',
    'mor', 'pembe', 'beyaz', 'turuncu', 'lacivert', 'gri', 'bordo', 'ekmek', 'peynir', 'zeytin', 'bal', 'ceviz',
    'findik', 'badem', 'kestane', 'mantar', 'havuc', 'patates', 'domates', 'biber', 'marul', 'yildirim', 'kasirga', 'elmas',
    'yakut', 'zumrut', 'inci', 'altin', 'gumus', 'bakir', 'demir', 'kale', 'kule', 'kopru', 'saray', 'cadir',
    'sepet', 'sandal', 'yelken', 'kayik', 'ruzgar', 'sihir', 'masal', 'oyun', 'sarki', 'resim', 'boya', 'yengec'
];
const rastgele = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
export const sifreOner = () => SIFRE_KELIMELERI[rastgele(SIFRE_KELIMELERI.length)] + String(1000 + rastgele(9000));

// Yeni ya da değişen şifre için kural (eski hesapların şifresine dokunulmaz). Sorun yoksa boş yazı döner.
export function sifreSorunu(sifre) {
    const s = String(sifre || '');
    if (s.length < 6) return 'Şifre en az 6 karakter olmalı (ör. kedi4827)';
    if (!/[0-9]/.test(s) || !/[^0-9]/.test(s)) return 'Şifrede hem harf hem rakam olmalı (ör. kedi4827)';
    return '';
}

// Başka bir sınıfta aynı kullanıcı adı varsa giriş hesabı açılamaz; sonuna harf eklenerek tekrar denenir (ada101 -> ada101b)
export const yedekKullaniciAdi = (ad, deneme) => `${ad}${'bcdefgh'[deneme - 1] || deneme}`;

// Excel'den ya da elle yazılmış bir satır: "Ali Yılmaz  101", "Ali Yılmaz<TAB>101<TAB>12345678901"
// ya da eski 5 sütunlu biçim: ad, TC, okul no, kullanıcı adı, şifre
export function satirCoz(satir) {
    const s = String(satir || '').trim();
    if (!s) return null;
    const sutun = s.split('\t').map(x => x.trim());
    if (sutun.length >= 4) {
        const [ad, tcno = '', okulno = '', kullanici = '', sifre = ''] = sutun;
        return { ad, tcno: tcno.replace(/\D/g, ''), okulno: okulno.replace(/\D/g, ''), kullanici, sifre };
    }
    let ad = sutun[0], okulno = '', tcno = '';
    for (const x of sutun.slice(1)) { const r = x.replace(/\D/g, ''); if (r.length === 11) tcno = r; else if (r) okulno = r; }
    if (sutun.length === 1) {   // boşlukla yazılmış: "Ali Yılmaz 101" ya da "Ali Yılmaz 101 12345678901"
        const p = ad.split(/\s+/);
        while (p.length > 1 && /^\d+$/.test(p[p.length - 1])) { const r = p.pop(); if (r.length === 11) tcno = r; else okulno = r; }
        ad = p.join(' ');
    }
    return ad ? { ad, okulno, tcno, kullanici: '', sifre: '' } : null;
}

// Giriş kartları: A4'e 8 kart (2 sütun), kesip öğrenciye / veliye verilir
export function girisKartlariniYazdir(ogrenciler, sinifAdi) {
    const adres = location.origin + location.pathname.replace(/[^/]*$/, '');
    const veli = veliLinki();
    const kartlar = ogrenciler.map(o => `
        <div class="kart">
            <div class="ust"><b>${esc(sinifAdi)}</b> Sınıf Panosu · Giriş kartı</div>
            <div class="ad">${esc(o.name)}</div>
            <table>
                <tr><td>Kullanıcı adı</td><td class="kod">${esc(o.username || '')}</td></tr>
                <tr><td>Şifre</td><td class="kod">${esc(o.password || '')}</td></tr>
            </table>
            <ol class="adimlar">
                <li><b>${esc(adres)}</b> adresini açın</li>
                <li>Sağ üstteki <b>Giriş yap</b>'a dokunun</li>
                <li>Kullanıcı adını ve şifreyi yazın</li>
            </ol>
            <div class="alt"><b>Veliler giriş yapmadan da bakabilir:</b> ${esc(veli)} · sınıf kodu <b>${esc(aktifSinifId())}</b></div>
        </div>`).join('');
    yazdir(`${sinifAdi} giriş kartları`, `
        <style>
            .kartlar { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
            .kart { border: 1px dashed #999; padding: 14px 16px; break-inside: avoid; min-height: 62mm; font-size: 13px; }
            .kart .ust { font-size: 11px; color: #5e554a; text-transform: none; }
            .kart .ad { font-size: 19px; font-weight: 600; margin: 6px 0 8px; }
            .kart table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .kart td { border: 0; padding: 3px 0; }
            .kart td:first-child { color: #5e554a; width: 40%; }
            .kart .kod { font-family: ui-monospace, Menlo, monospace; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
            .kart .adimlar { margin: 0 0 8px 18px; padding: 0; font-size: 12px; line-height: 1.6; }
            .kart .adimlar b { overflow-wrap: anywhere; }
            .kart .alt { font-size: 11px; color: #3b342c; line-height: 1.5; border-top: 1px solid #ddd; padding-top: 6px; overflow-wrap: anywhere; }
        </style>
        <p style="margin:-8px 0 12px;color:#5e554a;font-size:12px">${esc(DUZEN_ACIKLAMASI)}. Kesik çizgilerden kesip dağıtabilirsiniz</p>
        <div class="kartlar">${kartlar}</div>`);
}
