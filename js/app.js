import { appConfig } from './config.js';
import { db } from './db.js';

let currentRole = 'guest';

export async function initApp(role) {
    currentRole = role;
    await renderMenu();
    setupMobileMenu();

    const hash = window.location.hash.substring(1);
    if (hash) {
        loadModule(hash);
    } else {
        const firstMenuItem = document.querySelector('.menu-item');
        if (firstMenuItem) {
            const defaultModule = firstMenuItem.getAttribute('data-module');
            window.location.hash = defaultModule;
            loadModule(defaultModule);
        }
    }

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

    let html = '';
    
    // HIZLANDIRMA 1: Menü çizilirken tüm modüllerin durumunu TEK SEFERDE (Paralel) soruyoruz.
    let visibilityResults = [];
    if (currentRole === 'guest') {
        const visibilityPromises = appConfig.modules.map(mod => db.getModuleVisibility(mod.id));
        visibilityResults = await Promise.all(visibilityPromises);
    }

    appConfig.modules.forEach((mod, index) => {
        if (currentRole === 'guest' && !visibilityResults[index]) {
            return; // Modül gizliyse atla
        }
        
        html += `<a href="#${mod.id}" class="menu-item" data-module="${mod.id}">
                    <span class="icon">${mod.icon}</span> ${mod.name}
                 </a>`;
    });
    
    container.innerHTML = html;

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const modId = item.getAttribute('data-module');
            if (window.location.hash.substring(1) === modId) {
                e.preventDefault();
                loadModule(modId);
            }
        });
    });

    if (menuItems.length === 0 && currentRole === 'guest') {
        document.getElementById('app-content').innerHTML = `
            <div class="card" style="text-align:center; padding: 40px;">
                <h2>Şu an misafirlere açık bir içerik bulunmuyor 🔒</h2>
            </div>`;
    }
}

async function loadModule(moduleId) {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="card"><p>⚡ Sayfa hızla yükleniyor...</p></div>';

    document.querySelectorAll('.menu-item').forEach(btn => btn.style.backgroundColor = 'transparent');
    const activeItem = document.querySelector(`.menu-item[data-module="${moduleId}"]`);
    if (activeItem) activeItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';

    let linkId = `css-${moduleId}`;
    if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `modules/${moduleId}/style.css`;
        document.head.appendChild(link);
    }

    try {
        const module = await import(`../modules/${moduleId}/${currentRole}.js`);
        if (module.render) {
            await module.render(container);
        } else {
            container.innerHTML = `<div class="card" style="border-left:4px solid orange;">
                <h3>Eksik Fonksiyon</h3><p><b>${currentRole}.js</b> dosyası var ancak <code>render</code> fonksiyonu yok.</p></div>`;
        }
    } catch (err) {
        console.error("Modül yükleme hatası:", err);
        container.innerHTML = `<div class="card" style="border-left:4px solid red;">
            <h3>Sayfa Bulunamadı</h3><p>Ulaşmaya çalıştığınız (<b>${moduleId}</b>) sayfası şu an aktif değil veya yetkiniz yok.</p>
            <button onclick="window.history.back()" style="padding: 8px 15px; margin-top: 10px; cursor: pointer; border-radius: 5px;">Geri Dön</button>
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
    
    document.getElementById('menu-container').addEventListener('click', (e) => {
        if (e.target.closest('.menu-item') && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
}