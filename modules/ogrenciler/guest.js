// Öğrenciler — veli görünümü: sadece ad ve okul numarası
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { noSirasi, ogrencileriAyir } from './ortak.js';

export async function render(container) {
    const ogrenciler = ogrencileriAyir(await db.getAll('users')).sort(noSirasi);
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Sınıf listesi', aciklama: ogrenciler.length ? `Sınıfımızda ${sayi(ogrenciler.length)} öğrenci var` : '' })}
        <section class="panel">
            ${ogrenciler.map(o => `
                <div class="satir">
                    <span class="ders-no" title="Okul numarası">${esc(o.okulno || '–')}</span>
                    <span class="satir-ad">${esc(o.name)}</span>
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}
