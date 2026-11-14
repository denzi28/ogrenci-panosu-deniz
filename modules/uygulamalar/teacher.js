// Etkileşimli görevler — öğretmen: görev ekle, dene, sınıfta oynat (tek ya da iki kişi), sonuçları gör ve düzelt
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { kutla } from '../../js/hareket.js';
import {
    KALEMLER, MATRIS, OYUNLAR, verileriGetir, puanAl, yayinDurumu, DURUM, sureMetni,
    puanHtml, puanMetni, oyunAdresi, puanDinle, katmanAc,
} from './ortak.js';

let kok, veri, siralama = 'yeni', seciliId = null;

// Tarihi olmayan eski kayıtlar en eski sayılır
const zaman = (k) => Date.parse(k.createdAt) || 0;

const SIRALAMALAR = {
    yeni: ['Önce yeni eklenenler', (a, b) => zaman(b) - zaman(a)],
    eski: ['Önce eski eklenenler', (a, b) => zaman(a) - zaman(b)],
    ad: ['Ada göre', (a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr-TR')],
    yayinda: ['Önce yayındakiler', (a, b) => (yayinDurumu(a) !== 'yayinda') - (yayinDurumu(b) !== 'yayinda') || (a.ad || '').localeCompare(b.ad || '', 'tr-TR')],
};

export async function render(container) {
    container.innerHTML = `<div id="gorev-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        <div id="view-liste">
            ${modulBasligi({
                baslik: 'Etkileşimli görevler',
                aciklama: 'Öğrenciler yayındaki görevleri kendi hesaplarından oynar, puanları kendiliğinden kaydedilir. Sınıfta oynat ile tahtada sırayla da oynatabilirsiniz',
                eylemler: `${await gorunurlukAnahtari('uygulamalar')}<button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-plus"></i>Yeni görev</button>`,
            })}
            <section class="panel" id="gorev-form-panel" hidden>
                <div class="panel-ust"><h2 id="gorev-form-baslik">Yeni görev</h2></div>
                <form id="form-gorev" class="panel-ic" autocomplete="off">
                    <input type="hidden" id="gorev-id">
                    <div class="form-group"><label for="gorev-oyun">Oyun</label>
                        <select id="gorev-oyun">
                            ${OYUNLAR.map(o => `<option value="${esc(o.link)}">${esc(o.ad)}</option>`).join('')}
                            <option value="">Başka bir adres yazacağım</option>
                        </select>
                    </div>
                    <div class="form-group" id="gorev-link-alan" hidden><label for="gorev-link">Oyunun adresi</label><input type="text" id="gorev-link" placeholder="oyunlar/yeni-oyun.html ya da https://..."></div>
                    <div class="form-group"><label for="gorev-ad">Görev adı</label><input type="text" id="gorev-ad" maxlength="80" required></div>
                    <div class="form-group"><label for="gorev-aciklama">Açıklama <small style="font-weight:400;color:var(--muted)">isteğe bağlı, öğrenciler ve veliler görür</small></label><textarea id="gorev-aciklama" rows="2"></textarea></div>
                    <div class="form-ikili">
                        <div class="form-group"><label for="gorev-baslangic">Başlangıç <small style="font-weight:400;color:var(--muted)">boşsa hemen</small></label><input type="date" id="gorev-baslangic"></div>
                        <div class="form-group"><label for="gorev-bitis">Bitiş <small style="font-weight:400;color:var(--muted)">boşsa süresiz</small></label><input type="date" id="gorev-bitis"></div>
                    </div>
                    <div class="form-eylem">
                        <button type="submit" class="btn btn-primary" id="gorev-kaydet">Ekle</button>
                        <button type="button" class="btn btn-secondary" data-islem="vazgec">Vazgeç</button>
                    </div>
                </form>
            </section>
            <section class="panel">
                <div class="panel-ust">
                    <h2>Görevler</h2>
                    <select id="gorev-siralama" aria-label="Sıralama" style="width:auto;min-height:32px;padding:4px 8px;font-size:14px">
                        ${Object.entries(SIRALAMALAR).map(([k, [ad]]) => `<option value="${k}"${k === siralama ? ' selected' : ''}>${ad}</option>`).join('')}
                    </select>
                </div>
                <div id="gorev-liste"></div>
            </section>
        </div>
        <div id="view-sonuc" hidden></div>`;
    baglaGorunurlukAnahtari('uygulamalar');
    kok.addEventListener('click', tikla);
    kok.addEventListener('change', degisti);
    kok.querySelector('#form-gorev').addEventListener('submit', kaydet);
    veri = await verileriGetir();
    listeyiCiz();
    if (seciliId && veri.kalemler.some(k => k.id === seciliId)) sonuclariAc(seciliId);
}

async function yenile() {
    veri = await verileriGetir();
    listeyiCiz();
    if (!kok.querySelector('#view-sonuc').hidden && seciliId) sonuclariCiz();
}

function listeyiCiz(isaretle) {
    const { kalemler, ogrenciler, puanlar } = veri;
    const sirali = [...kalemler].sort(SIRALAMALAR[siralama][1]);
    kok.querySelector('#gorev-liste').innerHTML = sirali.map(k => {
        const durum = DURUM[yayinDurumu(k)];
        const oynayan = ogrenciler.filter(o => puanAl(puanlar, o.id, k.id)).length;
        const oran = ogrenciler.length ? oynayan / ogrenciler.length : 0;
        return `
        <div class="gorev-satir" data-id="${esc(k.id)}">
            <div class="gorev-bilgi">
                <strong>${esc(k.ad)}</strong>
                <div class="ilan-meta"><span class="etiket ${durum.sinif}">${durum.ad}</span><span>${sureMetni(k)}</span></div>
            </div>
            <button type="button" class="gorev-katilim" data-islem="sonuc" title="Sonuçları göster">
                <span class="ilerleme" aria-hidden="true"><span style="transform:scaleX(${oran})"></span></span>
                <span class="ilerleme-yazi">${sayi(oynayan)}<small>/${sayi(ogrenciler.length)} oynadı</small></span>
            </button>
            <div class="satir-eylem">
                <button type="button" class="btn btn-primary btn-kucuk" data-islem="sinif"${oyunAdresi(k.link) ? '' : ' disabled'}><i class="fas fa-chalkboard-user"></i>Sınıfta oynat</button>
                <button type="button" class="btn btn-secondary btn-kucuk" data-islem="sonuc">Sonuçlar</button>
                <button type="button" class="ikon-dugme" data-islem="dene" title="Kendiniz deneyin (puan kaydedilmez)" aria-label="Dene"${oyunAdresi(k.link) ? '' : ' disabled'}><i class="fas fa-play"></i></button>
                <button type="button" class="ikon-dugme" data-islem="duzenle" title="Düzenle" aria-label="Düzenle"><i class="fas fa-pen"></i></button>
                <button type="button" class="ikon-dugme tehlike" data-islem="sil" title="Sil" aria-label="Sil"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('') || '<p class="bos-not">Henüz görev yok. Sağ üstten ilk görevi ekleyebilirsiniz</p>';
    if (isaretle) kaydedildiIsareti(kok.querySelector(`.gorev-satir[data-id="${CSS.escape(isaretle)}"]`));
}

// ---------------------------------------------------------------- Form
function formuAc(k = null) {
    const panel = kok.querySelector('#gorev-form-panel');
    const hazir = OYUNLAR.some(o => o.link === k?.link);
    kok.querySelector('#gorev-id').value = k?.id || '';
    kok.querySelector('#gorev-oyun').value = !k ? OYUNLAR[0].link : hazir ? k.link : '';
    kok.querySelector('#gorev-link').value = k && !hazir ? k.link || '' : '';
    kok.querySelector('#gorev-link-alan').hidden = !k || hazir;
    kok.querySelector('#gorev-ad').value = k?.ad || OYUNLAR[0].ad.replace(/^./, c => c.toLocaleUpperCase('tr-TR'));
    kok.querySelector('#gorev-aciklama').value = k?.aciklama || '';
    kok.querySelector('#gorev-baslangic').value = k?.baslangic || '';
    kok.querySelector('#gorev-bitis').value = k?.bitis || '';
    kok.querySelector('#gorev-form-baslik').textContent = k ? 'Görevi düzenle' : 'Yeni görev';
    kok.querySelector('#gorev-kaydet').textContent = k ? 'Kaydet' : 'Ekle';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
const formuKapat = () => { kok.querySelector('#gorev-form-panel').hidden = true; };

async function kaydet(e) {
    e.preventDefault();
    const id = kok.querySelector('#gorev-id').value;
    const secim = kok.querySelector('#gorev-oyun').value;
    const v = {
        ad: kok.querySelector('#gorev-ad').value.trim(),
        link: secim || kok.querySelector('#gorev-link').value.trim(),
        aciklama: kok.querySelector('#gorev-aciklama').value.trim(),
        baslangic: kok.querySelector('#gorev-baslangic').value,
        bitis: kok.querySelector('#gorev-bitis').value,
    };
    if (!v.ad) return;
    if (!oyunAdresi(v.link)) { alert('Oyunun adresini yazın'); kok.querySelector('#gorev-link').focus(); return; }
    if (v.baslangic && v.bitis && v.bitis < v.baslangic) { alert('Bitiş tarihi başlangıçtan önce olamaz'); return; }
    const dugme = kok.querySelector('#gorev-kaydet');
    dugme.disabled = true;
    try {
        const sonuc = id ? await db.update(KALEMLER, id, v) : await db.add(KALEMLER, v);
        formuKapat();
        veri = await verileriGetir();
        listeyiCiz(sonuc.id);
    } catch (err) { alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin'); }
    dugme.disabled = false;
}

function degisti(e) {
    if (e.target.id === 'gorev-siralama') { siralama = e.target.value; listeyiCiz(); }
    if (e.target.id === 'gorev-oyun') {
        const secim = e.target.value;
        kok.querySelector('#gorev-link-alan').hidden = !!secim;
        const ad = kok.querySelector('#gorev-ad');
        const eskiHazir = OYUNLAR.some(o => o.ad.toLocaleLowerCase('tr-TR') === ad.value.toLocaleLowerCase('tr-TR'));
        if (secim && (!ad.value || eskiHazir)) ad.value = OYUNLAR.find(o => o.link === secim).ad.replace(/^./, c => c.toLocaleUpperCase('tr-TR'));
        if (!secim) kok.querySelector('#gorev-link').focus();
    }
    if (e.target.classList.contains('puan-girdi')) puanDuzelt(e.target);
}

async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    const islem = d.dataset.islem;
    if (islem === 'yeni') return formuAc();
    if (islem === 'vazgec') return formuKapat();
    if (islem === 'geri') return listeyeDon();
    if (islem === 'yazdir') return yazdirSonuc();
    if (islem === 'temizle') return puanTemizle(d);
    const k = veri.kalemler.find(x => x.id === d.closest('[data-id]')?.dataset.id);
    if (!k) return;
    if (islem === 'duzenle') return formuAc(k);
    if (islem === 'sonuc') return sonuclariAc(k.id);
    if (islem === 'dene') return dene(k);
    if (islem === 'sinif') return sinifModu(k);
    if (islem === 'sil') {
        if (!confirm(`"${k.ad}" silinsin mi? Öğrencilerin bu görevdeki puanları da görünmez olur`)) return;
        await db.delete(KALEMLER, k.id);
        veri.kalemler = veri.kalemler.filter(x => x.id !== k.id);
        listeyiCiz();
    }
}

// ---------------------------------------------------------------- Sonuçlar
function sonuclariAc(id) {
    seciliId = id;
    kok.querySelector('#view-liste').hidden = true;
    kok.querySelector('#view-sonuc').hidden = false;
    sonuclariCiz();
    window.scrollTo({ top: 0 });
}
function listeyeDon() {
    seciliId = null;
    kok.querySelector('#view-sonuc').hidden = true;
    kok.querySelector('#view-liste').hidden = false;
    listeyiCiz();
}

function sonuclariCiz() {
    const k = veri.kalemler.find(x => x.id === seciliId);
    if (!k) return listeyeDon();
    const { ogrenciler, puanlar } = veri;
    const oynayan = ogrenciler.filter(o => puanAl(puanlar, o.id, k.id)).length;
    kok.querySelector('#view-sonuc').innerHTML = `
        <button type="button" class="yazi-dugme" data-islem="geri" style="margin:0 0 8px -8px"><i class="fas fa-arrow-left"></i>Görevler</button>
        ${modulBasligi({
            baslik: esc(k.ad),
            aciklama: `${sayi(ogrenciler.length)} öğrenciden ${sayi(oynayan)} kişi oynadı. Puanı elle düzeltmek için kutuya yazın`,
            eylemler: `<button type="button" class="btn btn-primary" data-islem="sinif" data-id="${esc(k.id)}"${oyunAdresi(k.link) ? '' : ' disabled'}><i class="fas fa-chalkboard-user"></i>Sınıfta oynat</button><button type="button" class="btn btn-secondary" data-islem="yazdir"><i class="fas fa-print"></i>Yazdır</button>`,
        })}
        <section class="panel" data-id="${esc(k.id)}">
            ${ogrenciler.map(o => {
                const p = puanAl(puanlar, o.id, k.id);
                return `
                <div class="satir" data-ogr="${esc(o.id)}">
                    <span class="satir-ad">${esc(o.name)}</span>
                    ${p ? puanHtml(p) : '<span class="etiket rafta">Oynamadı</span>'}
                    <input type="text" class="puan-girdi" value="${esc(p)}" placeholder="Puan" aria-label="${esc(o.name)} puanı">
                    <button type="button" class="ikon-dugme tehlike" data-islem="temizle" title="Puanı sil" aria-label="Puanı sil"${p ? '' : ' hidden'}><i class="fas fa-eraser"></i></button>
                </div>`;
            }).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}

async function puanKaydet(ogrId, deger) {
    await db.saveMatrixStatus(MATRIS, ogrId, seciliId, deger);
    veri.puanlar.set(`${ogrId}_${seciliId}`, deger);
}
async function puanDuzelt(girdi) {
    const ogrId = girdi.closest('[data-ogr]').dataset.ogr;
    try { await puanKaydet(ogrId, girdi.value.trim()); }
    catch (e) { alert('Kaydedilemedi, tekrar deneyin'); }
    sonuclariCiz();
    kaydedildiIsareti(kok.querySelector(`#view-sonuc [data-ogr="${CSS.escape(ogrId)}"]`));
}
async function puanTemizle(d) {
    const satir = d.closest('[data-ogr]');
    if (!confirm(`${satir.querySelector('.satir-ad').textContent} için puan silinsin mi?`)) return;
    await puanKaydet(satir.dataset.ogr, '');
    sonuclariCiz();
}

function yazdirSonuc() {
    const k = veri.kalemler.find(x => x.id === seciliId);
    if (!k) return;
    yazdir(`${k.ad} sonuçları`, `
        <table><thead><tr><th>Sıra</th><th>Öğrenci</th><th class="sag">Puan</th></tr></thead>
        <tbody>${veri.ogrenciler.map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.name)}</td><td class="sag">${esc(puanAl(veri.puanlar, o.id, k.id)) || '–'}</td></tr>`).join('')}</tbody></table>`);
}

// ---------------------------------------------------------------- Dene (öğretmen, puan kaydedilmez)
function dene(k) {
    const { el, govde, kapat } = katmanAc({ baslik: `${esc(k.ad)} <small>Deneme, puan kaydedilmez</small>` });
    govde.innerHTML = `<iframe class="oyun-cerceve" title="${esc(k.ad)}" src="${esc(oyunAdresi(k.link))}"></iframe>`;
    const iframe = govde.querySelector('iframe');
    const birak = puanDinle((e) => {
        if (e.source === iframe.contentWindow && e.data.islem === 'gorev_bitti') setTimeout(() => { if (document.body.contains(el)) kapat(); }, 1500);
    });
    el.addEventListener('kapandi', birak);
}

// ---------------------------------------------------------------- Sınıf modu (akıllı tahta)
// Tek kişi: öğrenci adına dokunur, oynar, puanı onun adına kaydedilir.
// İki kişi: ekran ikiye bölünür, iki öğrenci aynı anda bağımsız oynar.
function sinifModu(k) {
    const adres = oyunAdresi(k.link);
    const { el, govde, kapat } = katmanAc({
        baslik: `<span class="yildiz-cikartma" aria-hidden="true"></span>${esc(k.ad)}`,
        sinif: 'sinif-modu',
        dugmeler: '<button type="button" class="btn btn-hayalet" data-sm="mod" hidden><i class="fas fa-table-columns"></i>Oyun türü</button>',
    });
    const taraflar = {}; // 'tek' | 'sol' | 'sag' -> { ogr, iframe, alan }

    const adlarHtml = (secili) => `<div class="sm-adlar">${veri.ogrenciler.map(o => {
        const p = puanAl(veri.puanlar, o.id, k.id);
        const baskasi = Object.values(taraflar).some(t => t.ogr?.id === o.id) && secili !== o.id;
        return `<button type="button" class="sm-ad${p ? ' oynadi' : ''}" data-ogr="${esc(o.id)}"${baskasi ? ' disabled' : ''}><strong>${esc(o.name)}</strong><small>${p ? esc(p) : 'Oynamadı'}</small></button>`;
    }).join('')}</div>`;

    const modSecimi = () => {
        Object.keys(taraflar).forEach(t => delete taraflar[t]);
        el.querySelector('[data-sm="mod"]').hidden = true;
        govde.innerHTML = `
            <div class="sm-secim">
                <h3>Nasıl oynayacaksınız?</h3>
                <div class="sm-secenekler">
                    <button type="button" class="sm-secenek" data-sm="tek"><i class="fas fa-user"></i><strong>Tek kişi</strong><small>Tahtaya gelen öğrenci adına dokunur ve oynar</small></button>
                    <button type="button" class="sm-secenek" data-sm="iki"><i class="fas fa-user-group"></i><strong>İki kişi</strong><small>Ekran ikiye bölünür, iki öğrenci aynı anda oynar</small></button>
                </div>
            </div>`;
    };

    const tarafCiz = (ad) => {
        const t = taraflar[ad];
        const baslik = ad === 'tek' ? '' : `<div class="sm-taraf-ust"><span>${ad === 'sol' ? 'Sol' : 'Sağ'}${t.ogr ? `: <b>${esc(t.ogr.name)}</b>` : ''}</span><span class="sm-not" aria-live="polite"></span>${t.ogr ? `<button type="button" class="btn btn-hayalet btn-kucuk" data-sm="vazgec" data-taraf="${ad}">Vazgeç</button>` : ''}</div>`;
        const tekUst = ad === 'tek' && t.ogr ? `<div class="sm-taraf-ust"><span>Oynayan: <b>${esc(t.ogr.name)}</b></span><span class="sm-not" aria-live="polite"></span><button type="button" class="btn btn-hayalet btn-kucuk" data-sm="vazgec" data-taraf="tek">Vazgeç</button></div>` : '';
        t.alan.innerHTML = (ad === 'tek' ? tekUst : baslik) + (t.ogr
            ? `<iframe class="oyun-cerceve" title="${esc(k.ad)}" src="${esc(adres)}"></iframe>`
            : `<div class="sm-liste">${ad === 'tek' ? '<h3>Tahtaya kim geliyor?</h3><p>Oynamak için adına dokun</p>' : '<p>Oynayacak öğrenciyi seçin</p>'}${adlarHtml()}</div>`);
        t.iframe = t.alan.querySelector('iframe');
    };

    const baslat = (mod) => {
        el.querySelector('[data-sm="mod"]').hidden = false;
        const adlar = mod === 'tek' ? ['tek'] : ['sol', 'sag'];
        govde.innerHTML = `<div class="sm-alan ${mod}">${adlar.map(a => `<div class="sm-taraf" data-taraf-alan="${a}"></div>`).join('')}</div>`;
        adlar.forEach(a => { taraflar[a] = { ogr: null, iframe: null, alan: govde.querySelector(`[data-taraf-alan="${a}"]`) }; tarafCiz(a); });
    };
    const digerleriniYenile = (haric) => Object.keys(taraflar).forEach(a => { if (a !== haric && !taraflar[a].ogr) tarafCiz(a); });

    el.addEventListener('click', (e) => {
        const d = e.target.closest('[data-sm], .sm-ad');
        if (!d) return;
        if (d.dataset.sm === 'tek' || d.dataset.sm === 'iki') return baslat(d.dataset.sm);
        if (d.dataset.sm === 'mod') return modSecimi();
        const ad = d.closest('[data-taraf-alan]')?.dataset.tarafAlan;
        if (!ad) return;
        if (d.dataset.sm === 'vazgec') { taraflar[ad].ogr = null; tarafCiz(ad); digerleriniYenile(ad); return; }
        if (d.classList.contains('sm-ad')) {
            taraflar[ad].ogr = veri.ogrenciler.find(o => o.id === d.dataset.ogr);
            tarafCiz(ad);
            digerleriniYenile(ad);
        }
    });

    const birak = puanDinle(async (e) => {
        const ad = Object.keys(taraflar).find(a => taraflar[a].iframe && e.source === taraflar[a].iframe.contentWindow);
        if (!ad || !taraflar[ad].ogr) return;
        const t = taraflar[ad], ogr = t.ogr, deger = puanMetni(e.data);
        const not = t.alan.querySelector('.sm-not');
        try {
            await db.saveMatrixStatus(MATRIS, ogr.id, k.id, deger);
            veri.puanlar.set(`${ogr.id}_${k.id}`, deger);
            if (not) not.textContent = `Kaydedildi: ${deger}`;
        } catch (err) { if (not) not.textContent = 'Puan kaydedilemedi'; return; }
        if (e.data.islem === 'gorev_bitti') {
            kutla(not);
            setTimeout(() => {
                if (!document.body.contains(el) || t.ogr !== ogr) return;
                t.ogr = null; tarafCiz(ad); digerleriniYenile(ad);
            }, 1800);
        }
    });

    el.addEventListener('kapandi', () => { birak(); listeyiCiz(); if (seciliId) sonuclariCiz(); });
    modSecimi();
}
