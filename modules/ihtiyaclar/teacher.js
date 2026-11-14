// İhtiyaçlar — öğretmen: malzeme listesi ve kim getirdi tablosu (hücreye dokununca işaretlenir)
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, yazdir } from '../../js/arayuz.js';
import { oynat } from '../../js/hareket.js';
import { KALEMLER, MATRIS, GETIRDI, verileriGetir, durum, getirdiMi, deger, kalemOzeti, ilerlemeHtml, kalemAdi } from './ortak.js';

let kok, veri, sadeceEksik = false;

export async function render(container) {
    container.innerHTML = `<div id="ihtiyac-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'İhtiyaçlar',
            aciklama: 'Malzemeyi getiren öğrencinin kutusuna dokunun. Veliler sadece listeyi ve kaç kişinin getirdiğini görür',
            eylemler: `${await gorunurlukAnahtari('ihtiyaclar')}<button type="button" class="btn btn-secondary" data-islem="yazdir"><i class="fas fa-print"></i>Yazdır</button>`,
        })}
        <section class="panel">
            <div class="panel-ust"><h2>Malzemeler</h2></div>
            <div id="kalem-liste"></div>
            <form id="form-kalem" class="satir satir-form" autocomplete="off">
                <input type="text" id="yeni-kalem" placeholder="Yeni malzeme: peçete, A4 kâğıdı" aria-label="Yeni malzeme" maxlength="60">
                <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i>Ekle</button>
            </form>
        </section>
        <section class="panel" id="tablo-panel">
            <div class="panel-ust">
                <h2>Kim getirdi</h2>
                <label class="anahtar"><input type="checkbox" id="sadece-eksik"><span class="anahtar-iz" aria-hidden="true"></span><span>Sadece eksiği olanlar</span></label>
            </div>
            <div class="ihtiyac-tablo-kap" id="ihtiyac-tablo"></div>
        </section>`;
    baglaGorunurlukAnahtari('ihtiyaclar');
    kok.addEventListener('click', tikla);
    kok.querySelector('#form-kalem').addEventListener('submit', kalemEkle);
    kok.querySelector('#sadece-eksik').addEventListener('change', (e) => { sadeceEksik = e.target.checked; tabloCiz(); });
    veri = await verileriGetir();
    ciz();
}

function ciz() { kalemleriCiz(); tabloCiz(); }

function kalemleriCiz() {
    const { kalemler, ogrenciler, harita } = veri;
    kok.querySelector('#kalem-liste').innerHTML = kalemler.map(k => `
        <div class="satir" data-kalem-satir="${esc(k.id)}">
            <span class="satir-ad">${kalemAdi(k)}</span>
            ${ilerlemeHtml(kalemOzeti(k, ogrenciler, harita), ogrenciler.length)}
            <button type="button" class="ikon-dugme tehlike" data-islem="kalem-sil" data-id="${esc(k.id)}" aria-label="${kalemAdi(k)} sil" title="Sil"><i class="fas fa-trash"></i></button>
        </div>`).join('') || '<p class="bos-not">Henüz malzeme eklenmedi</p>';
}

function hucre(o, k) {
    const d = deger(veri.harita, o.id, k.id);
    const t = durum(d);
    const yazi = t === 'not' ? esc(d) : t === 'devamsiz' ? 'Devamsız' : '';
    return `<td><button type="button" class="ihtiyac-hucre ${t}" data-islem="isaretle" data-ogr="${esc(o.id)}" data-kalem="${esc(k.id)}"
        aria-pressed="${getirdiMi(d)}" aria-label="${esc(o.name)}, ${kalemAdi(k)}">${t === 'getirdi' ? '<i class="fas fa-check"></i>' : yazi}</button></td>`;
}

function tabloCiz() {
    const { kalemler, ogrenciler, harita } = veri;
    const alan = kok.querySelector('#ihtiyac-tablo');
    if (!kalemler.length || !ogrenciler.length) {
        alan.innerHTML = `<p class="bos-not">${!kalemler.length ? 'Önce yukarıdan malzeme ekleyin' : 'Henüz öğrenci yok'}</p>`;
        return;
    }
    const eksikSayisi = (o) => kalemler.filter(k => !getirdiMi(deger(harita, o.id, k.id))).length;
    const liste = sadeceEksik ? ogrenciler.filter(o => eksikSayisi(o) > 0) : ogrenciler;
    alan.innerHTML = liste.length ? `
        <table class="ihtiyac-tablo">
            <thead><tr><th scope="col">Öğrenci</th>${kalemler.map(k => `<th scope="col">${kalemAdi(k)}</th>`).join('')}</tr></thead>
            <tbody>${liste.map(o => `
                <tr data-ogr-satir="${esc(o.id)}">
                    <th scope="row"><span>${esc(o.name)}</span>${o.okulno ? `<small>${esc(o.okulno)}</small>` : ''}</th>
                    ${kalemler.map(k => hucre(o, k)).join('')}
                </tr>`).join('')}
            </tbody>
        </table>` : '<p class="bos-not">Herkes her şeyi getirdi</p>';
}

async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    if (d.dataset.islem === 'yazdir') return yazdirListe();
    if (d.dataset.islem === 'kalem-sil') return kalemSil(d.dataset.id);
    if (d.dataset.islem === 'isaretle') return isaretle(d);
}

async function isaretle(d) {
    const { ogr, kalem } = d.dataset;
    const anahtar = `${ogr}_${kalem}`;
    const eski = veri.harita.get(anahtar) || '';
    if (durum(eski) === 'not' && !confirm(`Bu kutuda "${eski}" notu var. Silinsin mi?`)) return;
    const yeni = getirdiMi(eski) || durum(eski) === 'devamsiz' ? '' : GETIRDI;
    veri.harita.set(anahtar, yeni);
    const o = veri.ogrenciler.find(x => x.id === ogr), k = veri.kalemler.find(x => x.id === kalem);
    d.closest('td').outerHTML = hucre(o, k);
    if (yeni) oynat(kok.querySelector(`[data-ogr="${CSS.escape(ogr)}"][data-kalem="${CSS.escape(kalem)}"] i`), 'zipla');
    kalemleriCiz();
    try {
        await db.saveMatrixStatus(MATRIS, ogr, kalem, yeni);
    } catch (err) {
        veri.harita.set(anahtar, eski);
        ciz();
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
}

async function kalemEkle(e) {
    e.preventDefault();
    const girdi = kok.querySelector('#yeni-kalem');
    const ad = girdi.value.trim();
    if (!ad) return;
    if (veri.kalemler.some(k => k.ad.toLocaleLowerCase('tr-TR') === ad.toLocaleLowerCase('tr-TR'))) { alert(`"${ad}" zaten listede`); return; }
    girdi.disabled = true;
    try {
        veri.kalemler.push(await db.add(KALEMLER, { ad }));
        girdi.value = '';
        ciz();
    } catch (err) { alert('Kaydedilemedi, tekrar deneyin'); }
    girdi.disabled = false;
    girdi.focus();
}

async function kalemSil(id) {
    const k = veri.kalemler.find(x => x.id === id);
    if (!k || !confirm(`"${k.ad}" listeden silinsin mi? Kimin getirdiği bilgisi de kaybolur`)) return;
    await db.delete(KALEMLER, id);
    veri.kalemler = veri.kalemler.filter(x => x.id !== id);
    ciz();
}

function yazdirListe() {
    const { kalemler, ogrenciler, harita } = veri;
    if (!kalemler.length) return alert('Yazdırılacak malzeme yok');
    yazdir('Sınıf ihtiyaç listesi', `
        <table>
            <thead><tr><th>No</th><th>Öğrenci</th>${kalemler.map(k => `<th style="text-align:center">${kalemAdi(k)}</th>`).join('')}</tr></thead>
            <tbody>${ogrenciler.map(o => `<tr><td>${esc(o.okulno || '')}</td><td>${esc(o.name)}</td>${kalemler.map(k => {
                const d = deger(harita, o.id, k.id); const t = durum(d);
                return `<td style="text-align:center">${t === 'getirdi' ? '✓' : t === 'bekliyor' ? '' : esc(d)}</td>`;
            }).join('')}</tr>`).join('')}</tbody>
            <tfoot><tr><th></th><th>Getiren</th>${kalemler.map(k => `<th style="text-align:center">${sayi(kalemOzeti(k, ogrenciler, harita))}/${sayi(ogrenciler.length)}</th>`).join('')}</tr></tfoot>
        </table>`);
}
