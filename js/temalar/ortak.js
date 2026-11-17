// Etkileşimli temaların ortak yardımcıları (sadece tema önizlemesinde yüklenir, bkz. js/tema.js).
// Kurallar: sadece transform/opacity canlanır; "hareketi azalt" açıksa hiçbir şey oynamaz;
// form, tablo ve tam ekran araçlarda (yoklama, sayaç, rapor) dokunma efekti çıkmaz; veritabanına hiçbir şey yazılmaz.
import { hareketAz, oynat } from '../hareket.js';

export { hareketAz, oynat };

// Efektlerin çizildiği sabit katman. arkada=true: içeriğin arkasında (süs), değilse içeriğin üstünde (dokunma efektleri).
export function katman(ad, { arkada = false } = {}) {
    const k = document.createElement('div');
    k.className = `tema-katman tema-katman-${ad}${arkada ? ' arkada' : ''}`;
    k.setAttribute('aria-hidden', 'true');
    document.body.appendChild(k);
    return k;
}

// Dokunma efekti çıkmayacak yerler: yazı kutuları, formlar, tablolar, tam ekran araçlar, rapor
const SAKIN = 'input, select, textarea, label, form, table, [contenteditable], .katman, .rapor, .tema-secici';
export const sakinMi = (el) => !!el?.closest?.(SAKIN);

// Dokununca/tıklayınca çalışır (fare, parmak, akıllı tahta kalemi). Hareket azaltılmışsa ya da sakin yerdeyse çalışmaz.
export function dokununca(fn) {
    document.addEventListener('pointerdown', (e) => {
        if (e.button > 0 || hareketAz() || sakinMi(e.target)) return;
        fn(e);
    }, { passive: true });
}

// Sekme arkadayken süs hareketleri dursun (pil ve işlemci için)
export function sekmeGizlenince(durdur, devam) {
    document.addEventListener('visibilitychange', () => (document.hidden ? durdur() : devam()));
}

// Aynı anda en fazla `ust` parça: fazlası çizilmez (eski tahtalarda takılma olmasın)
export function sinirli(ust) {
    let canli = 0;
    return {
        al() { if (canli >= ust) return false; canli++; return true; },
        birak() { canli = Math.max(0, canli - 1); },
    };
}

export const rastgele = (a, b) => a + Math.random() * (b - a);
