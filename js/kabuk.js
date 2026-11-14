// Sayfa iskeleti: üst bar, ana sayfa, modül menüsü. index.html, teacher.html ve student.html bunu kullanır.
// Kullanım:  kabukBaslat({ rol: 'guest' | 'teacher' | 'student' })
import { appConfig, acikTon } from './config.js';
import { db } from './db.js';
import { initApp } from './app.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GUN_ANAHTAR = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
const GUN_AD = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function kayitliKullanici() {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
}

function selamla() {
    const s = new Date().getHours();
    if (s < 6) return 'İyi geceler';
    if (s < 12) return 'Günaydın';
    if (s < 18) return 'İyi günler';
    return 'İyi akşamlar';
}

function basHarfler(ad) {
    return String(ad || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('tr-TR');
}

// Modül rengini CSS değişkeni olarak verir
function renkStili(mod) {
    return `--modul-renk:${mod.renk};--modul-renk-acik:${acikTon(mod.renk)}`;
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

    ustBariCiz(rol, kullanici, auth);

    // Görünür modüller: misafir sadece açık olanları görür. Öğretmen hepsini görür, kapalı olanlarda etiket çıkar.
    let gorunurlukler = {};
    if (rol !== 'student') {
        const sonuclar = await Promise.all(appConfig.modules.map(m => db.getModuleVisibility(m.id).catch(() => true)));
        appConfig.modules.forEach((m, i) => { gorunurlukler[m.id] = sonuclar[i]; });
    }
    const moduller = rol === 'guest' ? appConfig.modules.filter(m => gorunurlukler[m.id]) : appConfig.modules;

    const anaSayfa = () => anaSayfayiCiz(icerik, rol, kullanici, moduller, gorunurlukler);
    if (!location.hash) anaSayfa();

    window.addEventListener('hashchange', () => {
        if (!location.hash.substring(1)) {
            anaSayfa();
            document.querySelectorAll('.menu-item').forEach(el => el.classList.toggle('aktif', el.dataset.module === ''));
        }
    });

    modulMenusunuKur(moduller);
    await initApp(rol, { otomatikYonlendirme: false, gorunurModuller: moduller });
}

function ustBariCiz(rol, kullanici, auth) {
    const etiket = document.getElementById('rol-etiketi');
    const eylemler = document.getElementById('ust-eylemler');
    if (etiket) etiket.textContent = { guest: `${appConfig.sinifAdi} Sınıfı`, teacher: 'Öğretmen Paneli', student: 'Öğrenci Paneli' }[rol];

    if (rol === 'guest') {
        const k = kullanici;
        const panom = k && (k.role === 'teacher' || k.role === 'student');
        eylemler.innerHTML = panom
            ? `<a class="btn btn-success" href="${k.role === 'teacher' ? 'teacher.html' : 'student.html'}"><i class="fas fa-user-check"></i> Panom</a>`
            : `<a class="btn btn-primary" href="login.html"><i class="fas fa-right-to-bracket"></i> Giriş Yap</a>`;
        const altGiris = document.getElementById('nav-giris');
        if (panom && altGiris) {
            altGiris.href = k.role === 'teacher' ? 'teacher.html' : 'student.html';
            altGiris.innerHTML = '<i class="fas fa-user-check"></i><span>Panom</span>';
        }
        return;
    }

    eylemler.innerHTML = `
        <div class="kullanici-cip" title="${esc(kullanici?.name)}">
            <span class="avatar">${esc(basHarfler(kullanici?.name))}</span><span>${esc(kullanici?.name)}</span>
        </div>
        <button id="btn-logout" class="btn btn-hayalet" title="Çıkış yap"><i class="fas fa-right-from-bracket"></i><span class="gizle-tel"> Çıkış</span></button>`;
    document.getElementById('btn-logout').addEventListener('click', () => auth.logout());
}

async function anaSayfayiCiz(icerik, rol, kullanici, moduller, gorunurlukler) {
    const bugun = new Date();
    const tarih = bugun.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    const ilkAd = String(kullanici?.name || '').split(' ')[0];

    const karsilama = {
        guest: { sinif: '', baslik: `${appConfig.sinifAdi} Sınıfına Hoş Geldiniz!`, yazi: 'Sınıfımızdan haberler, etkinlikler ve çocuklarımızın başarıları burada.' },
        teacher: { sinif: 'ogretmen', baslik: `${selamla()}, ${esc(kullanici?.name || 'Öğretmenim')}`, yazi: 'Sınıf yönetim araçlarınız aşağıda. Velilere kapalı modüller etiketle gösterilir.' },
        student: { sinif: 'ogrenci', baslik: `Merhaba ${esc(ilkAd)}! 👋`, yazi: 'Bugün de harika işler çıkaralım. Görevlerine, kitaplarına ve rozetlerine buradan ulaşabilirsin.' },
    }[rol];

    const etiketKoy = rol === 'teacher';
    const kartlar = moduller.map(m => `
        <a href="#${m.id}" class="modul-kutu" style="${renkStili(m)}">
            ${etiketKoy && gorunurlukler[m.id] === false ? '<span class="modul-etiket">🔒 Velilere kapalı</span>' : ''}
            <span class="modul-ikon">${m.icon}</span>
            <strong>${m.name}</strong>
            <small>${m.aciklama || ''}</small>
        </a>`).join('');

    icerik.innerHTML = `
        <div class="icerik-kap">
            <section class="karsilama ${karsilama.sinif}">
                <div class="karsilama-tarih">${tarih}</div>
                <h2>${karsilama.baslik}</h2>
                <p>${karsilama.yazi}</p>
            </section>
            <div id="bugun-alani"></div>
            <div class="bolum-baslik"><h3>Modüller</h3><small>${moduller.length} bölüm</small></div>
            ${moduller.length
                ? `<div class="modul-grid">${kartlar}</div>`
                : `<div class="card bos-durum"><div class="buyuk">🔒</div><p>Şu an velilere açık bir bölüm bulunmuyor.</p></div>`}
        </div>`;

    bugunKartlariniCiz(rol, moduller, gorunurlukler).catch(e => console.warn('Bugün kartı yüklenemedi:', e));
}

// "Bugün" bölümü: günün dersleri ve beslenme menüsü (modül açıksa)
async function bugunKartlariniCiz(rol, moduller, gorunurlukler) {
    const alan = document.getElementById('bugun-alani');
    if (!alan) return;
    const gunNo = new Date().getDay();
    const acik = (id) => moduller.some(m => m.id === id) && (rol !== 'guest' || gorunurlukler[id] !== false);

    if (gunNo === 0 || gunNo === 6) {
        alan.innerHTML = `<div class="bugun"><div class="bugun-kart"><div class="bugun-ikon" style="background:#fff4e0">🌤️</div>
            <div><h4>Bugün</h4><p>Hafta sonu! İyi dinlenmeler, pazartesi görüşmek üzere.</p></div></div></div>`;
        return;
    }

    const [dersler, beslenme] = await Promise.all([
        acik('program') ? db.getAll('ders_programi').catch(() => []) : [],
        acik('beslenme') ? db.getAll('beslenme_programi').catch(() => []) : [],
    ]);
    const kartlar = [];

    const gununDersi = dersler.find(d => d.gun === GUN_AD[gunNo]);
    if (gununDersi) {
        const liste = [1, 2, 3, 4, 5, 6].map(i => gununDersi[`ders${i}`]).filter(Boolean);
        if (liste.length) kartlar.push(`
            <a class="bugun-kart" href="#program" style="color:inherit">
                <div class="bugun-ikon" style="background:${acikTon('#0ea5e9')}">🗓️</div>
                <div><h4>Bugünün dersleri</h4>
                    <div class="ders-cipleri">${liste.map((d, i) => `<span class="ders-cip"><b>${i + 1}</b>${esc(d)}</span>`).join('')}</div>
                </div>
            </a>`);
    }

    const menu = beslenme[0]?.[GUN_ANAHTAR[gunNo]];
    if (menu) kartlar.push(`
        <a class="bugun-kart" href="#beslenme" style="color:inherit">
            <div class="bugun-ikon" style="background:${acikTon('#ef4444')}">🍎</div>
            <div><h4>Bugünün beslenmesi</h4><p>${esc(menu)}</p></div>
        </a>`);

    alan.innerHTML = kartlar.length ? `<div class="bolum-baslik"><h3>Bugün</h3></div><div class="bugun">${kartlar.join('')}</div>` : '';
}

function modulMenusunuKur(moduller) {
    const modal = document.getElementById('modul-modal');
    const liste = document.getElementById('modal-modul-listesi');
    const ac = document.getElementById('btn-tum-moduller');
    if (!modal || !liste || !ac) return;

    const kapat = () => modal.classList.remove('acik');
    ac.addEventListener('click', () => {
        liste.innerHTML = moduller.map(m => `
            <a href="#${m.id}" class="menu-item" style="${renkStili(m)}">
                <span class="icon">${m.icon}</span><span>${m.name}</span>
            </a>`).join('');
        liste.querySelectorAll('a').forEach(a => a.addEventListener('click', kapat));
        modal.classList.add('acik');
    });
    document.getElementById('modal-kapat')?.addEventListener('click', kapat);
    modal.addEventListener('click', (e) => { if (e.target === modal) kapat(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') kapat(); });
}
