// İhtiyaçlar — öğrenci görünümü: kendi getirdikleri ve getireceği
import { auth } from '../../js/auth.js';
import { modulBasligi, esc, sayi } from '../../js/arayuz.js';
import { verileriGetir, durum, deger, kalemAdi } from './ortak.js';

const ETIKET = {
    getirdi: '<span class="etiket okudu"><i class="fas fa-check"></i>Getirdin</span>',
    bekliyor: '<span class="etiket okuyor">Getireceksin</span>',
    devamsiz: '<span class="etiket rafta">Devamsız</span>',
};

export async function render(container) {
    const benim = auth.currentUser?.id;
    const { kalemler, harita } = await verileriGetir();
    const durumlar = kalemler.map(k => ({ k, d: deger(harita, benim, k.id) }));
    const getirilen = durumlar.filter(x => ['getirdi', 'not'].includes(durum(x.d))).length;
    container.innerHTML = `
        ${modulBasligi({ baslik: 'İhtiyaçlar', aciklama: kalemler.length ? `${sayi(kalemler.length)} malzemenin ${sayi(getirilen)} tanesini getirdin` : '' })}
        <section class="panel">
            ${durumlar.map(({ k, d }) => `
                <div class="satir">
                    <span class="satir-ad">${kalemAdi(k)}</span>
                    ${durum(d) === 'not' ? `<span class="etiket okudu">${esc(d)}</span>` : ETIKET[durum(d)]}
                </div>`).join('') || '<p class="bos-not">Şu an listelenmiş bir ihtiyaç yok</p>'}
        </section>`;
}
