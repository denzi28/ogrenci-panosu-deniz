// SINIF OYUNLARI MOTORU
// Bütün oyunlar aynı çerçeveyi kullanır: başlangıç ekranı, puan/ilerleme çubuğu, seri (üst üste doğru),
// sesler, yıldız patlaması, övgü yazıları ve yıldızlı bitiş ekranı.
// Siteyle iletişim eskisiyle aynıdır: window.parent.postMessage({ islem: 'gorev_bitti' | 'puan_guncelle', puan, limit })
//
// Hareket: sadece transform/opacity; "hareketi azalt" açıksa efektler kapanır. Döngüde çalışan animasyon yoktur.

export const karistir = (dizi) => {
    const a = [...dizi];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
export const rastgele = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const hareketAz = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export { esc };

// ------------------------------------------------------------------ SES (dosya yok, tarayıcı üretir)
const SES_ANAHTAR = 'oyun-ses-kapali';
export const ses = {
    ctx: null,
    kapali: (() => { try { return localStorage.getItem(SES_ANAHTAR) === '1'; } catch { return false; } })(),
    ac() {
        try {
            this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch { /* ses yoksa oyun yine çalışır */ }
    },
    degistir() {
        this.kapali = !this.kapali;
        try { localStorage.setItem(SES_ANAHTAR, this.kapali ? '1' : '0'); } catch { }
        return this.kapali;
    },
    nota(frekans, { gecikme = 0, sure = 0.15, tip = 'sine', guc = 0.12, kayma = null } = {}) {
        if (this.kapali || !this.ctx) return;
        try {
            const t = this.ctx.currentTime + gecikme;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = tip;
            o.frequency.setValueAtTime(frekans, t);
            if (kayma) o.frequency.exponentialRampToValueAtTime(kayma, t + sure);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(guc, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + sure + 0.02);
        } catch { }
    },
    // Seri arttıkça doğru sesi bir basamak tizleşir
    dogru(seri = 1) {
        const taban = [523, 587, 659, 698, 784, 880][Math.min(seri - 1, 5)];
        this.nota(taban, { sure: 0.12 });
        this.nota(taban * 1.5, { gecikme: 0.08, sure: 0.2 });
    },
    yanlis() { this.nota(240, { sure: 0.22, tip: 'triangle', guc: 0.15, kayma: 150 }); },
    tik() { this.nota(880, { sure: 0.05, tip: 'triangle', guc: 0.05 }); },
    yildiz(i) { this.nota([659, 784, 988][i] || 988, { sure: 0.25, guc: 0.1 }); },
    bitis() { [523, 659, 784, 1047].forEach((f, i) => this.nota(f, { gecikme: i * 0.11, sure: 0.3 })); },
    uyari() { this.nota(440, { sure: 0.08, tip: 'square', guc: 0.04 }); },
};

const OVGULER = ['Süper!', 'Harika!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Çok iyi!', 'Tam isabet!'];
const TESELLI = ['Olsun, devam!', 'Bir dahakine!', 'Az kaldı!', 'Sen yaparsın!'];
const sec = (l) => l[Math.floor(Math.random() * l.length)];

// ------------------------------------------------------------------ OYUN ÇERÇEVESİ
export class Oyun {
    /**
     * @param {object} a
     *  baslik, maskot (emoji), renk (#hex), nasil (kısa kural yazısı)
     *  toplam: ilerleme çubuğunun sonu (soru sayısı ya da hedef puan), ilerlemeTuru: 'soru' | 'puan' | null
     *  limit: siteye gönderilen en yüksek puan (yoksa sadece puan gönderilir)
     *  bitirDugmesi: oyun ortasında "Bitir ve kaydet" düğmesi gösterilsin mi
     *  canliKayit: her doğruda 'puan_guncelle' gönderilsin mi
     *  baslat: başla düğmesine basılınca çağrılır
     */
    constructor(a) {
        this.a = { ilerlemeTuru: 'soru', bitirDugmesi: false, canliKayit: false, ...a };
        this.puan = 0; this.seri = 0; this.enUzunSeri = 0; this.dogruSayisi = 0; this.yanlisSayisi = 0;
        this.adim = 0; this.bitti = false;
        document.title = a.baslik;
        document.documentElement.style.setProperty('--renk', a.renk || '#7c3aed');
        document.body.innerHTML = `
            <div class="sahne">
                <header class="ust" hidden>
                    <span class="maskot" aria-hidden="true">${a.maskot || '⭐'}</span>
                    <div class="ilerleme" role="progressbar" aria-label="İlerleme"><span></span><b class="ilerleme-yazi"></b></div>
                    <div class="seri" aria-live="polite" hidden><span aria-hidden="true">🔥</span><b>0</b></div>
                    <div class="puan" aria-label="Puan"><span aria-hidden="true">⭐</span><b>0</b></div>
                    <button type="button" class="kucuk-dugme ses-dugme" aria-label="Sesi aç/kapat"></button>
                    ${a.bitirDugmesi ? '<button type="button" class="kucuk-dugme bitir-dugme">Bitir</button>' : ''}
                </header>
                <main class="alan" id="alan"></main>
                <div class="ovgu" aria-live="polite"></div>
            </div>
            <section class="perde giris-perdesi">
                <div class="perde-kart">
                    <div class="buyuk-maskot" aria-hidden="true">${a.maskot || '⭐'}</div>
                    <h1>${esc(a.baslik)}</h1>
                    <p>${a.nasil || ''}</p>
                    ${a.hedefYazi ? `<div class="hedef-yazi">${a.hedefYazi}</div>` : ''}
                    <button type="button" class="dev-dugme" id="basla">Başla</button>
                </div>
            </section>`;
        this.alan = document.getElementById('alan');
        this.ust = document.querySelector('.ust');
        this.sesDugme = document.querySelector('.ses-dugme');
        this.sesDugmeCiz();
        this.sesDugme.addEventListener('click', () => { ses.ac(); ses.degistir(); this.sesDugmeCiz(); });
        document.querySelector('.bitir-dugme')?.addEventListener('click', () => {
            if (this.puan === 0 || confirm(`${this.puan} puanla bitirip kaydedelim mi?`)) this.bitir();
        });
        const basla = document.getElementById('basla');
        basla.addEventListener('click', () => this.basla());
        document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && document.querySelector('.giris-perdesi')) { e.preventDefault(); this.basla(); } });
        // Odak oyuna kendiliğinden alınmaz: site içinde açılınca Esc ile kapatma çalışsın
    }

    sesDugmeCiz() { this.sesDugme.textContent = ses.kapali ? '🔇' : '🔊'; this.sesDugme.title = ses.kapali ? 'Sesi aç' : 'Sesi kapat'; }

    basla() {
        const perde = document.querySelector('.giris-perdesi');
        if (!perde) return;
        ses.ac(); ses.tik();
        perde.classList.add('gidiyor');
        setTimeout(() => perde.remove(), hareketAz() ? 0 : 250);
        this.ust.hidden = false;
        this.ilerlemeCiz();
        this.a.baslat?.(this);
    }

    // ------------------------------------------------ puan ve ilerleme
    ilerlemeCiz() {
        const { toplam, ilerlemeTuru } = this.a;
        const cubuk = this.ust.querySelector('.ilerleme');
        if (!toplam || !ilerlemeTuru) { cubuk.hidden = true; return; }
        const deger = ilerlemeTuru === 'puan' ? this.puan : this.adim;
        cubuk.querySelector('span').style.transform = `scaleX(${Math.min(1, deger / toplam)})`;
        cubuk.querySelector('.ilerleme-yazi').textContent = ilerlemeTuru === 'puan' ? `${this.puan} / ${toplam}` : `${Math.min(this.adim + (this.bitti ? 0 : 1), toplam)} / ${toplam}`;
        cubuk.setAttribute('aria-valuenow', deger); cubuk.setAttribute('aria-valuemax', toplam);
    }
    puanCiz(fark) {
        const b = this.ust.querySelector('.puan b');
        b.textContent = this.puan;
        const kutu = this.ust.querySelector('.puan');
        oynat(kutu, fark >= 0 ? 'zipla' : 'sars');
        if (fark) this.ucanYazi(kutu, `${fark > 0 ? '+' : ''}${fark}`, fark > 0 ? 'arti' : 'eksi');
        this.ilerlemeCiz();
    }
    // Puan, sitedeki en yüksek puanı (limit) geçmez: 105/100 yerine 100/100
    puanEkle(n) {
        const once = this.puan;
        this.puan = this.a.limit ? Math.min(this.puan + n, this.a.limit) : this.puan + n;
        this.puanCiz(this.puan - once);
        if (this.a.canliKayit) this.gonder('puan_guncelle');
    }
    puanDus(n) { const once = this.puan; this.puan = Math.max(0, this.puan - n); if (once !== this.puan) { this.puanCiz(this.puan - once); if (this.a.canliKayit) this.gonder('puan_guncelle'); } }
    sonraki() { this.adim++; this.ilerlemeCiz(); }

    // ------------------------------------------------ geri bildirim
    dogru(el, { puan = 0, sessiz = false } = {}) {
        this.seri++; this.dogruSayisi++;
        this.enUzunSeri = Math.max(this.enUzunSeri, this.seri);
        if (!sessiz) ses.dogru(this.seri);
        if (el) { el.classList.add('dogru'); oynat(el, 'zipla'); yildizPatlat(el); }
        oynat(this.ust.querySelector('.maskot'), 'sevin');
        this.seriCiz();
        this.ovgu([3, 5, 7, 10, 15, 20].includes(this.seri)
            ? `${this.seri} doğru üst üste! 🔥` : sec(OVGULER), 'iyi');
        if (puan) this.puanEkle(puan);
    }
    yanlis(el, { ceza = 0, dogruEl = null } = {}) {
        this.seri = 0; this.yanlisSayisi++;
        ses.yanlis();
        if (el) { el.classList.add('yanlis'); oynat(el, 'sars'); }
        if (dogruEl) dogruEl.classList.add('dogru', 'goster');
        oynat(this.ust.querySelector('.maskot'), 'uz');
        this.seriCiz();
        this.ovgu(sec(TESELLI), 'kotu');
        if (ceza) this.puanDus(ceza);
    }
    seriCiz() {
        const s = this.ust.querySelector('.seri');
        s.hidden = this.seri < 2;
        s.querySelector('b').textContent = this.seri;
        if (this.seri >= 2) oynat(s, 'zipla');
    }
    ovgu(yazi, tur) {
        const o = document.querySelector('.ovgu');
        o.textContent = yazi;
        o.className = `ovgu ${tur}`;
        void o.offsetWidth;
        o.classList.add('goster');
        clearTimeout(this._ovguZaman);
        this._ovguZaman = setTimeout(() => o.classList.remove('goster'), 900);
    }
    ucanYazi(yakin, yazi, tur) {
        if (hareketAz()) return;
        const r = yakin.getBoundingClientRect();
        const s = document.createElement('span');
        s.className = `ucan-yazi ${tur}`;
        s.textContent = yazi;
        s.style.left = `${r.left + r.width / 2}px`; s.style.top = `${r.bottom}px`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 800);
    }

    // ------------------------------------------------ siteyle iletişim
    gonder(islem) {
        if (window.parent === window) return;
        const veri = { islem, puan: this.puan };
        if (this.a.limit) veri.limit = this.a.limit;
        window.parent.postMessage(veri, '*');
    }

    // ------------------------------------------------ bitiş
    // kaydet: false ise siteye puan gönderilmez (ör. baraj geçilemedi), tekrar oynanır
    bitir({ kaydet = true, baslik = null, mesaj = null } = {}) {
        if (this.bitti) return;
        this.bitti = true;
        this.ilerlemeCiz();
        if (kaydet) this.gonder('gorev_bitti');
        const oran = this.a.limit ? this.puan / this.a.limit : null;
        const yildiz = !kaydet ? 0 : oran === null ? (this.puan >= 100 ? 3 : this.puan >= 50 ? 2 : this.puan > 0 ? 1 : 0)
            : oran >= 0.9 ? 3 : oran >= 0.6 ? 2 : oran > 0 ? 1 : 0;
        const varsayilanBaslik = !kaydet ? 'Bir daha deneyelim!' : yildiz === 3 ? 'Muhteşemsin!' : yildiz === 2 ? 'Çok iyi gidiyorsun!' : yildiz === 1 ? 'Güzel başlangıç!' : 'Bitti!';
        const perde = document.createElement('section');
        perde.className = 'perde bitis-perdesi';
        perde.innerHTML = `
            <div class="perde-kart">
                <div class="yildizlar">${[0, 1, 2].map(i => `<span class="by${i < yildiz ? ' dolu' : ''}" style="--i:${i}">★</span>`).join('')}</div>
                <h1>${baslik || varsayilanBaslik}</h1>
                <div class="sonuc-puan"><b>${this.puan}</b>${this.a.limit ? `<small>/ ${this.a.limit}</small>` : '<small>puan</small>'}</div>
                <div class="istatistik">
                    <span><b>${this.dogruSayisi}</b> doğru</span>
                    ${this.yanlisSayisi ? `<span><b>${this.yanlisSayisi}</b> yanlış</span>` : ''}
                    ${this.enUzunSeri >= 3 ? `<span><b>${this.enUzunSeri}</b> en uzun seri 🔥</span>` : ''}
                </div>
                <p>${mesaj || (kaydet ? (window.parent !== window ? 'Puanın kaydedildi' : '') : '')}</p>
                ${!kaydet || window.parent === window ? '<button type="button" class="dev-dugme" id="tekrar">Tekrar oyna</button>' : ''}
            </div>`;
        document.body.appendChild(perde);
        perde.querySelector('#tekrar')?.addEventListener('click', () => location.reload());
        ses.bitis();
        if (yildiz) { [0, 1, 2].slice(0, yildiz).forEach(i => setTimeout(() => ses.yildiz(i), 450 + i * 220)); konfeti(); }
    }
}

// ------------------------------------------------------------------ EFEKTLER
export function oynat(el, sinif) {
    if (!el || hareketAz()) return;
    el.classList.remove(sinif); void el.offsetWidth; el.classList.add(sinif);
    el.addEventListener('animationend', () => el.classList.remove(sinif), { once: true });
}

export function yildizPatlat(el, adet = 8) {
    if (!el || hareketAz()) return;
    const r = el.getBoundingClientRect();
    const kap = document.createElement('div');
    kap.className = 'patlama';
    kap.style.left = `${r.left + r.width / 2}px`; kap.style.top = `${r.top + r.height / 2}px`;
    const uzak = Math.max(40, Math.min(r.width, 160) * 0.6);
    for (let i = 0; i < adet; i++) {
        const k = document.createElement('span');
        k.style.setProperty('--aci', `${i * (360 / adet) + Math.random() * 20 - 10}deg`);
        k.style.setProperty('--uzak', `${uzak + Math.random() * 20}px`);
        kap.appendChild(k);
    }
    document.body.appendChild(kap);
    setTimeout(() => kap.remove(), 700);
}

// Bitişte kısa konfeti: 60 parça, tek seferlik, sadece transform
export function konfeti() {
    if (hareketAz()) return;
    const kap = document.createElement('div');
    kap.className = 'konfeti';
    const renkler = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('i');
        p.style.left = `${Math.random() * 100}%`;
        p.style.background = renkler[i % renkler.length];
        p.style.setProperty('--x', `${Math.random() * 160 - 80}px`);
        p.style.setProperty('--d', `${Math.random() * 720 - 360}deg`);
        p.style.animationDelay = `${Math.random() * 400}ms`;
        p.style.animationDuration = `${1600 + Math.random() * 1000}ms`;
        kap.appendChild(p);
    }
    document.body.appendChild(kap);
    setTimeout(() => kap.remove(), 3200);
}

// ------------------------------------------------------------------ ÇOKTAN SEÇMELİ OYUN
/**
 * Hazır soru-cevap oyunu.
 *  sorular(): soru listesi üretir. Her soru: { soru, ust?, ikon?, secenekler: [string | {deger, yazi}], dogru }
 *    soru içinde {?} varsa orası boşluk kutusu olur ve cevaplanınca seçilen işaret oraya yazılır.
 *  mod: 'sabit'  -> soru sayısı kadar soru; yanlışta doğrusu gösterilir ve geçilir
 *       'hedef'  -> hedef puana ulaşana kadar; yanlışta aynı soru tekrar denenir (yanlış şık kapanır)
 *  dogruPuan, yanlisCeza, hedef (mod hedef), baraj (sabit modda geçme puanı; altında kalırsa kaydedilmez)
 *  duzen: 'iki' | 'uc' | 'dort' | 'liste' | 'kategori'  (şıkların dizilişi)
 *  soruBoyu: 'buyuk' (tek kelime/sayı) | 'metin' (cümle)
 */
export function secmeli(a) {
    const ayar = { mod: 'sabit', dogruPuan: 10, yanlisCeza: 0, duzen: 'dort', soruBoyu: 'buyuk', ...a };
    let liste = [], sira = 0, kilit = false;

    const oyun = new Oyun({
        ...ayar,
        toplam: ayar.mod === 'hedef' ? ayar.hedef : ayar.soruSayisi,
        ilerlemeTuru: ayar.mod === 'hedef' ? 'puan' : 'soru',
        bitirDugmesi: ayar.mod === 'hedef',
        canliKayit: ayar.mod === 'hedef',
        baslat: () => { liste = ayar.sorular(); goster(); },
    });

    const secenekDeger = (s) => typeof s === 'object' ? s.deger : s;
    const secenekYazi = (s) => typeof s === 'object' ? (s.yazi ?? s.deger) : s;

    function goster() {
        if (ayar.mod === 'hedef' && sira >= liste.length) { liste = ayar.sorular(); sira = 0; }
        const q = liste[sira];
        kilit = false;
        const soruHtml = esc(q.soru).replace('{?}', '<span class="bosluk">?</span>');
        oyun.alan.innerHTML = `
            <div class="soru-kart ${ayar.soruBoyu}">
                ${q.ust ? `<div class="soru-ust">${q.ust}</div>` : ''}
                ${q.ikon ? `<div class="soru-ikon" aria-hidden="true">${q.ikon}</div>` : ''}
                <div class="soru-metin">${soruHtml}</div>
            </div>
            <div class="secenekler ${ayar.duzen}">
                ${q.secenekler.map((s, i) => `<button type="button" class="secenek" data-i="${i}"${typeof s === 'object' && s.renk ? ` style="--srenk:${s.renk}"` : ''}>
                    <kbd aria-hidden="true">${i + 1}</kbd><span>${typeof s === 'object' && s.html ? s.html : esc(secenekYazi(s))}</span></button>`).join('')}
            </div>`;
        oynat(oyun.alan.querySelector('.soru-kart'), 'gelis');
    }

    function cevapla(btn) {
        if (kilit || !btn || btn.disabled || oyun.bitti) return;
        const q = liste[sira];
        const secilen = secenekDeger(q.secenekler[+btn.dataset.i]);
        const dogruMu = secilen === q.dogru;
        const bosluk = oyun.alan.querySelector('.bosluk');
        kilit = true;
        if (dogruMu) {
            if (bosluk) { bosluk.textContent = secenekYazi(q.secenekler[+btn.dataset.i]); bosluk.classList.add('dolu'); }
            oyun.dogru(btn, { puan: ayar.dogruPuan });
            setTimeout(ilerle, 900);
        } else if (ayar.mod === 'hedef') {
            oyun.yanlis(btn, { ceza: ayar.yanlisCeza });
            btn.disabled = true;
            setTimeout(() => { kilit = false; }, 400);
        } else {
            const dogruBtn = [...oyun.alan.querySelectorAll('.secenek')].find(b => secenekDeger(q.secenekler[+b.dataset.i]) === q.dogru);
            if (bosluk) { bosluk.textContent = secenekYazi(q.secenekler.find(s => secenekDeger(s) === q.dogru)); bosluk.classList.add('duzeltme'); }
            oyun.yanlis(btn, { ceza: ayar.yanlisCeza, dogruEl: dogruBtn });
            setTimeout(ilerle, 1500);
        }
    }

    function ilerle() {
        if (oyun.bitti) return;
        sira++;
        if (ayar.mod === 'hedef') {
            if (oyun.puan >= ayar.hedef) return oyun.bitir();
            return goster();
        }
        oyun.sonraki();
        if (sira >= ayar.soruSayisi) {
            if (ayar.baraj && oyun.puan < ayar.baraj)
                return oyun.bitir({ kaydet: false, mesaj: `Geçmek için en az ${ayar.baraj} puan gerekiyor. Sen ${oyun.puan} puan aldın, tekrar dene` });
            return oyun.bitir();
        }
        goster();
    }

    oyun.alan.addEventListener('click', (e) => cevapla(e.target.closest('.secenek')));
    document.addEventListener('keydown', (e) => {
        if (!/^[1-9]$/.test(e.key) || document.querySelector('.perde')) return;
        cevapla(oyun.alan.querySelector(`.secenek[data-i="${+e.key - 1}"]`));
    });
    return oyun;
}

// ------------------------------------------------------------------ RAKAM TUŞ TAKIMI
// Ekrandaki tuş takımı + klavye. tusla(rakam), sil(), tamam() çağrılarını yapar.
export function tusTakimi(kap, { tusla, sil, tamam, tamamYazi = 'Kontrol et' }) {
    kap.innerHTML = `
        <div class="tuslar">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="tus" data-tus="${n}">${n}</button>`).join('')}
            <button type="button" class="tus ikincil" data-tus="sil" aria-label="Sil">⌫</button>
            <button type="button" class="tus" data-tus="0">0</button>
            ${tamam ? `<button type="button" class="tus tamam" data-tus="tamam" aria-label="${tamamYazi}">✔</button>` : '<span></span>'}
        </div>`;
    kap.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tus]');
        if (!t) return;
        oynat(t, 'bas');
        if (t.dataset.tus === 'sil') sil?.();
        else if (t.dataset.tus === 'tamam') tamam?.();
        else { ses.tik(); tusla(+t.dataset.tus); }
    });
    document.addEventListener('keydown', (e) => {
        if (document.querySelector('.perde')) return;
        if (/^[0-9]$/.test(e.key)) { ses.tik(); tusla(+e.key); oynat(kap.querySelector(`[data-tus="${e.key}"]`), 'bas'); }
        else if (e.key === 'Backspace') { e.preventDefault(); sil?.(); }
        else if (e.key === 'Enter') { e.preventDefault(); tamam?.(); }
    });
}
