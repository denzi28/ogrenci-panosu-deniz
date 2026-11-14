// Modüllerin ortak kullandığı küçük arayüz yardımcıları.
import { db } from './db.js';

// Veritabanından gelen metni HTML'e güvenle basmak için
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);

// Modül başlığı: başlık, kısa açıklama ve sağda eylemler
export function modulBasligi({ baslik, aciklama = '', eylemler = '' }) {
    return `
        <header class="modul-ust">
            <div><h1>${baslik}</h1>${aciklama ? `<p>${aciklama}</p>` : ''}</div>
            ${eylemler ? `<div class="modul-ust-eylem">${eylemler}</div>` : ''}
        </header>`;
}

// "Velilere açık" anahtarı. Önce html'i sayfaya koyun, sonra baglaGorunurlukAnahtari(moduleId) çağırın.
export async function gorunurlukAnahtari(moduleId) {
    const acik = await db.getModuleVisibility(moduleId).catch(() => true);
    return `
        <label class="anahtar" title="Açıkken bu bölüm veliler tarafından da görülebilir">
            <input type="checkbox" id="gorunurluk-${moduleId}" ${acik ? 'checked' : ''}>
            <span class="anahtar-iz" aria-hidden="true"></span>
            <span>Velilere açık</span>
        </label>`;
}

export function baglaGorunurlukAnahtari(moduleId) {
    const kutu = document.getElementById(`gorunurluk-${moduleId}`);
    if (!kutu) return;
    kutu.addEventListener('change', async () => {
        kutu.disabled = true;
        try { await db.toggleModuleVisibility(moduleId, kutu.checked); }
        catch (e) { kutu.checked = !kutu.checked; alert('Kaydedilemedi, tekrar deneyin'); }
        kutu.disabled = false;
    });
}

// Sekmeler: [{ id, ad }] -> düğmeler. Seçilince ilgili #view-<id> görünür, diğerleri gizlenir.
export function sekmeler(liste, secili) {
    return `<div class="sekmeler" role="tablist">${liste.map(s =>
        `<button class="sekme" role="tab" data-sekme="${s.id}" aria-selected="${s.id === secili}">${s.ad}</button>`).join('')}</div>`;
}

export function baglaSekmeler(kapsayici, degisince) {
    kapsayici.querySelectorAll('.sekme').forEach(d => d.addEventListener('click', () => {
        kapsayici.querySelectorAll('.sekme').forEach(x => {
            const secili = x === d;
            x.setAttribute('aria-selected', secili);
            const gorunum = document.getElementById(`view-${x.dataset.sekme}`);
            if (gorunum) gorunum.hidden = !secili;
        });
        degisince?.(d.dataset.sekme);
    }));
}

// Kaydedilen satırı kısa süre işaretle
export function kaydedildiIsareti(eleman) {
    if (!eleman) return;
    eleman.classList.add('kaydedildi');
    setTimeout(() => eleman.classList.remove('kaydedildi'), 600);
}

// Yazdırma penceresi: tek tip, sade bir rapor sayfası
export function yazdir(baslik, govdeHtml) {
    const pencere = window.open('', '_blank');
    if (!pencere) { alert('Yazdırma penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol edin'); return; }
    pencere.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${esc(baslik)}</title>
        <style>
            body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1f1b16; padding: 24px; font-variant-numeric: tabular-nums; }
            h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
            .tarih { color: #5e554a; font-size: 13px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #ccc; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { font-weight: 600; color: #5e554a; font-size: 12px; }
            td.sag, th.sag { text-align: right; }
        </style></head><body>
        <h1>${esc(baslik)}</h1><div class="tarih">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        ${govdeHtml}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };<\/script>
        </body></html>`);
    pencere.document.close();
}
