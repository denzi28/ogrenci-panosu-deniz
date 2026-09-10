import { appConfig } from './config.js';
import { db } from './db.js';

let currentRole = 'guest';

// initApp artık asenkron (async) çünkü menüyü çizerken Firebase'den veri bekleyecek
export async function initApp(role) {
    currentRole = role;
    await renderMenu();
    setupMobileMenu();

    // YENİ: Sayfa ilk açıldığında veya dışarıdan linkle gelindiğinde URL'deki # kısmını yakala
    const hash = window.location.hash.substring(1);
    if (hash) {
        // Hash varsa ve bu modül yüklenmek isteniyorsa onu aç
        loadModule(hash);
    } else {
        // Hash yoksa (siteye düz girildiyse) menüdeki ilk elemanı aç ve URL'yi ona göre ayarla
        const firstMenuItem = document.querySelector('.menu-item');
        if (firstMenuItem) {
            const defaultModule = firstMenuItem.getAttribute('data-module');
            window.location.hash = defaultModule; // URL'ye ekle
            loadModule(defaultModule);
        }
    }

    // YENİ: Tarayıcıda geri/ileri tuşlarına basıldığında veya menüye tıklandığında URL değişimini dinle
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
    
    // forEach yerine for...of kullanıyoruz ki await (bekleme) işlemi doğru çalışsın
    for (const mod of appConfig.modules) {
        if (currentRole === 'guest') {
            const isVisible = await db.getModuleVisibility(mod.id);
            if (!isVisible) continue; // Modül gizliyse atla
        }
        
        // YENİ: href="#" kısmını href="#modul.id" olarak değiştirdik, tıklayınca URL otomatik değişecek
        html += `<a href="#${mod.id}" class="menu-item" data-module="${mod.id}">
                    <span class="icon">${mod.icon}</span> ${mod.name}
                 </a>`;
    }
    
    container.innerHTML = html;

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const modId = item.getAttribute('data-module');
            // Zaten bulunduğumuz modüle tıklanıyorsa URL değişmeyeceği için sayfayı manuel tazele
            if (window.location.hash.substring(1) === modId) {
                e.preventDefault();
                loadModule(modId);
            }
            // Farklı sayfaya tıklanıyorsa e.preventDefault() yapmıyoruz ki href="#modId" doğal olarak URL'yi değiştirsin
        });
    });

    // Artık ilk tıklamayı initApp içinden yönettiğimiz için buradaki [0].click() kısmını kaldırdık
    if (menuItems.length === 0 && currentRole === 'guest') {
        document.getElementById('app-content').innerHTML = `
            <div class="card" style="text-align:center; padding: 40px;">
                <h2>Şu an misafirlere açık bir içerik bulunmuyor 🔒</h2>
            </div>`;
    }
}

async function loadModule(moduleId) {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="card"><p>⏳ Yükleniyor...</p></div>';

    // YENİ: Hangi sayfada olduğumuzu belli etmek için menü butonunun rengini koyulaştır
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
            // Render fonksiyonu da artık internetten veri çekeceği için await ekliyoruz
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