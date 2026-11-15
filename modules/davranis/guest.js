// Davranış panosu — veli görünümü (salt okunur sıralama)
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { verileriGetir, puanHaritasi, siralama, podyumHtml, toplamHtml, adHtml } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('davranis'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Davranış panosu' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }

    const { kriterler, ogrenciler, matris } = await verileriGetir();
    const liste = siralama(ogrenciler, kriterler, puanHaritasi(matris));

    container.innerHTML = `
        ${modulBasligi({ baslik: 'Davranış panosu', aciklama: 'Öğrencilerin sınıfta topladığı yıldızlar' })}
        ${liste.length ? `
            ${podyumHtml(liste)}
            <section class="panel">
                <div class="panel-ust"><h2>Sıralama</h2><small>${sayi(liste.length)} öğrenci</small></div>
                ${liste.map(o => `
                    <div class="satir">
                        <span class="satir-sira">${o.sira ?? '–'}</span>
                        <span class="satir-ad avatarli">${adHtml(o)}</span>
                        ${toplamHtml(o.toplam)}
                    </div>`).join('')}
            </section>` : `<div class="panel"><p class="bos-not">Henüz öğrenci yok</p></div>`}`;
}
