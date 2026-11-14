// Beslenme programı — öğretmen: kutudan çıkınca kendiliğinden kaydedilir
import { db } from '../../js/db.js';
import { esc, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { TABLO, GUNLER, planGetir, bugunSirasi } from './ortak.js';

let kok, plan;

export async function render(container) {
    container.innerHTML = `<div id="beslenme-kok"></div>`;
    kok = container.firstElementChild;
    plan = await planGetir();
    const bugun = bugunSirasi();
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Beslenme programı',
            aciklama: 'Yazıp başka yere geçince kendiliğinden kaydedilir',
            eylemler: `${await gorunurlukAnahtari('beslenme')}<button type="button" class="btn btn-secondary" id="beslenme-yazdir"><i class="fas fa-print"></i>Yazdır</button>`,
        })}
        <section class="panel">
            ${GUNLER.map((g, i) => `
                <label class="satir gun-satiri${i === bugun ? ' bugun' : ''}">
                    <span class="gun-ad">${g.ad}</span>
                    <input type="text" class="beslenme-girdi" data-anahtar="${g.anahtar}" value="${esc(plan[g.anahtar] || '')}" placeholder="${g.ornek}">
                </label>`).join('')}
        </section>`;
    baglaGorunurlukAnahtari('beslenme');
    kok.querySelectorAll('.beslenme-girdi').forEach(g => g.addEventListener('change', () => kaydet(g)));
    kok.querySelector('#beslenme-yazdir').addEventListener('click', () => yazdir('Haftalık beslenme programı',
        `<table><tbody>${GUNLER.map(g => `<tr><th style="width:120px">${g.ad}</th><td>${esc(plan[g.anahtar] || '')}</td></tr>`).join('')}</tbody></table>`));
}

async function kaydet(girdi) {
    const alan = girdi.dataset.anahtar;
    const deger = girdi.value.trim();
    const satir = girdi.closest('.satir');
    try {
        if (plan.id) await db.update(TABLO, plan.id, { [alan]: deger });
        else plan.id = (await db.add(TABLO, { [alan]: deger })).id;
        plan[alan] = deger;
        kaydedildiIsareti(satir);
    } catch (e) {
        girdi.value = plan[alan] || '';
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
}
