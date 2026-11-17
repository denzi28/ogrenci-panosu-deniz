// Gün Doğumu Tepeleri: dipte her açılışta yeniden çizilen dört pastel tepe; fare/parmak hareket edince
// katmanlar farklı hızda kayar. Gökte iki bulut süzülür. Dokununca o noktadan bir uçurtma yükselir.
import { katman, dokununca, hareketAz, sinirli, rastgele, sekmeGizlenince } from './ortak.js';

// Yumuşak tepe çizgisi: rastgele yükseklikte noktalar, aralarında eğri (her açılışta biraz farklı)
function tepeYolu(tepeSayisi, enAz, enCok) {
    const G = 1200, Y = 300, adim = G / tepeSayisi;
    const nok = Array.from({ length: tepeSayisi + 1 }, (_, i) => [i * adim, Y - rastgele(enAz, enCok)]);
    let d = `M0 ${Y} L${nok[0][0]} ${nok[0][1]}`;
    for (let i = 0; i < nok.length - 1; i++) {
        const [x1, y1] = nok[i], [x2, y2] = nok[i + 1], xm = (x1 + x2) / 2;
        d += ` C${xm} ${y1} ${xm} ${y2} ${x2} ${y2}`;
    }
    return d + ` L${G} ${Y} Z`;
}

const kok = getComputedStyle(document.documentElement);
const KATMANLAR = [
    { renk: kok.getPropertyValue('--tepe-1').trim() || '#e6dcff', yuk: '26vh', sayi: 3, az: 150, cok: 250, derin: 6 },
    { renk: kok.getPropertyValue('--tepe-2').trim() || '#cdeee4', yuk: '22vh', sayi: 4, az: 110, cok: 210, derin: 12 },
    { renk: kok.getPropertyValue('--tepe-3').trim() || '#b8e6d2', yuk: '17vh', sayi: 5, az: 80, cok: 170, derin: 20 },
    { renk: kok.getPropertyValue('--tepe-4').trim() || '#a3dcc1', yuk: '12vh', sayi: 6, az: 60, cok: 140, derin: 30 },
];

const arka = katman('tepe', { arkada: true });
const katmanlar = KATMANLAR.map(k => {
    const el = document.createElement('div');
    el.className = 'tepe-katman';
    el.style.height = k.yuk;
    el.innerHTML = `<svg viewBox="0 0 1200 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="${tepeYolu(k.sayi, k.az, k.cok)}" fill="${k.renk}"/></svg>`;
    arka.appendChild(el);
    return { el, derin: k.derin };
});
document.documentElement.classList.add('tepe-hazir');

if (!hareketAz()) {
    // Derinlik: imleç/parmak sağa gidince öndeki tepeler daha çok kayar
    let hedef = null, bekliyor = false;
    const kaydir = () => {
        bekliyor = false;
        const ox = hedef.x / innerWidth - .5, oy = hedef.y / innerHeight - .5;
        katmanlar.forEach(({ el, derin }) => { el.style.transform = `translate(${(-ox * derin).toFixed(1)}px, ${(-oy * derin * .3).toFixed(1)}px)`; });
    };
    const izle = (e) => { hedef = { x: e.clientX, y: e.clientY }; if (!bekliyor) { bekliyor = true; requestAnimationFrame(kaydir); } };
    document.addEventListener('pointermove', izle, { passive: true });
    document.addEventListener('pointerdown', izle, { passive: true });

    // İki bulut
    [{ ust: '9%', g: 120, t: 70, gecikme: -20 }, { ust: '24%', g: 80, t: 95, gecikme: -60 }].forEach(b => {
        const el = document.createElement('div');
        el.className = 'bulutcuk';
        el.style.setProperty('--ust', b.ust); el.style.setProperty('--g', `${b.g}px`);
        el.style.setProperty('--t', `${b.t}s`); el.style.setProperty('--gecikme', `${b.gecikme}s`);
        arka.insertBefore(el, arka.firstChild);
    });
    sekmeGizlenince(() => document.documentElement.classList.add('tema-durgun'), () => document.documentElement.classList.remove('tema-durgun'));
}

// Dokununca uçurtma (özgün, basit çizim: baklava gövde, çapraz çıta, kurdeleli kuyruk)
const RENK = [['#f472b6', '#fde68a'], ['#38bdf8', '#fef3c7'], ['#a78bfa', '#bbf7d0'], ['#fb923c', '#e0f2fe'], ['#34d399', '#fce7f3']];
const ucurtmaSvg = ([a, b]) => `<svg viewBox="0 0 44 90" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 2 L40 24 L22 50 L4 24 Z" fill="${a}" stroke="#2e2550" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M22 2 L22 50 M4 24 L40 24" stroke="${b}" stroke-width="2.5"/>
  <path d="M22 50 Q14 60 22 68 Q30 76 22 86" stroke="#2e2550" stroke-width="1.8" fill="none"/>
  <path d="M22 60 l-6 -3 l0 6 Z M22 74 l6 -3 l0 6 Z" fill="${b}" stroke="#2e2550" stroke-width="1.2"/>
</svg>`;
const ust = katman('ucurtma');
const sinir = sinirli(8);
dokununca((e) => {
    if (!sinir.al()) return;
    const u = document.createElement('i');
    u.className = 'ucurtma';
    u.style.left = `${e.clientX}px`;
    u.style.top = `${e.clientY}px`;
    u.style.setProperty('--x', `${Math.round(rastgele(-90, 90))}px`);
    u.innerHTML = ucurtmaSvg(RENK[Math.floor(Math.random() * RENK.length)]);
    u.addEventListener('animationend', (ev) => { if (ev.target === u) { u.remove(); sinir.birak(); } });
    ust.appendChild(u);
});
