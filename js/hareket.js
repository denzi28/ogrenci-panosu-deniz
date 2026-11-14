// Hafif hareket yardımcıları. Sadece transform/opacity kullanır; "hareketi azalt" açıksa hiçbir şey canlanmaz.

export const hareketAz = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// Bir elemana tek seferlik animasyon sınıfı ekle (ör. 'zipla', 'damga'), bitince kaldır
export function oynat(el, sinif) {
    if (!el || hareketAz()) return;
    el.classList.remove(sinif);
    void el.offsetWidth; // aynı animasyon arka arkaya da oynasın
    el.classList.add(sinif);
    el.addEventListener('animationend', () => el.classList.remove(sinif), { once: true });
}

// Sayıyı eski değerden yenisine sayarak değiştir (ör. 12 → 14)
const sayiBicim = new Intl.NumberFormat('tr-TR');
export function sayiSay(el, hedef, baslangic = null, sure = 450) {
    if (!el) return;
    const bas = baslangic ?? (parseInt(String(el.textContent).replace(/\D/g, '')) || 0);
    if (hareketAz() || bas === hedef) { el.textContent = sayiBicim.format(hedef); return; }
    const t0 = performance.now();
    const adim = (t) => {
        const p = Math.min(1, (t - t0) / sure);
        const e = 1 - Math.pow(1 - p, 3); // yumuşak yavaşlama
        el.textContent = sayiBicim.format(Math.round(bas + (hedef - bas) * e));
        if (p < 1) requestAnimationFrame(adim);
    };
    requestAnimationFrame(adim);
}

// Kapsayıcıdaki [data-say] sayılarını sıfırdan saydır (sayfa açılışında)
export function sayilariSaydir(kok) {
    kok?.querySelectorAll('[data-say]').forEach(el => sayiSay(el, parseInt(el.dataset.say) || 0, 0, 600));
}

// Kutlama: elemanın ortasından 8 küçük altın yıldız saçılır
export function kutla(el) {
    if (!el || hareketAz()) return;
    const r = el.getBoundingClientRect();
    const kap = document.createElement('div');
    kap.className = 'kivilcimlar';
    kap.style.left = `${r.left + r.width / 2}px`;
    kap.style.top = `${r.top + r.height / 2}px`;
    const uzaklik = Math.max(28, Math.min(r.width, 80) * 0.8);
    for (let i = 0; i < 8; i++) {
        const k = document.createElement('span');
        k.className = 'kivilcim';
        k.style.setProperty('--aci', `${i * 45 + (Math.random() * 16 - 8)}deg`);
        k.style.setProperty('--uzaklik', `${uzaklik + Math.random() * 12}px`);
        kap.appendChild(k);
    }
    document.body.appendChild(kap);
    setTimeout(() => kap.remove(), 700);
}

// İçerik çizildikten hemen sonra çağrılır: giriş hareketi bir kez oynar, sonraki yeniden çizimlerde tekrarlanmaz
export function girisOynat(kapsayici) {
    if (!kapsayici || hareketAz()) return;
    kapsayici.classList.remove('giris');
    void kapsayici.offsetWidth;
    kapsayici.classList.add('giris');
    clearTimeout(kapsayici._girisZaman);
    kapsayici._girisZaman = setTimeout(() => kapsayici.classList.remove('giris'), 900);
}

// Kısa bildirim: ekranın altında birkaç saniye görünür (ör. "Ada, Kitap Dostu rozetini kazandı")
export function bildirim(html, { sure = 4000, yildiz = true } = {}) {
    let kap = document.getElementById('bildirimler');
    if (!kap) {
        kap = Object.assign(document.createElement('div'), { id: 'bildirimler' });
        kap.setAttribute('aria-live', 'polite');
        document.body.appendChild(kap);
    }
    const b = document.createElement('div');
    b.className = 'bildirim';
    b.innerHTML = `${yildiz ? '<span class="yildiz-cikartma" aria-hidden="true"></span>' : ''}<span>${html}</span>`;
    kap.appendChild(b);
    if (yildiz) requestAnimationFrame(() => kutla(b.querySelector('.yildiz-cikartma')));
    setTimeout(() => { b.classList.add('gidiyor'); setTimeout(() => b.remove(), hareketAz() ? 0 : 250); }, sure);
}
