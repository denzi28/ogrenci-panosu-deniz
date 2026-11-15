// Davranış panosu: öğretmen, öğrenci ve veli görünümlerinin ortak hesapları ve çizimleri.
import { db } from '../../js/db.js';
import { esc, sayi } from '../../js/arayuz.js';
import { avatarlariEkle, avatarHtml } from '../../js/avatar.js';

// Sıralama satırında ad: avatar + isim
export const adHtml = (o) => `${avatarHtml(o.avatar, o.name, { boyut: 28 })}<span class="ad-yazi">${esc(o.name)}</span>`;

export const ENCOK_YILDIZ = 5;

export async function verileriGetir() {
    const [kriterler, kullanicilar, matris] = await Promise.all([
        db.getAll('davranis_kriterleri'),
        db.getAll('users'),
        db.getAll('davranis_matrisi'),
    ]);
    const ogrenciler = await avatarlariEkle(kullanicilar.filter(u => u.role === 'student'));
    return { kriterler, ogrenciler, matris };
}

// Öğrenci + davranış -> yıldız sayısı. Hızlı erişim için harita.
export function puanHaritasi(matris) {
    const harita = new Map();
    matris.forEach(m => harita.set(`${m.ogrId}_${m.targetId}`, parseInt(m.deger) || 0));
    return harita;
}

export const puanAl = (harita, ogrId, kriterId) => harita.get(`${ogrId}_${kriterId}`) || 0;

// Her öğrencinin toplamı ve sırası. Eşit puanlılar aynı sırayı alır; hiç yıldızı olmayan sıralanmaz.
export function siralama(ogrenciler, kriterler, harita) {
    const liste = ogrenciler.map(o => ({
        ...o,
        toplam: kriterler.reduce((t, k) => t + puanAl(harita, o.id, k.id), 0),
    }));
    liste.sort((a, b) => b.toplam - a.toplam || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    const puanlar = [...new Set(liste.map(o => o.toplam).filter(p => p > 0))];
    liste.forEach(o => { o.sira = o.toplam > 0 ? puanlar.indexOf(o.toplam) + 1 : null; });
    return liste;
}

export function toplamHtml(toplam) {
    return `<span class="toplam" aria-label="${toplam} yıldız"><span class="yildiz-cikartma" aria-hidden="true"></span><span class="sayi-deger">${sayi(toplam)}</span></span>`;
}

// İlk üç sıra: kara tahta renginde basamaklar
export function podyumHtml(liste) {
    const sira = (n) => liste.filter(o => o.sira === n);
    if (!sira(1).length) return '';
    const sutun = (n) => {
        const kisiler = sira(n);
        if (!kisiler.length) return `<div class="podyum-sutun s${n}"></div>`;
        return `
            <div class="podyum-sutun s${n}">
                <div class="podyum-adlar">
                    <div class="podyum-avatarlar">${kisiler.map(k => avatarHtml(k.avatar, k.name, { boyut: n === 1 ? 52 : 42 })).join('')}</div>
                    ${kisiler.map(k => `<span>${esc(k.name)}</span>`).join('')}
                </div>
                <div class="podyum-basamak">
                    <b>${n}.</b>
                    <strong><span class="yildiz-cikartma" aria-hidden="true"></span>${sayi(kisiler[0].toplam)}</strong>
                </div>
            </div>`;
    };
    // Görsel sıra: 2 - 1 - 3
    return `<div class="podyum" aria-label="İlk üç sıra">${sutun(2)}${sutun(1)}${sutun(3)}<div class="podyum-zemin"></div></div>`;
}

// Salt okunur yıldız göstergesi
export function yildizGosterge(deger) {
    return `<span class="yildizlar" aria-label="${deger} / ${ENCOK_YILDIZ} yıldız">${Array.from({ length: ENCOK_YILDIZ }, (_, i) =>
        `<i class="fas fa-star yildiz-gosterge${i < deger ? ' dolu' : ''}" aria-hidden="true"></i>`).join('')}</span>`;
}

// Tıklanabilir yıldızlar (öğretmen)
export function yildizDugmeleri(deger, ogrId, kriterId, buyuk = false) {
    return `<span class="yildizlar${buyuk ? ' buyuk' : ''}" data-ogr="${esc(ogrId)}" data-kriter="${esc(kriterId)}">${Array.from({ length: ENCOK_YILDIZ }, (_, i) =>
        `<button type="button" class="yildiz-dugme${i < deger ? ' dolu' : ''}" data-val="${i + 1}" aria-label="${i + 1} yıldız"><i class="fas fa-star"></i></button>`).join('')}</span>`;
}

export function yildizlariBoya(kapsayici, deger) {
    kapsayici.querySelectorAll('.yildiz-dugme').forEach((d, i) => d.classList.toggle('dolu', i < deger));
}
