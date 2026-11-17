// Piksel Dünyası: gökte kesik kesik ilerleyen piksel bulutlar; dokununca piksel yıldız ve kalpler saçılır.
// Çizimler box-shadow ile yapılan küçük, özgün piksel desenleridir (hiçbir oyundan alınmadı).
import { katman, dokununca, hareketAz, sinirli, rastgele, sekmeGizlenince } from './ortak.js';

// Desen: her satır bir piksel sırası; harf = renk, nokta = boş
const DESEN = {
    yildiz: ['...a...', '...a...', 'aaaaaaa', '.aaaaa.', '..aaa..', '.aa.aa.', 'a.....a'],
    kalp: ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
    elmas: ['...a...', '..aaa..', '.aaaaa.', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
    bulut: ['....aaaa......', '..aaaaaaaa.aa.', '.aaaaaaaaaaaaa', 'aaaaaaaaaaaaaa', '.aaaaaaaaaaaa.'],
};
// box-shadow ile piksel çizim: her dolu kare bir gölge (bir kare kaydırılmış: gölge kutunun altına çizilmez)
function cizim(desen, renk, boy) {
    const g = [];
    desen.forEach((satir, y) => [...satir].forEach((h, x) => { if (h !== '.') g.push(`${(x + 1) * boy}px ${(y + 1) * boy}px 0 ${renk}`); }));
    return g.join(',');
}

const ust = katman('piksel');
const sinir = sinirli(40);
const PARCALAR = [['yildiz', '#facc15'], ['kalp', '#f43f5e'], ['elmas', '#38bdf8'], ['yildiz', '#a3e635'], ['kalp', '#c084fc']];
dokununca((e) => {
    const adet = 7;
    for (let i = 0; i < adet; i++) {
        if (!sinir.al()) break;
        const [ad, renk] = PARCALAR[Math.floor(Math.random() * PARCALAR.length)];
        const p = document.createElement('i');
        const a = (i / adet) * Math.PI * 2 + rastgele(-.25, .25), r = rastgele(60, 110);
        p.className = 'piksel-parca';
        p.style.left = `${e.clientX}px`; p.style.top = `${e.clientY}px`;
        p.style.boxShadow = cizim(DESEN[ad], renk, 4);
        p.style.background = 'transparent';
        // Dörde bölünmüş adımlarla (8-bit gibi) uzaklaşır
        p.style.setProperty('--dx', `${Math.round(Math.cos(a) * r / 4) * 4}px`);
        p.style.setProperty('--dy', `${Math.round(Math.sin(a) * r / 4) * 4}px`);
        p.addEventListener('animationend', () => { p.remove(); sinir.birak(); }, { once: true });
        ust.appendChild(p);
    }
});

if (!hareketAz()) {
    const arka = katman('piksel-gok', { arkada: true });
    [{ ust: '10%', t: 60, adim: 120, gecikme: -10, boy: 8 }, { ust: '30%', t: 85, adim: 140, gecikme: -50, boy: 6 }, { ust: '62%', t: 110, adim: 160, gecikme: -30, boy: 5 }].forEach(b => {
        const el = document.createElement('div');
        el.className = 'piksel-bulut';
        el.style.width = el.style.height = `${b.boy}px`;
        el.style.boxShadow = cizim(DESEN.bulut, '#ffffff', b.boy);
        Object.entries({ '--ust': b.ust, '--t': `${b.t}s`, '--adim': b.adim, '--gecikme': `${b.gecikme}s` }).forEach(([k, v]) => el.style.setProperty(k, v));
        arka.appendChild(el);
    });
    sekmeGizlenince(() => document.documentElement.classList.add('tema-durgun'), () => document.documentElement.classList.remove('tema-durgun'));
}
