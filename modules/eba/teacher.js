import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ EBA Şifreleri yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('eba');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Misafirler EBA şifrelerini göremez. Bu modül sadece senin kontrolündedir.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">🔑 EBA Şifre Yönetimi</h3>
                <button id="btn-eba-yazdir" class="btn btn-primary" style="padding: 10px 20px; font-size: 1em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🖨️ Listeyi Yazdır / PDF Al
                </button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Öğrencilerin EBA şifrelerini aşağıdaki kutulara girip doğrudan kaydedebilirsiniz.</p>
            <div id="eba-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('eba'));
        await db.toggleModuleVisibility('eba', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    // Tek sayfaya sığması için daraltılmış yazdırma stili
    document.getElementById('btn-eba-yazdir').addEventListener('click', async () => {
        const tumKullanicilar = await db.getAll('users');
        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>EBA Şifre Listesi</title>
                <style>
                    @page { margin: 1cm; }
                    body { font-family: Arial, sans-serif; padding: 0; color: #000; margin: 0; }
                    h2 { text-align: center; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 12px; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #000; padding: 5px 8px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    
                    /* Tek sayfaya sığması için font ve aralıklar küçültüldü */
                    .sifre { 
                        font-family: 'Courier New', Courier, monospace; 
                        font-size: 15px; 
                        font-weight: bold; 
                        letter-spacing: 2px; 
                    }
                    .gri { color: #64748b; font-style: italic; font-size: 12px; }
                    
                    @media print {
                        .yesil { background-color: #d1fae5 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <h2>SINIF EBA ŞİFRE LİSTESİ</h2>
                <div class="tarih">Güncelleme Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">SN</th>
                            <th style="text-align: left;">Öğrenci Adı Soyadı</th>
                            <th style="width: 200px; text-align: center;">EBA Şifresi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ogrenciler.forEach((ogr, index) => {
            let ebaSifresi = ogr.ebaPassword || '';
            
            let sonucHucresi = ebaSifresi !== '' 
                ? `<td class="merkez sifre yesil">${ebaSifresi}</td>` 
                : `<td class="merkez gri">Şifre Girilmedi</td>`;
            
            printContent += `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td><strong>${ogr.name}</strong></td>
                    ${sonucHucresi}
                </tr>
            `;
        });

        printContent += `
                    </tbody>
                </table>
                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(() => window.close(), 500); 
                    };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 400px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 10px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Öğrenci Adı Soyadı</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 300px; color: var(--primary);">EBA Şifresi</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let ebaSifresi = ogr.ebaPassword || '';
        let islemGorduMu = ebaSifresi !== '';
        
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #555;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #333;">${ogr.name}</td>
            <td style="border: 1px solid #ddd; padding: 0;">
                <div style="display: flex; align-items: center; width: 100%; height: 100%; background: ${islemGorduMu ? '#e6ffed' : 'transparent'};">
                    <input type="text" class="eba-input" data-ogr="${ogr.id}" value="${ebaSifresi}" placeholder="Şifre Girin..."
                        style="flex: 1; padding: 12px; border: none; text-align: center; box-sizing: border-box; outline: none; background: transparent; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: ${islemGorduMu ? 'var(--success)' : '#888'};">
                </div>
            </td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('eba-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.eba-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const ogrId = e.target.getAttribute('data-ogr');
            const yeniSifre = e.target.value.trim();
            
            e.target.parentElement.style.backgroundColor = '#fff3cd'; 
            await db.update('users', ogrId, { ebaPassword: yeniSifre });
            
            setTimeout(() => { arayuzuGuncelle(); }, 300);
        });
    });
}