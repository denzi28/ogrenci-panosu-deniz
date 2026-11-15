// Öğrenciler — veli görünümü: sadece ad (okul numarası gizli bilgidir)
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { ogrencileriAyir } from './ortak.js';

export async function render(container) {
    const ogrenciler = ogrencileriAyir(await db.getAll('users')).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Sınıf listesi', aciklama: ogrenciler.length ? `Sınıfımızda ${sayi(ogrenciler.length)} öğrenci var` : '' })}
        <section class="panel">
            ${ogrenciler.map((o, i) => `
                <div class="satir">
                    <span class="ders-no">${i + 1}</span>
                    <span class="satir-ad">${esc(o.name)}</span>
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}
