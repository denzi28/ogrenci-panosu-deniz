// Beslenme programı — öğrenci görünümü
import { db } from '../../js/db.js';
import { esc, modulBasligi } from '../../js/arayuz.js';
import { GUNLER, planGetir, bugunSirasi } from './ortak.js';

export async function render(container, { veli = false } = {}) {
    if (!(await db.getModuleVisibility('beslenme'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Beslenme programı' })}<div class="panel"><p class="bos-not">${veli ? 'Beslenme programı şu an velilere kapalı' : 'Öğretmenin beslenme programını güncelliyor, biraz sonra tekrar bak'}</p></div>`;
        return;
    }
    const plan = await planGetir();
    const bugun = bugunSirasi();
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Beslenme programı', aciklama: 'Her gün beslenme saatinde ne yiyeceğimiz' })}
        <section class="panel">
            ${GUNLER.map((g, i) => `
                <div class="satir gun-satiri${i === bugun ? ' bugun' : ''}">
                    <span class="gun-ad">${g.ad}</span>
                    <span class="satir-ad" style="white-space:normal">${plan[g.anahtar] ? esc(plan[g.anahtar]) : '<span class="bos">Henüz yazılmadı</span>'}</span>
                    ${i === bugun ? '<span class="etiket okudu">Bugün</span>' : ''}
                </div>`).join('')}
        </section>`;
}
