// Öğrenciler — öğretmen: sınıf listesi, ekle/düzenle/sil, Excel'den toplu ekleme, yazdırma.
// Gizli bilgiler (TC, şifre, not) tahtaya yansıtılırken görünmesin diye varsayılan olarak kapalıdır.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { noSirasi, adSirasi, ogrencileriAyir } from './ortak.js';
import { appConfig } from '../../js/config.js';
import { kullaniciAdiOner, sifreOner, yedekKullaniciAdi, satirCoz, girisKartlariniYazdir, DUZEN_ACIKLAMASI } from '../../js/girisBilgisi.js';

let kok, ogrenciler = [], siralama = 'no', arama = '', gizliAcik = false;

export async function render(container) {
    container.innerHTML = `<div id="ogrenci-kok"></div>`;
    kok = container.firstElementChild;
    gizliAcik = false;
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Öğrenciler',
            aciklama: 'Öğrenci eklediğinizde giriş hesabı kendiliğinden açılır. Veliler sadece ad ve okul numarasını görür; TC, şifre ve notlar sadece sizde',
            eylemler: `${await gorunurlukAnahtari('ogrenciler')}<button type="button" class="btn btn-secondary" data-islem="yazdir"><i class="fas fa-print"></i>Liste yazdır</button><button type="button" class="btn btn-secondary" data-islem="kartlar"><i class="fas fa-id-card"></i>Giriş kartları</button><button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-user-plus"></i>Öğrenci ekle</button>`,
        })}
        <div class="kurulum-bilgi duzen-bilgi"><i class="fas fa-key"></i><div><small>Giriş bilgisi düzeni</small><strong>${esc(DUZEN_ACIKLAMASI)}</strong></div></div>
        <div id="ogr-sonuc"></div>
        <section class="panel" id="ogr-form-panel" hidden>
            <div class="panel-ust"><h2 id="ogr-form-baslik">Yeni öğrenci</h2></div>
            <form id="form-ogr" class="panel-ic" autocomplete="off">
                <input type="hidden" id="ogr-id">
                <div class="form-group"><label for="ogr-ad">Ad soyad</label><input type="text" id="ogr-ad" required></div>
                <div class="form-ikili">
                    <div class="form-group"><label for="ogr-okulno">Okul numarası</label><input type="text" id="ogr-okulno" inputmode="numeric"></div>
                    <div class="form-group"><label for="ogr-tcno">TC kimlik no</label><input type="text" id="ogr-tcno" inputmode="numeric" maxlength="11"></div>
                    <div class="form-group"><label for="ogr-kullanici">Kullanıcı adı <small style="font-weight:400;color:var(--muted)">kendiliğinden</small></label><input type="text" id="ogr-kullanici" autocapitalize="none" spellcheck="false" required></div>
                    <div class="form-group"><label for="ogr-sifre">Şifre <small style="font-weight:400;color:var(--muted)">kendiliğinden</small></label>
                        <div class="satir-form"><input type="text" id="ogr-sifre" autocapitalize="none" spellcheck="false" required><button type="button" class="ikon-dugme" data-islem="sifre-yenile" title="Yeni şifre öner" aria-label="Yeni şifre öner"><i class="fas fa-rotate"></i></button></div></div>
                </div>
                <div class="form-group"><label for="ogr-ozellik">Öğretmen notu <small style="font-weight:400;color:var(--muted)">veli telefonu vb., öğrenci görmez</small></label><input type="text" id="ogr-ozellik"></div>
                <p class="error" id="ogr-hata" role="alert"></p>
                <div class="form-eylem">
                    <button type="submit" class="btn btn-primary" id="ogr-kaydet">Ekle</button>
                    <button type="button" class="btn btn-secondary" data-islem="vazgec">Vazgeç</button>
                </div>
            </form>
        </section>
        <details class="panel acilir-panel" id="toplu-panel">
            <summary class="panel-ust"><h2>Listeden toplu ekle</h2><small>Sadece isimler yeter</small></summary>
            <form id="form-toplu" class="panel-ic">
                <p style="color:var(--text-2);margin-bottom:12px">Her satıra bir öğrenci yazın ya da Excel'den yapıştırın: ad soyad, isterseniz yanına okul numarası ve TC. Kullanıcı adı ve şifre kendiliğinden oluşur</p>
                <textarea id="toplu-girdi" rows="5" spellcheck="false" style="font-size:14px;white-space:pre;overflow-x:auto" placeholder="Ali Yılmaz&#9;101&#10;Ayşe Demir&#9;102&#10;Mehmet Kaya"></textarea>
                <div id="toplu-tablo"></div>
                <p id="toplu-onizleme" style="color:var(--muted);font-size:14px;margin:8px 0 12px"></p>
                <button type="submit" class="btn btn-primary" id="toplu-kaydet" disabled>Ekle</button>
                <div id="toplu-sonuc"></div>
            </form>
        </details>
        <section class="panel">
            <div class="panel-ust">
                <h2>Sınıf listesi <small id="ogr-sayi" style="font-weight:400"></small></h2>
                <div class="liste-arac">
                    <input type="search" id="ogr-ara" placeholder="Ara" aria-label="Öğrenci ara">
                    <select id="ogr-siralama" aria-label="Sıralama"><option value="no">Okul numarasına göre</option><option value="ad">Ada göre</option></select>
                    <label class="anahtar"><input type="checkbox" id="gizli-goster"><span class="anahtar-iz" aria-hidden="true"></span><span>TC ve şifreleri göster</span></label>
                </div>
            </div>
            <div id="ogr-liste"></div>
        </section>`;
    baglaGorunurlukAnahtari('ogrenciler');
    kok.addEventListener('click', tikla);
    kok.querySelector('#form-ogr').addEventListener('submit', kaydet);
    kok.querySelector('#ogr-ad').addEventListener('input', kullaniciOner);
    kok.querySelector('#ogr-okulno').addEventListener('input', kullaniciOner);
    kok.querySelector('#ogr-kullanici').addEventListener('input', (e) => { e.target.dataset.elle = '1'; });
    kok.querySelector('#form-toplu').addEventListener('submit', topluEkle);
    kok.querySelector('#toplu-girdi').addEventListener('input', onizle);
    kok.querySelector('#ogr-ara').addEventListener('input', (e) => { arama = e.target.value; listeyiCiz(); });
    kok.querySelector('#ogr-siralama').value = siralama;
    kok.querySelector('#ogr-siralama').addEventListener('change', (e) => { siralama = e.target.value; listeyiCiz(); });
    kok.querySelector('#gizli-goster').addEventListener('change', (e) => { gizliAcik = e.target.checked; listeyiCiz(); });
    await yenile();
}

async function yenile(isaretle) {
    ogrenciler = ogrencileriAyir(await db.getAll('users'));
    listeyiCiz(isaretle);
}

const kucuk = (s) => String(s || '').toLocaleLowerCase('tr-TR');

function listeyiCiz(isaretle) {
    const a = kucuk(arama.trim());
    const liste = ogrenciler.filter(o => !a || kucuk(o.name).includes(a) || kucuk(o.okulno).includes(a) || kucuk(o.username).includes(a))
        .sort(siralama === 'ad' ? adSirasi : noSirasi);
    kok.querySelector('#ogr-sayi').textContent = ogrenciler.length ? `· ${sayi(ogrenciler.length)}` : '';
    kok.querySelector('#ogr-liste').innerHTML = liste.map(o => `
        <div class="ogr-kayit" data-id="${esc(o.id)}">
            <span class="ders-no" title="Okul numarası">${esc(o.okulno || '–')}</span>
            <span class="ogr-ad"><strong>${esc(o.name)}</strong><small>Kullanıcı adı: ${esc(o.username || '–')}</small></span>
            <span class="ogr-gizli">${gizliAcik ? `
                <span><small>TC</small>${esc(o.tcno || '–')}</span>
                <span><small>Şifre</small>${esc(o.password || '–')}</span>
                ${o.ozellik ? `<span class="not"><small>Not</small>${esc(o.ozellik)}</span>` : ''}` : ''}
            </span>
            <span class="satir-eylem">
                <button type="button" class="ikon-dugme" data-islem="kart" title="Giriş kartını yazdır" aria-label="${esc(o.name)} giriş kartı"><i class="fas fa-id-card"></i></button>
                <button type="button" class="ikon-dugme" data-islem="duzenle" title="Düzenle" aria-label="${esc(o.name)} düzenle"><i class="fas fa-pen"></i></button>
                <button type="button" class="ikon-dugme tehlike" data-islem="sil" title="Sil" aria-label="${esc(o.name)} sil"><i class="fas fa-trash"></i></button>
            </span>
        </div>`).join('') || `<p class="bos-not">${ogrenciler.length ? 'Aramaya uyan öğrenci yok' : 'Henüz öğrenci yok. Sağ üstten ekleyebilir ya da Excel\'den toplu ekleyebilirsiniz'}</p>`;
    if (isaretle) kaydedildiIsareti(kok.querySelector(`.ogr-kayit[data-id="${CSS.escape(isaretle)}"]`));
}

// ---------------------------------------------------------------- Tek öğrenci formu
const ALANLAR = { name: 'ogr-ad', okulno: 'ogr-okulno', tcno: 'ogr-tcno', username: 'ogr-kullanici', password: 'ogr-sifre', ozellik: 'ogr-ozellik' };

function formuAc(o = null) {
    kok.querySelector('#ogr-id').value = o?.id || '';
    Object.entries(ALANLAR).forEach(([k, id]) => { kok.querySelector(`#${id}`).value = o?.[k] || ''; });
    kok.querySelector('#ogr-form-baslik').textContent = o ? `${o.name} bilgileri` : 'Yeni öğrenci';
    kok.querySelector('#ogr-kaydet').textContent = o ? 'Kaydet' : 'Ekle';
    kok.querySelector('#ogr-hata').textContent = '';
    kok.querySelector('#ogr-kullanici').dataset.elle = o ? '1' : '';
    if (!o) kok.querySelector('#ogr-sifre').value = sifreOner();
    const panel = kok.querySelector('#ogr-form-panel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    kok.querySelector('#ogr-ad').focus({ preventScroll: true });
}
const formuKapat = () => { kok.querySelector('#ogr-form-panel').hidden = true; };

// Yeni öğrencide ad ve okul numarası yazıldıkça kullanıcı adı önerilir (öğretmen elle değiştirdiyse dokunulmaz)
function kullaniciOner() {
    const k = kok.querySelector('#ogr-kullanici');
    if (k.dataset.elle || kok.querySelector('#ogr-id').value) return;
    const kullanilan = new Set(ogrenciler.map(o => kucuk(o.username)));
    k.value = kok.querySelector('#ogr-ad').value.trim() ? kullaniciAdiOner(kok.querySelector('#ogr-ad').value, kok.querySelector('#ogr-okulno').value, kullanilan) : '';
}

// Başka sınıfta aynı kullanıcı adı varsa sonuna harf eklenerek tekrar denenir
async function hesapliEkle(veri) {
    for (let deneme = 0; deneme < 5; deneme++) {
        const kullanici = deneme ? yedekKullaniciAdi(veri.username, deneme) : veri.username;
        try { return await db.add('users', { ...veri, username: kullanici, role: 'student' }); }
        catch (e) { if (!/kullanıcı adı/i.test(e.message) || deneme === 4) throw e; }
    }
}

function sonucGoster(eklenenler) {
    const alan = kok.querySelector('#ogr-sonuc');
    if (!eklenenler.length) { alan.innerHTML = ''; return; }
    alan.innerHTML = `
        <section class="panel sonuc-panel">
            <div class="panel-ust"><h2><i class="fas fa-circle-check" style="color:var(--primary);margin-right:6px"></i>${sayi(eklenenler.length)} öğrencinin hesabı açıldı</h2>
                <span style="display:flex;gap:8px"><button type="button" class="btn btn-primary btn-kucuk" data-islem="yeni-kartlar"><i class="fas fa-id-card"></i>Kartlarını yazdır</button><button type="button" class="ikon-dugme" data-islem="sonuc-kapat" aria-label="Kapat"><i class="fas fa-xmark"></i></button></span></div>
            ${eklenenler.map(o => `<div class="satir"><span class="satir-ad">${esc(o.name)}</span><span class="giris-bilgi"><small>Kullanıcı adı</small><b>${esc(o.username)}</b></span><span class="giris-bilgi"><small>Şifre</small><b>${esc(o.password)}</b></span></div>`).join('')}
        </section>`;
    alan.dataset.idler = eklenenler.map(o => o.id).join(',');
}

const adAlinmis = (kullanici, haricId) => ogrenciler.some(o => o.id !== haricId && kucuk(o.username) === kucuk(kullanici));

async function kaydet(e) {
    e.preventDefault();
    const id = kok.querySelector('#ogr-id').value;
    const v = Object.fromEntries(Object.entries(ALANLAR).map(([k, alan]) => [k, kok.querySelector(`#${alan}`).value.trim()]));
    const hata = kok.querySelector('#ogr-hata');
    if (v.tcno && !/^\d{11}$/.test(v.tcno)) { hata.textContent = 'TC kimlik numarası 11 rakam olmalı'; return; }
    if (/\s/.test(v.username)) { hata.textContent = 'Kullanıcı adında boşluk olmasın'; return; }
    if (adAlinmis(v.username, id)) { hata.textContent = `"${v.username}" kullanıcı adı başka bir öğrencide var`; return; }
    const dugme = kok.querySelector('#ogr-kaydet');
    dugme.disabled = true;
    hata.textContent = '';
    try {
        const sonuc = id ? await db.update('users', id, v) : await hesapliEkle(v);
        formuKapat();
        await yenile(sonuc.id);
        if (!id) sonucGoster([{ ...v, ...sonuc }]);
    } catch (err) {
        hata.textContent = `Kaydedilemedi: ${err.message || 'bilinmeyen hata'}`;
    }
    dugme.disabled = false;
}

// ---------------------------------------------------------------- Toplu ekleme
let topluOneri = [];   // önizlemede gösterilen öneriler, eklerken aynısı kullanılır
function satirlariOku() {
    const kullanilan = new Set(ogrenciler.map(o => kucuk(o.username)));
    const eski = new Map(topluOneri.map(o => [`${o.name}|${o.okulno}`, o]));
    topluOneri = kok.querySelector('#toplu-girdi').value.split('\n').map(satirCoz).map((c, i) => {
        if (!c) return null;
        const once = eski.get(`${c.ad}|${c.okulno}`);
        const username = c.kullanici || (once && !kullanilan.has(kucuk(once.username)) ? (kullanilan.add(kucuk(once.username)), once.username) : kullaniciAdiOner(c.ad, c.okulno, kullanilan));
        return { satir: i + 1, name: c.ad, tcno: c.tcno, okulno: c.okulno, username, password: c.sifre || once?.password || sifreOner() };
    }).filter(Boolean);
    return topluOneri;
}
function sorun(k, gorulen) {
    if (!k.name || !k.username || !k.password) return 'ad eksik';
    if (/\s/.test(k.username)) return 'kullanıcı adında boşluk var';
    if (adAlinmis(k.username) || gorulen.has(kucuk(k.username))) return `"${k.username}" kullanıcı adı zaten var`;
    return '';
}
function onizle() {
    const satirlar = satirlariOku();
    const gorulen = new Set();
    const hatali = satirlar.filter(k => { const s = sorun(k, gorulen); gorulen.add(kucuk(k.username)); return s; }).length;
    kok.querySelector('#toplu-tablo').innerHTML = satirlar.length ? `
        <div class="kurulum-tablo-kap" style="margin-top:12px"><table class="kurulum-ogrenci">
            <thead><tr><th>Ad soyad</th><th>Okul no</th><th>Kullanıcı adı</th><th>Şifre</th></tr></thead>
            <tbody>${satirlar.map(k => `<tr><td style="padding:8px">${esc(k.name)}</td><td style="padding:8px">${esc(k.okulno)}</td><td style="padding:8px;font-family:ui-monospace,monospace">${esc(k.username)}</td><td style="padding:8px;font-family:ui-monospace,monospace">${esc(k.password)}</td></tr>`).join('')}</tbody>
        </table></div>` : '';
    kok.querySelector('#toplu-onizleme').textContent = satirlar.length ? `${sayi(satirlar.length)} satır okundu${hatali ? `, ${sayi(hatali)} tanesi eklenemeyecek` : ''}` : '';
    const dugme = kok.querySelector('#toplu-kaydet');
    dugme.disabled = satirlar.length === hatali;
    dugme.textContent = satirlar.length - hatali > 0 ? `${sayi(satirlar.length - hatali)} öğrenciyi ekle` : 'Ekle';
}
async function topluEkle(e) {
    e.preventDefault();
    const satirlar = [...topluOneri];
    const dugme = kok.querySelector('#toplu-kaydet');
    dugme.disabled = true;
    const gorulen = new Set(), sorunlar = [], yeniler = [];
    let eklenen = 0;
    for (const k of satirlar) {
        const s = sorun(k, gorulen);
        gorulen.add(kucuk(k.username));
        if (s) { sorunlar.push(`${k.satir}. satır: ${s}`); continue; }
        dugme.textContent = `Ekleniyor ${sayi(eklenen + 1)}`;
        try {
            const { satir, ...veri } = k;
            const yeni = await hesapliEkle({ ...veri, ozellik: '' });
            ogrenciler.push(yeni);
            yeniler.push(yeni);
            eklenen++;
        } catch (err) { sorunlar.push(`${k.satir}. satır: ${err.message || 'eklenemedi'}`); }
    }
    kok.querySelector('#toplu-girdi').value = '';
    topluOneri = [];
    onizle();
    sonucGoster(yeniler);
    kok.querySelector('#toplu-sonuc').innerHTML = `
        <p style="margin-top:12px;font-weight:500;color:var(--primary)">${sayi(eklenen)} öğrenci eklendi</p>
        ${sorunlar.length ? `<ul class="sorun-liste">${sorunlar.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}`;
    await yenile();
}

// ---------------------------------------------------------------- Olaylar
async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    const islem = d.dataset.islem;
    if (islem === 'yeni') return formuAc();
    if (islem === 'vazgec') return formuKapat();
    if (islem === 'yazdir') return yazdirListe();
    if (islem === 'kartlar') return girisKartlariniYazdir([...ogrenciler].sort(siralama === 'ad' ? adSirasi : noSirasi), appConfig.sinifAdi);
    if (islem === 'yeni-kartlar') { const idler = (kok.querySelector('#ogr-sonuc').dataset.idler || '').split(','); return girisKartlariniYazdir(ogrenciler.filter(o => idler.includes(o.id)), appConfig.sinifAdi); }
    if (islem === 'sonuc-kapat') return sonucGoster([]);
    if (islem === 'sifre-yenile') { kok.querySelector('#ogr-sifre').value = sifreOner(); return; }
    const o = ogrenciler.find(x => x.id === d.closest('[data-id]')?.dataset.id);
    if (!o) return;
    if (islem === 'duzenle') return formuAc(o);
    if (islem === 'kart') return girisKartlariniYazdir([o], appConfig.sinifAdi);
    if (islem === 'sil') {
        if (!confirm(`${o.name} silinsin mi? Giriş hesabı da kapanır`)) return;
        d.disabled = true;
        try { await db.delete('users', o.id); }
        catch (err) { alert(`Silinemedi: ${err.message || 'bilinmeyen hata'}`); }
        await yenile();
    }
}

function yazdirListe() {
    const liste = [...ogrenciler].sort(siralama === 'ad' ? adSirasi : noSirasi);
    if (!liste.length) return alert('Yazdırılacak öğrenci yok');
    yazdir('Sınıf listesi', `
        <table><thead><tr><th style="width:40px">Sıra</th><th style="width:80px">Okul no</th><th>Ad soyad</th><th style="width:45%"></th></tr></thead>
        <tbody>${liste.map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.okulno || '')}</td><td>${esc(o.name)}</td><td></td></tr>`).join('')}</tbody></table>`);
}
