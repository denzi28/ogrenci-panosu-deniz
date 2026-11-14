// Davranış panosu — öğrenci görünümü (kendi yıldızları)
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { puanHaritasi, puanAl, yildizGosterge, ENCOK_YILDIZ } from './ortak.js';

export async function render(container) {
    const benim = auth.currentUser?.id;
    const [kriterler, matris] = await Promise.all([db.getAll('davranis_kriterleri'), db.getAll('davranis_matrisi')]);
    const harita = puanHaritasi(matris);
    const toplam = kriterler.reduce((t, k) => t + puanAl(harita, benim, k.id), 0);
    const enFazla = kriterler.length * ENCOK_YILDIZ;

    container.innerHTML = `
        ${modulBasligi({ baslik: 'Yıldızlarım', aciklama: 'Öğretmeninin her davranış için verdiği yıldızlar' })}
        <section class="tahta" style="margin-bottom:24px">
            <div class="tahta-ust"><h2>Toplam yıldız</h2><small>${kriterler.length ? `En fazla ${sayi(enFazla)}` : ''}</small></div>
            <div style="display:flex;align-items:center;gap:16px">
                <span class="yildiz-cikartma" style="width:44px;height:44px" aria-hidden="true"></span>
                <span style="font-size:48px;font-weight:500;line-height:1">${sayi(toplam)}</span>
            </div>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Davranışlar</h2></div>
            ${kriterler.length ? kriterler.map(k => {
                const deger = puanAl(harita, benim, k.id);
                return `
                <div class="satir">
                    <span class="satir-ad">${esc(k.ad)}</span>
                    ${deger ? yildizGosterge(deger) : '<small style="color:var(--muted)">Henüz değerlendirilmedi</small>'}
                </div>`;
            }).join('') : '<p class="bos-not">Henüz davranış eklenmedi</p>'}
        </section>`;
}
