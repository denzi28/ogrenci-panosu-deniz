// Öğrenci avatarları: çocuk hazır listeden bir hayvan seçer; panolarda ve ana sayfada adının yanında görünür.
// Saklama: avatarlar/{öğrenciId} = { avatar: 'aslan' }  (sınıfın kendi yolunda, bkz. js/sinif.js)
//   - Herkes okur (panolar velilere de açık), öğrenci sadece KENDİ kaydına sadece "avatar" alanını yazar (firestore.rules).
//   - Kullanıcı kayıtlarından (users / users_gizli) ayrıdır; yedekten geri yüklemede ve göç aracında bozulmaz.
// Saklanan değer çocuğun yazdığı bir anahtardır; ekrana asla olduğu gibi basılmaz, sadece aşağıdaki listeden karşılığı gösterilir.
import { db } from './db.js';
import { esc } from './arayuz.js';

export const AVATARLAR = {
    aslan: ['🦁', 'Aslan'], kaplan: ['🐯', 'Kaplan'], panda: ['🐼', 'Panda'], tilki: ['🦊', 'Tilki'],
    tavsan: ['🐰', 'Tavşan'], kedi: ['🐱', 'Kedi'], kopek: ['🐶', 'Köpek'], ayi: ['🐻', 'Ayı'],
    koala: ['🐨', 'Koala'], baykus: ['🦉', 'Baykuş'], penguen: ['🐧', 'Penguen'], kaplumbaga: ['🐢', 'Kaplumbağa'],
    yunus: ['🐬', 'Yunus'], balina: ['🐳', 'Balina'], ahtapot: ['🐙', 'Ahtapot'], kelebek: ['🦋', 'Kelebek'],
    ari: ['🐝', 'Arı'], zurafa: ['🦒', 'Zürafa'], fil: ['🐘', 'Fil'], kurbaga: ['🐸', 'Kurbağa'],
    tekboynuz: ['🦄', 'Tek boynuzlu at'], maymun: ['🐵', 'Maymun'], civciv: ['🐥', 'Civciv'], dinozor: ['🦕', 'Dinozor'],
};
const TABLO = 'avatarlar';

// Avatar seçimi, veritabanı kuralı (firestore.rules: avatarlar) yayınlandıktan sonra açılır.
// Kapalıyken: seçici görünmez; daha önce seçilmiş avatarlar yine gösterilir.
export const AVATAR_SECIMI_ACIK = true;

const basHarf = (ad) => String(ad || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('tr-TR');

// Map(öğrenciId -> avatar anahtarı). Okunamazsa boş: panolar avatarsız da çalışır.
export async function avatarlariGetir() {
    try {
        const liste = await db.getAll(TABLO);
        return new Map(liste.filter(k => AVATARLAR[k.avatar]).map(k => [k.id, k.avatar]));
    } catch { return new Map(); }
}

// Avatar rozeti; avatar seçilmemişse adın baş harfleri
export function avatarHtml(anahtar, ad, { boyut = 32, sinif = '' } = {}) {
    const a = AVATARLAR[anahtar];
    return a
        ? `<span class="avatar-rozet ${sinif}" style="--boyut:${boyut}px" role="img" aria-label="${esc(a[1])}">${a[0]}</span>`
        : `<span class="avatar-rozet bos ${sinif}" style="--boyut:${boyut}px" aria-hidden="true">${esc(basHarf(ad))}</span>`;
}

// Öğrencilere .avatar alanı ekler (sadece bellekte; kayıtlara yazılmaz)
export async function avatarlariEkle(ogrenciler) {
    const harita = await avatarlariGetir();
    ogrenciler.forEach(o => { o.avatar = harita.get(o.id) || null; });
    return ogrenciler;
}

export async function avatarKaydet(ogrId, anahtar) {
    if (!AVATARLAR[anahtar]) throw new Error('Bilinmeyen avatar');
    const tamam = await db.setWithId(TABLO, String(ogrId), { avatar: anahtar });
    if (!tamam) throw new Error('Avatar kaydedilemedi');
}
