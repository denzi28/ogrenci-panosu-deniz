// Ödevler — öğrenci görünümü: ödevleri ve öğretmenin işaretlediği durumu
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, metinHtml } from '../../js/arayuz.js';
import { verileriGetir, durumAl, durumBilgi, ogrenciOzeti, teslimMetni, teslimEtiketi, gectiMi, odevBasligi } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('odevler'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Ödevlerim' })}<div class="panel"><p class="bos-not">Öğretmenin ödevleri güncelliyor, biraz sonra tekrar bak</p></div>`;
        return;
    }
    const benim = auth.currentUser?.id;
    const { odevler, harita } = await verileriGetir();
    const oz = ogrenciOzeti(benim, odevler, harita);
    const bakilan = oz.yapti + oz.eksik + oz.yapmadi;
    const kart = (o) => {
        const d = durumBilgi(durumAl(harita, benim, o.id));
        const etiket = d ? `<span class="etiket durum-${d.sinif}"><i class="fas ${d.ikon}"></i>${d.ogrenciAd}</span>` : teslimEtiketi(o);
        return `
        <article class="ilan">
            <div class="ilan-ust"><h3>${odevBasligi(o)}</h3>${etiket}</div>
            <div class="ilan-meta"><span>${teslimMetni(o)}</span></div>
            ${o.aciklama ? `<p class="ilan-metin">${metinHtml(o.aciklama)}</p>` : ''}
        </article>`;
    };
    const yaklasan = odevler.filter(o => !gectiMi(o)), gecmis = odevler.filter(gectiMi);
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Ödevlerim', aciklama: bakilan ? `Öğretmeninin baktığı ${sayi(bakilan)} ödevin ${sayi(oz.yapti)} tanesini tam yaptın` : 'Öğretmeninin verdiği ödevler' })}
        <section class="panel">
            <div class="panel-ust"><h2>Teslimi yaklaşan</h2></div>
            ${yaklasan.map(kart).join('') || '<p class="bos-not">Şu an bekleyen ödevin yok</p>'}
        </section>
        ${gecmis.length ? `<details class="panel acilir-panel"${oz.eksikler.length ? ' open' : ''}><summary class="panel-ust"><h2>Geçmiş ödevler</h2><small>${oz.eksikler.length ? `${oz.eksikler.length} eksiğin var` : `${gecmis.length} ödev`}</small></summary>${gecmis.slice(0, 40).map(kart).join('')}</details>` : ''}`;
}
