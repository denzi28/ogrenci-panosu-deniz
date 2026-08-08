import { db } from '../../js/db.js';
import { utils } from '../../js/utils.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Duyurular yükleniyor...</p></div>';
    
    const duyurular = await db.getPublic('duyurular');
    duyurular.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = `<div class="card"><h2>Genel Duyurular</h2>`;
    if(duyurular.length === 0) html += `<p>Şu an herkese açık bir duyuru bulunmuyor.</p>`;
    
    duyurular.forEach(item => {
        let linkBtn = '';
        if (item.link) {
            let href = item.link.startsWith('http') ? item.link : 'https://' + item.link;
            linkBtn = `<a href="${href}" target="_blank" class="btn" style="display:inline-block; margin-top:10px; background:#e8f4fd; color:var(--primary); border:1px solid var(--primary); padding:6px 12px; font-size:0.9em; font-weight:bold;">🔗 İlgili Bağlantıya Git</a>`;
        }

        html += `
        <div class="item-row" style="display:block; border-left: 4px solid var(--success);">
            <h3 style="color: var(--sidebar);">${item.baslik}</h3>
            <p style="margin:10px 0; line-height: 1.5; white-space: pre-wrap;">${utils.linkify(item.icerik)}</p>
            ${linkBtn}
            <br><small style="color: #888; display:inline-block; margin-top:8px;">${utils.formatDate(item.createdAt)}</small>
        </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}