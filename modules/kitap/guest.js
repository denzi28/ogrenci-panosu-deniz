import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Kitap okuma tablosu hızla yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('kitap');
    
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">📚 Kitap Okuma Tablosu Şimdilik Gizli</h3>
                <p style="color: #666;">Sınıf öğretmenimiz tabloyu güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    // HIZLANDIRMA: Veriler paralel çekilir
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    if (kalemler.length === 0) {
        container.innerHTML = '<div class="card"><p style="color:#888;">Henüz listeye kitap eklenmemiş.</p></div>';
        return;
    }

    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    let tabloHtml = `
        <div class="card" style="border-top: 4px solid var(--primary); overflow-x: auto;">
            <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">📚 Sınıf Kitap Okuma Tablosu</h3>
            <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.9em;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 10px 5px; width: 30px; text-align: center; vertical-align: bottom; height: 140px;">SN</th>
                        <th style="border: 1px solid #ddd; padding: 10px 5px; text-align: left; width: 180px; vertical-align: bottom;">ADI SOYADI</th>
                        ${kalemler.map(k => `
                            <th style="border: 1px solid #ddd; padding: 10px 2px; width: 35px; vertical-align: bottom;">
                                <div style="writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; margin: 0 auto; font-size: 0.95em;">${k.ad}</div>
                            </th>
                        `).join('')}
                        <th style="border: 1px solid #ddd; padding: 10px 5px; width: 50px; color: var(--primary); vertical-align: bottom;">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; margin: 0 auto; font-weight: 900;">TOPLAM</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let okunanSayisi = 0;
        let cellsHtml = '';

        kalemler.forEach(k => {
            let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
            let doluMu = hucreDegeri === '✔️';
            if (doluMu) okunanSayisi++;
            
            cellsHtml += `
                <td style="border: 1px solid #ddd; padding: 8px 0; text-align: center; background-color: ${doluMu ? '#d1fae5' : 'transparent'}; color: ${doluMu ? '#059669' : 'transparent'}; font-size: 1.1em; font-weight: bold;">
                    ${doluMu ? '✔️' : ''}
                </td>
            `;
        });

        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #333;">${ogr.name}</td>
            ${cellsHtml}
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.1em; background: #f8f9fa;">${okunanSayisi}</td>
        </tr>`;
    });

    tabloHtml += `</tbody></table></div>`;
    container.innerHTML = tabloHtml;
}