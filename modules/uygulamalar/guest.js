// Etkileşimli görevler — veli görünümü: yayındaki görevlerin listesi (puanlar gösterilmez)
import { db } from '../../js/db.js';
import { esc, modulBasligi } from '../../js/arayuz.js';
import { KALEMLER, yayinDurumu, sureMetni } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('uygulamalar'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Etkileşimli görevler' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }
    const gorevler = (await db.getAll(KALEMLER)).filter(k => yayinDurumu(k) === 'yayinda');
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Etkileşimli görevler', aciklama: 'Öğrencilerin kendi hesaplarından oynadığı güncel oyunlar ve görevler' })}
        <section class="panel">
            ${gorevler.map(k => `
                <div class="ilan">
                    <div class="ilan-ust"><h3>${esc(k.ad)}</h3></div>
                    <div class="ilan-meta"><span>${sureMetni(k)}</span></div>
                    ${k.aciklama ? `<p class="ilan-metin">${esc(k.aciklama)}</p>` : ''}
                </div>`).join('') || '<p class="bos-not">Şu an yayında bir görev yok</p>'}
        </section>`;
}
