import { appConfig, acikTon } from './config.js';
import { db } from './db.js';

let currentRole = 'guest';
let dinleyicilerEklendi = false;
let hazirModulListesi = null; // kabuk.js görünür modülleri zaten hesapladıysa tekrar sorgulanmaz

// initApp sayfa başına BİR KEZ çağrılmalı. Dinleyiciler de yalnızca bir kez eklenir;
// aksi halde her sayfa geçişinde modül N kez üst üste yükleniyordu.
// otomatikYonlendirme=false: adres çubuğunda modül yoksa ilk modüle atlama, ana sayfa kutularında kal.
export async function initApp(role, { otomatikYonlendirme = true, gorunurModuller = null } = {}) {
    hazirModulListesi = gorunurModuller;
    // --- 1 HAFTALIK "BENİ HATIRLA" KONTROLÜ ---
    const HAFTA_MILISANIYE = 7 * 24 * 60 * 60 * 1000; // 7 günün milisaniye karşılığı
    const simdi = Date.now();
    let sonGiris = localStorage.getItem('sonGirisTarihi');

    // Eğer sisteme giriş yapılmışsa (misafir değilse) süreyi ölç
    if (role !== 'guest' && localStorage.getItem('currentUser')) {
        if (sonGiris && (simdi - parseInt(sonGiris) > HAFTA_MILISANIYE)) {
            // 1 haftadan fazla zaman geçmiş -> Firebase oturumunu da kapat
            const { auth } = await import('./auth.js');
            await auth.logout();
            return;
        } else {
            // 1 hafta dolmamış -> Siteye tekrar girdiği için süreyi bugünden itibaren 1 hafta daha uzat
            localStorage.setItem('sonGirisTarihi', simdi.toString());
            currentRole = role;
        }
    } else {
        currentRole = role;
    }
    // ------------------------------------------

    await renderMenu();
    if (!dinleyicilerEklendi) setupMobileMenu();

    const hash = window.location.hash.substring(1);
    if (hash) {
        loadModule(hash);
    } else {
        // Eğer kullanıcı misafir (guest) değilse ilk modüle yönlendir, misafirse ana sayfa kutularında bırak
        if (role !== 'guest' && otomatikYonlendirme) {
            const firstMenuItem = document.querySelector('.menu-item');
            if (firstMenuItem) {
                const defaultModule = firstMenuItem.getAttribute('data-module');
                window.location.hash = defaultModule; 
                loadModule(defaultModule);
            }
        }
    }

    if (dinleyicilerEklendi) return;
    dinleyicilerEklendi = true;
    window.addEventListener('hashchange', () => {
        const targetModule = window.location.hash.substring(1);
        if (targetModule) {
            loadModule(targetModule);
        }
    });
}

async function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    let moduller = hazirModulListesi;
    if (!moduller) {
        moduller = appConfig.modules;
        if (currentRole === 'guest') {
            const gorunur = await Promise.all(appConfig.modules.map(mod => db.getModuleVisibility(mod.id)));
            moduller = appConfig.modules.filter((_, i) => gorunur[i]);
        }
    }

    let html = `<div class="yan-menu-ana"><a href="#" class="menu-item${window.location.hash.length > 1 ? '' : ' aktif'}" data-module="" style="--modul-renk-acik:${acikTon('#3563d9')}">
                    <span class="icon">🏠</span><span>Ana Sayfa</span></a></div>
                <div class="yan-menu-baslik">Bölümler</div>`;
    moduller.forEach(mod => {
        html += `<a href="#${mod.id}" class="menu-item" data-module="${mod.id}" style="--modul-renk:${mod.renk};--modul-renk-acik:${acikTon(mod.renk)}">
                    <span class="icon">${mod.icon}</span><span>${mod.name}</span>
                 </a>`;
    });

    container.innerHTML = html;

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const modId = item.getAttribute('data-module');
            if (!modId) { e.preventDefault(); history.pushState('', '', location.pathname); window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
            if (window.location.hash.substring(1) === modId) {
                e.preventDefault();
                loadModule(modId);
            }
        });
    });

    if (moduller.length === 0 && currentRole === 'guest' && !hazirModulListesi) {
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `
                <div class="card" style="text-align:center; padding: 40px;">
                    <h2>Şu an misafirlere açık bir içerik bulunmuyor 🔒</h2>
                </div>`;
        }
    }
}

async function loadModule(moduleId) {
    const container = document.getElementById('app-content');
    if (!container) return;
    
    container.innerHTML = `<div aria-busy="true" aria-label="Yükleniyor">
        <div class="iskelet" style="height:64px;margin-bottom:14px"></div>
        <div class="iskelet" style="height:220px;margin-bottom:14px"></div>
        <div class="iskelet" style="height:120px"></div></div>`;

    document.querySelectorAll('#menu-container .menu-item').forEach(el => el.classList.toggle('aktif', el.dataset.module === moduleId));
    window.scrollTo({ top: 0 });

    let linkId = `css-${moduleId}`;
    if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `modules/${moduleId}/style.css`;
        document.head.appendChild(link);
    }

    let module;
    try {
        module = await import(`../modules/${moduleId}/${currentRole}.js`);
    } catch (err) {
        console.error("Modül bulunamadı:", err);
        module = null;
    }

    if (!module) {
        container.innerHTML = `<div class="card" style="border-left:4px solid red;">
            <h3>Sayfa Bulunamadı</h3><p>Ulaşmaya çalıştığınız (<b>${moduleId}</b>) sayfası şu an aktif değil veya yetkiniz yok.</p>
            <button onclick="window.history.back()" style="padding: 8px 15px; margin-top: 10px; cursor: pointer; border-radius: 5px;">Geri Dön</button>
            </div>`;
        return;
    }

    try {
        if (module.render) {
            await module.render(container);
        } else {
            container.innerHTML = `<div class="card" style="border-left:4px solid orange;">
                <h3>Eksik Fonksiyon</h3><p><b>${currentRole}.js</b> dosyası var ancak <code>render</code> fonksiyonu yok.</p></div>`;
        }
    } catch (err) {
        console.error("Modül çalışırken hata:", err);
        const internetYok = !navigator.onLine;
        container.innerHTML = `<div class="card" style="border-left:4px solid orange;">
            <h3>${internetYok ? '📡 İnternet bağlantısı yok' : '⚠️ Veriler yüklenemedi'}</h3>
            <p>${internetYok ? 'Bağlantınızı kontrol edip tekrar deneyin.' : 'Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu. Lütfen biraz sonra tekrar deneyin.'}</p>
            <button onclick="location.reload()" style="padding: 8px 15px; margin-top: 10px; cursor: pointer; border-radius: 5px;">Tekrar Dene</button>
            </div>`;
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        menuContainer.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item') && window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    }
}