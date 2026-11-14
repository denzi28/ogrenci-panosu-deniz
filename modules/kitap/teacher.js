// Kitap okuma — öğretmen görünümü
// Öğrenciler: kim ne okuyor, kitap ver / bitirdi / bıraktı, öğrencinin tüm listesi.
// Kitaplık: kitap ekle (tek ya da toplu), düzenle, sil; en az okuma süresi kuralı.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, sekmeler, baglaSekmeler, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { sayiSay } from '../../js/hareket.js';
import { verileriGetir, durumHaritasi, durumAl, ogrenciOzeti, kitapOzeti, kitapAdiHtml, kitapAdiDuz, numarasiVar, sureMetni, gunFarki, SIRALAMALAR, OKUYOR, OKUDU, NUMARASIZ } from './ortak.js';

let siralamaTuru = 'ad';
let minGun = 1;
let veri, h, kok;
let klavyeBagli = false;

export async function render(container) {
    const [anahtar] = await Promise.all([gorunurlukAnahtari('kitap'), ayarlariGetir(), yenile()]);

    // Olaylar modüle özel kapsayıcıya bağlanır; modülden çıkınca kapsayıcıyla birlikte silinir.
    container.innerHTML = `<div id="kitap-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        <div id="ana-gorunum">
            ${modulBasligi({
                baslik: 'Kitap okuma',
                aciklama: 'Sınıf kitaplığından kim ne okuyor, kim neyi bitirdi',
                eylemler: `${anahtar}<button class="btn btn-secondary" id="btn-yazdir"><i class="fas fa-print"></i>Rapor</button>`,
            })}
            <div id="kitap-sayilar"></div>
            ${sekmeler([{ id: 'ogrenciler', ad: 'Öğrenciler' }, { id: 'kitaplik', ad: 'Kitaplık' }], 'ogrenciler')}
            <div id="view-ogrenciler"></div>
            <div id="view-kitaplik" hidden></div>
        </div>
        <div id="view-detay" hidden></div>
        <div id="numara-modal" class="modal-arka orta" role="dialog" aria-modal="true" aria-label="Kitap numarası">
            <div class="modal-kutu kucuk">
                <div class="modal-ust"><h3 id="numara-baslik">Kitap ver</h3><button class="ikon-btn" data-islem="numara-kapat" aria-label="Kapat"><i class="fas fa-xmark"></i></button></div>
                <div class="tus-ekran"><b id="numara-ekran"></b><small id="numara-kitap">Kitap numarasını girin</small></div>
                <div class="tus-takimi">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="tus" data-tus="${n}">${n}</button>`).join('')}
                    <button class="tus ikincil" data-tus="sil" aria-label="Sil"><i class="fas fa-delete-left"></i></button>
                    <button class="tus" data-tus="0">0</button>
                    <button class="tus ikincil" data-tus="temizle">Temizle</button>
                </div>
                <button class="btn btn-primary btn-buyuk w-100" id="numara-ver" style="margin-top:12px" disabled>Ver</button>
            </div>
        </div>`;

    baglaGorunurlukAnahtari('kitap');
    baglaSekmeler(kok.querySelector('#ana-gorunum'));
    document.getElementById('btn-yazdir').addEventListener('click', raporYazdir);
    hepsiniCiz();
    olaylariBagla();
}

async function ayarlariGetir() {
    try {
        const ayarlar = await db.getAll('system_settings');
        const k = ayarlar.find(a => a.id === 'kitap_ayarlari');
        if (k && k.minGun !== undefined) minGun = parseInt(k.minGun) || 0;
    } catch (e) { console.warn('Kitap ayarı okunamadı', e); }
}

async function yenile() {
    veri = await verileriGetir();
    h = durumHaritasi(veri.matris);
}

function hepsiniCiz() { sayilariCiz(); ogrencileriCiz(); kitapligiCiz(); }

// ------------------------------------------------------------------ SAYILAR
function sayilariCiz() {
    let okunuyor = 0, buAy = 0;
    const ay = new Date().getMonth(), yil = new Date().getFullYear();
    h.forEach(d => {
        if (d.deger === OKUYOR) okunuyor++;
        if (d.deger === OKUDU && d.tarih) { const t = new Date(d.tarih); if (t.getMonth() === ay && t.getFullYear() === yil) buAy++; }
    });
    const alan = document.getElementById('kitap-sayilar');
    const yeni = [['Kitaplıktaki kitap', veri.kalemler.length], ['Şu an okunan', okunuyor], ['Bu ay bitirilen', buAy]];
    const eski = [...alan.querySelectorAll('[data-say]')].map(el => parseInt(el.dataset.say));
    alan.innerHTML = `
        <div class="sayilar" style="margin-bottom:24px">
            ${yeni.map(([ad, n]) => `<div class="sayi-kart"><small>${ad}</small><strong><span data-say="${n}">${sayi(n)}</span></strong></div>`).join('')}
        </div>`;
    alan.querySelectorAll('[data-say]').forEach((el, i) => sayiSay(el, yeni[i][1], eski[i] ?? 0, 600));
}

// ------------------------------------------------------------------ ÖĞRENCİLER
function ogrencileriCiz() {
    const alan = document.getElementById('view-ogrenciler');
    const liste = veri.ogrenciler.map(o => ({ ...o, ozet: ogrenciOzeti(o, veri.kalemler, h) })).sort(SIRALAMALAR[siralamaTuru].fn);

    const secenekler = Object.entries(SIRALAMALAR).map(([id, s]) => `<option value="${id}" ${id === siralamaTuru ? 'selected' : ''}>${s.ad}</option>`).join('');
    alan.innerHTML = `
        <section class="panel">
            <div class="panel-ust">
                <h2>Öğrenciler</h2>
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-2)">Sırala
                    <select id="kitap-siralama" style="width:auto;min-height:32px;padding:4px 8px">${secenekler}</select>
                </label>
            </div>
            ${!veri.kalemler.length ? '<p class="bos-not">Önce Kitaplık sekmesinden kitap ekleyin</p>' : ''}
            ${liste.length ? liste.map(o => ogrenciSatiri(o)).join('') : '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}

function ogrenciSatiri(o) {
    const okuyor = o.ozet.okuyor.map(k => `
        <div class="okuma">
            <span class="okuma-ad">${kitapAdiHtml(k)}</span>
            <small class="${gunFarki(k.tarih) !== null && gunFarki(k.tarih) < minGun ? 'uyari' : ''}">${sureMetni(k.tarih)}</small>
            <span style="display:inline-flex;gap:4px;margin-left:auto">
                <button class="btn btn-secondary btn-kucuk" data-islem="bitir" data-ogr="${esc(o.id)}" data-kitap="${esc(k.id)}"><i class="fas fa-check"></i>Bitirdi</button>
                <button class="yazi-dugme" data-islem="birak" data-ogr="${esc(o.id)}" data-kitap="${esc(k.id)}" title="Okumadan geri verdi">Bıraktı</button>
            </span>
        </div>`).join('');
    return `
        <div class="ogr-satir" data-ogr="${esc(o.id)}">
            <div class="ogr-ad"><strong>${esc(o.name)}</strong>${o.okulno ? `<small>No ${esc(o.okulno)}</small>` : ''}</div>
            <div class="sayi-hucre">${sayi(o.ozet.okunan.length)}<small>okudu</small></div>
            <div class="okuma-listesi">${okuyor || '<span class="okuma-yok">Elinde kitap yok</span>'}</div>
            <div class="satir-eylem">
                <button class="btn btn-primary btn-kucuk" data-islem="ver" data-ogr="${esc(o.id)}"><i class="fas fa-book-open"></i>Kitap ver</button>
                <button class="ikon-dugme" data-islem="liste" data-ogr="${esc(o.id)}" title="Tüm kitap listesi" aria-label="${esc(o.name)} kitap listesi"><i class="fas fa-list"></i></button>
            </div>
        </div>`;
}

// ------------------------------------------------------------------ KİTAPLIK
function kitapligiCiz() {
    const alan = document.getElementById('view-kitaplik');
    alan.innerHTML = `
        <section class="panel">
            <div class="panel-ust"><h2>Kitap ekle</h2></div>
            <form class="panel-ic satir-form" id="form-kitap">
                <input type="number" id="yeni-kitap-no" placeholder="No" min="0" style="max-width:96px" aria-label="Kitap numarası">
                <input type="text" id="yeni-kitap-ad" placeholder="Kitabın adı" maxlength="120" aria-label="Kitabın adı">
                <button class="btn btn-primary" type="submit">Ekle</button>
            </form>
            <details class="acilir-form">
                <summary>Listeden toplu ekle</summary>
                <form class="panel-ic" id="form-toplu" style="padding-top:0">
                    <p style="color:var(--text-2);font-size:14px;margin-bottom:8px">Her satıra bir kitap. Başına numara yazarsanız numara olarak alınır, örneğin “12- Matilda” ya da “12. Matilda”</p>
                    <textarea id="toplu-kitap" rows="5" placeholder="1- Küçük Prens&#10;2- Şeker Portakalı"></textarea>
                    <button class="btn btn-secondary" type="submit" style="margin-top:8px">Hepsini ekle</button>
                </form>
            </details>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Okuma süresi kuralı</h2></div>
            <form class="panel-ic" id="form-kural" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span>Bir kitap en az</span>
                <input type="number" id="kural-gun" value="${minGun}" min="0" max="60" style="width:72px" aria-label="Gün">
                <span>gün okunmalı</span>
                <button class="btn btn-secondary" type="submit" style="margin-left:auto">Kaydet</button>
                <small style="flex-basis:100%;color:var(--muted)">Daha erken teslim edilirse uyarı gösterilir. Uyarıyı istemiyorsanız 0 yazın</small>
            </form>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Kitaplık</h2><small>${sayi(veri.kalemler.length)} kitap</small></div>
            ${veri.kalemler.length ? veri.kalemler.map(k => kitapSatiri(k)).join('') : '<p class="bos-not">Henüz kitap eklenmedi</p>'}
        </section>`;
}

function kitapSatiri(k) {
    const { okuyanlar, okumuslar } = kitapOzeti(k, veri.ogrenciler, h);
    return `
        <div class="satir" data-kitap="${esc(k.id)}" style="flex-wrap:wrap">
            <span class="satir-ad" style="white-space:normal">${kitapAdiHtml(k)}
                <small>${okumuslar.length ? `${sayi(okumuslar.length)} kez okundu` : 'Henüz okunmadı'}</small>
            </span>
            ${okuyanlar.length
                ? `<span class="etiket okuyor">${esc(okuyanlar.map(o => o.name).join(', '))} okuyor</span>`
                : `<span class="etiket rafta">Rafta</span>`}
            <span style="display:flex">
                <button class="ikon-dugme" data-islem="kitap-duzenle" data-kitap="${esc(k.id)}" title="Düzenle" aria-label="Düzenle"><i class="fas fa-pen"></i></button>
                <button class="ikon-dugme tehlike" data-islem="kitap-sil" data-kitap="${esc(k.id)}" title="Sil" aria-label="Sil"><i class="fas fa-trash-can"></i></button>
            </span>
        </div>`;
}

function kitapDuzenleFormu(k) {
    const satir = kok.querySelector(`.satir[data-kitap="${CSS.escape(k.id)}"]`);
    satir.innerHTML = `
        <form class="satir-form" data-duzenle="${esc(k.id)}" style="flex:1;flex-wrap:wrap">
            <input type="number" name="no" value="${numarasiVar(k) ? esc(k.no) : ''}" placeholder="No" style="max-width:96px" aria-label="Numara">
            <input type="text" name="ad" value="${esc(k.ad)}" maxlength="120" aria-label="Ad" style="min-width:180px">
            <button class="btn btn-primary" type="submit">Kaydet</button>
            <button class="btn btn-secondary" type="button" data-islem="duzenle-iptal">Vazgeç</button>
        </form>`;
    satir.querySelector('input[name="ad"]').focus();
}

// ------------------------------------------------------------------ ÖĞRENCİNİN TÜM LİSTESİ
let detayOgr = null;
function detayAc(ogrId) {
    detayOgr = veri.ogrenciler.find(o => o.id === ogrId);
    if (!detayOgr) return;
    document.getElementById('ana-gorunum').hidden = true;
    const alan = document.getElementById('view-detay');
    alan.hidden = false;
    detayCiz();
    window.scrollTo({ top: 0 });
}

function detayCiz() {
    const alan = document.getElementById('view-detay');
    const ozet = ogrenciOzeti(detayOgr, veri.kalemler, h);
    const etiket = { '': 'Okumadı', [OKUYOR]: 'Okuyor', [OKUDU]: 'Okudu' };
    alan.innerHTML = `
        <button class="yazi-dugme" data-islem="detay-geri" style="margin:8px 0 8px -8px"><i class="fas fa-arrow-left"></i>Kitap okuma</button>
        ${modulBasligi({ baslik: esc(detayOgr.name), aciklama: `${sayi(ozet.okunan.length)} kitap okudu. Durumu değiştirmek için düğmeye dokunun: okumadı, okuyor, okudu` })}
        <section class="panel">
            ${veri.kalemler.map(k => {
                const d = durumAl(h, detayOgr.id, k.id);
                return `
                <div class="satir">
                    <span class="satir-ad" style="white-space:normal">${kitapAdiHtml(k)}${d.deger === OKUYOR ? `<small>${sureMetni(d.tarih)}</small>` : ''}</span>
                    <button class="btn btn-secondary durum-dugme" data-islem="durum" data-kitap="${esc(k.id)}" data-durum="${d.deger}">${etiket[d.deger] || 'Okumadı'}</button>
                </div>`;
            }).join('') || '<p class="bos-not">Kitaplıkta kitap yok</p>'}
        </section>`;
}

// ------------------------------------------------------------------ NUMARA TUŞ TAKIMI (kitap ver)
let numaraOgr = null, numaraYazi = '';
function numaraAc(ogrId) {
    numaraOgr = veri.ogrenciler.find(o => o.id === ogrId);
    numaraYazi = '';
    document.getElementById('numara-baslik').textContent = `${numaraOgr?.name || ''} için kitap`;
    numaraGuncelle();
    document.getElementById('numara-modal').classList.add('acik');
}
function numaraKapat() { document.getElementById('numara-modal').classList.remove('acik'); numaraOgr = null; }

function numaradanKitap() {
    if (!numaraYazi) return null;
    return veri.kalemler.find(k => numarasiVar(k) && parseInt(k.no) === parseInt(numaraYazi)) || null;
}
function numaraGuncelle() {
    document.getElementById('numara-ekran').textContent = numaraYazi;
    const bilgi = document.getElementById('numara-kitap');
    const dugme = document.getElementById('numara-ver');
    const k = numaradanKitap();
    bilgi.classList.toggle('hata', !!numaraYazi && !k);
    if (!numaraYazi) { bilgi.textContent = 'Kitap numarasını girin'; dugme.disabled = true; return; }
    if (!k) { bilgi.textContent = 'Bu numarada kitap yok'; dugme.disabled = true; return; }
    const { okuyanlar } = kitapOzeti(k, veri.ogrenciler, h);
    const baskasi = okuyanlar.filter(o => o.id !== numaraOgr?.id);
    bilgi.textContent = k.ad + (baskasi.length ? ` · şu an ${baskasi.map(o => o.name).join(', ')} okuyor` : '');
    dugme.disabled = false;
}

// ------------------------------------------------------------------ İŞLEMLER
async function durumYaz(ogrId, kitapId, deger) {
    await db.saveMatrixStatus('kitap_matrisi', String(ogrId), String(kitapId), deger);
    h.set(`${ogrId}_${kitapId}`, { deger, tarih: new Date().toISOString() });
}

function sureUyarisiGec(ogrId, kitapId, eylem) {
    const d = durumAl(h, ogrId, kitapId);
    const g = gunFarki(d.tarih);
    if (g === null || g >= minGun) return true;
    const ne = g === 0 ? 'bugün' : `${g} gün önce`;
    return confirm(`Bu kitap ${ne} verildi. Kurala göre en az ${minGun} gün okunmalı.\n\nYine de ${eylem} olarak işaretlensin mi?`);
}

async function kitapVer() {
    const k = numaradanKitap();
    if (!k || !numaraOgr) return;
    const ogrId = numaraOgr.id;
    const baskasi = kitapOzeti(k, veri.ogrenciler, h).okuyanlar.filter(o => o.id !== ogrId);
    if (baskasi.length && !confirm(`“${k.ad}” şu an ${baskasi.map(o => o.name).join(', ')} üzerinde görünüyor. Kitap ${numaraOgr.name} öğrencisine geçirilsin mi?`)) return;
    const dugme = document.getElementById('numara-ver');
    dugme.disabled = true;
    try {
        for (const o of baskasi) await durumYaz(o.id, k.id, '');
        await durumYaz(ogrId, k.id, OKUYOR);
        numaraKapat();
        sayilariCiz(); ogrencileriCiz(); kitapligiCiz();
        kaydedildiIsareti(kok.querySelector(`.ogr-satir[data-ogr="${CSS.escape(ogrId)}"]`));
    } catch (e) { alert('Kaydedilemedi. İnternet bağlantınızı kontrol edin'); dugme.disabled = false; }
}

async function okumaBitir(ogrId, kitapId, deger) {
    if (!sureUyarisiGec(ogrId, kitapId, deger === OKUDU ? 'okudu' : 'geri verdi')) return;
    try {
        await durumYaz(ogrId, kitapId, deger);
        sayilariCiz(); ogrencileriCiz(); kitapligiCiz();
        kaydedildiIsareti(kok.querySelector(`.ogr-satir[data-ogr="${CSS.escape(ogrId)}"]`));
    } catch (e) { alert('Kaydedilemedi. İnternet bağlantınızı kontrol edin'); }
}

async function durumDegistir(dugme) {
    const kitapId = dugme.dataset.kitap;
    const simdiki = dugme.dataset.durum;
    if (simdiki === OKUYOR && !sureUyarisiGec(detayOgr.id, kitapId, 'okudu')) return;
    const yeni = simdiki === '' ? OKUYOR : simdiki === OKUYOR ? OKUDU : '';
    dugme.disabled = true;
    try { await durumYaz(detayOgr.id, kitapId, yeni); detayCiz(); }
    catch (e) { alert('Kaydedilemedi. İnternet bağlantınızı kontrol edin'); dugme.disabled = false; }
}

function numaraAyir(satir) {
    const m = satir.trim().match(/^(\d+)[\s\-.)]+(.+)$/);
    return m ? { no: parseInt(m[1]), ad: m[2].trim() } : { no: NUMARASIZ, ad: satir.trim() };
}

function olaylariBagla() {
    kok.addEventListener('change', (e) => {
        if (e.target.id === 'kitap-siralama') { siralamaTuru = e.target.value; ogrencileriCiz(); }
    });

    kok.addEventListener('click', async (e) => {
        const tus = e.target.closest('[data-tus]');
        if (tus) {
            const t = tus.dataset.tus;
            if (t === 'sil') numaraYazi = numaraYazi.slice(0, -1);
            else if (t === 'temizle') numaraYazi = '';
            else if (numaraYazi.length < 4) numaraYazi += t;
            return numaraGuncelle();
        }
        if (e.target.id === 'numara-modal') return numaraKapat();
        const d = e.target.closest('button');
        if (!d) return;
        if (d.id === 'numara-ver') return kitapVer();

        const { islem, ogr, kitap } = d.dataset;
        if (islem === 'ver') return numaraAc(ogr);
        if (islem === 'numara-kapat') return numaraKapat();
        if (islem === 'bitir') return okumaBitir(ogr, kitap, OKUDU);
        if (islem === 'birak') return okumaBitir(ogr, kitap, '');
        if (islem === 'liste') return detayAc(ogr);
        if (islem === 'durum') return durumDegistir(d);
        if (islem === 'detay-geri') {
            document.getElementById('view-detay').hidden = true;
            document.getElementById('ana-gorunum').hidden = false;
            hepsiniCiz();
            return window.scrollTo({ top: 0 });
        }
        if (islem === 'kitap-duzenle') return kitapDuzenleFormu(veri.kalemler.find(k => k.id === kitap));
        if (islem === 'duzenle-iptal') return kitapligiCiz();
        if (islem === 'kitap-sil') {
            const k = veri.kalemler.find(x => x.id === kitap);
            if (!confirm(`“${k?.ad}” kitaplıktan silinsin mi?`)) return;
            try { await db.delete('kitaplar_kalemleri', kitap); await yenile(); hepsiniCiz(); }
            catch (err) { alert('Silinemedi, tekrar deneyin'); }
        }
    });

    // Bilgisayarda klavyeyle numara girişi (sayfa başına bir kez bağlanır)
    if (klavyeBagli) return kok.addEventListener('submit', formGonder);
    klavyeBagli = true;
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('numara-modal')?.classList.contains('acik')) return;
        if (/^\d$/.test(e.key) && numaraYazi.length < 4) { numaraYazi += e.key; numaraGuncelle(); }
        else if (e.key === 'Backspace') { numaraYazi = numaraYazi.slice(0, -1); numaraGuncelle(); }
        else if (e.key === 'Enter') { e.preventDefault(); kitapVer(); }
        else if (e.key === 'Escape') numaraKapat();
    });

    kok.addEventListener('submit', formGonder);
}

async function formGonder(e) {
        e.preventDefault();
        const form = e.target;
        const dugme = form.querySelector('button[type="submit"]');
        const kilitle = (v) => { if (dugme) dugme.disabled = v; };
        try {
            if (form.id === 'form-kitap') {
                const ad = form.querySelector('#yeni-kitap-ad').value.trim();
                const noYazi = form.querySelector('#yeni-kitap-no').value.trim();
                if (!ad) return form.querySelector('#yeni-kitap-ad').focus();
                kilitle(true);
                await db.add('kitaplar_kalemleri', { no: noYazi !== '' ? parseInt(noYazi) : NUMARASIZ, ad });
                await yenile(); hepsiniCiz();
                document.getElementById('yeni-kitap-no').focus();
            } else if (form.id === 'form-toplu') {
                const satirlar = form.querySelector('#toplu-kitap').value.split('\n').filter(s => s.trim());
                if (!satirlar.length) return;
                kilitle(true);
                for (const s of satirlar) await db.add('kitaplar_kalemleri', numaraAyir(s));
                await yenile(); hepsiniCiz();
            } else if (form.id === 'form-kural') {
                const g = parseInt(form.querySelector('#kural-gun').value);
                if (Number.isNaN(g) || g < 0) return;
                kilitle(true);
                await db.setWithId('system_settings', 'kitap_ayarlari', { minGun: g });
                minGun = g;
                dugme.textContent = 'Kaydedildi';
                setTimeout(() => { dugme.textContent = 'Kaydet'; kilitle(false); }, 1500);
                ogrencileriCiz();
            } else if (form.dataset.duzenle) {
                const ad = form.querySelector('[name="ad"]').value.trim();
                const noYazi = form.querySelector('[name="no"]').value.trim();
                if (!ad) return;
                kilitle(true);
                await db.update('kitaplar_kalemleri', form.dataset.duzenle, { ad, no: noYazi !== '' ? parseInt(noYazi) : NUMARASIZ });
                await yenile(); hepsiniCiz();
            }
        } catch (err) { console.error(err); alert('Kaydedilemedi, tekrar deneyin'); kilitle(false); }
}

// ------------------------------------------------------------------ RAPOR
function raporYazdir() {
    const liste = veri.ogrenciler.map(o => ({ ...o, ozet: ogrenciOzeti(o, veri.kalemler, h) })).sort(SIRALAMALAR[siralamaTuru].fn);
    yazdir(`Kitap okuma raporu · ${SIRALAMALAR[siralamaTuru].ad.toLocaleLowerCase('tr-TR')}`, `
        <table>
            <thead><tr><th style="width:40px">Sıra</th><th style="width:70px">Okul no</th><th style="width:200px">Ad soyad</th><th class="sag" style="width:60px">Okudu</th><th>Kitaplar</th></tr></thead>
            <tbody>${liste.map((o, i) => `
                <tr>
                    <td>${i + 1}</td><td>${esc(o.okulno || '–')}</td><td>${esc(o.name)}</td><td class="sag">${o.ozet.okunan.length}</td>
                    <td style="font-size:12px">${[
                        ...o.ozet.okunan.map(k => esc(kitapAdiDuz(k))),
                        ...o.ozet.okuyor.map(k => `${esc(kitapAdiDuz(k))} (okuyor, ${sureMetni(k.tarih)})`),
                    ].join(', ') || '–'}</td>
                </tr>`).join('')}</tbody>
        </table>`);
}
