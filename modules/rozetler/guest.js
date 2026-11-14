// Rozetler — veli görünümü (salt okunur)
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, sekmeler, baglaSekmeler } from '../../js/arayuz.js';
import { verileriGetir, sahiplik, sahipMi, kategoriyeGore, rozetGorseli, KATEGORILER } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('rozetler'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Rozetler' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }
    const { rozetler, ogrenciler, matris } = await verileriGetir();
    const sahip = sahiplik(matris);
    const liste = ogrenciler.map(o => ({ ...o, rozetleri: rozetler.filter(r => sahipMi(sahip, o.id, r.id)) }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    container.innerHTML = `
        ${modulBasligi({ baslik: 'Rozetler', aciklama: 'Öğrencilerin kazandığı rozetler' })}
        ${sekmeler([{ id: 'rv-ogrenciler', ad: 'Öğrenciler' }, { id: 'rv-katalog', ad: 'Rozet kataloğu' }], 'rv-ogrenciler')}
        <section class="panel" id="view-rv-ogrenciler">
            <div class="panel-ust"><h2>Öğrenciler</h2><small>${sayi(liste.length)} öğrenci</small></div>
            ${liste.map(o => `
                <div class="satir" style="flex-wrap:wrap;padding-top:12px;padding-bottom:12px">
                    <span class="satir-ad" style="flex-basis:160px">${esc(o.name)}<small>${sayi(o.rozetleri.length)} rozet</small></span>
                    <span class="madalya-serit">${o.rozetleri.map(r => `<span title="${esc(r.ad)}">${rozetGorseli(r, 32)}</span>`).join('')}</span>
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>
        <div id="view-rv-katalog" hidden>
            ${kategoriyeGore(rozetler).map(([kat, rl]) => `
                <section class="panel">
                    <div class="panel-ust"><h2><span class="kategori-nokta" style="background:${KATEGORILER[kat].renk}"></span>${KATEGORILER[kat].ad}</h2></div>
                    <div class="rozet-izgara">${rl.map(r => {
                        const alan = ogrenciler.filter(o => sahipMi(sahip, o.id, r.id)).length;
                        return `<div class="rozet-kart">${rozetGorseli(r, 64)}<strong>${esc(r.ad)}</strong><small>${esc(r.aciklama || '')}</small><small>${alan ? `${sayi(alan)} öğrenci kazandı` : 'Henüz kazanan yok'}</small></div>`;
                    }).join('')}</div>
                </section>`).join('') || '<div class="panel"><p class="bos-not">Henüz rozet yok</p></div>'}
        </div>`;
    baglaSekmeler(container);
}
