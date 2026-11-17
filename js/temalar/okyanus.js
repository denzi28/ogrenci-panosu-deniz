// Okyanus teması: dokununca kabarcık yükselir; arkada üç balık yavaşça yüzer.
import { katman, dokununca, hareketAz, sinirli, rastgele, sekmeGizlenince } from './ortak.js';

const ust = katman('kabarcik');
const sinir = sinirli(48);

dokununca((e) => {
    const adet = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < adet; i++) {
        if (!sinir.al()) break;
        const k = document.createElement('i');
        k.className = 'kabarcik';
        k.style.left = `${e.clientX + rastgele(-10, 10)}px`;
        k.style.top = `${e.clientY + rastgele(-6, 6)}px`;
        k.style.setProperty('--s', `${Math.round(rastgele(14, 34))}px`);
        k.style.setProperty('--x', `${Math.round(rastgele(-34, 34))}px`);
        k.style.setProperty('--y', `${Math.round(rastgele(-260, -140))}px`);
        k.style.setProperty('--t', `${Math.round(rastgele(1100, 1900))}ms`);
        k.style.animationDelay = `${i * 60}ms`;
        k.addEventListener('animationend', () => { k.remove(); sinir.birak(); }, { once: true });
        ust.appendChild(k);
    }
});

// Balıklar (özgün, basit çizim): gövde, kuyruk, yüzgeç, göz, çizgi
const balikSvg = (govde, yuzgec, cizgi) => `<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 35 L2 14 Q8 35 2 56 Z" fill="${yuzgec}"/>
  <ellipse cx="62" cy="35" rx="46" ry="28" fill="${govde}"/>
  <path d="M52 9 Q66 -2 78 10 Z" fill="${yuzgec}"/>
  <path d="M58 12 Q48 35 58 58" stroke="${cizgi}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="90" cy="28" r="8" fill="#fff"/><circle cx="92" cy="28" r="4.5" fill="#0b3a53"/>
  <path d="M100 42 Q96 46 91 44" stroke="#0b3a53" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`;

if (!hareketAz()) {
    const arka = katman('balik', { arkada: true });
    [
        { ust: '22%', g: 86, t: 34, gecikme: -6, renk: ['#fb923c', '#f97316', '#fff7ed'] },
        { ust: '58%', g: 64, t: 46, gecikme: -30, renk: ['#facc15', '#eab308', '#38bdf8'], ters: true },
        { ust: '78%', g: 110, t: 58, gecikme: -12, renk: ['#a78bfa', '#7c3aed', '#fbcfe8'] },
    ].forEach(b => {
        const el = document.createElement('div');
        el.className = `balik${b.ters ? ' ters' : ''}`;
        el.style.setProperty('--ust', b.ust);
        el.style.setProperty('--g', `${b.g}px`);
        el.style.setProperty('--t', `${b.t}s`);
        el.style.setProperty('--gecikme', `${b.gecikme}s`);
        el.innerHTML = balikSvg(...b.renk);
        arka.appendChild(el);
    });
    sekmeGizlenince(() => document.documentElement.classList.add('tema-durgun'), () => document.documentElement.classList.remove('tema-durgun'));
}
