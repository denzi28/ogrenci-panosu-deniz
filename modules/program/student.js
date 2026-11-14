// Ders programı — öğrenci görünümü
import { db } from '../../js/db.js';
import { modulBasligi } from '../../js/arayuz.js';
import { verileriGetir, programHtml, baglaGunSecici } from './ortak.js';

export async function render(container, { veli = false } = {}) {
    if (!(await db.getModuleVisibility('program'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Ders programı' })}<div class="panel"><p class="bos-not">${veli ? 'Ders programı şu an velilere kapalı' : 'Öğretmenin ders programını güncelliyor, biraz sonra tekrar bak'}</p></div>`;
        return;
    }
    const veri = await verileriGetir();
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Ders programı', aciklama: 'Haftalık dersler ve ders saatleri' })}
        ${programHtml(veri)}`;
    baglaGunSecici(container);
}
