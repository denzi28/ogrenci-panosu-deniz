// İhtiyaçlar — veli görünümü: sınıfın ortak ihtiyaçları ve kaç öğrencinin getirdiği (kim getirdi gösterilmez)
import { db } from '../../js/db.js';
import { modulBasligi } from '../../js/arayuz.js';
import { verileriGetir, kalemOzeti, ilerlemeHtml, kalemAdi } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('ihtiyaclar'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'İhtiyaçlar' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }
    const { kalemler, ogrenciler, harita } = await verileriGetir();
    container.innerHTML = `
        ${modulBasligi({ baslik: 'İhtiyaçlar', aciklama: 'Dönem boyunca sınıfta ortak kullanılacak malzemeler' })}
        <section class="panel">
            ${kalemler.map(k => `
                <div class="satir">
                    <span class="satir-ad">${kalemAdi(k)}</span>
                    ${ilerlemeHtml(kalemOzeti(k, ogrenciler, harita), ogrenciler.length)}
                </div>`).join('') || '<p class="bos-not">Şu an listelenmiş bir ihtiyaç yok</p>'}
        </section>`;
}
