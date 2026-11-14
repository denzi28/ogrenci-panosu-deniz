// İhtiyaçlar: kalemler (ihtiyac_kalemleri) × öğrenciler, durum ihtiyac_matrisi'nde
// Değer: boş = getirmedi; "X", "✔️", "getirdi" = getirdi; "devamsız" = devamsız; başka yazı = not (getirdi sayılır)
import { db } from '../../js/db.js';
import { esc, sayi } from '../../js/arayuz.js';

export const KALEMLER = 'ihtiyac_kalemleri';
export const MATRIS = 'ihtiyac_matrisi';
export const GETIRDI = 'X';

export async function verileriGetir() {
    const [kalemler, kullanicilar, matris] = await Promise.all([db.getAll(KALEMLER), db.getAll('users'), db.getAll(MATRIS)]);
    const ogrenciler = kullanicilar.filter(u => u.role === 'student').sort((a, b) =>
        (parseInt(a.okulno) || 1e6) - (parseInt(b.okulno) || 1e6) || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    kalemler.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    const harita = new Map(matris.map(m => [`${m.ogrId}_${m.targetId}`, String(m.deger ?? '').trim()]));
    return { kalemler, ogrenciler, harita };
}

export function durum(deger) {
    const d = String(deger || '').trim().toLocaleLowerCase('tr-TR');
    if (!d) return 'bekliyor';
    if (d === 'devamsız' || d === 'devamsiz') return 'devamsiz';
    if (['x', '✔️', '✔', 'getirdi', 'var'].includes(d)) return 'getirdi';
    return 'not';
}
export const getirdiMi = (deger) => ['getirdi', 'not'].includes(durum(deger));
export const deger = (harita, ogrId, kalemId) => harita.get(`${ogrId}_${kalemId}`) || '';

export function kalemOzeti(kalem, ogrenciler, harita) {
    return ogrenciler.filter(o => getirdiMi(deger(harita, o.id, kalem.id))).length;
}

// İlerleme çubuğu: kaç öğrenci getirdi
export function ilerlemeHtml(getiren, toplam) {
    const oran = toplam ? Math.round((getiren / toplam) * 100) : 0;
    return `<span class="ilerleme" role="img" aria-label="${toplam} öğrenciden ${getiren} getirdi"><span style="transform:scaleX(${oran / 100})"></span></span>
        <span class="ilerleme-yazi">${sayi(getiren)}<small>/${sayi(toplam)}</small></span>`;
}

export const kalemAdi = (k) => esc(k.ad);
