// Duyurular: öğretmen, öğrenci ve veli görünümlerinin ortak çizimi
import { esc, metinHtml, guvenliAdres, tarihMetni } from '../../js/arayuz.js';

export const yeniOnce = (liste) => [...liste].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Son 3 gün içinde eklenen duyuru "yeni" sayılır
const YENI_GUN = 3;
const yeniMi = (d) => (Date.now() - new Date(d.createdAt)) / 864e5 < YENI_GUN;

export function duyuruHtml(d, { ogretmen = false } = {}) {
    const adres = guvenliAdres(d.link);
    return `
        <article class="ilan" data-id="${esc(d.id)}">
            <div class="ilan-ust">
                <h3>${esc(d.baslik)}</h3>
                ${!ogretmen && yeniMi(d) ? '<span class="etiket yeni">Yeni</span>' : ''}
            </div>
            <div class="ilan-meta">
                <span>${tarihMetni(d.createdAt)}</span>
                ${ogretmen ? `<span class="etiket ${d.visibleToGuest ? 'okudu' : 'rafta'}">${d.visibleToGuest ? 'Veliler de görüyor' : 'Sadece öğrenciler'}</span>` : ''}
            </div>
            ${d.icerik ? `<p class="ilan-metin">${metinHtml(d.icerik)}</p>` : ''}
            ${adres ? `<a class="btn btn-secondary btn-kucuk ilan-baglanti" href="${esc(adres)}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i>Bağlantıyı aç</a>` : ''}
            ${ogretmen ? `
            <div class="ilan-eylem">
                <button type="button" class="yazi-dugme" data-islem="duzenle"><i class="fas fa-pen"></i>Düzenle</button>
                <button type="button" class="yazi-dugme" data-islem="veli"><i class="fas ${d.visibleToGuest ? 'fa-eye-slash' : 'fa-eye'}"></i>${d.visibleToGuest ? 'Velilerden gizle' : 'Velilere göster'}</button>
                <button type="button" class="yazi-dugme tehlike" data-islem="sil"><i class="fas fa-trash"></i>Sil</button>
            </div>` : ''}
        </article>`;
}
