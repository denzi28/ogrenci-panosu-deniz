import { appConfig } from './config.js';
import { db } from './db.js';

let currentRole = 'guest';

// initApp artık asenkron (async) çünkü menüyü çizerken Firebase'den veri bekleyecek
export async function initApp(role) {
    currentRole = role;
    await renderMenu();
    setupMobileMenu();
}

async function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    let html = '';
    
    // forEach yerine for...of kullanıyoruz ki await (bekleme) işlemi doğru çalışsın
    for (const mod of appConfig.modules) {
        if (currentRole === 'guest') {
            const isVisible = await db.getModuleVisibility(mod.id);
            if (!isVisible) continue; // Modül gizliyse atla
        }
        html += `<a href="#" class="menu-item" data-module="${mod.id}">
                    <span class="icon">${mod.icon}</span> ${mod.name}
                 </a>`;
    }
    
    container.innerHTML = html;

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            loadModule(item.getAttribute('data-module'));
        });
    });

    if (menuItems.length > 0) {
        menuItems[0].click(); 
    } else if (currentRole === 'guest') {
        document.getElementById('app-content').innerHTML = `
            <div class="card" style="text-align:center; padding: 40px;">
                <h2>Şu an misafirlere açık bir içerik bulunmuyor 🔒</h2>
            </div>`;
    }
}

async function loadModule(moduleId) {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="card"><p>⏳ Yükleniyor...</p></div>';

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
            // Render fonksiyonu da artık internetten veri çekeceği için await ekliyoruz
            await module.render(container);
        } else {
            container.innerHTML = `<div class="card" style="border-left:4px solid orange;">
                <h3>Eksik Fonksiyon</h3><p><b>${currentRole}.js</b> dosyası var ancak <code>render</code> fonksiyonu yok.</p></div>`;
        }
    } catch (err) {
        console.error("Modül yükleme hatası:", err);
        container.innerHTML = `<div class="card" style="border-left:4px solid red;">
            <h3>Geliştirme Aşamasında</h3><p>Bu role ait (<b>${currentRole}</b>) <b>${moduleId}</b> modülü henüz oluşturulmamış.</p></div>`;
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