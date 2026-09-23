import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Beslenme programı yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('beslenme');
    
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">🍎 Beslenme Programı Şimdilik Gizli</h3>
                <p style="color: #666;">Sınıf öğretmenimiz listeyi güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    const kayitlar = await db.getAll('beslenme_programi');
    
    if (kayitlar.length === 0) {
        container.innerHTML = '<div class="card"><p style="color:#888; text-align: center;">Henüz yayınlanmış bir beslenme programı bulunmuyor.</p></div>';
        return;
    }

    const plan = kayitlar[0];
    
    // O günün menüsünü vurgulamak için bugünü tespit edelim
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugunDegeri = gunler[new Date().getDay()];

    const kartUret = (gunAdi, veriKey, emoji) => {
        const icerik = plan[veriKey] || '<span style="color:#94a3b8; font-style:italic;">Belirtilmedi</span>';
        const isBugun = bugunDegeri === veriKey;
        const bgRenk = isBugun ? '#eff6ff' : '#f8fafc';
        const borderRenk = isBugun ? 'var(--primary)' : '#e2e8f0';
        const bugunRozeti = isBugun ? `<span style="background: var(--primary); color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7em; font-weight: bold; margin-left: 10px;">BUGÜN</span>` : '';

        return `
            <div style="background: ${bgRenk}; border: 2px solid ${borderRenk}; padding: 15px 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 900; font-size: 1.2em; color: #334155; text-transform: uppercase;">
                    ${emoji} ${gunAdi} ${bugunRozeti}
                </div>
                <div style="font-size: 1.1em; color: #475569; padding-left: 5px;">
                    ${icerik}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div class="card" style="border-top: 4px solid var(--success);">
            <h2 style="text-align: center; color: var(--primary); margin-top: 0; margin-bottom: 25px;">🍎 Haftalık Beslenme Programı</h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${kartUret('Pazartesi', 'pazartesi', '🍳')}
                ${kartUret('Salı', 'sali', '🥪')}
                ${kartUret('Çarşamba', 'carsamba', '🥗')}
                ${kartUret('Perşembe', 'persembe', '🧀')}
                ${kartUret('Cuma', 'cuma', '🥨')}
            </div>
        </div>
    `;
}