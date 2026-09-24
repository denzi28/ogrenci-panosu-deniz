import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ İhtiyaç tablosu buluttan getiriliyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('ihtiyaclar');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda misafirler (veliler) sadece neye ihtiyaç olduğunu liste halinde görür, kimin getirip getirmediğini göremez.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3>1. Aşama: İhtiyaç Kalemlerini Belirle</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="yeni-ihtiyac-ad" placeholder="Örn: A4 Kağıdı, Peçete, 200+200 TL" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <button id="btn-ihtiyac-ekle" class="btn btn-primary">Sütun Ekle</button>
            </div>
            <div id="ihtiyac-basliklari" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
        </div>

        <div class="card" style="border-top: 4px solid var(--success); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">2. Aşama: Sınıf Takip Tablosu</h3>
                <button id="btn-ihtiyac-yazdir" class="btn btn-primary" style="padding: 10px 20px; font-size: 1em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🖨️ Listeyi Yazdır / PDF Al
                </button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Hücrelere "x", "Devamsız" veya miktar yazabilirsiniz. Başka yere tıkladığınız an buluta otomatik kaydedilir.</p>
            <div id="ihtiyac-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('ihtiyaclar'));
        await db.toggleModuleVisibility('ihtiyaclar', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-ihtiyac-ekle').addEventListener('click', async () => {
        const ad = document.getElementById('yeni-ihtiyac-ad').value.trim();
        if (ad) {
            const btn = document.getElementById('btn-ihtiyac-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('ihtiyac_kalemleri', { ad: ad });
            document.getElementById('yeni-ihtiyac-ad').value = '';
            btn.disabled = false; btn.innerText = "Sütun Ekle";
            await arayuzuGuncelle();
        }
    });

    // YAZDIRMA İŞLEMİ
    document.getElementById('btn-ihtiyac-yazdir').addEventListener('click', async () => {
        // HIZLANDIRMA: Çıktı alırken verileri aynı anda çekiyoruz
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('ihtiyac_kalemleri'),
            db.getAll('users'),
            db.getAll('ihtiyac_matrisi')
        ]);
        
        if (kalemler.length === 0) {
            alert("Yazdırılacak herhangi bir ihtiyaç sütunu bulunmuyor.");
            return;
        }

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

        // Okul numarasına göre sıralama
        ogrenciler.sort((a, b) => {
            const noA = parseInt(a.okulno) || 999999;
            const noB = parseInt(b.okulno) || 999999;
            if (noA === noB) return (a.name || '').localeCompare(b.name || '');
            return noA - noB;
        });

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Sınıf İhtiyaç Takip Tablosu</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #000; padding: 6px 8px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .dolu { background-color: #d1fae5 !important; font-weight: bold; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .devamsiz { color: #dc2626 !important; font-style: italic; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    /* Yazıcıda da zebra deseninin çıkması için */
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>SINIF İHTİYAÇ TAKİP LİSTESİ</h2>
                <div class="tarih">Güncelleme Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px; text-align: center;">SN</th>
                            <th style="width: 50px; text-align: center;">Okul No</th>
                            <th style="text-align: left;">Öğrenci Adı Soyadı</th>
                            ${kalemler.map(k => `<th>${k.ad}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        ogrenciler.forEach((ogr, index) => {
            printContent += `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td class="merkez"><strong>${ogr.okulno || '-'}</strong></td>
                    <td>${ogr.name}</td>
            `;
            
            kalemler.forEach(k => {
                let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
                let islemGorduMu = hucreDegeri !== '';
                let cssClass = "merkez";
                
                if (hucreDegeri.toLowerCase() === 'devamsız') {
                    cssClass += " devamsiz";
                } else if (islemGorduMu) {
                    cssClass += " dolu";
                }
                
                printContent += `<td class="${cssClass}">${hucreDegeri}</td>`;
            });
            
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
    // HIZLANDIRMA: Tüm tabloları aynı anda çekiyoruz
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('ihtiyac_kalemleri'),
        db.getAll('users'),
        db.getAll('ihtiyac_matrisi')
    ]);
    
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    // --- OKUL NUMARASINA GÖRE SIRALAMA ---
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });
    // -------------------------------------------

    let basliklarHtml = '';
    kalemler.forEach(k => {
        basliklarHtml += `
            <div style="background: #f1f1f1; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #ddd;">
                <span style="font-size: 0.9em; font-weight: bold;">${k.ad}</span>
                <button class="btn-kalem-sil" data-id="${k.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;">✕</button>
            </div>
        `;
    });
    document.getElementById('ihtiyac-basliklari').innerHTML = basliklarHtml;

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu sütunu silmek istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.delete('ihtiyac_kalemleri', e.target.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    if (kalemler.length === 0) {
        document.getElementById('ihtiyac-tablosu-alani').innerHTML = '<p style="color:var(--secondary);">Lütfen önce yukarıdan en az bir ihtiyaç kalemi ekleyin.</p>';
        return;
    }

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.9em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px; width: 30px;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 8px; width: 60px;">OKUL NO</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ADI SOYADI</th>
                    ${kalemler.map(k => `<th style="border: 1px solid #ddd; padding: 8px;">${k.ad}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        // ZEBRA DESENİ İÇİN SATIR RENGİ: Çift sayılar beyaz, tek sayılar çok hafif gri-mavi
        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f1f5f9';

        tabloHtml += `<tr style="background-color: ${satirArkaPlan}; transition: background-color 0.2s;">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${ogr.okulno || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${ogr.name}</td>
        `;

        kalemler.forEach(k => {
            let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
            let textColor = hucreDegeri.toLowerCase() === 'devamsız' ? 'red' : 'inherit';
            
            tabloHtml += `
                <td style="border: 1px solid #ddd; padding: 0;">
                    <input type="text" class="hucre-input" data-ogr="${ogr.id}" data-kalem="${k.id}" value="${hucreDegeri}" 
                           onfocus="this.parentElement.parentElement.style.backgroundColor='#fff3cd';"
                           onblur="this.parentElement.parentElement.style.backgroundColor='${satirArkaPlan}';"
                           style="width: 100%; height: 100%; padding: 10px; border: none; text-align: center; color: ${textColor}; font-weight: ${hucreDegeri ? 'bold' : 'normal'}; box-sizing: border-box; outline: none; background: transparent;">
                </td>
            `;
        });
        tabloHtml += `</tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('ihtiyac-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-input').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.style.color = e.target.value.toLowerCase() === 'devamsız' ? 'red' : 'inherit';
            e.target.style.fontWeight = e.target.value ? 'bold' : 'normal';
        });

        input.addEventListener('change', async (e) => {
            const ogrId = e.target.getAttribute('data-ogr');
            const kalemId = e.target.getAttribute('data-kalem');
            const deger = e.target.value.trim();
            
            e.target.style.backgroundColor = '#d1fae5'; // Başarılı kayıt yeşili
            await db.saveMatrixStatus('ihtiyac_matrisi', ogrId, kalemId, deger);
            setTimeout(() => { e.target.style.backgroundColor = 'transparent'; }, 800);
        });
    });
}