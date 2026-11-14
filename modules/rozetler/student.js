// Rozetler — öğrenci görünümü: kazandığı rozetler (öne çıkan an) ve henüz kazanmadıkları
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi } from '../../js/arayuz.js';
import { verileriGetir, sahiplik, sahipMi, kategoriyeGore, rozetGorseli, KATEGORILER } from './ortak.js';

export async function render(container) {
    if (!(await db.getModuleVisibility('rozetler'))) {
        container.innerHTML = `${modulBasligi({ baslik: 'Rozetlerim' })}<div class="panel"><p class="bos-not">Öğretmenin rozetleri güncelliyor, biraz sonra tekrar bak</p></div>`;
        return;
    }
    const benim = auth.currentUser?.id;
    const { rozetler, ogrenciler, matris } = await verileriGetir();
    const sahip = sahiplik(matris);
    const kazandiklarim = rozetler.filter(r => sahipMi(sahip, benim, r.id));
    // En son kazanılan rozet: bu cihazda daha önce gösterilmediyse bir kez parlar
    const sonKayit = matris.filter(m => m.ogrId === benim && m.deger === '✔️' && m.tarih).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))[0];
    let yeniRozetId = null;
    try {
        const anahtar = `gorulen-rozet-${benim}`;
        if (sonKayit && localStorage.getItem(anahtar) !== sonKayit.targetId) { yeniRozetId = sonKayit.targetId; localStorage.setItem(anahtar, sonKayit.targetId); }
    } catch { /* gizli sekmede localStorage olmayabilir */ }
    if (yeniRozetId) kazandiklarim.sort((a, b) => (b.id === yeniRozetId) - (a.id === yeniRozetId));

    container.innerHTML = `
        ${modulBasligi({ baslik: 'Rozetlerim', aciklama: rozetler.length ? `${sayi(rozetler.length)} rozetin ${sayi(kazandiklarim.length)} tanesini kazandın` : '' })}
        ${kazandiklarim.length ? `
            <section class="panel">
                <div class="panel-ust"><h2>Kazandıkların</h2></div>
                <div class="rozet-izgara">${kazandiklarim.map(r => `<div class="rozet-kart${r.id === yeniRozetId ? ' yeni' : ''}">${rozetGorseli(r, 72)}<strong>${esc(r.ad)}</strong><small>${esc(r.aciklama || '')}</small>${r.id === yeniRozetId ? '<small class="yeni-etiket">Yeni kazandın</small>' : ''}</div>`).join('')}</div>
            </section>` : `<div class="panel"><p class="bos-not">Henüz rozetin yok. Aşağıdaki rozetleri kazanmaya çalışabilirsin</p></div>`}
        ${kategoriyeGore(rozetler.filter(r => !sahipMi(sahip, benim, r.id))).map(([kat, rl]) => `
            <section class="panel">
                <div class="panel-ust"><h2><span class="kategori-nokta" style="background:${KATEGORILER[kat].renk}"></span>${KATEGORILER[kat].ad}</h2><small>Henüz kazanmadın</small></div>
                <div class="rozet-izgara">${rl.map(r => {
                    const alan = ogrenciler.filter(o => sahipMi(sahip, o.id, r.id)).length;
                    return `<div class="rozet-kart kilitli">${rozetGorseli(r, 56, true)}<strong>${esc(r.ad)}</strong><small>${esc(r.aciklama || '')}</small>${alan ? `<small>${sayi(alan)} arkadaşın kazandı</small>` : ''}</div>`;
                }).join('')}</div>
            </section>`).join('')}`;
}
