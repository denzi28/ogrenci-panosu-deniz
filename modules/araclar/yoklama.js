// Yoklama: her gün için bir kayıt -> yoklama/{YYYY-MM-DD} = { tarih, gelmeyenler: [öğrenci id], guncelleme }
// Tahta araçlarında "Bugün gelmeyenler" seçilince yazılır; gelişim raporu devamsızlığı buradan sayar.
// Sadece sınıfın öğretmeni okur ve yazar (firestore.rules).
import { db } from '../../js/db.js';

const TABLO = 'yoklama';
const ikiHane = (n) => String(n).padStart(2, '0');

// Yerel tarih (gece yarısından sonra UTC'ye göre bir önceki güne kaymasın)
export function bugunTarihi(t = new Date()) {
    return `${t.getFullYear()}-${ikiHane(t.getMonth() + 1)}-${ikiHane(t.getDate())}`;
}

export async function gunuGetir(tarih = bugunTarihi()) {
    return db.get(TABLO, tarih);
}

export async function gunuKaydet(gelmeyenler, tarih = bugunTarihi()) {
    const tamam = await db.setWithId(TABLO, tarih, { tarih, gelmeyenler: [...gelmeyenler], guncelleme: new Date().toISOString() });
    if (!tamam) throw new Error('Yoklama kaydedilemedi');
}

export async function hepsiniGetir() {
    return db.getAll(TABLO);
}

// { gunSayisi, devamsizlik(id) -> gün sayısı, tarihler(id) -> ['2026-11-12', ...] }
export function devamOzeti(kayitlar = []) {
    const harita = new Map();
    for (const k of kayitlar) for (const id of k.gelmeyenler || []) {
        if (!harita.has(id)) harita.set(id, []);
        harita.get(id).push(k.tarih || k.id);
    }
    harita.forEach(l => l.sort());
    return {
        gunSayisi: kayitlar.length,
        devamsizlik: (id) => harita.get(id)?.length || 0,
        tarihler: (id) => harita.get(id) || [],
    };
}
