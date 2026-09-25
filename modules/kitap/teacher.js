import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Kitap okuma tablosu hızla getiriliyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('kitap');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda veliler ve öğrenciler sınıfın kitap okuma tablosunu görebilir.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3>1. Aşama: Okunacak Kitapları Ekle</h3>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="yeni-kitap-ad" placeholder="Tek bir kitap ekle (Örn: Küçük Prens)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <button id="btn-kitap-ekle" class="btn btn-primary">Tek Ekle</button>
            </div>

            <div style="margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="font-size: 0.85em; color: #475569; margin-bottom: 8px; font-weight: bold;">📥 Toplu Kitap Ekleme</p>
                <textarea id="toplu-kitap-ad" placeholder="Kitap isimlerini alt alta veya virgülle ayırarak yazın (Excel veya Word'den direkt yapıştırabilirsiniz)" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
                <button id="btn-toplu-kitap-ekle" class="btn btn-success" style="margin-top: 8px;">Listeyi Toplu Ekle</button>
            </div>

            <div id="kitap-basliklari" style="margin-top: 25px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
        </div>

        <div class="card" style="border-top: 4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">2. Aşama: Sınıf Kitap Takip Tablosu</h3>
                <button id="btn-kitap-yazdir" class="btn btn-primary" style="padding: 10px 20px; font-size: 1em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🖨️ Listeyi Yazdır / PDF Al
                </button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">
                Tabloyu sağa sola kaydırabilirsiniz, <strong>öğrenci isimleri sabit kalacaktır</strong>. İlgili hücreye tıklayarak durumu değiştirin: 
                <strong>1. Tıklama: ⏳ Okuyor (Sarı)</strong> ➔ 
                <strong>2. Tıklama: ✔️ Okudu (Yeşil)</strong> ➔ 
                <strong>3. Tıklama: Sil (Boş)</strong>.
            </p>
            <!-- YENİ: KAYDIRILABİLİR ALAN ÇERÇEVESİ -->
            <div id="kitap-tablosu-alani" style="max-height: 65vh; overflow: auto; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05);">
                <p style="padding: 20px;">⏳ Tablo yükleniyor...</p>
            </div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('kitap'));
        await db.toggleModuleVisibility('kitap', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-kitap-ekle').addEventListener('click', async () => {
        const ad = document.getElementById('yeni-kitap-ad').value.trim();
        if (ad) {
            const btn = document.getElementById('btn-kitap-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('kitaplar_kalemleri', { ad: ad });
            document.getElementById('yeni-kitap-ad').value = '';
            btn.disabled = false; btn.innerText = "Tek Ekle";
            await arayuzuGuncelle();
        }
    });

    document.getElementById('btn-toplu-kitap-ekle').addEventListener('click', async () => {
        const metin = document.getElementById('toplu-kitap-ad').value;
        if (!metin.trim()) return alert("Lütfen eklenecek kitap isimlerini yazın.");

        const btn = document.getElementById('btn-toplu-kitap-ekle');
        btn.disabled = true;
        btn.innerText = "⏳ Ekleniyor...";

        const kitaplar = metin.split(/[\n,]+/).map(k => k.trim()).filter(k => k !== "");
        
        let eklenenSayisi = 0;
        for (const kitap of kitaplar) {
            await db.add('kitaplar_kalemleri', { ad: kitap });
            eklenenSayisi++;
        }

        document.getElementById('toplu-kitap-ad').value = '';
        btn.disabled = false;
        btn.innerText = "Listeyi Toplu Ekle";
        
        if(eklenenSayisi > 0) {
            alert(eklenenSayisi + " adet kitap başarıyla eklendi!");
            await arayuzuGuncelle();
        }
    });

    document.getElementById('btn-kitap-yazdir').addEventListener('click', async () => {
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('kitaplar_kalemleri'),
            db.getAll('users'),
            db.getAll('kitap_matrisi')
        ]);
        
        if (kalemler.length === 0) {
            alert("Yazdırılacak herhangi bir kitap sütunu bulunmuyor.");
            return;
        }

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
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
                <title>Sınıf Kitap Okuma Takip Tablosu</title>
                <style>
                    @page { margin: 1cm; landscape; }
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #000; padding: 4px 6px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .okudu { background-color: #d1fae5 !important; font-weight: bold; -webkit-print-color-adjust: exact; color-adjust: exact; color: #059669; }
                    .okuyor { background-color: #fef3c7 !important; font-weight: bold; -webkit-print-color-adjust: exact; color-adjust: exact; color: #d97706; }
                    .dikey-baslik { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; margin: 0 auto; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>SINIF KİTAP OKUMA TAKİP LİSTESİ</h2>
                <div class="tarih">Güncelleme Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 25px; text-align: center; vertical-align: bottom; height: 120px;">SN</th>
                            <th style="width: 40px; text-align: center; vertical-align: bottom;">Okul No</th>
                            <th style="text-align: left; width: 140px; vertical-align: bottom;">Öğrenci Adı Soyadı</th>
                            ${kalemler.map(k => `<th style="width: 25px; vertical-align: bottom; padding-bottom: 10px;"><div class="dikey-baslik">${k.ad}</div></th>`).join('')}
                            <th style="width: 40px; text-align: center; vertical-align: bottom;"><div class="dikey-baslik" style="font-weight: 900;">TOPLAM</div></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ogrenciler.forEach((ogr, index) => {
            let okunanSayisi = 0;
            let rowHtml = `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td class="merkez"><strong>${ogr.okulno || '-'}</strong></td>
                    <td>${ogr.name}</td>
            `;
            
            kalemler.forEach(k => {
                let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
                let islemOkudu = hucreDegeri === '✔️';
                let islemOkuyor = hucreDegeri === '⏳';
                
                if (islemOkudu) okunanSayisi++;
                
                let cssClass = "merkez";
                if (islemOkudu) cssClass += " okudu";
                else if (islemOkuyor) cssClass += " okuyor";
                
                let icon = '';
                if(islemOkudu) icon = '✔️';
                else if(islemOkuyor) icon = '⏳';

                rowHtml += `<td class="${cssClass}">${icon}</td>`;
            });
            
            rowHtml += `<td class="merkez" style="background:#f8f9fa;"><strong>${okunanSayisi}</strong></td></tr>`;
            printContent += rowHtml;
        });

        printContent += `
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
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
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    let basliklarHtml = '';
    kalemler.forEach(k => {
        basliklarHtml += `
            <div style="background: #f1f1f1; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #ddd;">
                <span style="font-size: 0.9em; font-weight: bold;">📚 ${k.ad}</span>
                <button class="btn-kalem-duzenle" data-id="${k.id}" data-ad="${k.ad}" style="background: none; border: none; padding: 0; margin-left: 5px; color: var(--primary); cursor: pointer; font-size: 1.1em;" title="Adını Değiştir">✏️</button>
                <button class="btn-kalem-sil" data-id="${k.id}" style="background: none; border: none; padding: 0; color: var(--danger); cursor: pointer; font-weight: bold; font-size: 1.1em;" title="Sil">✕</button>
            </div>
        `;
    });
    document.getElementById('kitap-basliklari').innerHTML = basliklarHtml;

    document.querySelectorAll('.btn-kalem-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const eskiAd = e.currentTarget.getAttribute('data-ad');
            const yeniAd = prompt("Kitabın adını düzeltin:", eskiAd);
            if (yeniAd !== null && yeniAd.trim() !== "" && yeniAd.trim() !== eskiAd) {
                e.currentTarget.innerText = "⏳";
                await db.update('kitaplar_kalemleri', id, { ad: yeniAd.trim() });
                await arayuzuGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu kitabı listeden silmek istediğinize emin misiniz? Öğrenci okuma verileri de silinir.")) {
                e.currentTarget.innerText = "...";
                await db.delete('kitaplar_kalemleri', e.currentTarget.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    if (kalemler.length === 0) {
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:var(--secondary); padding: 20px;">Lütfen önce yukarıdan en az bir kitap ekleyin.</p>';
        return;
    }

    // YENİ: SABİT SÜTUNLU (STICKY) TABLO YAPISI
    let tabloHtml = `
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; font-size: 0.9em; box-sizing: border-box;">
            <thead>
                <tr>
                    <th style="box-sizing: border-box; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; padding: 10px 5px; width: 40px; min-width: 40px; max-width: 40px; text-align: center; vertical-align: bottom; height: 140px; position: sticky; left: 0; top: 0; background: #f8f9fa; z-index: 20;">SN</th>
                    <th style="box-sizing: border-box; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; padding: 10px 5px; width: 60px; min-width: 60px; max-width: 60px; text-align: center; vertical-align: bottom; position: sticky; left: 40px; top: 0; background: #f8f9fa; z-index: 20;">NO</th>
                    <th style="box-sizing: border-box; border-bottom: 2px solid #cbd5e1; border-right: 3px solid #94a3b8; padding: 10px 5px; text-align: left; width: 160px; min-width: 160px; max-width: 160px; vertical-align: bottom; position: sticky; left: 100px; top: 0; background: #f8f9fa; z-index: 20;">ADI SOYADI</th>
                    ${kalemler.map(k => `
                        <th style="box-sizing: border-box; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; padding: 10px 2px; width: 40px; min-width: 40px; vertical-align: bottom; position: sticky; top: 0; background: #f8f9fa; z-index: 10;">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; margin: 0 auto; font-size: 0.95em;">${k.ad}</div>
                        </th>
                    `).join('')}
                    <th style="box-sizing: border-box; border-bottom: 2px solid #cbd5e1; border-left: 3px solid #94a3b8; padding: 10px 5px; width: 60px; min-width: 60px; max-width: 60px; color: var(--primary); vertical-align: bottom; position: sticky; right: 0; top: 0; background: #f1f5f9; z-index: 20;">
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
            if (hucreDegeri === '✔️') okunanSayisi++; 
            
            let bgRenk = 'transparent';
            let textColor = 'transparent';
            let icon = '·';
            
            if (hucreDegeri === '⏳') { bgRenk = '#fef3c7'; textColor = '#d97706'; icon = '⏳'; } 
            else if (hucreDegeri === '✔️') { bgRenk = '#d1fae5'; textColor = '#059669'; icon = '✔️'; }
            
            cellsHtml += `
                <td style="box-sizing: border-box; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0; min-width: 40px; background-color: ${bgRenk};">
                    <div class="hucre-tikla" data-ogr="${ogr.id}" data-kalem="${k.id}" data-val="${hucreDegeri}"
                         style="width: 100%; height: 100%; padding: 12px 0; text-align: center; cursor: pointer; user-select: none; transition: 0.2s; 
                                color: ${textColor}; font-size: 1.1em; font-weight: bold;">
                        ${icon}
                    </div>
                </td>
            `;
        });

        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        tabloHtml += `<tr>
            <td style="box-sizing: border-box; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 8px; text-align: center; color: #666; position: sticky; left: 0; background: ${satirArkaPlan}; z-index: 5;">${index + 1}</td>
            <td style="box-sizing: border-box; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 8px; text-align: center; font-weight: bold; position: sticky; left: 40px; background: ${satirArkaPlan}; z-index: 5;">${ogr.okulno || '-'}</td>
            <td style="box-sizing: border-box; border-bottom: 1px solid #e2e8f0; border-right: 3px solid #94a3b8; padding: 8px; font-weight: bold; color: #333; position: sticky; left: 100px; background: ${satirArkaPlan}; z-index: 5;">${ogr.name}</td>
            ${cellsHtml}
            <td style="box-sizing: border-box; border-bottom: 1px solid #e2e8f0; border-left: 3px solid #94a3b8; padding: 8px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.1em; position: sticky; right: 0; background: #f1f5f9; z-index: 5;">${okunanSayisi}</td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-tikla').forEach(div => {
        div.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const kalemId = e.currentTarget.getAttribute('data-kalem');
            const mevcutDeger = e.currentTarget.getAttribute('data-val');
            
            let newValue = '';
            let bgRenk = 'transparent';
            let textColor = 'transparent';
            let icon = '·';

            if (mevcutDeger === '') {
                newValue = '⏳'; bgRenk = '#fef3c7'; textColor = '#d97706'; icon = '⏳';
            } else if (mevcutDeger === '⏳') {
                newValue = '✔️'; bgRenk = '#d1fae5'; textColor = '#059669'; icon = '✔️';
            } else {
                newValue = '';
            }
            
            e.currentTarget.setAttribute('data-val', newValue);
            e.currentTarget.innerText = icon;
            e.currentTarget.parentElement.style.backgroundColor = bgRenk;
            e.currentTarget.style.color = textColor;
            
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kalemId, newValue);
            
            // Toplam sayısını doğru güncellemek için listeyi arka planda tamamen yenile
            setTimeout(() => { arayuzuGuncelle(); }, 300);
        });
    });
}