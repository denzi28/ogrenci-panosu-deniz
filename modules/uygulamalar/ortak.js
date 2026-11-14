// Etkileşimli görevler: ortak veri, puan biçimi, tam ekran oyun penceresi ve oyunlardan gelen puan mesajları
import { db } from '../../js/db.js';
import { esc } from '../../js/arayuz.js';

export const KALEMLER = 'uygulama_kalemleri';
export const MATRIS = 'uygulama_matrisi';

// Sitedeki hazır oyunlar (oyunlar/ klasörü). Görev eklerken listeden seçilebilir.
export const OYUNLAR = [
    ['oyunlar/bilim-yollari.html', 'Bilimsel bilgiye ulaşma yolları'],
    ['oyunlar/canlilarin_ozellikleri.html', 'Canlıların ortak özellikleri'],
    ['oyunlar/carpma-oyunu.html', 'Matematik bahçesi: çarpma'],
    ['oyunlar/eldeli-toplama.html', 'Eldeli toplama'],
    ['oyunlar/es_anlamli.html', 'Eş anlamlı kelimeler'],
    ['oyunlar/es_sesli.html', 'Eş sesli kelimeler'],
    ['oyunlar/hak_sorumluluk_oyunu.html', 'Hak mı, sorumluluk mu?'],
    ['oyunlar/kelime_oyunu.html', 'Türkçesi varken'],
    ['oyunlar/sayi-karsilastirma.html', 'Sayıları karşılaştırma'],
    ['oyunlar/sayi-olustur.html', '3 basamaklı sayı oluşturma'],
    ['oyunlar/tek_cift_oyunu.html', 'Tek mi, çift mi?'],
    ['oyunlar/toplam_tek_cift_oyunu.html', 'Toplam tek mi, çift mi?'],
    ['oyunlar/zit_anlamli.html', 'Zıt anlamlı kelimeler'],
].map(([link, ad]) => ({ link, ad }));

export async function verileriGetir() {
    const [kalemler, kullanicilar, matris] = await Promise.all([db.getAll(KALEMLER), db.getAll('users'), db.getAll(MATRIS)]);
    const ogrenciler = kullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    const puanlar = new Map(matris.map(m => [`${m.ogrId}_${m.targetId}`, String(m.deger ?? '').trim()]));
    return { kalemler, ogrenciler, puanlar };
}
export const puanAl = (puanlar, ogrId, gorevId) => puanlar.get(`${ogrId}_${gorevId}`) || '';

// Yerel saatle bugün: "2026-11-14"
export function bugunMetni() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function yayinDurumu(k) {
    const b = bugunMetni();
    if (k.baslangic && b < k.baslangic) return 'bekliyor';
    if (k.bitis && b > k.bitis) return 'bitti';
    return 'yayinda';
}
export const DURUM = {
    yayinda: { ad: 'Yayında', sinif: 'okudu' },
    bekliyor: { ad: 'Başlamadı', sinif: 'okuyor' },
    bitti: { ad: 'Süresi bitti', sinif: 'rafta' },
};

const gunAy = (t) => { const d = new Date(`${t}T12:00`); return isNaN(d) ? t : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); };
export function sureMetni(k) {
    if (k.baslangic && k.bitis) return `${gunAy(k.baslangic)} – ${gunAy(k.bitis)}`;
    if (k.bitis) return `Son gün ${gunAy(k.bitis)}`;
    if (k.baslangic) return `${gunAy(k.baslangic)} tarihinden itibaren`;
    return 'Süresiz';
}

// "80/100" -> oran 0.8; "✔️" ya da düz sayı -> oran yok
export function puanCoz(deger) {
    const s = String(deger ?? '').trim();
    if (!s) return null;
    const m = /^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/.exec(s);
    const oran = m && parseFloat(m[2].replace(',', '.')) > 0 ? Math.min(1, parseFloat(m[1].replace(',', '.')) / parseFloat(m[2].replace(',', '.'))) : null;
    return { metin: s, oran };
}

// Yeni puan eskisinden daha mı iyi? (Tekrar oynayınca en iyi puan korunur.)
export function dahaIyiMi(yeni, eski) {
    const y = puanCoz(yeni), e = puanCoz(eski);
    if (!e) return true;
    if (!y) return false;
    if (y.oran !== null && e.oran !== null) return y.oran > e.oran;
    const sayi = (p) => parseFloat(String(p.metin).replace(',', '.'));
    const ys = sayi(y), es = sayi(e);
    if (isNaN(es)) return true;   // eski "✔️" gibi bir işaretse yeni puan yazılsın
    return !isNaN(ys) && ys > es;
}

// Oyunun bitiş ekranı görünsün diye pencere bu kadar sonra kapanır
export const KAPANMA_SURESI = 3500;

// Oyunun gönderdiği mesajdan kaydedilecek puan yazısı
export function puanMetni(veri) {
    if (veri.deger !== undefined) return String(veri.deger);
    if (veri.puan !== undefined) return veri.limit !== undefined && veri.limit !== 'undefined' ? `${veri.puan}/${veri.limit}` : String(veri.puan);
    return '✔️';
}

// Görev adresi: sitedeki bir dosya ya da http(s) adresi. javascript: vb. reddedilir.
export function oyunAdresi(link) {
    const l = String(link || '').trim();
    if (!l) return '';
    if (/^https?:\/\//i.test(l)) return l;
    if (/^[a-z][a-z0-9+.-]*:/i.test(l) || l.startsWith('//')) return '';
    return l.replace(/^\/+/, '');
}

export function puanHtml(deger) {
    const p = puanCoz(deger);
    if (!p) return '';
    return `<span class="puan">${p.oran !== null ? `<span class="ilerleme" aria-hidden="true"><span style="transform:scaleX(${p.oran})"></span></span>` : ''}<b>${esc(p.metin)}</b></span>`;
}

// Oyunlardan gelen puan mesajları tek bir dinleyiciden dağıtılır
const dinleyiciler = new Set();
window.addEventListener('message', (e) => {
    if (!e.data || !['gorev_bitti', 'puan_guncelle'].includes(e.data.islem)) return;
    dinleyiciler.forEach(fn => fn(e));
});
export function puanDinle(fn) { dinleyiciler.add(fn); return () => dinleyiciler.delete(fn); }

// Tam ekran katman: başlık, sağda düğmeler, altında içerik
export function katmanAc({ baslik, sinif = '', dugmeler = '' }) {
    const el = document.createElement('div');
    el.className = `katman ${sinif}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
        <div class="katman-ust">
            <h2>${baslik}</h2>
            <div class="katman-eylem">${dugmeler}<button type="button" class="btn btn-secondary" data-katman="kapat"><i class="fas fa-xmark"></i>Kapat</button></div>
        </div>
        <div class="katman-govde"></div>`;
    document.body.appendChild(el);
    document.body.classList.add('katman-acik');
    const kapat = () => {
        el.querySelectorAll('iframe').forEach(f => { f.src = 'about:blank'; });
        el.remove();
        if (!document.querySelector('.katman')) document.body.classList.remove('katman-acik');
        el.dispatchEvent(new Event('kapandi'));
    };
    el.querySelector('[data-katman="kapat"]').addEventListener('click', kapat);
    const tus = (e) => { if (e.key === 'Escape' && document.body.contains(el)) kapat(); };
    document.addEventListener('keydown', tus);
    el.addEventListener('kapandi', () => document.removeEventListener('keydown', tus));
    return { el, govde: el.querySelector('.katman-govde'), kapat };
}
