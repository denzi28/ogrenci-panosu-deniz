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

// Hazır rozet görselleri (assets/rozetler). Seçilince ad, kategori ve açıklama öneri olarak dolar.
export const HAZIR_ROZETLER = [
    { dosya: 'yardimsever',        ad: 'Yardımsever',          kategori: 'davranis',    aciklama: 'Arkadaşlarına yardım etti' },
    { dosya: 'saygili',            ad: 'Saygılı',              kategori: 'davranis',    aciklama: 'Herkese saygıyla davrandı' },
    { dosya: 'durust',             ad: 'Dürüst',               kategori: 'davranis',    aciklama: 'Her zaman doğruyu söyledi' },
    { dosya: 'nazik',              ad: 'Nazik',                kategori: 'davranis',    aciklama: 'Kibar ve anlayışlı davrandı' },
    { dosya: 'sabirli',            ad: 'Sabırlı',              kategori: 'davranis',    aciklama: 'Sırasını sabırla bekledi' },
    { dosya: 'kitap-kurdu',        ad: 'Kitap kurdu',          kategori: 'akademik',    aciklama: 'Kitap okumayı çok seviyor' },
    { dosya: 'matematik-ustasi',   ad: 'Matematik ustası',     kategori: 'akademik',    aciklama: 'Matematikte başarılı oldu' },
    { dosya: 'fen-kasifi',         ad: 'Fen kâşifi',           kategori: 'akademik',    aciklama: 'Doğayı ve bilimi merak etti' },
    { dosya: 'genc-yazar',         ad: 'Genç yazar',           kategori: 'akademik',    aciklama: 'Güzel bir yazı yazdı' },
    { dosya: 'harika-soru',        ad: 'Harika soru',          kategori: 'akademik',    aciklama: 'Derste düşündüren bir soru sordu' },
    { dosya: 'azimli',             ad: 'Azimli',               kategori: 'gelisim',     aciklama: 'Zorlandığında vazgeçmedi' },
    { dosya: 'gelisiyor',          ad: 'Gelişiyor',            kategori: 'gelisim',     aciklama: 'Kendini çok geliştirdi' },
    { dosya: 'hedefe-ulasti',      ad: 'Hedefe ulaştı',        kategori: 'gelisim',     aciklama: 'Koyduğu hedefe ulaştı' },
    { dosya: 'super-caba',         ad: 'Süper çaba',           kategori: 'gelisim',     aciklama: 'Çok çalıştı ve emek verdi' },
    { dosya: 'haftanin-yildizi',   ad: 'Haftanın yıldızı',     kategori: 'gelisim',     aciklama: 'Bu haftanın yıldızı oldu' },
    { dosya: 'duzenli',            ad: 'Düzenli',              kategori: 'sorumluluk',  aciklama: 'Eşyalarını düzenli tuttu' },
    { dosya: 'temizlik-kahramani', ad: 'Temizlik kahramanı',   kategori: 'sorumluluk',  aciklama: 'Sınıfın temizliğine yardım etti' },
    { dosya: 'dakik',              ad: 'Dakik',                kategori: 'sorumluluk',  aciklama: 'Derslere hep zamanında geldi' },
    { dosya: 'sanatci',            ad: 'Sanatçı',              kategori: 'yaraticilik', aciklama: 'Yaratıcı bir eser ortaya koydu' },
    { dosya: 'takim-oyuncusu',     ad: 'Takım oyuncusu',       kategori: 'yaraticilik', aciklama: 'Grup çalışmasında uyumlu oldu' },
].map(h => ({ ...h, resim: `assets/rozetler/${h.dosya}.webp` }));

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
    const yazi = r.altYazi ? `<span class="madalya-yazi">${esc(r.altYazi)}</span>` : '';
    // Hazır görselli rozet (üstüne yazı şeridi eklenebilir, ör. "20 kitap")
    if (r.resim) {
        return `<span class="madalya resimli${kilitli ? ' kilitli' : ''}" aria-hidden="true" style="--b:${boyut}px"><img src="${esc(r.resim)}" alt="" loading="lazy" decoding="async">${yazi}</span>`;
    }
    const ikon = r.icon || '⭐';
    // Eski kayıtlarda resim yolu olabilir
    if (!r.style1 && (ikon.endsWith('.png') || ikon.includes('/'))) {
        return `<img src="${esc(ikon)}" alt="" width="${boyut}" height="${boyut}" style="object-fit:contain;vertical-align:middle${kilitli ? ';filter:grayscale(1);opacity:.45' : ''}">`;
    }
    const c1 = r.style1 || '#fbbf24', c2 = r.style2 || '#d97706';
    const sekil = String(r.shape || '50%').replace(/^shape-/, ''); // 'shape-kalkan' gibi eski yazımları da tanı
    const sinif = ['tirtikli', 'yildizpatlama', 'sekizgen', 'kalkan'].includes(sekil) ? ` shape-${sekil}` : '';
    const radius = sinif ? '' : `border-radius:${sekil === '50%' ? '50%' : esc(sekil)};`;
    return `<span class="madalya${sinif}${kilitli ? ' kilitli' : ''}" aria-hidden="true"
        style="--b:${boyut}px;${radius}background:linear-gradient(145deg, ${esc(c1)}, ${esc(c2)})">
        <span class="madalya-ikon${r.altYazi ? ' yazili' : ''}">${esc(ikon)}</span>${yazi}</span>`;
}
