// Sihirli Bahçe teması: dokununca çiçek açar, yaprakları dökülür; bazen içinden kelebek uçar. Arkada bir kelebek dolaşır.
import { katman, dokununca, hareketAz, sinirli, rastgele, sekmeGizlenince } from './ortak.js';

const RENKLER = [['#f06292', '#ffd54f'], ['#ffb74d', '#fff3c4'], ['#ba68c8', '#fff59d'], ['#4fc3f7', '#ffee58'], ['#ef5350', '#fff8e1']];
const cicekSvg = (yaprak, orta) => `<svg viewBox="-30 -30 60 60" xmlns="http://www.w3.org/2000/svg">
  ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-14" rx="9" ry="13" fill="${yaprak}" transform="rotate(${a})"/>`).join('')}
  <circle r="9" fill="${orta}"/><circle r="9" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
  <circle cx="-3" cy="-3" r="2" fill="#fff" opacity=".8"/>
</svg>`;
const kelebekSvg = (renk) => `<svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
  <g class="kanat sol"><path d="M20 15 C10 0 0 4 3 13 C0 22 10 28 20 15 Z" fill="${renk}"/><circle cx="9" cy="10" r="2.5" fill="#fff" opacity=".7"/></g>
  <g class="kanat sag"><path d="M20 15 C30 0 40 4 37 13 C40 22 30 28 20 15 Z" fill="${renk}"/><circle cx="31" cy="10" r="2.5" fill="#fff" opacity=".7"/></g>
  <rect x="18.5" y="7" width="3" height="16" rx="1.5" fill="#3e2723"/>
  <path d="M19 8 Q16 2 14 2 M21 8 Q24 2 26 2" stroke="#3e2723" stroke-width="1.2" fill="none"/>
</svg>`;

const ust = katman('cicek');
const sinir = sinirli(60);
let sayac = 0;

function ekle(el, sure) {
    if (!sinir.al()) return false;
    ust.appendChild(el);
    setTimeout(() => { el.remove(); sinir.birak(); }, sure);
    return true;
}

dokununca((e) => {
    const [yaprak, orta] = RENKLER[Math.floor(Math.random() * RENKLER.length)];
    const c = document.createElement('i');
    c.className = 'cicek';
    c.style.left = `${e.clientX}px`;
    c.style.top = `${e.clientY}px`;
    c.innerHTML = cicekSvg(yaprak, orta);
    if (!ekle(c, 1600)) return;
    // Çiçek kapanırken yaprakları dökülür
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            const y = document.createElement('i');
            y.className = 'yaprakcik';
            y.style.left = `${e.clientX + rastgele(-12, 12)}px`;
            y.style.top = `${e.clientY + rastgele(-12, 12)}px`;
            y.style.setProperty('--renk', yaprak);
            y.style.setProperty('--x', `${Math.round(rastgele(-50, 50))}px`);
            y.style.setProperty('--y', `${Math.round(rastgele(50, 110))}px`);
            y.style.setProperty('--d', `${Math.round(rastgele(-200, 200))}deg`);
            ekle(y, 1350);
        }
    }, 1000);
    // Her üçüncü çiçekten bir kelebek uçar
    if (++sayac % 3 === 0) {
        const k = document.createElement('i');
        k.className = 'kelebek ucan';
        k.style.left = `${e.clientX - 17}px`;
        k.style.top = `${e.clientY - 12}px`;
        k.style.setProperty('--x', `${Math.round(rastgele(-80, 80))}px`);
        k.style.animationDelay = '400ms';
        k.style.opacity = '0';
        k.innerHTML = kelebekSvg(['#ff8a65', '#ba68c8', '#4fc3f7', '#ffd54f'][sayac % 4]);
        ekle(k, 2700);
    }
});

// Arkada dolaşan kelebek (içeriğin arkasında, boşluklarda görünür)
if (!hareketAz()) {
    const arka = katman('kelebek', { arkada: true });
    const k = document.createElement('div');
    k.className = 'kelebek gezgin';
    k.style.setProperty('--g', '42px');
    k.innerHTML = kelebekSvg('#f48fb1');
    arka.appendChild(k);
    sekmeGizlenince(() => document.documentElement.classList.add('tema-durgun'), () => document.documentElement.classList.remove('tema-durgun'));
}
