// Davranış panosu — öğretmen görünümü
// Pano: sıralama ve her öğrenciyi hızlı değerlendirme. Davranışlar: ekle, sil, tüm sınıfı tek davranıştan puanla.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, sekmeler, baglaSekmeler, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { oynat, sayiSay } from '../../js/hareket.js';
import { verileriGetir, puanHaritasi, puanAl, siralama, podyumHtml, toplamHtml, yildizDugmeleri, yildizlariBoya, ENCOK_YILDIZ, adHtml } from './ortak.js';

const acikPaneller = new Set(); // sayfa yenilense de açık kalan değerlendirme panelleri
let veri, harita, kok;

export async function render(container) {
    const [anahtar] = await Promise.all([gorunurlukAnahtari('davranis'), yenile()]);

    // Olaylar modüle özel kapsayıcıya bağlanır; modülden çıkınca kapsayıcıyla birlikte silinir.
    container.innerHTML = `<div id="davranis-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        <div id="ana-gorunum">
            ${modulBasligi({
                baslik: 'Davranış panosu',
                aciklama: `Her davranış için 1 ile ${ENCOK_YILDIZ} arasında yıldız verilir. Sıralama toplam yıldıza göre`,
                eylemler: `${anahtar}<button class="btn btn-secondary" id="btn-yazdir"><i class="fas fa-print"></i>Yazdır</button>`,
            })}
            ${sekmeler([{ id: 'pano', ad: 'Pano' }, { id: 'davranislar', ad: 'Davranışlar' }], 'pano')}
            <div id="view-pano"></div>
            <div id="view-davranislar" hidden></div>
        </div>
        <div id="view-puanlama" hidden></div>`;

    baglaGorunurlukAnahtari('davranis');
    baglaSekmeler(kok.querySelector('#ana-gorunum'));
    document.getElementById('btn-yazdir').addEventListener('click', panoyuYazdir);

    panoyuCiz();
    davranislariCiz();
    olaylariBagla();
}

async function yenile() {
    veri = await verileriGetir();
    harita = puanHaritasi(veri.matris);
}

// ------------------------------------------------------------------ PANO
function panoyuCiz() {
    const alan = document.getElementById('view-pano');
    const liste = siralama(veri.ogrenciler, veri.kriterler, harita);

    if (!liste.length) {
        alan.innerHTML = `<div class="panel"><p class="bos-not">Henüz öğrenci yok. Öğrenciler bölümünden ekleyebilirsiniz</p></div>`;
        return;
    }

    const satirlar = liste.map(o => {
        const acik = acikPaneller.has(String(o.id));
        return `
        <div class="satir-grup" data-ogr="${esc(o.id)}">
            <div class="satir">
                <span class="satir-sira">${o.sira ?? '–'}</span>
                <span class="satir-ad avatarli">${adHtml(o)}</span>
                ${toplamHtml(o.toplam)}
                <button class="yazi-dugme btn-degerlendir" aria-expanded="${acik}" aria-controls="acilir-${esc(o.id)}">
                    <span class="gizle-tel">Değerlendir</span><i class="fas fa-chevron-${acik ? 'up' : 'down'}"></i>
                </button>
            </div>
            <div class="acilir" id="acilir-${esc(o.id)}" ${acik ? '' : 'hidden'}>
                ${veri.kriterler.length ? veri.kriterler.map(k => {
                    const deger = puanAl(harita, o.id, k.id);
                    return `
                    <div class="acilir-satir">
                        <span>${esc(k.ad)}</span>
                        <span style="display:flex;align-items:center;gap:4px">
                            ${yildizDugmeleri(deger, o.id, k.id)}
                            <button class="ikon-dugme tehlike btn-sifirla" data-ogr="${esc(o.id)}" data-kriter="${esc(k.id)}" title="Sıfırla" aria-label="${esc(k.ad)} puanını sıfırla" ${deger ? '' : 'style="visibility:hidden"'}><i class="fas fa-xmark"></i></button>
                        </span>
                    </div>`;
                }).join('') : `<p class="bos-not" style="padding:12px 0">Önce Davranışlar sekmesinden bir davranış ekleyin</p>`}
            </div>
        </div>`;
    }).join('');

    alan.innerHTML = `
        ${podyumHtml(liste)}
        <section class="panel">
            <div class="panel-ust"><h2>Sıralama</h2><small>${sayi(liste.length)} öğrenci</small></div>
            ${satirlar}
        </section>`;
}

// ------------------------------------------------------------------ DAVRANIŞLAR
function davranislariCiz() {
    const alan = document.getElementById('view-davranislar');
    alan.innerHTML = `
        <section class="panel">
            <div class="panel-ust"><h2>Yeni davranış</h2></div>
            <form class="panel-ic satir-form" id="form-kriter">
                <input type="text" id="yeni-kriter-ad" placeholder="Örneğin: Ödevini yaptı" maxlength="60" aria-label="Davranış adı">
                <button class="btn btn-primary" type="submit">Ekle</button>
            </form>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Davranışlar</h2><small>Tüm sınıfı tek bir davranıştan puanlamak için “Sınıfı puanla”</small></div>
            ${veri.kriterler.length ? veri.kriterler.map(k => `
                <div class="satir">
                    <span class="satir-ad">${esc(k.ad)}</span>
                    <button class="btn btn-secondary btn-sinifi-puanla" data-kriter="${esc(k.id)}"><i class="fas fa-star"></i>Sınıfı puanla</button>
                    <button class="ikon-dugme tehlike btn-kriter-sil" data-kriter="${esc(k.id)}" title="Sil" aria-label="${esc(k.ad)} davranışını sil"><i class="fas fa-trash-can"></i></button>
                </div>`).join('') : `<p class="bos-not">Henüz davranış eklenmedi</p>`}
        </section>`;
}

// ------------------------------------------------------------------ OLAYLAR (tek yerden)
function olaylariBagla() {
    kok.addEventListener('click', async (e) => {
        const d = e.target.closest('button');
        if (!d) return;

        if (d.classList.contains('btn-degerlendir')) {
            const id = d.closest('.satir-grup').dataset.ogr;
            acikPaneller.has(id) ? acikPaneller.delete(id) : acikPaneller.add(id);
            const panel = document.getElementById(`acilir-${id}`);
            panel.hidden = !acikPaneller.has(id);
            d.setAttribute('aria-expanded', !panel.hidden);
            d.querySelector('i').className = `fas fa-chevron-${panel.hidden ? 'down' : 'up'}`;
            if (panel.hidden) panoyuCiz(); // kapanınca sıralamayı güncelle
            return;
        }

        if (d.classList.contains('yildiz-dugme')) {
            const kutu = d.closest('.yildizlar');
            return puanVer(kutu.dataset.ogr, kutu.dataset.kriter, parseInt(d.dataset.val), d);
        }
        if (d.classList.contains('btn-sifirla')) return puanVer(d.dataset.ogr, d.dataset.kriter, 0, d);

        if (d.classList.contains('btn-sinifi-puanla')) return sinifPuanlamaAc(d.dataset.kriter);
        if (d.classList.contains('btn-kriter-sil')) return kriterSil(d.dataset.kriter);
        if (d.id === 'btn-puanlama-geri') return sinifPuanlamaKapat();
        if (d.dataset.toplu) return topluIslem(d.dataset.toplu, d);
    });

    kok.addEventListener('submit', async (e) => {
        if (e.target.id !== 'form-kriter') return;
        e.preventDefault();
        const kutu = document.getElementById('yeni-kriter-ad');
        const ad = kutu.value.trim();
        if (!ad) return kutu.focus();
        const dugme = e.target.querySelector('button');
        dugme.disabled = true;
        try {
            await db.add('davranis_kriterleri', { ad });
            await yenile();
            davranislariCiz(); panoyuCiz();
            document.getElementById('yeni-kriter-ad').focus();
        } catch (err) { alert('Eklenemedi, tekrar deneyin'); dugme.disabled = false; }
    });
}

// Bir öğrencinin bir davranıştaki yıldızını kaydet (pano veya sınıf puanlama ekranından)
async function puanVer(ogrId, kriterId, deger, tiklanan) {
    const onceki = puanAl(harita, ogrId, kriterId);
    harita.set(`${ogrId}_${kriterId}`, deger);

    // Ekranı hemen güncelle
    document.querySelectorAll(`.yildizlar[data-ogr="${CSS.escape(ogrId)}"][data-kriter="${CSS.escape(kriterId)}"]`).forEach(k => yildizlariBoya(k, deger));
    document.querySelectorAll(`.btn-sifirla[data-ogr="${CSS.escape(ogrId)}"][data-kriter="${CSS.escape(kriterId)}"]`).forEach(b => b.style.visibility = deger ? 'visible' : 'hidden');

    // Toplamı yerinde güncelle. Satırlar puanlanırken yer değiştirmesin diye yeniden sıralama panel kapanınca yapılır.
    const toplam = veri.kriterler.reduce((t, k) => t + puanAl(harita, ogrId, k.id), 0);
    const toplamEl = document.querySelector(`.satir-grup[data-ogr="${CSS.escape(ogrId)}"] .toplam`);
    if (toplamEl) { toplamEl.setAttribute('aria-label', `${toplam} yıldız`); sayiSay(toplamEl.querySelector('.sayi-deger'), toplam); }
    if (deger > 0) oynat(tiklanan.closest('.yildizlar')?.querySelectorAll('.yildiz-dugme')[deger - 1], 'zipla');

    try {
        await db.saveMatrixStatus('davranis_matrisi', String(ogrId), String(kriterId), String(deger));
        kaydedildiIsareti(tiklanan.closest('.acilir-satir, .satir'));
    } catch (err) {
        harita.set(`${ogrId}_${kriterId}`, onceki);
        alert('Kaydedilemedi. İnternet bağlantınızı kontrol edin');
        panoyuCiz();
    }
}

async function kriterSil(kriterId) {
    const k = veri.kriterler.find(x => x.id === kriterId);
    if (!confirm(`“${k?.ad}” davranışı silinsin mi? Bu davranıştan verilen yıldızlar toplama artık eklenmez`)) return;
    try {
        await db.delete('davranis_kriterleri', kriterId);
        await yenile();
        davranislariCiz(); panoyuCiz();
    } catch (err) { alert('Silinemedi, tekrar deneyin'); }
}

// ------------------------------------------------------------------ SINIFI PUANLA (tek davranış, tüm öğrenciler)
let puanlananKriter = null;

function sinifPuanlamaAc(kriterId) {
    puanlananKriter = veri.kriterler.find(k => k.id === kriterId);
    if (!puanlananKriter) return;
    const ogrenciler = [...veri.ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    document.getElementById('ana-gorunum').hidden = true;
    const alan = document.getElementById('view-puanlama');
    alan.hidden = false;
    alan.innerHTML = `
        <button class="yazi-dugme" id="btn-puanlama-geri" style="margin:8px 0 8px -8px"><i class="fas fa-arrow-left"></i>Davranış panosu</button>
        ${modulBasligi({ baslik: esc(puanlananKriter.ad), aciklama: 'Tüm sınıfı bu davranıştan puanlayın. Değişiklikler hemen kaydedilir' })}
        <section class="panel">
            <div class="panel-ust">
                <h2>Toplu işlem</h2>
                <div class="modul-ust-eylem">
                    <button class="btn btn-secondary" data-toplu="arti">Herkese +1</button>
                    <button class="btn btn-secondary" data-toplu="eksi">Herkesten −1</button>
                    <button class="yazi-dugme tehlike" data-toplu="sifirla"><i class="fas fa-rotate-left"></i>Tümünü sıfırla</button>
                </div>
            </div>
            ${ogrenciler.map((o, i) => {
                const deger = puanAl(harita, o.id, puanlananKriter.id);
                return `
                <div class="satir">
                    <span class="satir-sira">${i + 1}</span>
                    <span class="satir-ad">${esc(o.name)}</span>
                    <button class="ikon-dugme tehlike btn-sifirla" data-ogr="${esc(o.id)}" data-kriter="${esc(puanlananKriter.id)}" title="Sıfırla" aria-label="Sıfırla" ${deger ? '' : 'style="visibility:hidden"'}><i class="fas fa-xmark"></i></button>
                    ${yildizDugmeleri(deger, o.id, puanlananKriter.id, true)}
                </div>`;
            }).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
    window.scrollTo({ top: 0 });
}

function sinifPuanlamaKapat() {
    document.getElementById('view-puanlama').hidden = true;
    document.getElementById('ana-gorunum').hidden = false;
    panoyuCiz();
    window.scrollTo({ top: 0 });
}

async function topluIslem(tur, dugme) {
    if (tur === 'sifirla' && !confirm(`Tüm sınıfın “${puanlananKriter.ad}” yıldızları sıfırlansın mı? Bu geri alınamaz`)) return;
    const kId = puanlananKriter.id;
    const islemler = [];
    veri.ogrenciler.forEach(o => {
        const simdiki = puanAl(harita, o.id, kId);
        const yeni = tur === 'arti' ? Math.min(ENCOK_YILDIZ, simdiki + 1) : tur === 'eksi' ? Math.max(0, simdiki - 1) : 0;
        if (yeni === simdiki) return;
        harita.set(`${o.id}_${kId}`, yeni);
        document.querySelectorAll(`#view-puanlama .yildizlar[data-ogr="${CSS.escape(o.id)}"]`).forEach(k => yildizlariBoya(k, yeni));
        document.querySelectorAll(`#view-puanlama .btn-sifirla[data-ogr="${CSS.escape(o.id)}"]`).forEach(b => b.style.visibility = yeni ? 'visible' : 'hidden');
        islemler.push(db.saveMatrixStatus('davranis_matrisi', String(o.id), String(kId), String(yeni)));
    });
    dugme.disabled = true;
    const sonuc = await Promise.allSettled(islemler);
    dugme.disabled = false;
    const hata = sonuc.filter(s => s.status === 'rejected').length;
    if (hata) { alert(`${hata} öğrencinin puanı kaydedilemedi. Sayfayı yenileyip tekrar deneyin`); await yenile(); sinifPuanlamaAc(kId); }
}

// ------------------------------------------------------------------ YAZDIR
function panoyuYazdir() {
    const liste = siralama(veri.ogrenciler, veri.kriterler, harita);
    yazdir('Davranış panosu', `
        <table>
            <thead><tr><th class="sag" style="width:48px">Sıra</th><th style="width:80px">Okul no</th><th>Ad soyad</th><th class="sag" style="width:90px">Yıldız</th></tr></thead>
            <tbody>${liste.map(o => `<tr><td class="sag">${o.sira ?? '–'}</td><td>${esc(o.okulno || '–')}</td><td>${esc(o.name)}</td><td class="sag">${sayi(o.toplam)}</td></tr>`).join('')}</tbody>
        </table>`);
}
