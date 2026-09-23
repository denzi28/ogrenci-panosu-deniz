import { db } from '../../js/db.js';

let aktifOynananGorevId = null; 

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Görevler hızla yükleniyor...</p></div>';

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
    
    // HIZLANDIRMA: Sadece kullanıcının ihtiyaç duyduğu listeler paralel çekilir
    const [kalemler, matris] = await Promise.all([
        db.getAll('uygulama_kalemleri'),
        db.getAll('uygulama_matrisi')
    ]);

    const bugunObj = new Date();
    const yyyy = bugunObj.getFullYear();
    const mm = String(bugunObj.getMonth() + 1).padStart(2, '0');
    const dd = String(bugunObj.getDate()).padStart(2, '0');
    const bugun = `${yyyy}-${mm}-${dd}`;

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
                        <button class="btn btn-primary btn-gorev-baslat" data-link="${k.link}" data-id="${k.id}" style="padding: 6px 15px; font-size: 0.9em; border-radius: 5px; cursor: pointer; border: none; color: white; background: var(--primary); font-weight: bold;">▶️ Oyuna Başla</button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;

    html += `
        <div id="oyun-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; flex-direction: column;">
            <div style="padding: 10px 20px; background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--primary);">
                <h3 style="margin: 0; color: var(--primary);">🎮 Görev Oynanıyor</h3>
                <button id="btn-oyun-kapat" class="btn btn-danger" style="padding: 8px 15px; font-weight: bold; border: none; border-radius: 5px; cursor: pointer;">Kapat</button>
            </div>
            <iframe id="oyun-iframe" style="width: 100%; flex: 1; border: none; background: #f0fdf4;"></iframe>
        </div>
    `;

    container.innerHTML = html;

    document.querySelectorAll('.btn-gorev-baslat').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const link = e.target.getAttribute('data-link');
            aktifOynananGorevId = e.target.getAttribute('data-id');
            document.getElementById('oyun-iframe').src = link;
            document.getElementById('oyun-modal').style.display = 'flex';
        });
    });

    document.getElementById('btn-oyun-kapat').addEventListener('click', () => {
        document.getElementById('oyun-iframe').src = '';
        document.getElementById('oyun-modal').style.display = 'none';
        aktifOynananGorevId = null;
        render(container); 
    });

    if (!window.oyunDinleyiciEklendi) {
        window.addEventListener('message', async (event) => {
            if (event.data && (event.data.islem === 'gorev_bitti' || event.data.islem === 'puan_guncelle')) {
                if (aktifOynananGorevId) {
                    const aktifUser = JSON.parse(localStorage.getItem('currentUser'));
                    
                    let formatliPuan;
                    if (event.data.limit && event.data.limit !== 'undefined') {
                        formatliPuan = `${event.data.puan}/${event.data.limit}`;
                    } else {
                        formatliPuan = `${event.data.puan}`;
                    }
                    
                    await db.saveMatrixStatus('uygulama_matrisi', aktifUser.id, aktifOynananGorevId, formatliPuan);
                    
                    if (event.data.islem === 'gorev_bitti') {
                        setTimeout(() => {
                            const modal = document.getElementById('oyun-modal');
                            if (modal && modal.style.display === 'flex') {
                                document.getElementById('oyun-iframe').src = '';
                                modal.style.display = 'none';
                                aktifOynananGorevId = null;
                                render(document.getElementById('content') || container);
                            }
                        }, 2000);
                    }
                }
            }
        });
        window.oyunDinleyiciEklendi = true;
    }
}