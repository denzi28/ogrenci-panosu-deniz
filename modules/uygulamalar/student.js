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

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const kalemler = await db.getAll('uygulama_kalemleri');
    const matris = await db.getAll('uygulama_matrisi');

    // Bugünün tarihini YYYY-MM-DD formatında al (Tarih kıyaslaması için)
    const bugunObj = new Date();
    const yyyy = bugunObj.getFullYear();
    const mm = String(bugunObj.getMonth() + 1).padStart(2, '0');
    const dd = String(bugunObj.getDate()).padStart(2, '0');
    const bugun = `${yyyy}-${mm}-${dd}`;

    // TARİH FİLTRESİ: Sadece tarihi uygun olan görevleri seç
    const aktifGorevler = kalemler.filter(k => {
        const baslangic = k.baslangic || '';
        const bitis = k.bitis || '';
        
        let yayinda = true;
        if (baslangic && bugun < baslangic) yayinda = false; // Başlangıç tarihi gelmediyse gizle
        if (bitis && bugun > bitis) yayinda = false;       // Bitiş tarihi geçtiyse gizle
        
        return yayinda;
    });

    let html = `
        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 style="margin-top: 0; color: var(--primary);">🎮 İnteraktif Görevlerim</h3>
            <p style="font-size:0.85em; color:#666;">Aşağıdaki listeden senin için tanımlanmış ve süresi devam eden görevlere ulaşabilirsin.</p>
            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
    `;

    if (aktifGorevler.length === 0) {
        html += '<p style="color:#888;">Şu an için süresi devam eden aktif bir görev bulunmuyor.</p>';
    } else {
        aktifGorevler.forEach(k => {
            let hucreDegeri = matris.find(m => m.ogrId === currentUser.id && m.targetId === k.id)?.deger || '';
            let islemGorduMu = hucreDegeri !== '';
            
            let durumRozeti = islemGorduMu 
                ? `<span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">Tamamlandı (Puan: ${hucreDegeri})</span>` 
                : `<span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">Bekleniyor</span>`;

            html += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: var(--primary); font-size: 1.1em;">${k.ad}</h4>
                        ${k.aciklama ? `<p style="margin: 0 0 8px 0; font-size: 0.85em; color: #555;">${k.aciklama}</p>` : ''}
                        <div style="font-size: 0.8em; color: #888;">📅 Son Gün: <strong>${k.bitis ? k.bitis.split('-').reverse().join('.') : 'Süresiz'}</strong></div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        ${durumRozeti}
                        <a href="${k.link}" target="_blank" class="btn btn-primary" style="text-decoration: none; padding: 6px 15px; font-size: 0.9em; text-align: center; border-radius: 5px;">▶️ Göreve Git</a>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}