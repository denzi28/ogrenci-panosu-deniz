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

    container.innerHTML = `
        <!-- ANA LİSTE GÖRÜNÜMÜ -->
        <div id="ana-gorunum" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">📚 Sınıf Kitap Okuma Tablosu</h3>
                <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Öğrencilerin okudukları detaylı kitap listesini görmek için yanlarındaki <strong>"📚 Kitapları Gör"</strong> butonuna tıklayın.</p>
                <div id="kitap-tablosu-alani" style="overflow-x: auto;"><p>⏳ Liste yükleniyor...</p></div>
            </div>
        </div>

        <!-- YENİ: ÖĞRENCİ DETAY GÖRÜNÜMÜ (Alt Alta Kitap Listesi) -->
        <div id="detay-gorunum" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--success); min-height: 50vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="detay-baslik" style="margin: 0; color: var(--primary);">📖 Öğrenci Adı - Kitap Listesi</h2>
                    <button id="btn-detay-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅️ Listeye Dön</button>
                </div>
                <div id="detay-kitap-listesi"></div>
            </div>
        </div>
    `;

    document.getElementById('btn-detay-kapat').addEventListener('click', () => {
        document.getElementById('detay-gorunum').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    await listeyiYukle();
}

async function listeyiYukle() {
    // HIZLANDIRMA: Veriler paralel çekilir
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    if (kalemler.length === 0) {
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:#888;">Henüz listeye kitap eklenmemiş.</p>';
        return;
    }

    // KİTAPLARI ALFABETİK SIRALA
    kalemler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'));

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 500px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">ADI SOYADI</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 90px; color: var(--primary); text-align: center;">TOPLAM</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 140px; text-align: center;">DETAY</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let okunanSayisi = 0;
        kalemler.forEach(k => {
            if (matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger === '✔️') okunanSayisi++;
        });

        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        tabloHtml += `
            <tr style="background-color: ${satirArkaPlan};">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #333;">${ogr.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.2em; background: #f1f5f9;">${okunanSayisi}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <button class="btn btn-primary btn-detay-ac" data-ogrid="${ogr.id}" data-ogrname="${ogr.name}" style="padding: 8px 15px; font-weight: bold; font-size: 0.9em;">
                        📚 Kitapları Gör
                    </button>
                </td>
            </tr>
        `;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.btn-detay-ac').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogrid');
            const ogrName = e.currentTarget.getAttribute('data-ogrname');
            ogrenciDetayiniAc(ogrId, ogrName, kalemler, matris);
        });
    });
}

function ogrenciDetayiniAc(ogrId, ogrName, kalemler, matris) {
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('detay-gorunum').style.display = 'block';
    document.getElementById('detay-baslik').innerText = `📖 ${ogrName} - Kitap Listesi`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    kalemler.forEach((k, index) => {
        let mevcutDeger = matris.find(m => m.ogrId === ogrId && m.targetId === k.id)?.deger || '';
        
        let durumText = 'Okumadı';
        let bgRenk = '#f1f5f9';
        let textColor = '#64748b';
        let borderRenk = '#cbd5e1';

        if (mevcutDeger === '⏳') {
            durumText = '⏳ Okuyor';
            bgRenk = '#fef3c7'; textColor = '#d97706'; borderRenk = '#f59e0b';
        } else if (mevcutDeger === '✔️') {
            durumText = '✔️ Okudu';
            bgRenk = '#d1fae5'; textColor = '#059669'; borderRenk = '#10b981';
        }

        listeHtml += `
            <div style="background: white; padding: 15px 20px; border-radius: 12px; border: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 1.1em; font-weight: bold; color: #334155; flex: 1; min-width: 200px;">
                    <span style="color: #94a3b8; margin-right: 10px;">${index + 1}.</span>${k.ad}
                </div>
                <div style="padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.95em; border: 2px solid ${borderRenk}; background: ${bgRenk}; color: ${textColor}; min-width: 100px; text-align: center;">
                    ${durumText}
                </div>
            </div>
        `;
    });

    listeHtml += '</div>';
    document.getElementById('detay-kitap-listesi').innerHTML = listeHtml;
}