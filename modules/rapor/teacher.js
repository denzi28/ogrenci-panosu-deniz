// Gelişim raporu — öğretmen: her öğrenci için tek sayfalık karne (davranış, kitap, rozet, görev, ödev, devam).
// Ekranda öğrenci öğrenci gezilir; tek tek ya da hepsi birden (her öğrenci ayrı sayfa) yazdırılır.
// Veri yeni bir yere yazılmaz; sadece diğer bölümlerin kayıtları okunur.
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { appConfig } from '../../js/config.js';
import * as davranis from '../davranis/ortak.js';
import * as kitap from '../kitap/ortak.js';
import * as rozet from '../rozetler/ortak.js';
import * as gorev from '../uygulamalar/ortak.js';
import * as odev from '../odevler/ortak.js';
import * as yoklama from '../araclar/yoklama.js';

let kok, v, sira = 0;
const notlar = new Map(); // öğretmen görüşü: sadece bu ekranda tutulur, kaydedilmez

export async function render(container) {
    container.innerHTML = `<div id="rapor-kok"><p class="bos-not">Raporlar hazırlanıyor</p></div>`;
    kok = container.firstElementChild;
    v = await verileriTopla();
    if (!v.ogrenciler.length) { kok.innerHTML = `${modulBasligi({ baslik: 'Gelişim raporu' })}<div class="panel"><p class="bos-not">Henüz öğrenci yok</p></div>`; return; }
    sira = Math.min(sira, v.ogrenciler.length - 1);
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Gelişim raporu',
            aciklama: 'Veli toplantısı için her öğrencinin tek sayfalık özeti. Yazdırınca her öğrenci ayrı sayfaya çıkar',
            eylemler: '<button type="button" class="btn btn-secondary" data-islem="hepsi"><i class="fas fa-print"></i>Hepsini yazdır</button><button type="button" class="btn btn-primary" data-islem="yazdir"><i class="fas fa-print"></i>Bu raporu yazdır</button>',
        })}
        <div class="rapor-gezgin">
            <button type="button" class="ikon-dugme" data-islem="onceki" aria-label="Önceki öğrenci"><i class="fas fa-chevron-left"></i></button>
            <select id="rapor-ogrenci" aria-label="Öğrenci">${v.ogrenciler.map((o, i) => `<option value="${i}">${esc(o.name)}</option>`).join('')}</select>
            <button type="button" class="ikon-dugme" data-islem="sonraki" aria-label="Sonraki öğrenci"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div id="rapor-onizleme"></div>`;
    kok.querySelector('#rapor-ogrenci').addEventListener('change', (e) => { sira = +e.target.value; ciz(); });
    kok.addEventListener('click', (e) => {
        const d = e.target.closest('[data-islem]');
        if (!d) return;
        if (d.dataset.islem === 'onceki') { sira = (sira - 1 + v.ogrenciler.length) % v.ogrenciler.length; ciz(); }
        if (d.dataset.islem === 'sonraki') { sira = (sira + 1) % v.ogrenciler.length; ciz(); }
        if (d.dataset.islem === 'yazdir') yazdirRapor([v.ogrenciler[sira]]);
        if (d.dataset.islem === 'hepsi') yazdirRapor(v.ogrenciler);
    });
    kok.addEventListener('input', (e) => { if (e.target.id === 'rapor-not') notlar.set(v.ogrenciler[sira].id, e.target.value); });
    ciz();
}

function ciz() {
    kok.querySelector('#rapor-ogrenci').value = sira;
    kok.querySelector('#rapor-onizleme').innerHTML = `<article class="rapor">${raporHtml(v.ogrenciler[sira], { ekran: true })}</article>`;
}

// ---------------------------------------------------------------- Veri
async function verileriTopla() {
    const bos = (e) => { console.warn('Rapor verisi okunamadı:', e); return null; };
    const [d, k, r, g, o, y] = await Promise.all([
        davranis.verileriGetir().catch(bos), kitap.verileriGetir().catch(bos), rozet.verileriGetir().catch(bos),
        gorev.verileriGetir().catch(bos), odev.verileriGetir().catch(bos), yoklama.hepsiniGetir().catch(bos),
    ]);
    const devam = yoklama.devamOzeti(y || []);
    const ogrenciler = (d?.ogrenciler || k?.ogrenciler || []).slice()
        .sort((a, b) => (parseInt(a.okulno) || 1e6) - (parseInt(b.okulno) || 1e6) || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    const davranisHarita = d ? davranis.puanHaritasi(d.matris) : new Map();
    const kitapHarita = k ? kitap.durumHaritasi(k.matris) : new Map();
    const sahip = r ? rozet.sahiplik(r.matris) : new Set();

    const yildiz = (id) => (d?.kriterler || []).reduce((t, kr) => t + davranis.puanAl(davranisHarita, id, kr.id), 0);
    const okunan = (o) => k ? kitap.ogrenciOzeti(o, k.kalemler, kitapHarita).okunan.length : 0;
    const ort = (f) => ogrenciler.length ? Math.round(ogrenciler.reduce((t, x) => t + f(x), 0) / ogrenciler.length) : 0;
    return {
        ogrenciler, d, k, r, g, o, devam, davranisHarita, kitapHarita, sahip, yildiz, okunan,
        ortalama: { yildiz: ort(x => yildiz(x.id)), kitap: ort(okunan) },
    };
}

// Yıldızlar yazı karakteriyle: yazdırırken ikon yazı tipine gerek kalmaz
const yildizMetin = (p) => `<span class="rapor-yildiz" aria-label="${p} / ${davranis.ENCOK_YILDIZ} yıldız"><b>${'★'.repeat(p)}</b>${'★'.repeat(Math.max(0, davranis.ENCOK_YILDIZ - p))}</span>`;

// Sayfanın kendi stilleri yazdırma penceresine kopyalanır (pencere ağdan dosya beklemez)
function sayfaStilleri() {
    return [...document.styleSheets].flatMap(ss => {
        try { return [...ss.cssRules].filter(r => !(r instanceof CSSImportRule)).map(r => r.cssText); } catch { return []; }
    }).join('\n');
}

// ---------------------------------------------------------------- Rapor sayfası (ekran ve kâğıt aynı)
function raporHtml(ogr, { ekran = false } = {}) {
    const id = ogr.id;
    const kriterler = v.d?.kriterler || [];
    const yildiz = v.yildiz(id);
    const kitapOz = v.k ? kitap.ogrenciOzeti(ogr, v.k.kalemler, v.kitapHarita) : { okunan: [], okuyor: [] };
    const rozetler = (v.r?.rozetler || []).filter(x => rozet.sahipMi(v.sahip, id, x.id));
    const gorevler = (v.g?.kalemler || []).filter(x => gorev.yayinDurumu(x) !== 'bekliyor')
        .sort((a, b) => String(a.baslangic || '').localeCompare(String(b.baslangic || '')));
    const odevOz = v.o ? odev.ogrenciOzeti(id, v.o.odevler, v.o.harita) : null;
    const bakilanOdev = odevOz ? odevOz.yapti + odevOz.eksik + odevOz.yapmadi : 0;
    const oynanan = gorevler.filter(x => gorev.puanAl(v.g.puanlar, id, x.id)).length;
    const not = notlar.get(id) || '';

    const kutu = (ad, deger, alt) => `<div class="rapor-kutu"><small>${ad}</small><b>${deger}</b>${alt ? `<span>${alt}</span>` : ''}</div>`;

    return `
        <header class="rapor-ust">
            <div>
                <small>${esc(appConfig.sinifAdi)} sınıfı · Öğrenci gelişim raporu</small>
                <h2>${esc(ogr.name)}</h2>
                ${ogr.okulno ? `<span>Okul no ${esc(ogr.okulno)}</span>` : ''}
            </div>
            <time>${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        </header>
        <div class="rapor-kutular">
            ${kutu('Davranış yıldızı', sayi(yildiz), kriterler.length ? `Sınıf ortalaması ${sayi(v.ortalama.yildiz)}` : '')}
            ${kutu('Okunan kitap', sayi(kitapOz.okunan.length), `Sınıf ortalaması ${sayi(v.ortalama.kitap)}`)}
            ${kutu('Rozet', sayi(rozetler.length), '')}
            ${odevOz ? kutu('Ödev', bakilanOdev ? `%${Math.round((odevOz.yapti / bakilanOdev) * 100)}` : '–', bakilanOdev ? `${sayi(bakilanOdev)} ödevin ${sayi(odevOz.yapti)} tanesi tam` : 'Henüz bakılmadı') : ''}
        </div>

        <section class="rapor-bolum">
            <h3>Davranış</h3>
            ${kriterler.length ? `<div class="rapor-satirlar">${kriterler.map(kr => {
                const p = davranis.puanAl(v.davranisHarita, id, kr.id);
                return `<div><span>${esc(kr.ad)}</span>${p ? yildizMetin(p) : '<small>Değerlendirilmedi</small>'}</div>`;
            }).join('')}</div>` : '<p class="rapor-bos">Davranış ölçütü eklenmemiş</p>'}
        </section>

        <section class="rapor-bolum">
            <h3>Kitap okuma</h3>
            ${kitapOz.okunan.length ? `<p>${kitapOz.okunan.map(x => esc(x.ad)).join(', ')}</p>` : '<p class="rapor-bos">Sınıf kitaplığından henüz bitirdiği kitap yok</p>'}
            ${kitapOz.okuyor.length ? `<p class="rapor-ek">Şu an okuduğu: ${kitapOz.okuyor.map(x => esc(x.ad)).join(', ')}</p>` : ''}
        </section>

        <section class="rapor-bolum">
            <h3>Rozetler</h3>
            ${rozetler.length ? `<div class="rapor-rozetler">${rozetler.map(x => `<div>${rozet.rozetGorseli(x, 44)}<span>${esc(x.ad)}</span></div>`).join('')}</div>` : '<p class="rapor-bos">Henüz rozeti yok</p>'}
        </section>

        ${gorevler.length ? `
        <section class="rapor-bolum">
            <h3>Etkileşimli görevler <small>${sayi(gorevler.length)} görevin ${sayi(oynanan)} tanesini oynadı</small></h3>
            <div class="rapor-satirlar">${gorevler.map(x => {
                const p = gorev.puanAl(v.g.puanlar, id, x.id);
                return `<div><span>${esc(x.ad)}</span>${p ? `<b>${esc(p)}</b>` : '<small>Oynamadı</small>'}</div>`;
            }).join('')}</div>
        </section>` : ''}

        ${odevOz && v.o.odevler.length ? `
        <section class="rapor-bolum">
            <h3>Ödevler</h3>
            <p>${sayi(odevOz.yapti)} tam, ${sayi(odevOz.eksik)} eksik, ${sayi(odevOz.yapmadi)} yapılmadı${odevOz.bekleyen ? `, ${sayi(odevOz.bekleyen)} henüz bakılmadı` : ''}</p>
            ${odevOz.eksikler.length ? `<p class="rapor-ek">Eksik ya da yapılmayanlar: ${odevOz.eksikler.map(x => esc(x.baslik)).join(', ')}</p>` : ''}
        </section>` : ''}

        ${v.devam.gunSayisi ? (() => {
            const gun = v.devam.devamsizlik(id);
            const tarihler = v.devam.tarihler(id).map(t => new Date(`${t}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }));
            return `
        <section class="rapor-bolum">
            <h3>Devam <small>Yoklama alınan ${sayi(v.devam.gunSayisi)} gün</small></h3>
            <p>${gun ? `${sayi(gun)} gün gelmedi` : 'Yoklama alınan her gün derse geldi'}</p>
            ${gun ? `<p class="rapor-ek">Gelmediği günler: ${tarihler.map(esc).join(', ')}</p>` : ''}
        </section>`; })() : ''}

        <section class="rapor-bolum rapor-not">
            <h3>Öğretmen görüşü</h3>
            ${ekran
                ? `<textarea id="rapor-not" rows="3" placeholder="İsterseniz yazın, yazdırınca rapora eklenir. Kaydedilmez">${esc(not)}</textarea>`
                : not ? `<p>${esc(not).replace(/\n/g, '<br>')}</p>` : '<div class="rapor-cizgiler"></div>'}
        </section>`;
}

// ---------------------------------------------------------------- Yazdırma: her öğrenci ayrı sayfa
function yazdirRapor(ogrenciler) {
    const pencere = window.open('', '_blank');
    if (!pencere) { alert('Yazdırma penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol edin'); return; }
    const taban = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    pencere.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><base href="${taban}">
        <title>${ogrenciler.length > 1 ? 'Gelişim raporları' : `${esc(ogrenciler[0].name)} gelişim raporu`}</title>
        <style>${sayfaStilleri()}</style>
        <style>body { background: #fff; padding: 0; } .rapor { box-shadow: none; border: 0; margin: 0 auto; } @page { size: A4; margin: 12mm; }</style>
        </head><body>
        ${ogrenciler.map(o => `<article class="rapor sayfa">${raporHtml(o)}</article>`).join('')}
        <script>window.onload = () => setTimeout(() => { window.print(); }, 400);<\/script>
        </body></html>`);
    pencere.document.close();
}
