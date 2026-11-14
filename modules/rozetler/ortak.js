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
    { dosya: 'dunya-gezgini', ad: 'Dünya gezgini', kategori: 'akademik', aciklama: 'Ülkeleri ve haritaları merak etti' },
    { dosya: 'genc-bilim-insani', ad: 'Genç bilim insanı', kategori: 'akademik', aciklama: 'Deneylerde çok başarılıydı' },
    { dosya: 'uzay-kasifi', ad: 'Uzay kâşifi', kategori: 'akademik', aciklama: 'Gökyüzünü ve uzayı merak etti' },
    { dosya: 'dil-ustasi', ad: 'Dil ustası', kategori: 'akademik', aciklama: 'Yabancı dil dersinde başarılı oldu' },
    { dosya: 'sesli-okuma', ad: 'Sesli okuma', kategori: 'akademik', aciklama: 'Sesli okumada çok başarılıydı' },
    { dosya: 'kitap-dostu', ad: 'Kitap dostu', kategori: 'akademik', aciklama: 'Birçok kitap okudu' },
    { dosya: 'kitap-kulesi', ad: 'Kitap kulesi', kategori: 'akademik', aciklama: 'Çok sayıda kitap okudu' },
    { dosya: 'geometri-ustasi', ad: 'Geometri ustası', kategori: 'akademik', aciklama: 'Şekiller ve ölçmede başarılıydı' },
    { dosya: 'satranc-ustasi', ad: 'Satranç ustası', kategori: 'akademik', aciklama: 'Satrançta stratejik düşündü' },
    { dosya: 'genc-kodcu', ad: 'Genç kodcu', kategori: 'akademik', aciklama: 'Kodlama etkinliğinde başarılı oldu' },
    { dosya: 'saglikli-beslenme', ad: 'Sağlıklı beslenme', kategori: 'sorumluluk', aciklama: 'Beslenme çantasında sağlıklı yiyecekler getirdi' },
    { dosya: 'su-dostu', ad: 'Su dostu', kategori: 'sorumluluk', aciklama: 'Suyu tasarruflu kullandı' },
    { dosya: 'geri-donusum', ad: 'Geri dönüşüm kahramanı', kategori: 'sorumluluk', aciklama: 'Atıkları ayrıştırdı' },
    { dosya: 'doga-dostu', ad: 'Doğa dostu', kategori: 'sorumluluk', aciklama: 'Doğayı ve çevreyi korudu' },
    { dosya: 'temiz-eller', ad: 'Temiz eller', kategori: 'sorumluluk', aciklama: 'Ellerini düzenli yıkadı' },
    { dosya: 'sporcu', ad: 'Sporcu', kategori: 'gelisim', aciklama: 'Beden eğitiminde çok başarılıydı' },
    { dosya: 'hizli-kosucu', ad: 'Hızlı koşucu', kategori: 'gelisim', aciklama: 'Koşuda harika bir derece yaptı' },
    { dosya: 'muzisyen', ad: 'Müzisyen', kategori: 'yaraticilik', aciklama: 'Müzik dersinde yeteneğini gösterdi' },
    { dosya: 'tiyatrocu', ad: 'Tiyatrocu', kategori: 'yaraticilik', aciklama: 'Gösteride rolünü çok iyi oynadı' },
    { dosya: 'sampiyon', ad: 'Şampiyon', kategori: 'gelisim', aciklama: 'Yarışmada birinci oldu' },
    { dosya: 'hayvan-dostu', ad: 'Hayvan dostu', kategori: 'davranis', aciklama: 'Hayvanlara sevgiyle davrandı' },
    { dosya: 'guler-yuzlu', ad: 'Güler yüzlü', kategori: 'davranis', aciklama: 'Her zaman neşeli ve olumluydu' },
    { dosya: 'iyi-dinleyici', ad: 'İyi dinleyici', kategori: 'davranis', aciklama: 'Arkadaşlarını ve öğretmenini dikkatle dinledi' },
    { dosya: 'iyi-arkadas', ad: 'İyi arkadaş', kategori: 'davranis', aciklama: 'Arkadaşlarıyla çok iyi anlaştı' },
    { dosya: 'baris-elcisi', ad: 'Barış elçisi', kategori: 'davranis', aciklama: 'Anlaşmazlıkları güzellikle çözdü' },
    { dosya: 'guvenilir', ad: 'Güvenilir', kategori: 'davranis', aciklama: 'Kendisine güvenilen bir arkadaş oldu' },
    { dosya: 'odev-yildizi', ad: 'Ödev yıldızı', kategori: 'sorumluluk', aciklama: 'Ödevlerini eksiksiz yaptı' },
    { dosya: 'devamli', ad: 'Tam devam', kategori: 'sorumluluk', aciklama: 'Okula hiç devamsızlık yapmadı' },
    { dosya: 'aktif-katilim', ad: 'Aktif katılım', kategori: 'sorumluluk', aciklama: 'Derslere aktif katıldı' },
    { dosya: 'sinif-yardimcisi', ad: 'Sınıf yardımcısı', kategori: 'sorumluluk', aciklama: 'Sınıf görevlerini üstlendi' },
    { dosya: 'ilerleme', ad: 'İlerleme', kategori: 'gelisim', aciklama: 'Her gün bir adım daha ilerledi' },
    { dosya: 'basari-madalyasi', ad: 'Başarı madalyası', kategori: 'gelisim', aciklama: 'Önemli bir başarı elde etti' },
    { dosya: 'hizli-ogrenen', ad: 'Hızlı öğrenen', kategori: 'gelisim', aciklama: 'Yeni konuları çabucak kavradı' },
    { dosya: 'yeni-baslangic', ad: 'Yeni başlangıç', kategori: 'gelisim', aciklama: 'Yeni döneme harika başladı' },
    { dosya: 'sinif-lideri', ad: 'Sınıf lideri', kategori: 'gelisim', aciklama: 'Arkadaşlarına örnek oldu' },
    { dosya: 'mucit', ad: 'Mucit', kategori: 'yaraticilik', aciklama: 'Yaratıcı bir buluş yaptı' },
    { dosya: 'fotografci', ad: 'Fotoğrafçı', kategori: 'yaraticilik', aciklama: 'Güzel fotoğraflar çekti' },
    { dosya: 'el-becerisi', ad: 'El becerisi', kategori: 'yaraticilik', aciklama: 'El işinde çok başarılıydı' },
    { dosya: 'kucuk-mimar', ad: 'Küçük mimar', kategori: 'yaraticilik', aciklama: 'Harika yapılar inşa etti' },
    { dosya: 'genc-sair', ad: 'Genç şair', kategori: 'yaraticilik', aciklama: 'Güzel bir şiir yazdı' },
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
