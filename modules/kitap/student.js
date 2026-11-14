// Kitap okuma — öğrenci görünümü: kendi kitapları ve sınıf kitaplığı
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, sekmeler, baglaSekmeler } from '../../js/arayuz.js';
import { verileriGetir, durumHaritasi, ogrenciOzeti, kitapOzeti, kitapAdiHtml, sureMetni } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('kitap'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Kitaplarım' })}<div class="panel"><p class="bos-not">Öğretmenin kitap listesini güncelliyor, biraz sonra tekrar bak</p></div>`;
        return;
    }
    const ben = auth.currentUser;
    const { kalemler, ogrenciler, matris } = await verileriGetir();
    const h = durumHaritasi(matris);
    const { okunan, okuyor } = ogrenciOzeti(ben, kalemler, h);

    container.innerHTML = `<div id="kitap-ogr-kok">
        ${modulBasligi({ baslik: 'Kitaplarım', aciklama: `Şimdiye kadar ${sayi(okunan.length)} kitap okudun` })}
        <section class="tahta" style="margin-bottom:24px">
            <div class="tahta-ust"><h2>Şu an okuduğun</h2><small>${okuyor.length ? '' : 'Öğretmeninden kitap alabilirsin'}</small></div>
            ${okuyor.length
                ? `<ol class="tahta-dersler" style="grid-template-columns:1fr">${okuyor.map(k => `<li><span><i class="fas fa-book-open"></i></span>${esc(k.ad)}<small style="margin-left:auto;color:var(--tebesir-soluk);font-size:13px">${sureMetni(k.tarih)}</small></li>`).join('')}</ol>`
                : `<p class="tahta-bos">Elinde kitap yok</p>`}
        </section>
        ${sekmeler([{ id: 'ko-okuduklarim', ad: 'Okuduklarım' }, { id: 'ko-kitaplik', ad: 'Sınıf kitaplığı' }], 'ko-okuduklarim')}
        <section class="panel" id="view-ko-okuduklarim">
            <div class="panel-ust"><h2>Okuduğun kitaplar</h2><small>${sayi(okunan.length)}</small></div>
            ${okunan.map(k => `<div class="satir"><span class="satir-ad">${kitapAdiHtml(k)}</span><span class="etiket okudu"><i class="fas fa-check"></i>Okudun</span></div>`).join('')
                || '<p class="bos-not">Henüz bitirdiğin kitap yok</p>'}
        </section>
        <section class="panel" id="view-ko-kitaplik" hidden>
            <div class="panel-ust"><h2>Sınıf kitaplığı</h2><small>Kimlerin okuduğunu görmek için kitaba dokun</small></div>
            ${kalemler.map(k => {
                const { okuyanlar, okumuslar } = kitapOzeti(k, ogrenciler, h);
                const benimDurum = okunan.some(x => x.id === k.id) ? '<span class="etiket okudu">Okudun</span>'
                    : okuyor.some(x => x.id === k.id) ? '<span class="etiket okuyor">Okuyorsun</span>'
                    : okuyanlar.length ? '<span class="etiket okuyor">Okunuyor</span>' : '<span class="etiket rafta">Rafta</span>';
                return `
                <details class="satir-detay">
                    <summary class="satir" style="cursor:pointer">
                        <span class="satir-ad" style="white-space:normal">${kitapAdiHtml(k)}<small>${okumuslar.length ? `${sayi(okumuslar.length)} arkadaşın okudu` : 'Henüz kimse okumadı'}</small></span>
                        ${benimDurum}
                    </summary>
                    <div class="acilir" style="padding-left:20px">
                        ${[...okuyanlar.map(o => `<div class="acilir-satir"><span>${esc(o.name)}</span><span class="etiket okuyor">Okuyor</span></div>`),
                           ...okumuslar.map(o => `<div class="acilir-satir"><span>${esc(o.name)}</span><span class="etiket okudu">Okudu</span></div>`)].join('')
                          || '<p class="okuma-yok" style="padding:8px 0">Bu kitabı henüz kimse okumadı</p>'}
                    </div>
                </details>`;
            }).join('') || '<p class="bos-not">Henüz kitap eklenmedi</p>'}
        </section>
    </div>`;
    baglaSekmeler(container.firstElementChild);
}
