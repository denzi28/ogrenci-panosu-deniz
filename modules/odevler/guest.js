// Ödevler — veli görünümü: verilen ödevler ve teslim tarihleri (kim yaptı gösterilmez)
import { db } from '../../js/db.js';
import { modulBasligi, metinHtml } from '../../js/arayuz.js';
import { KALEMLER, teslimSirasi, teslimMetni, teslimEtiketi, gectiMi, odevBasligi } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('odevler'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Ödevler' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }
    const odevler = teslimSirasi(await db.getAll(KALEMLER));
    const kart = (o) => `
        <article class="ilan">
            <div class="ilan-ust"><h3>${odevBasligi(o)}</h3>${teslimEtiketi(o)}</div>
            <div class="ilan-meta"><span>${teslimMetni(o)}</span></div>
            ${o.aciklama ? `<p class="ilan-metin">${metinHtml(o.aciklama)}</p>` : ''}
        </article>`;
    const yaklasan = odevler.filter(o => !gectiMi(o)), gecmis = odevler.filter(gectiMi);
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Ödevler', aciklama: 'Sınıfa verilen ödevler ve teslim tarihleri' })}
        <section class="panel">
            <div class="panel-ust"><h2>Teslimi yaklaşan</h2></div>
            ${yaklasan.map(kart).join('') || '<p class="bos-not">Şu an bekleyen ödev yok</p>'}
        </section>
        ${gecmis.length ? `<details class="panel acilir-panel"><summary class="panel-ust"><h2>Geçmiş ödevler</h2><small>${gecmis.length} ödev</small></summary>${gecmis.slice(0, 30).map(kart).join('')}</details>` : ''}`;
}
