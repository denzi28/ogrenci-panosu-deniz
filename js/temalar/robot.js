// Robot Atölyesi teması: sağ altta robot Bip. Gözleriyle fareyi/parmağı izler, arada göz kırpar,
// dokununca zıplar ve kısa bir söz söyler, bölüm değişince el sallar, sayfa kayarken aşağı saklanır.
// Basılan kutular ve düğmeler jöle gibi esner. Hiçbir şey kaydedilmez.
import { dokununca, hareketAz, oynat, sekmeGizlenince } from './ortak.js';

const SOZLER = [
    'Merhaba! Ben Bip.', 'Harika gidiyorsun!', 'Bip bop! Yıldızlarını topla!', 'Bugün kitap okudun mu?',
    'Rozetlerine baktın mı?', 'Hata yapmak öğrenmektir!', 'Pilim seninle doluyor!', 'Birlikte çalışınca güçlüyüz!',
    'Sorunca öğreniriz!', 'Ödevini bitirince bana söyle!',
];

const bip = document.createElement('div');
bip.className = 'bip';
bip.setAttribute('aria-hidden', 'true');
bip.innerHTML = `<div class="bip-balon"></div>
<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <line x1="50" y1="14" x2="50" y2="26" stroke="#3a4d61" stroke-width="4" stroke-linecap="round"/>
  <circle class="isik" cx="50" cy="10" r="7" fill="#f59e0b" stroke="#1c2b3a" stroke-width="3"/>
  <rect x="34" y="84" width="10" height="22" rx="4" fill="#9fb1c3"/><rect x="56" y="84" width="10" height="22" rx="4" fill="#9fb1c3"/>
  <rect x="28" y="104" width="20" height="10" rx="5" fill="#1c2b3a"/><rect x="52" y="104" width="20" height="10" rx="5" fill="#1c2b3a"/>
  <rect x="12" y="70" width="12" height="26" rx="6" fill="#c2410c"/>
  <g class="kol-sag"><rect x="76" y="70" width="12" height="26" rx="6" fill="#c2410c"/></g>
  <rect x="22" y="66" width="56" height="26" rx="10" fill="#fb923c" stroke="#1c2b3a" stroke-width="3"/>
  <circle cx="40" cy="79" r="4" fill="#22c55e"/><circle cx="52" cy="79" r="4" fill="#fbbf24"/><circle cx="64" cy="79" r="4" fill="#38bdf8"/>
  <rect x="14" y="24" width="72" height="46" rx="18" fill="#e2e8f0" stroke="#1c2b3a" stroke-width="3"/>
  <rect x="22" y="31" width="56" height="32" rx="12" fill="#1c2b3a"/>
  <g class="goz"><circle cx="38" cy="45" r="9" fill="#fff"/><circle class="bebek" cx="38" cy="45" r="4.5" fill="#1c2b3a"/><rect class="goz-kapak" x="28" y="35" width="20" height="20" rx="10" fill="#1c2b3a"/></g>
  <g class="goz"><circle cx="62" cy="45" r="9" fill="#fff"/><circle class="bebek" cx="62" cy="45" r="4.5" fill="#1c2b3a"/><rect class="goz-kapak" x="52" y="35" width="20" height="20" rx="10" fill="#1c2b3a"/></g>
  <path d="M42 57 Q50 62 58 57" stroke="#fbbf24" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="26" cy="56" r="3.5" fill="#fb7185" opacity=".8"/><circle cx="74" cy="56" r="3.5" fill="#fb7185" opacity=".8"/>
</svg>`;
document.body.appendChild(bip);
const balon = bip.querySelector('.bip-balon');

// Bip'in kendi hareketleri süreyle kalkar (iç içe animasyonların bitişi birbirini kesmesin)
const zamanlar = {};
function hareket(sinif, sure) {
    if (hareketAz()) return;
    clearTimeout(zamanlar[sinif]);
    bip.classList.remove(sinif); void bip.offsetWidth; bip.classList.add(sinif);
    zamanlar[sinif] = setTimeout(() => bip.classList.remove(sinif), sure);
}
const bebekler = [...bip.querySelectorAll('.bebek')];

// Konuşma: aynı sözü üst üste söylemez
let sonSoz = -1, konusZaman = 0;
function konus(metin) {
    if (metin == null) {
        let i;
        do { i = Math.floor(Math.random() * SOZLER.length); } while (i === sonSoz && SOZLER.length > 1);
        sonSoz = i; metin = SOZLER[i];
    }
    balon.textContent = metin;
    bip.classList.add('konusuyor');
    clearTimeout(konusZaman);
    konusZaman = setTimeout(() => bip.classList.remove('konusuyor'), 2600);
}

bip.addEventListener('pointerdown', (e) => { e.stopPropagation(); }, { passive: true });
bip.addEventListener('click', () => {
    bip.classList.remove('saklan');
    hareket('zipla', 650);
    konus();
});

if (!hareketAz()) {
    // Gözler hedefe bakar (fare hareketi ya da son dokunuş); en fazla 4 birim kayar
    let hedef = null, bekliyor = false;
    const bak = () => {
        bekliyor = false;
        if (!hedef) return;
        bebekler.forEach(b => {
            const r = b.getBoundingClientRect();
            const dx = hedef.x - (r.left + r.width / 2), dy = hedef.y - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy) || 1, k = Math.min(4, d / 30);
            b.style.transform = `translate(${(dx / d) * k}px, ${(dy / d) * k}px)`;
        });
    };
    const izle = (e) => { hedef = { x: e.clientX, y: e.clientY }; if (!bekliyor) { bekliyor = true; requestAnimationFrame(bak); } };
    document.addEventListener('pointermove', izle, { passive: true });
    document.addEventListener('pointerdown', izle, { passive: true });

    // Göz kırpma: 2,5–6 saniyede bir; sekme arkadayken durur
    let kirpZaman = 0;
    const kirpPlanla = () => { kirpZaman = setTimeout(() => { hareket('kirp', 200); kirpPlanla(); }, 2500 + Math.random() * 3500); };
    kirpPlanla();
    sekmeGizlenince(() => clearTimeout(kirpZaman), () => { clearTimeout(kirpZaman); kirpPlanla(); });

    // Sayfa kayarken aşağı saklanır, durunca geri çıkar (içeriğin önünü kapatmasın)
    let kayZaman = 0;
    window.addEventListener('scroll', () => {
        bip.classList.add('saklan');
        clearTimeout(kayZaman);
        kayZaman = setTimeout(() => bip.classList.remove('saklan'), 900);
    }, { passive: true });

    // Bölüm değişince el sallar
    window.addEventListener('hashchange', () => hareket('salla', 950));

    // Açılışta bir kez selam verir (öğretmen sayfasında sessiz kalır)
    if (!location.pathname.includes('teacher')) setTimeout(() => { hareket('salla', 950); konus('Merhaba! Ben Bip. Bana dokun!'); }, 900);
}

// Basılan kutular jöle gibi esner
dokununca((e) => {
    const el = e.target.closest('.modul-kutu, .btn, .sayi-kart, .menu-item, .rozet-kart, .hedef-kart, .mobile-nav a, .tanitim-ozellikler li, .avatar-rozet');
    if (el) oynat(el, 'jole');
});
