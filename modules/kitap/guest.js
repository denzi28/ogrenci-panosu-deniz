// Kitap okuma — veli görünümü (salt okunur)
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, sekmeler, baglaSekmeler } from '../../js/arayuz.js';
import { verileriGetir, durumHaritasi, ogrenciOzeti, kitapOzeti, kitapAdiHtml } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('kitap'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Kitap okuma' })}<div class="panel"><p class="bos-not">Bu bölüm şu an velilere kapalı</p></div>`;
        return;
    }
    const { kalemler, ogrenciler, matris } = await verileriGetir();
    const h = durumHaritasi(matris);
    const liste = ogrenciler.map(o => ({ ...o, ozet: ogrenciOzeti(o, kalemler, h) }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    container.innerHTML = `
        ${modulBasligi({ baslik: 'Kitap okuma', aciklama: 'Sınıf kitaplığından okunan ve okunmakta olan kitaplar' })}
        ${sekmeler([{ id: 'k-ogrenciler', ad: 'Öğrenciler' }, { id: 'k-kitaplik', ad: 'Kitaplık' }], 'k-ogrenciler')}
        <section class="panel" id="view-k-ogrenciler">
            <div class="panel-ust"><h2>Öğrenciler</h2><small>${sayi(liste.length)} öğrenci</small></div>
            ${liste.map(o => `
                <div class="satir">
                    <span class="satir-ad" style="white-space:normal">${esc(o.name)}
                        <small>${o.ozet.okuyor.length ? `Okuyor: ${o.ozet.okuyor.map(k => esc(k.ad)).join(', ')}` : 'Şu an okuduğu kitap yok'}</small>
                    </span>
                    <span class="sayi-hucre">${sayi(o.ozet.okunan.length)}<small>okudu</small></span>
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>
        <section class="panel" id="view-k-kitaplik" hidden>
            <div class="panel-ust"><h2>Kitaplık</h2><small>${sayi(kalemler.length)} kitap</small></div>
            ${kalemler.map(k => {
                const { okuyanlar, okumuslar } = kitapOzeti(k, ogrenciler, h);
                return `
                <div class="satir" style="flex-wrap:wrap">
                    <span class="satir-ad" style="white-space:normal">${kitapAdiHtml(k)}<small>${okumuslar.length ? `${sayi(okumuslar.length)} kez okundu` : 'Henüz okunmadı'}</small></span>
                    ${okuyanlar.length ? `<span class="etiket okuyor">Okunuyor</span>` : `<span class="etiket rafta">Rafta</span>`}
                </div>`;
            }).join('') || '<p class="bos-not">Henüz kitap eklenmedi</p>'}
        </section>`;
    baglaSekmeler(container);
}
