// Tahta araçları — öğretmen: kura çekme, geri sayım sayacı, rastgele grup oluşturma.
// "Bugün gelmeyenler" aynı zamanda günün yoklamasıdır: veritabanına yazılır (bkz. yoklama.js), gelişim raporunda devamsızlık olarak görünür.
// Gelmeyenler kura ve gruplara katılmaz.
import { db } from '../../js/db.js';
import { bugunTarihi, gunuGetir, gunuKaydet } from './yoklama.js';
import { esc, sayi, modulBasligi, sekmeler, baglaSekmeler, yazdir } from '../../js/arayuz.js';
import { oynat, kutla, hareketAz } from '../../js/hareket.js';

const TAKIMLAR = [['🦁', 'Aslanlar'], ['🦅', 'Kartallar'], ['🐬', 'Yunuslar'], ['🐝', 'Arılar'], ['🐼', 'Pandalar'], ['🦊', 'Tilkiler'],
    ['🦉', 'Baykuşlar'], ['🐢', 'Kaplumbağalar'], ['🐸', 'Kurbağalar'], ['🦋', 'Kelebekler'], ['🐧', 'Penguenler'], ['🐿️', 'Sincaplar']];
const SURELER = [1, 2, 3, 5, 10, 15];

let kok, ogrenciler = [], gelmeyen = new Set(), cikanlar = [], kuraDonuyor = false;
let yoklamaAlindi = false, kayitSirasi = Promise.resolve(), kayitHatasi = false;
let sayac = { toplam: 300, kalan: 300, bitis: null, zaman: null };
let grup = { tur: 'sayi', deger: 4, sonuc: [] };

// ---------------------------------------------------------------- küçük yardımcılar
const karistir = (d) => { const a = [...d]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const bugunAnahtar = () => `gelmeyenler-${bugunTarihi()}`; // internet yokken yedek
function gelmeyenleriOku() { try { return new Set(JSON.parse(localStorage.getItem(bugunAnahtar())) || []); } catch { return new Set(); } }
function gelmeyenleriYaz() { try { localStorage.setItem(bugunAnahtar(), JSON.stringify([...gelmeyen])); } catch { } }
const gelenler = () => ogrenciler.filter(o => !gelmeyen.has(o.id));
const ilkAd = (ad) => String(ad || '').trim();

let ses = null;
function nota(f, gecikme = 0, sure = 0.12, guc = 0.08) {
    try {
        ses = ses || new (window.AudioContext || window.webkitAudioContext)();
        if (ses.state === 'suspended') ses.resume();
        const t = ses.currentTime + gecikme, o = ses.createOscillator(), g = ses.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(guc, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
        o.connect(g); g.connect(ses.destination); o.start(t); o.stop(t + sure + 0.02);
    } catch { /* ses yoksa sessiz devam */ }
}

// ---------------------------------------------------------------- iskelet
export async function render(container) {
    container.innerHTML = `<div id="arac-kok"></div>`;
    kok = container.firstElementChild;
    ogrenciler = (await db.getAll('users')).filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    // Bugünün yoklaması kayıtlıysa o; değilse bu cihazdaki yedek
    const kayit = await gunuGetir().catch(() => null);
    yoklamaAlindi = !!kayit;
    gelmeyen = kayit ? new Set((kayit.gelmeyenler || []).filter(id => ogrenciler.some(o => o.id === id))) : gelmeyenleriOku();
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Tahta araçları',
            aciklama: 'Akıllı tahtada kura çekin, süre tutun, grupları oluşturun',
            eylemler: '<button type="button" class="btn btn-secondary" data-islem="tam-ekran"><i class="fas fa-expand"></i>Tam ekran</button>',
        })}
        <details class="panel acilir-panel" id="gelmeyen-panel"${gelmeyen.size ? ' open' : ''}>
            <summary class="panel-ust"><h2>Bugünün yoklaması</h2><small id="gelmeyen-ozet"></small></summary>
            <div class="panel-ic"><p class="arac-not" style="margin-bottom:12px">Gelmeyenlere dokunun; seçim kendiliğinden kaydedilir ve gelişim raporunda devamsızlık olarak görünür. Gelmeyenler kura ve gruplara katılmaz</p><div class="ad-cipleri" id="gelmeyen-liste"></div>
                <div class="yoklama-durum" id="yoklama-durum" role="status"></div></div>
        </details>
        ${sekmeler([{ id: 'a-kura', ad: 'Kura çek' }, { id: 'a-sayac', ad: 'Sayaç' }, { id: 'a-grup', ad: 'Gruplar' }], 'a-kura')}
        <div id="view-a-kura"></div>
        <div id="view-a-sayac" hidden></div>
        <div id="view-a-grup" hidden></div>`;
    baglaSekmeler(kok.querySelector(':scope > .sekmeler'));
    kok.addEventListener('click', tikla);
    gelmeyenleriCiz();
    kuraCiz();
    sayacCiz();
    grupCiz();
}

function gelmeyenleriCiz() {
    kok.querySelector('#gelmeyen-ozet').textContent = gelmeyen.size ? `${sayi(gelmeyen.size)} öğrenci yok · ${sayi(gelenler().length)} kişi var` : `Herkes burada · ${sayi(ogrenciler.length)} kişi`;
    kok.querySelector('#gelmeyen-liste').innerHTML = ogrenciler.map(o =>
        `<button type="button" class="ad-cip" data-islem="gelmeyen" data-id="${esc(o.id)}" aria-pressed="${gelmeyen.has(o.id)}">${esc(o.name)}</button>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>';
    yoklamaDurumunuCiz();
}

function yoklamaDurumunuCiz(kaydediliyor = false) {
    const alan = kok.querySelector('#yoklama-durum');
    if (!alan || !ogrenciler.length) return;
    if (kaydediliyor) alan.innerHTML = '<span class="arac-not">Kaydediliyor</span>';
    else if (kayitHatasi) alan.innerHTML = '<span class="error">Yoklama kaydedilemedi. İnternet bağlantısını kontrol edip bir öğrenciye tekrar dokunun</span>';
    else if (yoklamaAlindi) alan.innerHTML = '<span class="yoklama-tamam"><i class="fas fa-circle-check"></i>Bugünün yoklaması kayıtlı</span>';
    else alan.innerHTML = '<button type="button" class="btn btn-secondary btn-kucuk" data-islem="yoklama-kaydet"><i class="fas fa-check"></i>Herkes burada, yoklamayı kaydet</button>';
}

// Art arda dokunuşlar sırayla yazılır; en son seçim kalır
function yoklamayiKaydet() {
    const liste = [...gelmeyen];
    yoklamaDurumunuCiz(true);
    kayitSirasi = kayitSirasi.then(() => gunuKaydet(liste)).then(
        () => { yoklamaAlindi = true; kayitHatasi = false; },
        (e) => { console.warn('Yoklama:', e); kayitHatasi = true; },
    ).then(() => yoklamaDurumunuCiz());
}

async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    const islem = d.dataset.islem;
    if (islem === 'tam-ekran') return tamEkran();
    if (islem === 'gelmeyen') {
        gelmeyen.has(d.dataset.id) ? gelmeyen.delete(d.dataset.id) : gelmeyen.add(d.dataset.id);
        gelmeyenleriYaz(); gelmeyenleriCiz(); yoklamayiKaydet();
        cikanlar = cikanlar.filter(id => !gelmeyen.has(id));
        if (!kuraDonuyor) kuraCiz();
        return;
    }
    if (islem === 'yoklama-kaydet') return yoklamayiKaydet();
    if (islem === 'kura') return kuraCek();
    if (islem === 'kura-sifirla') { cikanlar = []; return kuraCiz(); }
    if (islem === 'sure') { sayacDurdur(); sayac.toplam = sayac.kalan = +d.dataset.dk * 60; return sayacCiz(); }
    if (islem === 'sure-ekle') { const ek = +d.dataset.sn; sayac.toplam = Math.max(60, sayac.toplam + ek); sayac.kalan = Math.max(0, sayac.kalan + ek); if (sayac.bitis) sayac.bitis += ek * 1000; return sayacCiz(); }
    if (islem === 'sayac-baslat') return sayac.bitis ? sayacDurdur() : sayacBaslat();
    if (islem === 'sayac-sifirla') { sayacDurdur(); sayac.kalan = sayac.toplam; return sayacCiz(); }
    if (islem === 'grup-tur') { grup.tur = d.dataset.tur; return grupCiz(); }
    if (islem === 'grup-sayi') { grup.deger = Math.min(12, Math.max(2, grup.deger + +d.dataset.fark)); return grupCiz(); }
    if (islem === 'grup-olustur') return gruplariOlustur();
    if (islem === 'grup-yazdir') return gruplariYazdir();
}

function tamEkran() {
    const el = kok;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => alert('Bu tarayıcı tam ekranı desteklemiyor'));
}

// ---------------------------------------------------------------- KURA
function kuraCiz(secilen = null) {
    const kalan = gelenler().filter(o => !cikanlar.includes(o.id));
    const tekrarYok = kok.querySelector('#kura-tekrar')?.checked ?? true;
    kok.querySelector('#view-a-kura').innerHTML = `
        <section class="tahta arac-tahta">
            <div class="tahta-ust"><h2>Kura</h2><small>${tekrarYok ? `${sayi(kalan.length)} kişi kaldı` : `${sayi(gelenler().length)} kişi`}</small></div>
            <div class="kura-ad" id="kura-ad">${secilen ? esc(secilen.name) : kalan.length || !tekrarYok ? 'Kim çıkacak?' : 'Herkes çıktı'}</div>
            <div class="arac-eylem">
                <button type="button" class="btn arac-dev" data-islem="kura"${gelenler().length && (kalan.length || !tekrarYok) ? '' : ' disabled'}><i class="fas fa-shuffle"></i>Kura çek</button>
            </div>
        </section>
        <section class="panel">
            <div class="panel-ust">
                <h2>Çıkanlar</h2>
                <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <label class="anahtar"><input type="checkbox" id="kura-tekrar"${tekrarYok ? ' checked' : ''}><span class="anahtar-iz" aria-hidden="true"></span><span>Çıkan tekrar çıkmasın</span></label>
                    <button type="button" class="yazi-dugme" data-islem="kura-sifirla"${cikanlar.length ? '' : ' disabled'}><i class="fas fa-rotate-left"></i>Baştan başla</button>
                </span>
            </div>
            <div class="panel-ic"><div class="ad-cipleri">${cikanlar.map((id, i) => `<span class="ad-cip secili"><b>${i + 1}</b>${esc(ogrenciler.find(o => o.id === id)?.name || '')}</span>`).join('') || '<span class="arac-not">Henüz kimse çıkmadı</span>'}</div></div>
        </section>`;
    kok.querySelector('#kura-tekrar').addEventListener('change', () => kuraCiz());
}

function kuraCek() {
    if (kuraDonuyor) return;
    const tekrarYok = kok.querySelector('#kura-tekrar').checked;
    const havuz = gelenler().filter(o => !tekrarYok || !cikanlar.includes(o.id));
    if (!havuz.length) return;
    const secilen = havuz[Math.floor(Math.random() * havuz.length)];
    const bitir = () => {
        kuraDonuyor = false;
        if (tekrarYok || !cikanlar.includes(secilen.id)) cikanlar.push(secilen.id);
        kuraCiz(secilen);
        const ad = kok.querySelector('#kura-ad');
        ad.classList.add('cikti');
        oynat(ad, 'zipla');
        kutla(ad);
        [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.09, 0.25));
    };
    if (hareketAz() || havuz.length === 1) return bitir();
    kuraDonuyor = true;
    kok.querySelector('[data-islem="kura"]').disabled = true;
    const ad = kok.querySelector('#kura-ad');
    ad.classList.remove('cikti');
    // İsimler önce hızlı, sonra yavaşlayarak döner (yaklaşık 2,5 saniye)
    let bekleme = 45, i = Math.floor(Math.random() * havuz.length);
    const don = () => {
        if (!document.body.contains(ad)) { kuraDonuyor = false; return; }
        if (bekleme > 300) return bitir();
        i = (i + 1) % havuz.length;
        ad.textContent = ilkAd(havuz[i].name);
        nota(600 + (i % 5) * 40, 0, 0.04, 0.04);
        bekleme *= 1.12;
        setTimeout(don, bekleme);
    };
    don();
}

// ---------------------------------------------------------------- SAYAÇ
const ikiHane = (n) => String(n).padStart(2, '0');
function sayacCiz() {
    const alan = kok.querySelector('#view-a-sayac');
    const calisiyor = !!sayac.bitis;
    if (!alan.querySelector('.sayac-rakam')) {
        alan.innerHTML = `
            <section class="tahta arac-tahta">
                <div class="tahta-ust"><h2>Sayaç</h2><small id="sayac-durum"></small></div>
                <div class="sayac-rakam" id="sayac-rakam" role="timer" aria-live="off"></div>
                <div class="sayac-cubuk"><span id="sayac-cubuk"></span></div>
                <div class="arac-eylem">
                    <button type="button" class="btn btn-hayalet" data-islem="sure-ekle" data-sn="-60">−1 dk</button>
                    <button type="button" class="btn arac-dev" data-islem="sayac-baslat" id="sayac-baslat"></button>
                    <button type="button" class="btn btn-hayalet" data-islem="sure-ekle" data-sn="60">+1 dk</button>
                    <button type="button" class="btn btn-hayalet" data-islem="sayac-sifirla" title="Sıfırla" aria-label="Sıfırla"><i class="fas fa-rotate-left"></i></button>
                </div>
            </section>
            <div class="sure-secici">${SURELER.map(dk => `<button type="button" class="sekme" data-islem="sure" data-dk="${dk}">${dk} dk</button>`).join('')}</div>`;
    }
    const k = Math.max(0, Math.ceil(sayac.kalan));
    alan.querySelector('#sayac-rakam').textContent = `${ikiHane(Math.floor(k / 60))}:${ikiHane(k % 60)}`;
    alan.querySelector('#sayac-rakam').classList.toggle('az', k > 0 && k <= 10);
    alan.querySelector('#sayac-rakam').classList.toggle('bitti', k === 0);
    alan.querySelector('#sayac-cubuk').style.transform = `scaleX(${sayac.toplam ? k / sayac.toplam : 0})`;
    alan.querySelector('#sayac-baslat').innerHTML = calisiyor ? '<i class="fas fa-pause"></i>Duraklat' : k === 0 ? '<i class="fas fa-play"></i>Başlat' : `<i class="fas fa-play"></i>${k < sayac.toplam ? 'Devam' : 'Başlat'}`;
    alan.querySelector('#sayac-baslat').disabled = k === 0;
    alan.querySelector('#sayac-durum').textContent = k === 0 ? 'Süre doldu' : calisiyor ? 'Çalışıyor' : k < sayac.toplam ? 'Duraklatıldı' : `${Math.round(sayac.toplam / 60)} dakika`;
    alan.querySelectorAll('[data-islem="sure"]').forEach(b => b.setAttribute('aria-selected', +b.dataset.dk * 60 === sayac.toplam));
}

function sayacBaslat() {
    if (sayac.kalan <= 0) return;
    sayac.bitis = Date.now() + sayac.kalan * 1000;
    nota(660, 0, 0.1);
    clearInterval(sayac.zaman);
    sayac.zaman = setInterval(() => {
        if (!kok || !document.body.contains(kok)) { clearInterval(sayac.zaman); sayac.bitis = null; return; }
        const once = Math.ceil(sayac.kalan);
        sayac.kalan = Math.max(0, (sayac.bitis - Date.now()) / 1000);
        const simdi = Math.ceil(sayac.kalan);
        if (simdi !== once && simdi > 0 && simdi <= 5) nota(880, 0, 0.08, 0.05);
        if (sayac.kalan <= 0) { sayacDurdur(); sureDoldu(); }
        sayacCiz();
    }, 200);
    sayacCiz();
}
function sayacDurdur() {
    clearInterval(sayac.zaman);
    if (sayac.bitis) sayac.kalan = Math.max(0, (sayac.bitis - Date.now()) / 1000);
    sayac.bitis = null;
    sayacCiz();
}
function sureDoldu() {
    [784, 659, 784, 659, 1047].forEach((f, i) => nota(f, i * 0.18, 0.3, 0.12));
    const r = kok.querySelector('#sayac-rakam');
    oynat(r, 'zipla');
    kutla(r);
}

// ---------------------------------------------------------------- GRUPLAR
function grupCiz() {
    const n = gelenler().length;
    const grupSayisi = grup.tur === 'sayi' ? Math.min(grup.deger, n || 1) : Math.max(1, Math.round(n / grup.deger));
    kok.querySelector('#view-a-grup').innerHTML = `
        <section class="panel">
            <div class="panel-ic grup-ayar">
                <div class="sekmeler" style="margin:0">
                    <button type="button" class="sekme" data-islem="grup-tur" data-tur="sayi" aria-selected="${grup.tur === 'sayi'}">Grup sayısına göre</button>
                    <button type="button" class="sekme" data-islem="grup-tur" data-tur="kisi" aria-selected="${grup.tur === 'kisi'}">Kişi sayısına göre</button>
                </div>
                <div class="adimlayici">
                    <button type="button" class="ikon-dugme" data-islem="grup-sayi" data-fark="-1" aria-label="Azalt"><i class="fas fa-minus"></i></button>
                    <b>${grup.deger}</b><span>${grup.tur === 'sayi' ? 'grup' : 'kişilik gruplar'}</span>
                    <button type="button" class="ikon-dugme" data-islem="grup-sayi" data-fark="1" aria-label="Arttır"><i class="fas fa-plus"></i></button>
                </div>
                <small class="arac-not">${sayi(n)} öğrenci, ${sayi(grupSayisi)} grup</small>
                <span style="margin-left:auto;display:flex;gap:8px">
                    ${grup.sonuc.length ? '<button type="button" class="btn btn-secondary" data-islem="grup-yazdir"><i class="fas fa-print"></i>Yazdır</button>' : ''}
                    <button type="button" class="btn btn-primary" data-islem="grup-olustur"${n ? '' : ' disabled'}><i class="fas fa-shuffle"></i>${grup.sonuc.length ? 'Yeniden karıştır' : 'Grupları oluştur'}</button>
                </span>
            </div>
        </section>
        <div class="grup-izgara" id="grup-izgara">${grup.sonuc.map(g => `
            <section class="grup-kart" style="--g:${g.renk}">
                <h3><span aria-hidden="true">${g.ikon}</span>${g.ad}<small>${g.uyeler.length} kişi</small></h3>
                <ul>${g.uyeler.map(o => `<li>${esc(o.name)}</li>`).join('')}</ul>
            </section>`).join('')}</div>`;
}

function gruplariOlustur() {
    const liste = karistir(gelenler());
    if (!liste.length) return;
    const k = grup.tur === 'sayi' ? Math.min(grup.deger, liste.length) : Math.max(1, Math.round(liste.length / grup.deger));
    const takimlar = karistir(TAKIMLAR);
    const renkler = ['#2e6b4e', '#b45309', '#1d4ed8', '#be123c', '#7c3aed', '#0e7490', '#4d7c0f', '#c2410c', '#6d28d9', '#0f766e', '#a21caf', '#334155'];
    grup.sonuc = Array.from({ length: k }, (_, i) => ({ ikon: takimlar[i % takimlar.length][0], ad: takimlar[i % takimlar.length][1], renk: renkler[i % renkler.length], uyeler: [] }));
    liste.forEach((o, i) => grup.sonuc[i % k].uyeler.push(o));   // sırayla dağıt: gruplar en fazla 1 kişi farklı olur
    grupCiz();
    nota(523, 0, 0.12); nota(784, 0.1, 0.2);
    if (!hareketAz()) kok.querySelectorAll('.grup-kart').forEach((el, i) => { el.style.animationDelay = `${i * 60}ms`; el.classList.add('beliriyor'); });
}

function gruplariYazdir() {
    yazdir('Sınıf grupları', `<table><tbody>${grup.sonuc.map(g => `<tr><th style="width:180px">${g.ikon} ${esc(g.ad)}</th><td>${g.uyeler.map(o => esc(o.name)).join(', ')}</td></tr>`).join('')}</tbody></table>`);
}
