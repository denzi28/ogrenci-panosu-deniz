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

// Öğretmen sayfasında dokunma efekti yok (yıldız verirken, not girerken ekran sakin kalsın)
const ogretmenSayfasi = location.pathname.includes('teacher');

// Gerçek bir dokunuşta/tıklamada çalışır (fare, parmak, akıllı tahta kalemi); kaydırma ya da sürükleme sayılmaz:
// parmak kalkarken 12 pikselden az kaymış ve 600 ms'den kısa basılmış olmalı. Hareket azaltılmışsa ya da sakin yerdeyse çalışmaz.
export function dokununca(fn) {
    if (ogretmenSayfasi) return;
    const basislar = new Map();
    document.addEventListener('pointerdown', (e) => {
        if (e.button > 0 || hareketAz() || sakinMi(e.target)) return;
        basislar.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), hedef: e.target });
    }, { passive: true });
    document.addEventListener('pointerup', (e) => {
        const b = basislar.get(e.pointerId);
        basislar.delete(e.pointerId);
        if (!b || performance.now() - b.t > 600 || Math.hypot(e.clientX - b.x, e.clientY - b.y) > 12) return;
        fn({ clientX: e.clientX, clientY: e.clientY, target: b.hedef });
    }, { passive: true });
    document.addEventListener('pointercancel', (e) => basislar.delete(e.pointerId), { passive: true });
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
