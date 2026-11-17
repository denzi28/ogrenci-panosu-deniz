// Renk Bulutları: arkada yavaşça dolaşan büyük yumuşak renk bulutları; fare/parmak gelince ona doğru eğilirler.
// Dokununca o noktada bir boya damlası yayılır, küçük zerreler sıçrar.
import { katman, dokununca, hareketAz, sinirli, rastgele, sekmeGizlenince } from './ortak.js';

const RENKLER = ['#ffb3c7', '#a5d8ff', '#ffe08a', '#b9f6ca', '#d0bfff'];
const arka = katman('bulut', { arkada: true });
const bulutlar = [
    { x: '12%', y: '14%', g: '62vmax', t: 26 }, { x: '88%', y: '26%', g: '56vmax', t: 32 },
    { x: '30%', y: '88%', g: '58vmax', t: 30 }, { x: '78%', y: '82%', g: '50vmax', t: 36 }, { x: '55%', y: '50%', g: '40vmax', t: 40 },
].map((b, i) => {
    const el = document.createElement('div');
    el.className = 'renk-bulut';
    Object.entries({ '--x': b.x, '--y': b.y, '--g': b.g, '--t': `${b.t}s`, '--gecikme': `${-i * 7}s`, '--renk': RENKLER[i] })
        .forEach(([k, v]) => el.style.setProperty(k, v));
    el.innerHTML = '<i></i>';
    arka.appendChild(el);
    return { el, guc: 30 + i * 12 };
});
document.documentElement.classList.add('bulut-hazir');

if (!hareketAz()) {
    // Bulutlar imlece/parmağa doğru eğilir (yakın olan daha çok)
    let hedef = null, bekliyor = false;
    const egil = () => {
        bekliyor = false;
        bulutlar.forEach(({ el, guc }) => {
            const r = el.getBoundingClientRect();
            const dx = hedef.x - (r.left + r.width / 2), dy = hedef.y - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy) || 1, k = Math.min(guc, 9000 / d);
            el.style.transform = `translate(${(dx / d * k).toFixed(1)}px, ${(dy / d * k).toFixed(1)}px)`;
        });
    };
    const izle = (e) => { hedef = { x: e.clientX, y: e.clientY }; if (!bekliyor) { bekliyor = true; requestAnimationFrame(egil); } };
    document.addEventListener('pointermove', izle, { passive: true });
    document.addEventListener('pointerdown', izle, { passive: true });
    sekmeGizlenince(() => document.documentElement.classList.add('tema-durgun'), () => document.documentElement.classList.remove('tema-durgun'));
}

// Dokununca boya damlası
const ust = katman('boya');
const sinir = sinirli(40);
const PARLAK = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#fb923c'];
dokununca((e) => {
    const renk = PARLAK[Math.floor(Math.random() * PARLAK.length)];
    const ekle = (el, sure) => { if (!sinir.al()) return; ust.appendChild(el); setTimeout(() => { el.remove(); sinir.birak(); }, sure); };
    const d = document.createElement('i');
    d.className = 'boya-damla';
    d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`; d.style.setProperty('--renk', renk);
    ekle(d, 1150);
    for (let i = 0; i < 6; i++) {
        const z = document.createElement('i');
        const a = (i / 6) * Math.PI * 2 + rastgele(-.3, .3), r = rastgele(50, 90);
        z.className = 'boya-zerre';
        z.style.left = `${e.clientX}px`; z.style.top = `${e.clientY}px`;
        z.style.setProperty('--renk', renk);
        z.style.setProperty('--s', `${Math.round(rastgele(8, 16))}px`);
        z.style.setProperty('--dx', `${Math.round(Math.cos(a) * r)}px`);
        z.style.setProperty('--dy', `${Math.round(Math.sin(a) * r)}px`);
        ekle(z, 850);
    }
});
