// ÇOK SINIFLI YAPI
// Her öğretmenin kendi sınıfı vardır. Sınıfın verisi Firestore'da şöyle durur:
//   ana sınıf (3/D, ilk kurulan)  -> eskisi gibi en üstteki tablolar: users, kitap_matrisi, ...
//   diğer sınıflar                -> siniflar/{sinifId}/users, siniflar/{sinifId}/kitap_matrisi, ...
// Böylece ana sınıfın verisi hiç taşınmadan yerinde kalır.
// Ortak tablolar (her sınıf için tek): roller (giriş hesabı -> kişi + sınıf), siniflar (sınıf bilgisi), davetler.
//
// Hangi sınıfın açık olduğu:
//   öğretmen/öğrenci sayfası -> giriş yapan kişinin sınıfı
//   veli sayfası (index.html?sinif=4a) -> adresteki sınıf. Adres boşsa index.html tanıtım sayfasıdır.
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore } from './firebase.js';

export const ANA_SINIF = '3d';
const ORTAK_TABLOLAR = new Set(['roller', 'siniflar', 'davetler']);

const gecerliId = (s) => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,29}$/.test(s);
const panelSayfasi = () => /(teacher|student|kurulum)\.html$/.test(location.pathname);

function kayitliKullanici() {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
}
export function adrestekiSinif() {
    try { const s = new URLSearchParams(location.search).get('sinif'); return gecerliId(s) ? s : null; } catch { return null; }
}

export function aktifSinifId() {
    const k = kayitliKullanici();
    if (panelSayfasi()) return gecerliId(k?.sinifId) ? k.sinifId : ANA_SINIF;
    return adrestekiSinif() || (gecerliId(k?.sinifId) ? k.sinifId : ANA_SINIF);
}

// Tablonun Firestore yolu (parçalar halinde): ['users'] ya da ['siniflar', '4a', 'users']
export function tabloYolu(tablo, sinifId = aktifSinifId()) {
    return ORTAK_TABLOLAR.has(tablo) || sinifId === ANA_SINIF ? [tablo] : ['siniflar', sinifId, tablo];
}

// Sınıf bilgisi: { id, ad, okul, kurulumBitti, ... }. Ana sınıfın kaydı yoksa varsayılan kullanılır.
const onbellek = new Map();
export async function sinifBilgisi(sinifId = aktifSinifId(), { yenile = false } = {}) {
    if (!yenile && onbellek.has(sinifId)) return onbellek.get(sinifId);
    let bilgi = null;
    try {
        const snap = await getDoc(doc(firestore, 'siniflar', sinifId));
        if (snap.exists()) bilgi = { id: sinifId, ...snap.data() };
    } catch (e) { console.warn('Sınıf bilgisi okunamadı:', e.code || e); }
    if (!bilgi && sinifId === ANA_SINIF) bilgi = { id: ANA_SINIF, ad: '3/D', kurulumBitti: true, varsayilan: true };
    if (bilgi) onbellek.set(sinifId, bilgi);
    return bilgi;
}

// Velilere verilecek link
export function veliLinki(sinifId = aktifSinifId()) {
    const taban = location.origin + location.pathname.replace(/[^/]*$/, '');
    return `${taban}?sinif=${sinifId}`; // ana adres artık tanıtım sayfası; her sınıfın kendi linki var
}

// "4/A" -> "4a", "Papatyalar Sınıfı" -> "papatyalar-sinifi"
export function sinifKisaltmasi(ad) {
    const tr = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    return String(ad || '').replace(/[çğıİöşüÇĞÖŞÜ]/g, c => tr[c]).toLowerCase()
        .replace(/\//g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'sinif';
}
