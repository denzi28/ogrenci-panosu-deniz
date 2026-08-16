import { db } from '../../js/db.js';

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const DERS_SAYISI = 6;
const TABLO_ADI = 'ders_programi';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Ders programı yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('program');
    
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">📅 Ders Programı Şimdilik Gizli</h3>
                <p style="color: #666;">Öğretmenimiz ders programını güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    const programVerileri = await db.getAll(TABLO_ADI);
    const saatKaydi = programVerileri.find(p => p.gun === 'SAATLER') || {};

    let tabloHtml = `
        <div class="card" style="border-top: 4px solid var(--primary); overflow-x: auto;">
            <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">📅 Haftalık Ders Programımız</h3>
            <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.95em;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: left; width: 120px; color: var(--primary);">GÜNLER</th>
                        ${Array.from({length: DERS_SAYISI}, (_, i) => `
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                                <div style="font-weight: bold; font-size: 1.1em;">${i + 1}. Ders</div>
                                <div style="font-size: 0.85em; color: #64748b; margin-top: 4px;">${saatKaydi[`ders${i+1}`] || '--:--'}</div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    GUNLER.forEach(gun => {
        let gunKaydi = programVerileri.find(p => p.gun === gun) || {};
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 15px; font-weight: bold; background-color: #f8fafc; color: #334155;">${gun}</td>
        `;
        for (let i = 1; i <= DERS_SAYISI; i++) {
            let dersAdi = gunKaydi[`ders${i}`] || '-';
            let bgRenk = dersAdi !== '-' ? '#f0fdf4' : 'transparent';
            let textRenk = dersAdi !== '-' ? '#166534' : '#cbd5e1';
            
            tabloHtml += `
                <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background-color: ${bgRenk}; font-weight: bold; color: ${textRenk};">
                    ${dersAdi}
                </td>
            `;
        }
        tabloHtml += `</tr>`;
    });

    tabloHtml += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tabloHtml;
}