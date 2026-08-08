import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Puan durumunuz yükleniyor...</p></div>';

    const userId = auth.currentUser.id;
    const kriterler = await db.getAll('davranis_kriterleri');
    const matris = await db.getAll('davranis_matrisi');

    let totalScore = 0;
    kriterler.forEach(k => {
        const kayit = matris.find(m => m.ogrId === userId && m.targetId === k.id);
        if (kayit && kayit.deger) {
            totalScore += parseInt(kayit.deger) || 0;
        }
    });

    let html = `
        <div class="card" style="border-left: 4px solid var(--primary); text-align: center; margin-bottom: 20px;">
            <h2 style="color: var(--primary);">⭐ Davranış Yıldızlarım</h2>
            <div style="font-size: 4em; font-weight: 900; color: var(--danger); margin: 15px 0;">${totalScore} <span style="font-size: 0.5em;">⭐</span></div>
            <p style="color: #666; font-weight: bold;">Sınıf İçinde Topladığınız Yıldızlar</p>
        </div>

        <div class="card">
            <h3>Detaylı Kriter Dağılımı</h3>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
    `;

    if (kriterler.length === 0) {
        html += `<p style="color: #888;">Henüz değerlendirme kriteri bulunmuyor.</p>`;
    } else {
        kriterler.forEach(k => {
            let numPuan = parseInt(matris.find(m => m.ogrId === userId && m.targetId === k.id)?.deger || '0');
            
            let starGorsel = '';
            if (numPuan === 0) {
                starGorsel = '<span style="color: #aaa; font-size: 0.9em; font-style: italic;">Değerlendirilmedi</span>';
            } else {
                for(let i = 1; i <= 5; i++) {
                    starGorsel += i <= numPuan ? '⭐' : '<span style="color:#e5e7eb; font-size:1.2em;">★</span>';
                }
            }

            html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;">
                <span style="font-weight: bold; font-size: 1.1em; color: #333;">${k.ad}</span>
                <span style="display: flex; align-items: center; gap: 2px;">${starGorsel}</span>
            </div>`;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}