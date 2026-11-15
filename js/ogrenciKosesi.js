// Öğrencinin ana sayfadaki köşesi: avatar seçimi, sıradaki rozete ilerleme ve yeni rozet kutlaması.
// Sadece öğrenci ana sayfasında çalışır (js/kabuk.js). Hiçbiri olmazsa sayfa yine eskisi gibi görünür.
import { db } from './db.js';
import { esc, sayi } from './arayuz.js';
import { AVATARLAR, avatarHtml, avatarlariGetir, avatarKaydet } from './avatar.js';
import { kutla, konfeti, zil } from './hareket.js';
import * as rozet from '../modules/rozetler/ortak.js';
import * as kitap from '../modules/kitap/ortak.js';
import * as odev from '../modules/odevler/ortak.js';

const HEDEF_YAZISI = {
    kitapHedefi: (n) => `${sayi(n)} kitap daha bitirince senin!`,
    odevHedefi: (n) => `${sayi(n)} ödevi daha tam yapınca senin!`,
};

let ben = null, avatarim = null;

export async function koseyiKur(kullanici) {
    ben = kullanici;
    if (!ben?.id) return;
    const harita = await avatarlariGetir();
    avatarim = harita.get(ben.id) || null;
    avatariGoster();
    document.getElementById('avatar-sec')?.addEventListener('click', seciciyiAc);
    rozetBolumu().catch(e => console.warn('Rozet köşesi yüklenemedi:', e));
}

// Ana sayfa başlığındaki büyük avatar ve üst bardaki küçük avatar
function avatariGoster() {
    const buyuk = document.querySelector('#avatar-sec .avatar-rozet');
    if (buyuk) buyuk.outerHTML = avatarHtml(avatarim, ben.name, { boyut: 72 });
    const kucuk = document.querySelector('.kullanici-cip .avatar');
    if (kucuk) {
        const a = AVATARLAR[avatarim];
        kucuk.textContent = a ? a[0] : kucuk.textContent;
        kucuk.classList.toggle('emoji', !!a);
    }
    const dugme = document.getElementById('avatar-sec');
    if (dugme) dugme.setAttribute('aria-label', avatarim ? `Avatarın: ${AVATARLAR[avatarim][1]}. Değiştirmek için dokun` : 'Avatarını seç');
    document.querySelector('.avatar-ipucu')?.toggleAttribute('hidden', !!avatarim);
}

// ---------------------------------------------------------------- Avatar seçici
function seciciyiAc() {
    const onceki = document.activeElement;
    const k = document.createElement('div');
    k.className = 'avatar-katman';
    k.innerHTML = `
        <div class="avatar-kutu" role="dialog" aria-modal="true" aria-labelledby="avatar-baslik">
            <div class="avatar-kutu-ust">
                <h2 id="avatar-baslik">Avatarını seç</h2>
                <button type="button" class="ikon-dugme" data-kapat aria-label="Kapat"><i class="fas fa-xmark"></i></button>
            </div>
            <div class="avatar-izgara">${Object.entries(AVATARLAR).map(([anahtar, [emoji, ad]]) => `
                <button type="button" class="avatar-secenek" data-avatar="${anahtar}" aria-pressed="${anahtar === avatarim}">
                    <span aria-hidden="true">${emoji}</span><small>${esc(ad)}</small>
                </button>`).join('')}</div>
            <p class="error" role="alert"></p>
        </div>`;
    document.body.appendChild(k);
    document.body.classList.add('katman-acik');
    const kapat = () => { k.remove(); document.body.classList.remove('katman-acik'); document.removeEventListener('keydown', tus); onceki?.focus?.(); };
    const tus = (e) => { if (e.key === 'Escape') kapat(); };
    document.addEventListener('keydown', tus);
    (k.querySelector('[aria-pressed="true"]') || k.querySelector('.avatar-secenek')).focus();

    k.addEventListener('click', async (e) => {
        if (e.target === k || e.target.closest('[data-kapat]')) return kapat();
        const d = e.target.closest('[data-avatar]');
        if (!d) return;
        k.querySelectorAll('.avatar-secenek').forEach(b => { b.disabled = true; });
        try {
            await avatarKaydet(ben.id, d.dataset.avatar);
            avatarim = d.dataset.avatar;
            kapat();
            avatariGoster();
            kutla(document.querySelector('#avatar-sec .avatar-rozet'));
        } catch (err) {
            console.warn('Avatar:', err);
            k.querySelector('.error').textContent = navigator.onLine ? 'Kaydedilemedi, biraz sonra tekrar dene' : 'İnternet bağlantısı yok';
            k.querySelectorAll('.avatar-secenek').forEach(b => { b.disabled = false; });
        }
    });
}

// ---------------------------------------------------------------- Sıradaki rozet + yeni rozet kutlaması
async function rozetBolumu() {
    if (!(await db.getModuleVisibility('rozetler').catch(() => true))) return; // öğretmen rozetleri güncelliyor
    // Sadece gereken tablolar okunur (öğrenci listesi gerekmiyor): ücretsiz planda günlük okuma kotası sınıflarca paylaşılır
    const [rozetler, matris] = await Promise.all([db.getAll('rozetler_kalemleri'), db.getAll('rozet_matrisi')]);
    if (!rozetler.length) return;
    const sahip = rozet.sahiplik(matris);

    // Otomatik rozet vermeyle aynı sayımlar (bkz. kitap/teacher.js ve odevler/teacher.js)
    const sayilar = {};
    if (rozetler.some(r => rozet.hedefAl(r, 'kitapHedefi'))) {
        const [kalemler, kmatris] = await Promise.all([db.getAll('kitaplar_kalemleri'), db.getAll('kitap_matrisi')]);
        sayilar.kitapHedefi = kitap.ogrenciOzeti({ id: ben.id }, kalemler, kitap.durumHaritasi(kmatris)).okunan.length;
    }
    if (rozetler.some(r => rozet.hedefAl(r, 'odevHedefi'))) {
        const [odevler, omatris] = await Promise.all([db.getAll(odev.KALEMLER), db.getAll(odev.MATRIS)]);
        const harita = new Map(omatris.map(m => [`${m.ogrId}_${m.targetId}`, String(m.deger ?? '')]));
        sayilar.odevHedefi = odev.ogrenciOzeti(ben.id, odevler, harita).yapti;
    }
    hedefiCiz(rozet.sonrakiHedef(rozetler, sahip, ben.id, sayilar));

    const yeniId = rozet.yeniRozetiAl(matris, ben.id);
    const yeni = yeniId && rozetler.find(r => String(r.id) === yeniId);
    if (yeni) kutlamayiAc(yeni);
}

function hedefiCiz(h) {
    const alan = document.getElementById('hedef-alani');
    if (!alan || !h) return; // hedefli rozet yoksa ya da hepsi kazanıldıysa boş kalır
    const oran = Math.max(0, Math.min(1, h.simdi / h.hedef));
    alan.innerHTML = `
        <a class="hedef-kart" href="#rozetler">
            <span class="hedef-rozet">${rozet.rozetGorseli(h.rozet, 56)}</span>
            <span class="hedef-yazi">
                <small>Sıradaki rozetin</small>
                <strong>${esc(h.rozet.ad)}</strong>
                <span class="hedef-cubuk" role="progressbar" aria-label="${esc(h.rozet.ad)} ilerlemesi" aria-valuemin="0" aria-valuemax="${h.hedef}" aria-valuenow="${h.simdi}"><span style="--oran:${oran}"></span></span>
                <span class="hedef-not"><b>${sayi(h.simdi)} / ${sayi(h.hedef)}</b> · ${HEDEF_YAZISI[h.alan](h.kalan)}</span>
            </span>
        </a>`;
}

function kutlamayiAc(r) {
    const onceki = document.activeElement;
    const k = document.createElement('div');
    k.className = 'kutlama-katman';
    k.innerHTML = `
        <div class="kutlama-kutu" role="dialog" aria-modal="true" aria-labelledby="kutlama-baslik">
            <div class="kutlama-rozet">${rozet.rozetGorseli(r, 120)}</div>
            <small>Yeni rozet kazandın!</small>
            <h2 id="kutlama-baslik">${esc(r.ad)}</h2>
            ${r.aciklama ? `<p>${esc(r.aciklama)}</p>` : ''}
            <div class="kutlama-dugmeler">
                <button type="button" class="btn btn-primary btn-buyuk" data-kapat>Yaşasın!</button>
                <a class="btn btn-secondary btn-buyuk" href="#rozetler" data-kapat>Rozetlerime bak</a>
            </div>
        </div>`;
    document.body.appendChild(k);
    document.body.classList.add('katman-acik');
    const kapat = () => { k.remove(); document.body.classList.remove('katman-acik'); document.removeEventListener('keydown', tus); onceki?.focus?.(); };
    const tus = (e) => { if (e.key === 'Escape') kapat(); };
    document.addEventListener('keydown', tus);
    k.querySelector('[data-kapat]').focus();
    konfeti(); zil();
    k.addEventListener('click', (e) => {
        if (e.target === k) return kapat();
        const d = e.target.closest('[data-kapat]');
        if (!d) return;
        if (d.tagName === 'BUTTON') { zil(); konfeti(40); }
        kapat();
    });
}
