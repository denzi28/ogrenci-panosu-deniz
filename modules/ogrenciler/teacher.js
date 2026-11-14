// Öğrenciler — öğretmen: sınıf listesi, ekle/düzenle/sil, Excel'den toplu ekleme, yazdırma.
// Gizli bilgiler (TC, şifre, not) tahtaya yansıtılırken görünmesin diye varsayılan olarak kapalıdır.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { noSirasi, adSirasi, ogrencileriAyir } from './ortak.js';

let kok, ogrenciler = [], siralama = 'no', arama = '', gizliAcik = false;

export async function render(container) {
    container.innerHTML = `<div id="ogrenci-kok"></div>`;
    kok = container.firstElementChild;
    gizliAcik = false;
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Öğrenciler',
            aciklama: 'Veliler sadece ad ve okul numarasını görür. TC, şifre ve notlar sadece sizde',
            eylemler: `${await gorunurlukAnahtari('ogrenciler')}<button type="button" class="btn btn-secondary" data-islem="yazdir"><i class="fas fa-print"></i>Liste yazdır</button><button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-user-plus"></i>Öğrenci ekle</button>`,
        })}
        <section class="panel" id="ogr-form-panel" hidden>
            <div class="panel-ust"><h2 id="ogr-form-baslik">Yeni öğrenci</h2></div>
            <form id="form-ogr" class="panel-ic" autocomplete="off">
                <input type="hidden" id="ogr-id">
                <div class="form-group"><label for="ogr-ad">Ad soyad</label><input type="text" id="ogr-ad" required></div>
                <div class="form-ikili">
                    <div class="form-group"><label for="ogr-okulno">Okul numarası</label><input type="text" id="ogr-okulno" inputmode="numeric"></div>
                    <div class="form-group"><label for="ogr-tcno">TC kimlik no</label><input type="text" id="ogr-tcno" inputmode="numeric" maxlength="11"></div>
                    <div class="form-group"><label for="ogr-kullanici">Kullanıcı adı</label><input type="text" id="ogr-kullanici" autocapitalize="none" spellcheck="false" required></div>
                    <div class="form-group"><label for="ogr-sifre">Şifre</label><input type="text" id="ogr-sifre" autocapitalize="none" spellcheck="false" required></div>
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
            <summary class="panel-ust"><h2>Excel'den toplu ekle</h2><small>Ad soyad, TC, okul no, kullanıcı adı, şifre</small></summary>
            <form id="form-toplu" class="panel-ic">
                <p style="color:var(--text-2);margin-bottom:12px">Excel'de bu beş sütunu yan yana seçip kopyalayın ve aşağıya yapıştırın. Her satır bir öğrenci</p>
                <textarea id="toplu-girdi" rows="5" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:14px;white-space:pre;overflow-x:auto" placeholder="Ali Yılmaz&#9;12345678901&#9;1453&#9;ali&#9;1234"></textarea>
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
    const panel = kok.querySelector('#ogr-form-panel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    kok.querySelector('#ogr-ad').focus({ preventScroll: true });
}
const formuKapat = () => { kok.querySelector('#ogr-form-panel').hidden = true; };

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
        const sonuc = id ? await db.update('users', id, v) : await db.add('users', { ...v, role: 'student' });
        formuKapat();
        await yenile(sonuc.id);
    } catch (err) {
        hata.textContent = `Kaydedilemedi: ${err.message || 'bilinmeyen hata'}`;
    }
    dugme.disabled = false;
}

// ---------------------------------------------------------------- Toplu ekleme
function satirlariOku() {
    return kok.querySelector('#toplu-girdi').value.split('\n').map(s => s.trim()).filter(Boolean).map((s, i) => {
        const [name = '', tcno = '', okulno = '', username = '', password = ''] = s.split('\t').map(x => x.trim());
        return { satir: i + 1, name, tcno, okulno, username, password };
    });
}
function sorun(k, gorulen) {
    if (!k.name || !k.username || !k.password) return 'ad, kullanıcı adı ya da şifre eksik';
    if (/\s/.test(k.username)) return 'kullanıcı adında boşluk var';
    if (adAlinmis(k.username) || gorulen.has(kucuk(k.username))) return `"${k.username}" kullanıcı adı zaten var`;
    return '';
}
function onizle() {
    const satirlar = satirlariOku();
    const gorulen = new Set();
    const hatali = satirlar.filter(k => { const s = sorun(k, gorulen); gorulen.add(kucuk(k.username)); return s; }).length;
    kok.querySelector('#toplu-onizleme').textContent = satirlar.length ? `${sayi(satirlar.length)} satır okundu${hatali ? `, ${sayi(hatali)} tanesi eklenemeyecek` : ''}` : '';
    const dugme = kok.querySelector('#toplu-kaydet');
    dugme.disabled = satirlar.length === hatali;
    dugme.textContent = satirlar.length - hatali > 0 ? `${sayi(satirlar.length - hatali)} öğrenciyi ekle` : 'Ekle';
}
async function topluEkle(e) {
    e.preventDefault();
    const satirlar = satirlariOku();
    const dugme = kok.querySelector('#toplu-kaydet');
    dugme.disabled = true;
    const gorulen = new Set(), sorunlar = [];
    let eklenen = 0;
    for (const k of satirlar) {
        const s = sorun(k, gorulen);
        gorulen.add(kucuk(k.username));
        if (s) { sorunlar.push(`${k.satir}. satır: ${s}`); continue; }
        dugme.textContent = `Ekleniyor ${sayi(eklenen + 1)}`;
        try {
            const { satir, ...veri } = k;
            const yeni = await db.add('users', { ...veri, ozellik: '', role: 'student' });
            ogrenciler.push(yeni);
            eklenen++;
        } catch (err) { sorunlar.push(`${k.satir}. satır: ${err.message || 'eklenemedi'}`); }
    }
    kok.querySelector('#toplu-girdi').value = '';
    onizle();
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
    const o = ogrenciler.find(x => x.id === d.closest('[data-id]')?.dataset.id);
    if (!o) return;
    if (islem === 'duzenle') return formuAc(o);
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
