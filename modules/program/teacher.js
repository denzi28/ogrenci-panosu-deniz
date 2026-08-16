import { db } from '../../js/db.js';

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const DERS_SAYISI = 6;
const TABLO_ADI = 'ders_programi';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Ders programı yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('program');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda öğrenciler ve veliler güncel ders programını ve saatlerini görebilirler.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">📅 Sınıf Ders Programı</h3>
                <button id="btn-program-yazdir" class="btn btn-primary" style="padding: 10px 20px; font-size: 1em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🖨️ Programı Yazdır / PDF Al
                </button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Tablo başlığındaki saat kutucuklarına ders saatlerini (Örn: 09:00 - 09:40), aşağıdaki hücrelere ise ders adlarını yazabilirsiniz. Otomatik kaydedilir.</p>
            <div id="program-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('program'));
        await db.toggleModuleVisibility('program', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    // YAZDIRMA İŞLEMİ (Saatler Dahil)
    document.getElementById('btn-program-yazdir').addEventListener('click', async () => {
        const programVerileri = await db.getAll(TABLO_ADI);
        const saatKaydi = programVerileri.find(p => p.gun === 'SAATLER') || {};

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Ders Programı</title>
                <style>
                    @page { margin: 1cm; landscape; }
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;}
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 16px; margin-top: 10px; }
                    th, td { border: 2px solid #000; padding: 15px; text-align: center; width: 16%; }
                    th { background-color: #f1f5f9; font-size: 16px; text-transform: uppercase; }
                    .saat-text { display: block; font-size: 13px; font-weight: normal; color: #333; margin-top: 5px; }
                    .gun-sutunu { background-color: #e2e8f0; font-weight: bold; text-align: left; padding-left: 20px; }
                    .ders-adi { font-weight: bold; font-size: 18px; }
                </style>
            </head>
            <body>
                <h2>HAFTALIK DERS PROGRAMI</h2>
                <div class="tarih">Eğitim Öğretim Yılı Güncel Ders Çizelgesi</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%; font-weight: bold;">GÜNLER</th>
                            ${Array.from({length: DERS_SAYISI}, (_, i) => `
                                <th>
                                    <strong>${i + 1}. DERS</strong>
                                    <span class="saat-text">${saatKaydi[`ders${i+1}`] || ''}</span>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        GUNLER.forEach(gun => {
            let gunKaydi = programVerileri.find(p => p.gun === gun) || {};
            printContent += `<tr><td class="gun-sutunu">${gun}</td>`;
            for (let i = 1; i <= DERS_SAYISI; i++) {
                let dersAdi = gunKaydi[`ders${i}`] || '';
                printContent += `<td><span class="ders-adi">${dersAdi}</span></td>`;
            }
            printContent += `</tr>`;
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
    const programVerileri = await db.getAll(TABLO_ADI);
    const saatKaydi = programVerileri.find(p => p.gun === 'SAATLER') || { gun: 'SAATLER' };

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 120px; vertical-align: middle;">GÜNLER / SAAT</th>
                    ${Array.from({length: DERS_SAYISI}, (_, i) => `
                        <th style="border: 1px solid #ddd; padding: 5px; text-align: center; vertical-align: middle;">
                            <div style="font-weight: bold; margin-bottom: 3px;">${i + 1}. Ders</div>
                            <input type="text" class="ders-input" data-gun="SAATLER" data-ders="${i + 1}" value="${saatKaydi[`ders${i+1}`] || ''}" placeholder="00:00 - 00:00"
                                style="width: 90%; padding: 4px; font-size: 0.8em; text-align: center; border: 1px dashed #ccc; border-radius: 3px; outline: none; color: #555;">
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    GUNLER.forEach(gun => {
        let gunKaydi = programVerileri.find(p => p.gun === gun) || { gun: gun };
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f8fafc;">${gun}</td>
        `;
        for (let i = 1; i <= DERS_SAYISI; i++) {
            let dersAdi = gunKaydi[`ders${i}`] || '';
            let doluMu = dersAdi !== '';
            tabloHtml += `
                <td style="border: 1px solid #ddd; padding: 0;">
                    <div style="display: flex; align-items: center; width: 100%; height: 100%; background: ${doluMu ? '#e6ffed' : 'transparent'};">
                        <input type="text" class="ders-input" data-gun="${gun}" data-ders="${i}" value="${dersAdi}" placeholder="Ders gir..."
                            style="width: 100%; padding: 12px; border: none; text-align: center; box-sizing: border-box; outline: none; background: transparent; font-weight: bold; color: ${doluMu ? '#0f172a' : '#888'};">
                    </div>
                </td>
            `;
        }
        tabloHtml += `</tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('program-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.ders-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const gun = e.target.getAttribute('data-gun');
            const dersNo = e.target.getAttribute('data-ders');
            const deger = e.target.value.trim();
            
            e.target.style.backgroundColor = '#fff3cd'; 
            
            const guncelVeriler = await db.getAll(TABLO_ADI);
            let mevcutKayit = guncelVeriler.find(p => p.gun === gun);
            
            if (mevcutKayit) {
                let guncellenecekVeri = { ...mevcutKayit };
                guncellenecekVeri[`ders${dersNo}`] = deger;
                await db.update(TABLO_ADI, mevcutKayit.id, guncellenecekVeri);
            } else {
                let yeniKayit = { gun: gun };
                yeniKayit[`ders${dersNo}`] = deger;
                await db.add(TABLO_ADI, yeniKayit);
            }
            
            setTimeout(() => { arayuzuGuncelle(); }, 400);
        });
    });
}