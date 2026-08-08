import { db } from '../../js/db.js';
import { utils } from '../../js/utils.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Takvim yükleniyor...</p></div>';
    
    const etkinlikler = await db.getAll('etkinlikler');
    etkinlikler.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    let html = `<div class="card" style="border-left: 4px solid var(--primary);"><h2>📅 Sınıf Etkinlik Takvimi</h2>`;
    
    if(etkinlikler.length === 0) {
        html += `<p style="color: #666; margin-top: 15px;">Planlanmış bir etkinlik bulunmuyor.</p>`;
    }
    
    etkinlikler.forEach(item => {
        const gectiMi = new Date(item.tarih) < new Date();
        
        html += `
        <div class="item-row" style="display:block; ${gectiMi ? 'opacity: 0.6; background: #f9f9f9;' : 'border-left: 4px solid var(--primary);'}">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                <h3 style="color: ${gectiMi ? '#888' : 'var(--primary)'}; margin: 0;">${item.baslik}</h3>
                ${gectiMi ? '<span style="font-size: 0.8em; background: #ddd; padding: 3px 8px; border-radius: 12px; font-weight: bold;">Tamamlandı</span>' : ''}
            </div>
            <div style="font-weight: bold; color: var(--danger); font-size: 1.1em; margin-bottom: 10px;">
                🗓️ ${utils.formatDate(item.tarih)}
            </div>
            <p style="margin:10px 0; line-height: 1.5; white-space: pre-wrap;">${utils.linkify(item.detay)}</p>
        </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}