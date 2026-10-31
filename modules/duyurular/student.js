// modules/duyurular/student.js
import { db } from '../../js/db.js';
import { utils } from '../../js/utils.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Duyurular yükleniyor...</p></div>';
    
    const duyurular = await db.getAll('duyurular');
    duyurular.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = `<div class="card"><h2 style="font-size: 1.2em; color: var(--primary); margin-bottom: 15px;">📢 Sınıf Duyuruları</h2>`;
    if(duyurular.length === 0) {
        html += `<p style="color: #64748b; font-size: 0.9em;">Henüz yayınlanmış duyuru yok.</p>`;
    }
    
    duyurular.forEach(item => {
        let linkBtn = '';
        if (item.link) {
            let href = item.link.startsWith('http') ? item.link : 'https://' + item.link;
            linkBtn = `<a href="${href}" target="_blank" class="btn" style="display:inline-block; margin-top:10px; background:#e8f4fd; color:var(--primary); border:1px solid var(--primary); padding:6px 12px; font-size:0.85em; font-weight:bold;">🔗 İlgili Bağlantıya Git</a>`;
        }

        html += `
        <div class="item-row" style="display:block; border-bottom: 1px solid #eaeaea; padding: 15px 0;">
            <h3 style="color: var(--primary); font-size: 1.05em; margin-bottom: 6px;">${item.baslik}</h3>
            <p style="margin:8px 0; font-size: 0.9em; line-height: 1.5; white-space: pre-wrap; color: #334155;">${utils.linkify(item.icerik)}</p>
            ${linkBtn}
            <div style="margin-top: 8px;"><small style="color: #94a3b8; font-size: 0.75em;">${utils.formatDate(item.createdAt)}</small></div>
        </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}