// Rozetler: öğretmen, öğrenci ve veli görünümlerinin ortak hesapları ve rozet çizimi.
// Veri: rozetler_kalemleri (ad, kategori, icon, shape, style1, style2, altYazi, aciklama)
//       rozet_matrisi (ogrId, targetId, deger: '✔️' verildi | '' yok)
import { db } from '../../js/db.js';
import { esc } from '../../js/arayuz.js';

export const VERILDI = '✔️';

export const KATEGORILER = {
    davranis:    { ad: 'Davranış ve değerler',       renk: '#c2410c' },
    akademik:    { ad: 'Akademik başarı',            renk: '#1d4ed8' },
    gelisim:     { ad: 'Çaba ve gelişim',            renk: '#a16207' },
    sorumluluk:  { ad: 'Sorumluluk ve düzen',        renk: '#6d28d9' },
    yaraticilik: { ad: 'Yaratıcılık ve iş birliği',  renk: '#047857' },
};
export const kategoriAl = (r) => KATEGORILER[r.kategori] ? r.kategori : 'akademik';

export const SEKILLER = {
    '50%': 'Daire', kalkan: 'Kalkan', '12px': 'Yumuşak kare', '0px': 'Kare',
    tirtikli: 'Tırtıklı', yildizpatlama: 'Yıldız patlaması', sekizgen: 'Sekizgen',
};

export const IKONLAR = ['⭐', '🏆', '🥇', '📚', '✏️', '💡', '🎯', '🚀', '🎨', '🔍', '🤝', '👥', '❤️', '⏰', '🎒', '🎓', '👑', '🌱', '🧹', '🧮'];

export async function verileriGetir() {
    const [rozetler, kullanicilar, matris] = await Promise.all([
        db.getAll('rozetler_kalemleri'),
        db.getAll('users'),
        db.getAll('rozet_matrisi'),
    ]);
    rozetler.sort((a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr-TR'));
    return { rozetler, ogrenciler: kullanicilar.filter(u => u.role === 'student'), matris };
}

// "öğrenciId_rozetId" -> verildi mi
export function sahiplik(matris) {
    const s = new Set();
    matris.forEach(m => { if (m.deger === VERILDI) s.add(`${m.ogrId}_${m.targetId}`); });
    return s;
}
export const sahipMi = (s, ogrId, rozetId) => s.has(`${ogrId}_${rozetId}`);

// Kategori sırasıyla gruplanmış rozetler: [[kategoriId, [rozet...]], ...]
export function kategoriyeGore(rozetler) {
    return Object.keys(KATEGORILER)
        .map(k => [k, rozetler.filter(r => kategoriAl(r) === k)])
        .filter(([, liste]) => liste.length);
}

// ÖNE ÇIKAN AN: rozetin kendisi. Öğretmenin seçtiği iki renk, şekil, ikon ve iç yazıyla madalya.
export function rozetGorseli(r, boyut = 48, kilitli = false) {
    const ikon = r.icon || '⭐';
    // Eski kayıtlarda resim yolu olabilir
    if (!r.style1 && (ikon.endsWith('.png') || ikon.includes('/'))) {
        return `<img src="${esc(ikon)}" alt="" width="${boyut}" height="${boyut}" style="object-fit:contain;vertical-align:middle${kilitli ? ';filter:grayscale(1);opacity:.45' : ''}">`;
    }
    const c1 = r.style1 || '#fbbf24', c2 = r.style2 || '#d97706';
    const sekil = String(r.shape || '50%').replace(/^shape-/, ''); // 'shape-kalkan' gibi eski yazımları da tanı
    const sinif = ['tirtikli', 'yildizpatlama', 'sekizgen', 'kalkan'].includes(sekil) ? ` shape-${sekil}` : '';
    const radius = sinif ? '' : `border-radius:${sekil === '50%' ? '50%' : esc(sekil)};`;
    const yazi = r.altYazi ? `<span class="madalya-yazi">${esc(r.altYazi)}</span>` : '';
    return `<span class="madalya${sinif}${kilitli ? ' kilitli' : ''}" aria-hidden="true"
        style="--b:${boyut}px;${radius}background:linear-gradient(145deg, ${esc(c1)}, ${esc(c2)})">
        <span class="madalya-ikon${r.altYazi ? ' yazili' : ''}">${esc(ikon)}</span>${yazi}</span>`;
}
