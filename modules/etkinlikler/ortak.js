// Etkinlikler: ortak hesaplar ve çizim (takvim yaprağı)
import { esc, metinHtml } from '../../js/arayuz.js';

const ay = new Intl.DateTimeFormat('tr-TR', { month: 'short' });
const gunAdi = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });
const saat = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

const gunBasi = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
// "2026-11-25" saat içermez: o günün sonuna kadar geçmiş sayılmaz
const saatVar = (t) => /T\d{2}:\d{2}/.test(String(t));
export const gectiMi = (e) => {
    const d = new Date(e.tarih);
    if (isNaN(d)) return false;
    return saatVar(e.tarih) ? d < new Date() : gunBasi(d) < gunBasi(new Date());
};

// Yaklaşanlar en yakından, geçmişler en yeniden başlayarak
export function ayir(liste) {
    const sirali = [...liste].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    return { yaklasan: sirali.filter(e => !gectiMi(e)), gecmis: sirali.filter(gectiMi).reverse() };
}

function kalanMetin(e) {
    const fark = Math.round((gunBasi(e.tarih) - gunBasi(new Date())) / 864e5);
    if (fark === 0) return 'Bugün';
    if (fark === 1) return 'Yarın';
    if (fark > 1 && fark < 7) return `${fark} gün sonra`;
    return '';
}

export function etkinlikHtml(e, { ogretmen = false } = {}) {
    const d = new Date(e.tarih);
    const gecti = gectiMi(e);
    const kalan = gecti ? '' : kalanMetin(e);
    const gecerli = !isNaN(d);
    return `
        <article class="ilan etkinlik${gecti ? ' gecti' : ''}" data-id="${esc(e.id)}">
            <div class="takvim-yaprak" aria-hidden="true">${gecerli ? `<small>${ay.format(d)}</small><b>${d.getDate()}</b>` : '<small>&nbsp;</small><b>?</b>'}</div>
            <div class="etkinlik-govde">
                <div class="ilan-ust">
                    <h3>${esc(e.baslik)}</h3>
                    ${kalan ? `<span class="etiket ${kalan === 'Bugün' ? 'okuyor' : 'okudu'}">${kalan}</span>` : ''}
                </div>
                <div class="ilan-meta">
                    ${gecerli ? `<span>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${gunAdi.format(d)}${saatVar(e.tarih) ? `, ${saat.format(d)}` : ''}</span>` : ''}
                    ${ogretmen ? `<span class="etiket ${e.visibleToGuest ? 'okudu' : 'rafta'}">${e.visibleToGuest ? 'Veliler de görüyor' : 'Sadece öğrenciler'}</span>` : ''}
                </div>
                ${e.detay ? `<p class="ilan-metin">${metinHtml(e.detay)}</p>` : ''}
                ${ogretmen ? `
                <div class="ilan-eylem">
                    <button type="button" class="yazi-dugme" data-islem="duzenle"><i class="fas fa-pen"></i>Düzenle</button>
                    <button type="button" class="yazi-dugme" data-islem="veli"><i class="fas ${e.visibleToGuest ? 'fa-eye-slash' : 'fa-eye'}"></i>${e.visibleToGuest ? 'Velilerden gizle' : 'Velilere göster'}</button>
                    <button type="button" class="yazi-dugme tehlike" data-islem="sil"><i class="fas fa-trash"></i>Sil</button>
                </div>` : ''}
            </div>
        </article>`;
}

// Yaklaşanlar paneli + geçmişler (kapalı açılır bölüm)
export function listeHtml(liste, { ogretmen = false, bosYazi = 'Planlanmış etkinlik yok' } = {}) {
    const { yaklasan, gecmis } = ayir(liste);
    return `
        <section class="panel">
            <div class="panel-ust"><h2>Yaklaşan</h2>${yaklasan.length ? `<small>${yaklasan.length} etkinlik</small>` : ''}</div>
            ${yaklasan.map(e => etkinlikHtml(e, { ogretmen })).join('') || `<p class="bos-not">${bosYazi}</p>`}
        </section>
        ${gecmis.length ? `
        <details class="panel acilir-panel">
            <summary class="panel-ust"><h2>Geçmiş etkinlikler</h2><small>${gecmis.length} etkinlik</small></summary>
            ${gecmis.map(e => etkinlikHtml(e, { ogretmen })).join('')}
        </details>` : ''}`;
}
