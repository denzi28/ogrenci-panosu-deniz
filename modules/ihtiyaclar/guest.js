import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ İhtiyaç listesi yükleniyor...</p></div>';

    const kalemler = await db.getAll('ihtiyac_kalemleri');

    let html = `
        <div class="card" style="border-left: 4px solid var(--success);">
            <h2>📋 Sınıfımızın İhtiyaç Listesi</h2>
            <p style="margin-bottom: 20px; color: #555;">Dönem boyunca sınıfımızda kullanılmak üzere belirlenen ortak ihtiyaç kalemleri aşağıdadır:</p>
    `;

    if (kalemler.length === 0) {
        html += `<p style="color: var(--secondary);">Şu an için sisteme girilmiş bir ihtiyaç bulunmuyor.</p>`;
    } else {
        html += `<ul style="list-style-type: none; padding: 0;">`;
        kalemler.forEach(k => {
            html += `
                <li style="background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--success); font-size: 1.2em;">📦</span>
                    <strong style="font-size: 1.1em; color: #333;">${k.ad}</strong>
                </li>
            `;
        });
        html += `</ul>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}