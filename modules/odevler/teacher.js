// Ödevler — öğretmen: ödev ver, kimin yaptığını işaretle, öğrenci bazında eksikleri gör.
// İşaretleme: her öğrencinin satırında Yaptı / Eksik / Yapmadı. "Herkes yaptı" ile hepsi yaptı yapılır, sonra istisnalar düzeltilir.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, sekmeler, baglaSekmeler, kaydedildiIsareti, metinHtml, yazdir } from '../../js/arayuz.js';
import { bildirim } from '../../js/hareket.js';
import { hedefRozetleriniVer } from '../rozetler/ortak.js';
import {
    KALEMLER, MATRIS, YAPTI, DURUMLAR, durumBilgi, verileriGetir, durumAl, ogrenciOzeti,
    teslimMetni, teslimEtiketi, gectiMi, odevBasligi, bugun,
} from './ortak.js';

const SIK_DERSLER = ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Görsel Sanatlar', 'Müzik'];
let kok, veri, seciliId = null;

export async function render(container) {
    container.innerHTML = `<div id="odev-kok"></div>`;
    kok = container.firstElementChild;
    veri = await verileriGetir();
    let dersler = SIK_DERSLER;
    try {
        const program = await db.getAll('ders_programi');
        dersler = [...new Set([...SIK_DERSLER, ...program.flatMap(p => Object.entries(p).filter(([k]) => /^ders\d$/.test(k) && p.gun !== 'SAATLER').map(([, v]) => v)).filter(Boolean)])];
    } catch { /* program yoksa sık dersler yeter */ }

    kok.innerHTML = `
        <div id="ana-gorunum">
            ${modulBasligi({
                baslik: 'Ödevler',
                aciklama: 'Veliler ödevleri ve teslim tarihlerini görür, kimin yaptığını görmez. Her öğrenci kendi durumunu görür',
                eylemler: `${await gorunurlukAnahtari('odevler')}<button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-plus"></i>Ödev ver</button>`,
            })}
            <section class="panel" id="odev-form-panel" hidden>
                <div class="panel-ust"><h2 id="odev-form-baslik">Yeni ödev</h2></div>
                <form id="form-odev" class="panel-ic" autocomplete="off">
                    <input type="hidden" id="odev-id">
                    <div class="form-group"><label for="odev-baslik">Ödev</label><input type="text" id="odev-baslik" maxlength="100" placeholder="Matematik kitabı 45. sayfa" required></div>
                    <div class="form-ikili">
                        <div class="form-group"><label for="odev-ders">Ders <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><input type="text" id="odev-ders" list="odev-dersler"><datalist id="odev-dersler">${dersler.map(d => `<option value="${esc(d)}">`).join('')}</datalist></div>
                        <div class="form-group"><label for="odev-teslim">Teslim tarihi</label><input type="date" id="odev-teslim" required></div>
                    </div>
                    <div class="form-group"><label for="odev-aciklama">Açıklama <small style="font-weight:400;color:var(--muted)">isteğe bağlı, veliler de görür</small></label><textarea id="odev-aciklama" rows="2"></textarea></div>
                    <div class="form-eylem">
                        <button type="submit" class="btn btn-primary" id="odev-kaydet">Ödevi ver</button>
                        <button type="button" class="btn btn-secondary" data-islem="vazgec">Vazgeç</button>
                    </div>
                </form>
            </section>
            ${sekmeler([{ id: 'o-odevler', ad: 'Ödevler' }, { id: 'o-ogrenciler', ad: 'Öğrenciler' }], 'o-odevler')}
            <div id="view-o-odevler"></div>
            <div id="view-o-ogrenciler" hidden></div>
        </div>
        <div id="view-o-kontrol" hidden></div>`;
    baglaGorunurlukAnahtari('odevler');
    baglaSekmeler(kok.querySelector('#ana-gorunum'));
    kok.addEventListener('click', tikla);
    kok.querySelector('#form-odev').addEventListener('submit', kaydet);
    ciz();
    if (seciliId && veri.odevler.some(o => o.id === seciliId)) kontrolAc(seciliId);
}

function ciz(isaretle) { odevleriCiz(isaretle); ogrencileriCiz(); }

function sayac(o) {
    const s = { yapti: 0, eksik: 0, yapmadi: 0, bakilmadi: 0 };
    veri.ogrenciler.forEach(g => { const d = durumAl(veri.harita, g.id, o.id); s[d === YAPTI ? 'yapti' : d === '◐' ? 'eksik' : d === '✗' ? 'yapmadi' : 'bakilmadi']++; });
    return s;
}

function odevleriCiz(isaretle) {
    const n = veri.ogrenciler.length;
    const satir = (o) => {
        const s = sayac(o);
        return `
        <div class="gorev-satir" data-id="${esc(o.id)}">
            <div class="gorev-bilgi">
                <strong style="white-space:normal">${odevBasligi(o)}</strong>
                <div class="ilan-meta"><span>${teslimMetni(o)}</span>${teslimEtiketi(o)}</div>
            </div>
            <button type="button" class="gorev-katilim" data-islem="kontrol" title="Kimin yaptığını işaretle">
                <span class="ilerleme" aria-hidden="true"><span style="transform:scaleX(${n ? s.yapti / n : 0})"></span></span>
                <span class="ilerleme-yazi">${s.bakilmadi === n ? '<small>Bakılmadı</small>' : `${sayi(s.yapti)}<small>/${sayi(n)} yaptı</small>`}</span>
            </button>
            <div class="satir-eylem">
                <button type="button" class="btn ${s.bakilmadi === n && gectiMi(o) ? 'btn-primary' : 'btn-secondary'} btn-kucuk" data-islem="kontrol"><i class="fas fa-list-check"></i>Kontrol et</button>
                <button type="button" class="ikon-dugme" data-islem="duzenle" title="Düzenle" aria-label="Düzenle"><i class="fas fa-pen"></i></button>
                <button type="button" class="ikon-dugme tehlike" data-islem="sil" title="Sil" aria-label="Sil"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    };
    const yaklasan = veri.odevler.filter(o => !gectiMi(o)), gecmis = veri.odevler.filter(gectiMi);
    kok.querySelector('#view-o-odevler').innerHTML = `
        <section class="panel">
            <div class="panel-ust"><h2>Teslimi yaklaşan</h2>${yaklasan.length ? `<small>${yaklasan.length} ödev</small>` : ''}</div>
            ${yaklasan.map(satir).join('') || '<p class="bos-not">Bekleyen ödev yok. Sağ üstten ödev verebilirsiniz</p>'}
        </section>
        ${gecmis.length ? `<section class="panel"><div class="panel-ust"><h2>Teslim tarihi geçenler</h2><small>${gecmis.length} ödev</small></div>${gecmis.map(satir).join('')}</section>` : ''}`;
    if (isaretle) kaydedildiIsareti(kok.querySelector(`.gorev-satir[data-id="${CSS.escape(isaretle)}"]`));
}

function ogrencileriCiz() {
    const liste = veri.ogrenciler.map(o => ({ o, oz: ogrenciOzeti(o.id, veri.odevler, veri.harita) }))
        .sort((a, b) => (b.oz.eksik + b.oz.yapmadi) - (a.oz.eksik + a.oz.yapmadi) || (a.o.name || '').localeCompare(b.o.name || '', 'tr-TR'));
    kok.querySelector('#view-o-ogrenciler').innerHTML = `
        <section class="panel">
            <div class="panel-ust"><h2>Öğrencilerin ödev durumu</h2><small>Eksiği en çok olan en üstte</small></div>
            ${liste.map(({ o, oz }) => `
                <details class="satir-detay">
                    <summary class="satir">
                        <span class="satir-ad">${esc(o.name)}${oz.eksikler.length ? `<small>Eksik: ${oz.eksikler.slice(0, 3).map(x => esc(x.baslik)).join(', ')}${oz.eksikler.length > 3 ? ` ve ${oz.eksikler.length - 3} ödev daha` : ''}</small>` : ''}</span>
                        <span class="odev-sayilar">
                            <span class="etiket durum-yapti" title="Yaptı"><i class="fas fa-check"></i>${oz.yapti}</span>
                            ${oz.eksik ? `<span class="etiket durum-eksik" title="Eksik"><i class="fas fa-circle-half-stroke"></i>${oz.eksik}</span>` : ''}
                            ${oz.yapmadi ? `<span class="etiket durum-yapmadi" title="Yapmadı"><i class="fas fa-xmark"></i>${oz.yapmadi}</span>` : ''}
                        </span>
                    </summary>
                    <div class="acilir">${veri.odevler.filter(x => durumAl(veri.harita, o.id, x.id)).map(x => {
                        const d = durumBilgi(durumAl(veri.harita, o.id, x.id));
                        return `<div class="acilir-satir"><span>${esc(x.baslik)}</span><span class="etiket durum-${d.sinif}"><i class="fas ${d.ikon}"></i>${d.ad}</span></div>`;
                    }).join('') || '<div class="acilir-satir"><span>Henüz bakılan ödev yok</span></div>'}</div>
                </details>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}

// ---------------------------------------------------------------- Kontrol ekranı
function kontrolAc(id) {
    seciliId = id;
    kok.querySelector('#ana-gorunum').hidden = true;
    kok.querySelector('#view-o-kontrol').hidden = false;
    kontrolCiz();
    window.scrollTo({ top: 0 });
}
function listeyeDon() {
    seciliId = null;
    kok.querySelector('#view-o-kontrol').hidden = true;
    kok.querySelector('#ana-gorunum').hidden = false;
    ciz();
}

function kontrolCiz() {
    const o = veri.odevler.find(x => x.id === seciliId);
    if (!o) return listeyeDon();
    const s = sayac(o);
    kok.querySelector('#view-o-kontrol').innerHTML = `
        <button type="button" class="yazi-dugme" data-islem="geri" style="margin:0 0 8px -8px"><i class="fas fa-arrow-left"></i>Ödevler</button>
        ${modulBasligi({
            baslik: esc(o.baslik),
            aciklama: `${o.ders ? `${esc(o.ders)} · ` : ''}${teslimMetni(o)}`,
            eylemler: `<button type="button" class="btn btn-secondary" data-islem="yazdir"><i class="fas fa-print"></i>Yazdır</button><button type="button" class="btn btn-primary" data-islem="herkes"${s.bakilmadi ? '' : ' disabled'}><i class="fas fa-check-double"></i>Bakılmayanlar yaptı</button>`,
        })}
        ${o.aciklama ? `<p class="ilan-metin" style="margin:-12px 0 16px">${metinHtml(o.aciklama)}</p>` : ''}
        <div class="sayilar dort" style="margin-bottom:16px">
            <div class="sayi-kart"><small>Yaptı</small><strong>${sayi(s.yapti)}</strong></div>
            <div class="sayi-kart"><small>Eksik</small><strong>${sayi(s.eksik)}</strong></div>
            <div class="sayi-kart"><small>Yapmadı</small><strong>${sayi(s.yapmadi)}</strong></div>
            <div class="sayi-kart"><small>Bakılmadı</small><strong>${sayi(s.bakilmadi)}</strong></div>
        </div>
        <section class="panel" data-odev="${esc(o.id)}">
            ${veri.ogrenciler.map(g => {
                const d = durumAl(veri.harita, g.id, o.id);
                return `
                <div class="satir" data-ogr="${esc(g.id)}">
                    <span class="satir-ad">${esc(g.name)}</span>
                    <span class="durum-secici" role="group" aria-label="${esc(g.name)} ödev durumu">
                        ${DURUMLAR.map(x => `<button type="button" class="durum-sec ${x.sinif}" data-islem="isaretle" data-deger="${x.deger}" aria-pressed="${d === x.deger}"><i class="fas ${x.ikon}"></i><span>${x.ad}</span></button>`).join('')}
                    </span>
                </div>`;
            }).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}

async function isaretle(d) {
    const ogrId = d.closest('[data-ogr]').dataset.ogr;
    const anahtar = `${ogrId}_${seciliId}`;
    const eski = veri.harita.get(anahtar) || '';
    const yeni = eski === d.dataset.deger ? '' : d.dataset.deger; // seçiliye tekrar basınca kaldırılır
    veri.harita.set(anahtar, yeni);
    kontrolCiz();
    try {
        await db.saveMatrixStatus(MATRIS, ogrId, seciliId, yeni);
        if (yeni === YAPTI) rozetKontrol([ogrId]);
    } catch (e) {
        veri.harita.set(anahtar, eski);
        kontrolCiz();
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
}

async function herkesYapti(dugme) {
    const bakilmayan = veri.ogrenciler.filter(g => !durumAl(veri.harita, g.id, seciliId));
    if (!bakilmayan.length) return;
    dugme.disabled = true;
    try {
        for (const g of bakilmayan) {
            await db.saveMatrixStatus(MATRIS, g.id, seciliId, YAPTI);
            veri.harita.set(`${g.id}_${seciliId}`, YAPTI);
        }
    } catch (e) { alert('Bazı öğrenciler kaydedilemedi, tekrar deneyin'); }
    kontrolCiz();
    rozetKontrol(bakilmayan.map(g => g.id));
}

// Ödev hedefli rozetler: "N ödevi tam yaptı" hedefine ulaşanlara kendiliğinden verilir
async function rozetKontrol(ogrIdler) {
    try {
        const [rozetler, matris] = await Promise.all([db.getAll('rozetler_kalemleri'), db.getAll('rozet_matrisi')]);
        if (!rozetler.some(r => parseInt(r.odevHedefi) > 0)) return;
        for (const id of ogrIdler) {
            const g = veri.ogrenciler.find(x => x.id === id);
            const verilen = await hedefRozetleriniVer(id, 'odevHedefi', ogrenciOzeti(id, veri.odevler, veri.harita).yapti, { rozetler, matris });
            verilen.forEach(r => { bildirim(`${esc(g.name)} <b>${esc(r.ad)}</b> rozetini kazandı`); matris.push({ ogrId: id, targetId: r.id, deger: '✔️' }); });
        }
    } catch (e) { console.warn('Ödev rozeti verilemedi:', e); }
}

// ---------------------------------------------------------------- Form
function formuAc(o = null) {
    const yarin = new Date(Date.now() + 864e5);
    const varsayilan = `${yarin.getFullYear()}-${String(yarin.getMonth() + 1).padStart(2, '0')}-${String(yarin.getDate()).padStart(2, '0')}`;
    kok.querySelector('#odev-id').value = o?.id || '';
    kok.querySelector('#odev-baslik').value = o?.baslik || '';
    kok.querySelector('#odev-ders').value = o?.ders || '';
    kok.querySelector('#odev-teslim').value = o?.teslim || varsayilan;
    kok.querySelector('#odev-aciklama').value = o?.aciklama || '';
    kok.querySelector('#odev-form-baslik').textContent = o ? 'Ödevi düzenle' : 'Yeni ödev';
    kok.querySelector('#odev-kaydet').textContent = o ? 'Kaydet' : 'Ödevi ver';
    const panel = kok.querySelector('#odev-form-panel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    kok.querySelector('#odev-baslik').focus({ preventScroll: true });
}
const formuKapat = () => { kok.querySelector('#odev-form-panel').hidden = true; };

async function kaydet(e) {
    e.preventDefault();
    const id = kok.querySelector('#odev-id').value;
    const v = {
        baslik: kok.querySelector('#odev-baslik').value.trim(),
        ders: kok.querySelector('#odev-ders').value.trim(),
        teslim: kok.querySelector('#odev-teslim').value,
        aciklama: kok.querySelector('#odev-aciklama').value.trim(),
    };
    if (!v.baslik || !v.teslim) return;
    if (!id) v.verilis = bugun();
    const dugme = kok.querySelector('#odev-kaydet');
    dugme.disabled = true;
    try {
        const sonuc = id ? await db.update(KALEMLER, id, v) : await db.add(KALEMLER, v);
        formuKapat();
        veri = await verileriGetir();
        ciz(sonuc.id);
    } catch (err) { alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin'); }
    dugme.disabled = false;
}

async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    const islem = d.dataset.islem;
    if (islem === 'yeni') return formuAc();
    if (islem === 'vazgec') return formuKapat();
    if (islem === 'geri') return listeyeDon();
    if (islem === 'isaretle') return isaretle(d);
    if (islem === 'herkes') return herkesYapti(d);
    if (islem === 'yazdir') return yazdirKontrol();
    const o = veri.odevler.find(x => x.id === d.closest('[data-id]')?.dataset.id);
    if (!o) return;
    if (islem === 'kontrol') return kontrolAc(o.id);
    if (islem === 'duzenle') return formuAc(o);
    if (islem === 'sil') {
        if (!confirm(`"${o.baslik}" ödevi silinsin mi? Kimin yaptığı bilgisi de görünmez olur`)) return;
        await db.delete(KALEMLER, o.id);
        veri.odevler = veri.odevler.filter(x => x.id !== o.id);
        ciz();
    }
}

function yazdirKontrol() {
    const o = veri.odevler.find(x => x.id === seciliId);
    if (!o) return;
    yazdir(`${o.baslik}${o.ders ? ` (${o.ders})` : ''}`, `
        <p style="margin-bottom:12px;color:#5e554a">${esc(teslimMetni(o))}</p>
        <table><thead><tr><th style="width:40px">Sıra</th><th>Öğrenci</th><th>Durum</th></tr></thead>
        <tbody>${veri.ogrenciler.map((g, i) => `<tr><td>${i + 1}</td><td>${esc(g.name)}</td><td>${durumBilgi(durumAl(veri.harita, g.id, o.id))?.ad || ''}</td></tr>`).join('')}</tbody></table>`);
}
