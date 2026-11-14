// Beslenme programı: tek kayıt { pazartesi, sali, carsamba, persembe, cuma }
import { db } from '../../js/db.js';

export const TABLO = 'beslenme_programi';
export const GUNLER = [
    { ad: 'Pazartesi', anahtar: 'pazartesi', ornek: 'Haşlanmış yumurta, peynir, meyve suyu' },
    { ad: 'Salı', anahtar: 'sali', ornek: 'Ev yapımı kek, süt' },
    { ad: 'Çarşamba', anahtar: 'carsamba', ornek: 'Zeytinli poğaça, ayran' },
    { ad: 'Perşembe', anahtar: 'persembe', ornek: 'Tost, mevsim meyvesi' },
    { ad: 'Cuma', anahtar: 'cuma', ornek: 'Gözleme, ayran' },
];

export async function planGetir() {
    const kayitlar = await db.getAll(TABLO);
    return kayitlar[0] || {};
}

// Hafta içiyse bugünün sırası (0-4), hafta sonuysa -1
export const bugunSirasi = () => { const g = new Date().getDay(); return g >= 1 && g <= 5 ? g - 1 : -1; };
