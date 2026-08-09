import { db } from '../../js/db.js';

function tarihFormatla(tarihStr) {
    if (!tarihStr) return 'Belirtilmedi';
    return tarihStr.split('-').reverse().join('.');
}

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Görevler yükleniyor...</p></div>';
    
    const kalemler = await db.getAll('uygulama_kalemleri');

    let html = `
        <div class="card" style="border-left: 4px solid var(--success);">
            <h2 style="color: var(--sidebar);">🎮 Sınıf İnteraktif Görevleri</h2>
            <p style="color: #666; margin-bottom: 20px;">Öğrencilerimiz kendi panellerinden giriş yaparak aşağıdaki görevleri görüntüleyip tamamlayabilirler.</p>
            <div style="display: flex; flex-direction: column; gap: 15px;">
    `;

    if (kalemler.length === 0) {
        html += `<p style="color: #888;">Şu an planlanmış bir görev bulunmuyor.</p>`;
    } else {
        kalemler.forEach(k => {
            html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; border: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">🎯</span>
                    <span style="font-weight: bold; font-size: 1.1em; color: #333;">${k.ad}</span>
                </div>
                ${k.aciklama ? `<div style="font-size: 0.95em; color: #444; background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid var(--success);">📝 ${k.aciklama}</div>` : ''}
                <div style="font-size: 0.85em; color: #777; font-weight: bold;">
                    📅 Tarih: ${tarihFormatla(k.baslangic)} - ${tarihFormatla(k.bitis)}
                </div>
            </div>`;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}