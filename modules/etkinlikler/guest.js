// Etkinlikler — veli görünümü (sadece velilere açılan etkinlikler)
import { db } from '../../js/db.js';
import { modulBasligi } from '../../js/arayuz.js';
import { listeHtml } from './ortak.js';

export async function render(container) {
    const liste = await db.getPublic('etkinlikler');
    container.innerHTML = `
        ${modulBasligi({ baslik: 'Etkinlikler', aciklama: 'Geziler, toplantılar ve özel günler' })}
        ${listeHtml(liste, { bosYazi: 'Şu an velilere açık bir etkinlik yok' })}`;
}
