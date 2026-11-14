// Etkileşimli görevler — öğrenci: yayındaki görevleri oynar, puanı kendiliğinden kaydedilir
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { kutla } from '../../js/hareket.js';
import { KALEMLER, MATRIS, yayinDurumu, sureMetni, puanHtml, puanMetni, oyunAdresi, puanDinle, katmanAc } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('uygulamalar'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Görevlerim' })}<div class="panel"><p class="bos-not">Şu an yayında bir görev yok</p></div>`;
        return;
    }
    const benim = auth.currentUser?.id;
    const [kalemler, matris] = await Promise.all([db.getAll(KALEMLER), db.getAll(MATRIS)]);
    const puan = (k) => String(matris.find(m => m.ogrId === benim && m.targetId === k.id)?.deger ?? '').trim();
    const aktif = kalemler.filter(k => yayinDurumu(k) === 'yayinda');
    const biten = kalemler.filter(k => yayinDurumu(k) === 'bitti' && puan(k));
    const yapilan = aktif.filter(k => puan(k)).length;

    const satir = (k, oynanir) => `
        <div class="ilan gorev-ilan" data-id="${esc(k.id)}">
            <div class="ilan-ust">
                <h3>${esc(k.ad)}</h3>
                ${puan(k) ? puanHtml(puan(k)) : oynanir ? '<span class="etiket okuyor">Seni bekliyor</span>' : ''}
            </div>
            <div class="ilan-meta"><span>${sureMetni(k)}</span></div>
            ${k.aciklama ? `<p class="ilan-metin">${esc(k.aciklama)}</p>` : ''}
            ${oynanir && oyunAdresi(k.link) ? `<button type="button" class="btn ${puan(k) ? 'btn-secondary' : 'btn-primary'} ilan-baglanti" data-islem="oyna"><i class="fas fa-play"></i>${puan(k) ? 'Tekrar oyna' : 'Başla'}</button>` : ''}
        </div>`;

    container.innerHTML = `
        <div id="gorev-ogr-kok">
            ${modulBasligi({ baslik: 'Görevlerim', aciklama: aktif.length ? `${sayi(aktif.length)} görevin ${sayi(yapilan)} tanesini yaptın` : '' })}
            <section class="panel">
                ${aktif.map(k => satir(k, true)).join('') || '<p class="bos-not">Şu an yayında bir görev yok</p>'}
            </section>
            ${biten.length ? `
            <details class="panel acilir-panel">
                <summary class="panel-ust"><h2>Süresi biten görevler</h2><small>${biten.length} görev</small></summary>
                ${biten.map(k => satir(k, false)).join('')}
            </details>` : ''}
        </div>`;

    container.querySelector('#gorev-ogr-kok').addEventListener('click', (e) => {
        const d = e.target.closest('[data-islem="oyna"]');
        if (!d) return;
        const k = kalemler.find(x => x.id === d.closest('.ilan').dataset.id);
        if (k) oyna(k, benim, () => render(container));
    });
}

function oyna(k, benim, bitince) {
    const { el, govde, kapat } = katmanAc({ baslik: esc(k.ad), dugmeler: '<span class="katman-not" aria-live="polite"></span>' });
    govde.innerHTML = `<iframe class="oyun-cerceve" title="${esc(k.ad)}" src="${esc(oyunAdresi(k.link))}"></iframe>`;
    const iframe = govde.querySelector('iframe');
    const not = el.querySelector('.katman-not');
    let kaydedildi = false;
    const birak = puanDinle(async (e) => {
        if (e.source !== iframe.contentWindow) return;
        const deger = puanMetni(e.data);
        try {
            await db.saveMatrixStatus(MATRIS, benim, k.id, deger);
            kaydedildi = true;
            not.textContent = `Puanın kaydedildi: ${deger}`;
        } catch (err) { not.textContent = 'Puan kaydedilemedi, internetini kontrol et'; return; }
        if (e.data.islem === 'gorev_bitti') {
            kutla(not);
            setTimeout(() => { if (document.body.contains(el)) kapat(); }, 2000);
        }
    });
    el.addEventListener('kapandi', () => { birak(); if (kaydedildi) bitince(); });
}
