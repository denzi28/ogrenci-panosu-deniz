// Duyurular — veli görünümü (sadece velilere açılan duyurular)
import { db } from '../../js/db.js';
import { modulBasligi } from '../../js/arayuz.js';
import { yeniOnce, duyuruHtml } from './ortak.js';

export async function render(container) {
    const liste = yeniOnce(await db.getPublic('duyurular'));
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Duyurular', aciklama: 'Sınıf öğretmeninin velilere duyuruları' })}
        <section class="panel">
            ${liste.map(d => duyuruHtml(d)).join('') || '<p class="bos-not">Şu an velilere açık bir duyuru yok</p>'}
        </section>`;
}
