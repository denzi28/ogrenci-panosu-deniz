// Ödevler: odevler (baslik, ders, aciklama, teslim: "2026-11-20", visibleToGuest yok — modül anahtarıyla açılır)
//          odev_matrisi (ogrId, targetId, deger: '✔️' yaptı | '◐' eksik | '✗' yapmadı | '' bakılmadı)
import { db } from '../../js/db.js';
import { esc } from '../../js/arayuz.js';

export const KALEMLER = 'odevler';
export const MATRIS = 'odev_matrisi';
export const YAPTI = '✔️', EKSIK = '◐', YAPMADI = '✗';
export const DURUMLAR = [
    { deger: YAPTI, ad: 'Yaptı', ogrenciAd: 'Yaptın', sinif: 'yapti', ikon: 'fa-check' },
    { deger: EKSIK, ad: 'Eksik', ogrenciAd: 'Eksik yaptın', sinif: 'eksik', ikon: 'fa-circle-half-stroke' },
    { deger: YAPMADI, ad: 'Yapmadı', ogrenciAd: 'Yapmadın', sinif: 'yapmadi', ikon: 'fa-xmark' },
];
export const durumBilgi = (d) => DURUMLAR.find(x => x.deger === d) || null;

export async function verileriGetir() {
    const [odevler, kullanicilar, matris] = await Promise.all([db.getAll(KALEMLER), db.getAll('users'), db.getAll(MATRIS)]);
    const ogrenciler = kullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    const harita = new Map(matris.map(m => [`${m.ogrId}_${m.targetId}`, String(m.deger ?? '')]));
    return { odevler: teslimSirasi(odevler), ogrenciler, harita };
}
export const durumAl = (h, ogrId, odevId) => h.get(`${ogrId}_${odevId}`) || '';

// Yerel saatle bugün "2026-11-15"
export function bugun() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const kalanGun = (teslim) => teslim ? Math.round((new Date(`${teslim}T12:00`) - new Date(`${bugun()}T12:00`)) / 864e5) : null;
export const gectiMi = (o) => o.teslim && o.teslim < bugun();

// Yaklaşanlar en yakın tarihten, geçmişler en yeniden
export function teslimSirasi(liste) {
    const yaklasan = liste.filter(o => !gectiMi(o)).sort((a, b) => (a.teslim || '9999').localeCompare(b.teslim || '9999'));
    const gecmis = liste.filter(gectiMi).sort((a, b) => b.teslim.localeCompare(a.teslim));
    return [...yaklasan, ...gecmis];
}

const gunAy = (t) => new Date(`${t}T12:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
export function teslimMetni(o) {
    if (!o.teslim) return 'Teslim tarihi yok';
    const k = kalanGun(o.teslim);
    const ek = k === 0 ? ' · bugün' : k === 1 ? ' · yarın' : k > 1 && k < 8 ? ` · ${k} gün kaldı` : '';
    return `Teslim ${gunAy(o.teslim)}${ek}`;
}
export function teslimEtiketi(o) {
    const k = kalanGun(o.teslim);
    if (k === null || k < 0) return '';
    if (k === 0) return '<span class="etiket okuyor">Bugün</span>';
    if (k === 1) return '<span class="etiket okuyor">Yarın</span>';
    return '';
}

// Öğrencinin ödev özeti (sadece bakılmış ya da süresi geçmiş ödevler sayılır)
export function ogrenciOzeti(ogrId, odevler, h) {
    const oz = { yapti: 0, eksik: 0, yapmadi: 0, bekleyen: 0, eksikler: [] };
    odevler.forEach(o => {
        const d = durumAl(h, ogrId, o.id);
        if (d === YAPTI) oz.yapti++;
        else if (d === EKSIK) { oz.eksik++; oz.eksikler.push(o); }
        else if (d === YAPMADI) { oz.yapmadi++; oz.eksikler.push(o); }
        else oz.bekleyen++;
    });
    return oz;
}

export const odevBasligi = (o) => `${esc(o.baslik)}${o.ders ? ` <span class="etiket rafta">${esc(o.ders)}</span>` : ''}`;
