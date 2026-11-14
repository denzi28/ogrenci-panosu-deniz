// Duyurular — öğrenci görünümü
import { db } from '../../js/db.js';
import { modulBasligi } from '../../js/arayuz.js';
import { yeniOnce, duyuruHtml } from './ortak.js';

export async function render(container) {
    const liste = yeniOnce(await db.getAll('duyurular'));
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Duyurular', aciklama: 'Öğretmeninin sınıfa duyuruları' })}
        <section class="panel">
            ${liste.map(d => duyuruHtml(d)).join('') || '<p class="bos-not">Henüz duyuru yok</p>'}
        </section>`;
}
