// Kitap okuma: öğretmen, öğrenci ve veli görünümlerinin ortak hesapları.
// Veri: kitaplar_kalemleri (no, ad), kitap_matrisi (ogrId, targetId, deger: '⏳' okuyor | '✔️' okudu | '' yok, tarih)
import { db } from '../../js/db.js';
import { esc } from '../../js/arayuz.js';

export const OKUYOR = '⏳';
export const OKUDU = '✔️';
export const NUMARASIZ = 999; // eski sistemde numarasız kitaplar 999 ile kaydediliyordu

export async function verileriGetir() {
    const [kalemler, kullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi'),
    ]);
    kalemler.sort((a, b) => numara(a) - numara(b) || (a.ad || '').localeCompare(b.ad || '', 'tr-TR'));
    return { kalemler, ogrenciler: kullanicilar.filter(u => u.role === 'student'), matris };
}

const numara = (k) => (k.no !== undefined && k.no !== null && k.no !== '') ? parseInt(k.no) : NUMARASIZ;
export const numarasiVar = (k) => numara(k) !== NUMARASIZ && !Number.isNaN(numara(k));

// "#12 Matilda" ya da sadece "Matilda"
export function kitapAdiHtml(k) {
    return numarasiVar(k) ? `<span class="kitap-no">${numara(k)}</span>${esc(k.ad)}` : esc(k.ad);
}
export const kitapAdiDuz = (k) => numarasiVar(k) ? `${numara(k)}. ${k.ad}` : k.ad;

export function durumHaritasi(matris) {
    const h = new Map();
    matris.forEach(m => h.set(`${m.ogrId}_${m.targetId}`, { deger: m.deger || '', tarih: m.tarih || null }));
    return h;
}
export const durumAl = (h, ogrId, kitapId) => h.get(`${ogrId}_${kitapId}`) || { deger: '', tarih: null };

export function gunFarki(tarih) {
    if (!tarih) return null;
    const a = new Date(tarih), b = new Date();
    a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
    return Math.floor((b - a) / 86400000);
}
export function sureMetni(tarih) {
    const g = gunFarki(tarih);
    if (g === null) return 'tarih yok';
    return g === 0 ? 'bugün aldı' : `${g} gündür okuyor`;
}

// Öğrenci başına özet
export function ogrenciOzeti(ogr, kalemler, h) {
    const okunan = [], okuyor = [];
    kalemler.forEach(k => {
        const d = durumAl(h, ogr.id, k.id);
        if (d.deger === OKUDU) okunan.push({ ...k, tarih: d.tarih });
        else if (d.deger === OKUYOR) okuyor.push({ ...k, tarih: d.tarih });
    });
    return { okunan, okuyor };
}

// Kitap başına özet
export function kitapOzeti(k, ogrenciler, h) {
    const okuyanlar = [], okumuslar = [];
    ogrenciler.forEach(o => {
        const d = durumAl(h, o.id, k.id);
        if (d.deger === OKUYOR) okuyanlar.push(o);
        else if (d.deger === OKUDU) okumuslar.push(o);
    });
    return { okuyanlar, okumuslar };
}

export const SIRALAMALAR = {
    ad: { ad: 'Ada göre', fn: (a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR') },
    encok: { ad: 'En çok okuyan', fn: (a, b) => b.ozet.okunan.length - a.ozet.okunan.length || (b.ozet.okuyor.length - a.ozet.okuyor.length) || (a.name || '').localeCompare(b.name || '', 'tr-TR') },
    okuyan: { ad: 'Şu an okuyan', fn: (a, b) => (b.ozet.okuyor.length > 0) - (a.ozet.okuyor.length > 0) || (a.name || '').localeCompare(b.name || '', 'tr-TR') },
};
