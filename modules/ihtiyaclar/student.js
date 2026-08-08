import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ İhtiyaç durumunuz buluttan getiriliyor...</p></div>';

    const user = auth.currentUser;
    const kalemler = await db.getAll('ihtiyac_kalemleri');
    const matris = await db.getAll('ihtiyac_matrisi');

    let html = `
        <div class="card" style="border-left: 4px solid var(--primary);">
            <h2>📋 Bireysel İhtiyaç Durumum</h2>
            <p style="margin-bottom: 20px;">Sınıfımız için belirlenen ihtiyaçlar ve sizin getirme durumunuz aşağıda listelenmiştir.</p>
    `;

    if (kalemler.length === 0) {
        html += `<p style="color: var(--secondary);">Şu an için listelenmiş bir ihtiyaç bulunmuyor.</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
        
        kalemler.forEach(k => {
            let durum = matris.find(m => m.ogrId === user.id && m.targetId === k.id)?.deger || '';
            let durumGorsel = '';
            
            if (!durum) durumGorsel = `<span style="color: #f39c12; font-weight: bold;">⌛ Bekleniyor</span>`;
            else if (durum.toLowerCase() === 'x' || durum.toLowerCase() === 'getirdi') durumGorsel = `<span style="color: var(--success); font-weight: bold;">✅ Getirdi</span>`;
            else if (durum.toLowerCase() === 'devamsız') durumGorsel = `<span style="color: var(--danger); font-weight: bold;">❌ Devamsız</span>`;
            else durumGorsel = `<span style="color: var(--primary); font-weight: bold;">📝 Miktar/Not: ${durum}</span>`;

            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;">
                    <span style="font-size: 1.1em; color: #333;">${k.ad}</span>
                    <span>${durumGorsel}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}