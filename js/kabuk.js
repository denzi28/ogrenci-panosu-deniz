// Sayfa iskeleti: üst bar, ana sayfa, bölüm menüsü. index.html, teacher.html ve student.html bunu kullanır.
// Kullanım:  kabukBaslat({ rol: 'guest' | 'teacher' | 'student' })
import { appConfig } from './config.js';
import { db } from './db.js';
import { initApp } from './app.js';
import { sinifBilgisi, aktifSinifId, ANA_SINIF } from './sinif.js';
import { girisOynat, sayilariSaydir } from './hareket.js';
import { gectiMi } from '../modules/etkinlikler/ortak.js';
import { gectiMi as odevGectiMi, teslimSirasi as odevSirasi } from '../modules/odevler/ortak.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GUN_ANAHTAR = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
const GUN_AD = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);

function kayitliKullanici() {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
}

function basHarfler(ad) {
    return String(ad || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('tr-TR');
}

export async function kabukBaslat({ rol }) {
    const icerik = document.getElementById('app-content');
    let kullanici = kayitliKullanici();

    // Panel sayfalarında yetki kontrolü (asıl koruma veritabanı kurallarındadır)
    if (rol !== 'guest' && (!kullanici || kullanici.role !== rol)) {
        location.replace('index.html');
        return;
    }

    const { auth } = rol !== 'guest' ? await import('./auth.js') : { auth: null };
    if (auth) kullanici = auth.currentUser || kullanici;

    // Hangi sınıf? Adı ve kurulum durumu sınıf kaydından gelir
    const sinif = await sinifBilgisi();
    if (!sinif) { bulunamadi(icerik); return; }
    if (sinif.ad) appConfig.sinifAdi = sinif.ad;
    document.querySelectorAll('.marka-rozet').forEach(el => { el.textContent = sinif.ad; el.classList.toggle('uzun', String(sinif.ad).length > 4); });
    document.title = rol === 'guest' ? `${sinif.ad} sınıfı · Sınıf Panosu` : document.title.replace(/3\/D/g, sinif.ad);
    if (rol === 'teacher' && sinif.varsayilan) anaSinifKaydiniOlustur();
    if (rol === 'teacher' && !sinif.kurulumBitti) { location.replace('kurulum.html'); return; }
    // Veli sayfasında sınıf adresi (?sinif=4a) iç linklerde kaybolmasın
    if (rol === 'guest' && location.search) document.querySelectorAll('a[href="index.html"]').forEach(a => { a.href = 'index.html' + location.search; });

    ustBariCiz(rol, kullanici, auth);

    // Misafir sadece velilere açık bölümleri görür. Öğretmen hepsini görür, kapalı olanlar işaretlenir.
    const gorunurlukler = {};
    if (rol !== 'student') {
        const sonuclar = await Promise.all(appConfig.modules.map(m => db.getModuleVisibility(m.id).catch(() => true)));
        appConfig.modules.forEach((m, i) => { gorunurlukler[m.id] = sonuclar[i]; });
    }
    const moduller = appConfig.modules
        .filter(m => !m.roller || m.roller.includes(rol))
        .filter(m => rol !== 'guest' || gorunurlukler[m.id]);

    const anaSayfa = () => anaSayfayiCiz(icerik, rol, kullanici, moduller, gorunurlukler);
    if (!location.hash) anaSayfa();

    window.addEventListener('hashchange', () => {
        if (!location.hash.substring(1)) {
            anaSayfa();
            document.querySelectorAll('#menu-container .menu-item').forEach(el => el.classList.toggle('aktif', el.dataset.module === ''));
        }
    });

    bolumMenusunuKur(moduller);
    await initApp(rol, { otomatikYonlendirme: false, gorunurModuller: moduller });
}

// Adresteki ?sinif= bir sınıfa ait değilse
function bulunamadi(icerik) {
    icerik.innerHTML = `<div class="panel" style="max-width:520px;margin:40px auto"><div class="panel-ic"><h2 style="margin-bottom:8px">Sınıf bulunamadı</h2><p style="color:var(--text-2)">Bu bağlantıdaki sınıf yok ya da kaldırılmış. Bağlantıyı sınıf öğretmeninizden tekrar isteyin.</p></div></div>`;
}

// Ana sınıfın (ilk kurulan sınıf) kaydı yoksa öğretmen ilk girdiğinde sessizce oluşturulur
async function anaSinifKaydiniOlustur() {
    if (aktifSinifId() !== ANA_SINIF) return;
    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { firestore } = await import('./firebase.js');
        await setDoc(doc(firestore, 'siniflar', ANA_SINIF), { ad: appConfig.sinifAdi, ana: true, kurulumBitti: true, olusturma: new Date().toISOString() }, { merge: true });
    } catch (e) { console.warn('Ana sınıf kaydı oluşturulamadı (kurallar güncel değil olabilir):', e.code || e); }
}

function ustBariCiz(rol, kullanici, auth) {
    const etiket = document.getElementById('rol-etiketi');
    const eylemler = document.getElementById('ust-eylemler');
    const temaDugmesi = `<button type="button" id="btn-tema" class="btn btn-secondary tema-dugme" aria-pressed="false" title="Görünümü değiştir: sade ya da renkli"><i class="fas fa-palette"></i><span class="gizle-tel">Renkli</span></button>`;
    if (etiket) etiket.textContent = { guest: `${appConfig.sinifAdi} sınıfı`, teacher: 'Öğretmen', student: 'Öğrenci' }[rol];

    if (rol === 'guest') {
        const k = kullanici;
        const panom = k && (k.role === 'teacher' || k.role === 'student');
        const hedef = panom ? (k.role === 'teacher' ? 'teacher.html' : 'student.html') : 'login.html';
        eylemler.innerHTML = temaDugmesi + (panom
            ? `<a class="btn btn-secondary" href="${hedef}">Panelim</a>`
            : `<a class="btn btn-primary" href="login.html">Giriş yap</a>`);
        temaDugmesiniBagla();
        const altGiris = document.getElementById('nav-giris');
        if (panom && altGiris) {
            altGiris.href = hedef;
            altGiris.innerHTML = '<i class="fas fa-user"></i><span>Panelim</span>';
        }
        return;
    }

    eylemler.innerHTML = `${temaDugmesi}
        <div class="kullanici-cip" title="${esc(kullanici?.name)}">
            <span class="avatar">${esc(basHarfler(kullanici?.name))}</span><span class="gizle-tel">${esc(kullanici?.name)}</span>
        </div>
        <button id="btn-logout" class="btn btn-secondary" title="Çıkış yap"><i class="fas fa-arrow-right-from-bracket"></i><span class="gizle-tel">Çıkış</span></button>`;
    document.getElementById('btn-logout').addEventListener('click', () => auth.logout());
    temaDugmesiniBagla();
}

// Sade / renkli görünüm (js/tema.js). Seçim bu cihazda hatırlanır.
function temaDugmesiniBagla() {
    const d = document.getElementById('btn-tema');
    if (!d || !window.gorunumTemasi) { d?.remove(); return; }
    const ciz = () => d.setAttribute('aria-pressed', window.gorunumTemasi.simdiki() === 'renkli');
    ciz();
    d.addEventListener('click', () => { window.gorunumTemasi.degistir(); ciz(); });
}

async function anaSayfayiCiz(icerik, rol, kullanici, moduller, gorunurlukler) {
    const tarih = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    const acik = (id) => moduller.some(m => m.id === id) && (rol !== 'guest' || gorunurlukler[id] !== false);

    const baslik = {
        guest:   { ust: tarih, h1: `${appConfig.sinifAdi} sınıfı`, alt: 'Duyurular, etkinlikler, ders programı ve sınıfın okuma ve davranış panoları' },
        teacher: { ust: tarih, h1: 'Öğretmen paneli', alt: '' },
        student: { ust: `Öğrenci paneli · ${tarih}`, h1: esc(kullanici?.name || 'Öğrenci'), alt: '' },
    }[rol];

    const bolumler = moduller.map(m => `
        <a href="#${m.id}" class="modul-kutu">
            <span class="modul-ikon"><i class="fas ${m.ikon}"></i></span>
            <span class="modul-yazi"><strong>${m.name}</strong><small>${m.aciklama || ''}</small></span>
            ${rol === 'teacher' && gorunurlukler[m.id] === false
                ? '<span class="modul-etiket" title="Velilere kapalı"><i class="fas fa-lock"></i><span class="gizle-tel">Velilere kapalı</span></span>'
                : '<i class="fas fa-chevron-right modul-ok"></i>'}
        </a>`).join('');

    const ilkAd = esc(String(kullanici?.name || 'Öğrenci').trim().split(/\s+/)[0]);
    icerik.innerHTML = `
        ${rol === 'student' ? `
        <header class="sayfa-baslik ogrenci-karsilama">
            <button type="button" class="avatar-sec" id="avatar-sec" aria-label="Avatarını seç">
                <span class="avatar-rozet bos" style="--boyut:72px" aria-hidden="true"></span>
                <span class="avatar-kalem" aria-hidden="true"><i class="fas fa-pen"></i></span>
            </button>
            <div>
                <small style="text-transform:none">${baslik.ust}</small>
                <h1>Merhaba ${ilkAd}!</h1>
                <p class="avatar-ipucu" hidden>Avatarını seçmek için resme dokun</p>
            </div>
        </header>
        <div id="hedef-alani"></div>` : `
        <header class="sayfa-baslik">
            <small style="text-transform:none">${baslik.ust}</small>
            <h1>${baslik.h1}</h1>
            ${baslik.alt ? `<p>${baslik.alt}</p>` : ''}
        </header>`}
        <div id="sayilar-alani"></div>
        <div class="ana-izgara" id="ana-izgara">
            <div id="tahta-alani"><div class="iskelet" style="height:200px"></div></div>
            <div id="bilgi-alani"><div class="iskelet" style="height:200px"></div></div>
        </div>
        <section>
            <div class="bolum-baslik"><h3>Bölümler</h3><small>${moduller.length}</small></div>
            ${moduller.length
                ? `<div class="modul-grid">${bolumler}</div>`
                : `<div class="card bos-durum">Şu an velilere açık bir bölüm yok</div>`}
        </section>`;
    girisOynat(icerik);
    if (rol === 'student') ogrenciKosesi(kullanici);

    // Veriler paralel ve birbirinden bağımsız yüklenir; biri başarısız olursa diğerleri yine görünür.
    const getir = (tablo, sadeceAcik = false) => (sadeceAcik ? db.getPublic(tablo) : db.getAll(tablo)).catch(() => []);
    const [dersler, beslenme, etkinlikler, duyurular, odevler] = await Promise.all([
        acik('program') ? getir('ders_programi') : [],
        acik('beslenme') ? getir('beslenme_programi') : [],
        acik('etkinlikler') ? getir('etkinlikler', rol === 'guest') : [],
        acik('duyurular') ? getir('duyurular', rol === 'guest') : [],
        acik('odevler') ? getir('odevler') : [],
    ]);

    tahtayiCiz(dersler, beslenme, acik('program'), acik('beslenme'));
    bilgiListesiniCiz(etkinlikler, duyurular, acik('etkinlikler'), acik('duyurular'), odevler, acik('odevler'));
    if (rol !== 'guest') sayilariCiz(rol, kullanici).catch(e => console.warn('Sayılar yüklenemedi:', e));
}

// Öğrenci ana sayfası: avatar, sıradaki rozet, yeni rozet kutlaması (js/ogrenciKosesi.js)
async function ogrenciKosesi(kullanici) {
    try { (await import('./ogrenciKosesi.js')).koseyiKur(kullanici); }
    catch (e) { console.warn('Öğrenci köşesi yüklenemedi:', e); }
}

// ÖNE ÇIKAN AN: kara tahtada günün (hafta sonuysa pazartesinin) dersleri ve beslenmesi
function tahtayiCiz(dersler, beslenme, programAcik, beslenmeAcik) {
    const alan = document.getElementById('tahta-alani');
    if (!alan) return;
    if (!programAcik && !beslenmeAcik) { alan.remove(); document.getElementById('ana-izgara').style.gridTemplateColumns = '1fr'; return; }

    const bugunNo = new Date().getDay();
    const haftaSonu = bugunNo === 0 || bugunNo === 6;
    const gunNo = haftaSonu ? 1 : bugunNo;
    const baslik = haftaSonu ? 'Pazartesi dersleri' : 'Bugünün dersleri';
    const sag = haftaSonu ? 'Hafta sonu' : GUN_AD[gunNo];

    const kayit = dersler.find(d => d.gun === GUN_AD[gunNo]);
    const liste = kayit ? [1, 2, 3, 4, 5, 6].map(i => kayit[`ders${i}`]).filter(Boolean) : [];
    const menu = beslenme[0]?.[GUN_ANAHTAR[gunNo]];

    alan.innerHTML = `
        <section class="tahta" aria-label="${baslik}">
            <div class="tahta-ust"><h2>${programAcik ? baslik : 'Beslenme'}</h2><small>${sag}</small></div>
            ${programAcik ? (liste.length
                ? `<ol class="tahta-dersler">${liste.map((d, i) => `<li><span>${i + 1}</span>${esc(d)}</li>`).join('')}</ol>`
                : `<p class="tahta-bos">Ders programı henüz girilmedi</p>`) : ''}
            ${beslenmeAcik ? `<div class="tahta-not"><b>Beslenme</b><span>${menu ? esc(menu) : 'Henüz girilmedi'}</span></div>` : ''}
        </section>`;
}

function bilgiListesiniCiz(etkinlikler, duyurular, etkinlikAcik, duyuruAcik, odevler = [], odevAcik = false) {
    const alan = document.getElementById('bilgi-alani');
    if (!alan) return;
    const satirlar = [];

    if (etkinlikAcik) {
        const siradaki = etkinlikler.filter(e => !gectiMi(e)).sort((a, b) => new Date(a.tarih) - new Date(b.tarih))[0];
        satirlar.push(siradaki
            ? `<a class="bilgi-satir" href="#etkinlikler"><i class="fas fa-calendar-days"></i><div><small>Sıradaki etkinlik · ${new Date(siradaki.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</small><strong>${esc(siradaki.baslik)}</strong></div></a>`
            : `<div class="bilgi-satir"><i class="fas fa-calendar-days"></i><div><small>Sıradaki etkinlik</small><strong>Planlanmış etkinlik yok</strong></div></div>`);
    }
    if (odevAcik) {
        const yaklasan = odevSirasi(odevler).filter(o => !odevGectiMi(o));
        const o = yaklasan[0];
        satirlar.push(o
            ? `<a class="bilgi-satir" href="#odevler"><i class="fas fa-list-check"></i><div><small>Sıradaki ödev · ${new Date(`${o.teslim}T12:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}${yaklasan.length > 1 ? ` · ${yaklasan.length} ödev bekliyor` : ''}</small><strong>${esc(o.baslik)}</strong></div></a>`
            : `<div class="bilgi-satir"><i class="fas fa-list-check"></i><div><small>Ödevler</small><strong>Bekleyen ödev yok</strong></div></div>`);
    }
    if (duyuruAcik) {
        const son = [...duyurular].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        satirlar.push(son
            ? `<a class="bilgi-satir" href="#duyurular"><i class="fas fa-bullhorn"></i><div><small>Son duyuru · ${new Date(son.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</small><strong>${esc(son.baslik)}</strong></div></a>`
            : `<div class="bilgi-satir"><i class="fas fa-bullhorn"></i><div><small>Son duyuru</small><strong>Henüz duyuru yok</strong></div></div>`);
    }

    if (!satirlar.length) { alan.remove(); document.getElementById('ana-izgara').style.gridTemplateColumns = '1fr'; return; }
    alan.innerHTML = `<div class="bilgi-liste">${satirlar.join('')}</div>`;
}

// Öğretmen: sınıfın sayıları. Öğrenci: kendi yıldızı, kitabı ve rozeti.
async function sayilariCiz(rol, kullanici) {
    const alan = document.getElementById('sayilar-alani');
    if (!alan) return;
    const getir = (t) => db.getAll(t).catch(() => []);

    let kartlar;
    if (rol === 'teacher') {
        const [kullanicilar, kitap, rozet] = await Promise.all([getir('users'), getir('kitap_matrisi'), getir('rozet_matrisi')]);
        kartlar = [
            ['Öğrenci', kullanicilar.filter(u => u.role === 'student').length],
            ['Şu an okunan kitap', kitap.filter(m => m.deger === '⏳').length],
            ['Verilen rozet', rozet.filter(m => m.deger === '✔️').length],
        ];
    } else {
        const id = kullanici?.id;
        // Sadece çocuğun kendi satırları okunur (tüm sınıfın tablosu değil)
        const kendi = (t) => db.ogrencininSatirlari(t, id).catch(() => []);
        const [davranis, kitap, rozet] = await Promise.all([kendi('davranis_matrisi'), kendi('kitap_matrisi'), kendi('rozet_matrisi')]);
        const yildiz = davranis.filter(m => m.ogrId === id).reduce((t, m) => t + (parseInt(m.deger) || 0), 0);
        kartlar = [
            ['Yıldızların', yildiz, '<span class="yildiz-cikartma" aria-hidden="true"></span>'],
            ['Okuduğun kitap', kitap.filter(m => m.ogrId === id && m.deger === '✔️').length],
            ['Rozetlerin', rozet.filter(m => m.ogrId === id && m.deger === '✔️').length],
        ];
    }
    alan.innerHTML = `<div class="sayilar" style="margin-bottom:16px">${kartlar.map(([e, n, on = '']) => `<div class="sayi-kart"><small>${e}</small><strong>${on}<span data-say="${n}">${sayi(n)}</span></strong></div>`).join('')}</div>`;
    sayilariSaydir(alan);
}

function bolumMenusunuKur(moduller) {
    const modal = document.getElementById('modul-modal');
    const liste = document.getElementById('modal-modul-listesi');
    const ac = document.getElementById('btn-tum-moduller');
    if (!modal || !liste || !ac) return;

    const kapat = () => modal.classList.remove('acik');
    ac.addEventListener('click', () => {
        liste.innerHTML = moduller.map(m => `
            <a href="#${m.id}" class="menu-item"><i class="fas ${m.ikon} icon"></i><span>${m.name}</span></a>`).join('');
        liste.querySelectorAll('a').forEach(a => a.addEventListener('click', kapat));
        modal.classList.add('acik');
    });
    document.getElementById('modal-kapat')?.addEventListener('click', kapat);
    modal.addEventListener('click', (e) => { if (e.target === modal) kapat(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') kapat(); });
}
