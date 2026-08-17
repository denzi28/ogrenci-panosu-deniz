import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Görevler yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('uygulamalar');
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">🎮 İnteraktif Görevler</h3>
                <p style="color: #666;">Şu an için yayında olan bir görev bulunmamaktadır.</p>
            </div>
        `;
        return;
    }

    const kalemler = await db.getAll('uygulama_kalemleri');

    // Bugünün tarihini YYYY-MM-DD formatında al
    const bugunObj = new Date();
    const yyyy = bugunObj.getFullYear();
    const mm = String(bugunObj.getMonth() + 1).padStart(2, '0');
    const dd = String(bugunObj.getDate()).padStart(2, '0');
    const bugun = `${yyyy}-${mm}-${dd}`;

    // TARİH FİLTRESİ
    const aktifGorevler = kalemler.filter(k => {
        const baslangic = k.baslangic || '';
        const bitis = k.bitis || '';
        
        let yayinda = true;
        if (baslangic && bugun < baslangic) yayinda = false; 
        if (bitis && bugun > bitis) yayinda = false;       
        
        return yayinda;
    });

    let html = `
        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 style="margin-top: 0; color: var(--primary);">🎮 Güncel Sınıf Görevleri</h3>
            <p style="font-size:0.85em; color:#666;">Sınıfımızdaki öğrenciler için tanımlanmış ve süresi devam eden güncel görevlerin listesi aşağıdadır. Görevler sadece öğrenci hesaplarından yapılabilir.</p>
            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
    `;

    if (aktifGorevler.length === 0) {
        html += '<p style="color:#888;">Şu an için süresi devam eden aktif bir görev bulunmuyor.</p>';
    } else {
        aktifGorevler.forEach(k => {
            let baslamaTarihi = k.baslangic ? k.baslangic.split('-').reverse().join('.') : 'Hemen';
            let bitisTarihi = k.bitis ? k.bitis.split('-').reverse().join('.') : 'Süresiz';
            
            html += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: var(--primary); font-size: 1.1em;">${k.ad}</h4>
                        ${k.aciklama ? `<p style="margin: 0 0 8px 0; font-size: 0.85em; color: #555;">${k.aciklama}</p>` : ''}
                        <div style="font-size: 0.8em; color: #475569; background: #e2e8f0; display: inline-block; padding: 3px 8px; border-radius: 4px; margin-top: 5px;">
                            📅 <strong>Süre:</strong> ${baslamaTarihi} - ${bitisTarihi}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}