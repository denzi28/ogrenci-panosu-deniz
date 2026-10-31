import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ İhtiyaç modülü buluttan getiriliyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('ihtiyaclar');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda misafirler (veliler) sadece neye ihtiyaç olduğunu liste halinde görür.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3>1. Aşama: İhtiyaç Kalemlerini Belirle</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="yeni-ihtiyac-ad" placeholder="Örn: A4 Kağıdı, Peçete" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <button id="btn-ihtiyac-ekle" class="btn btn-primary">İhtiyaç Ekle</button>
            </div>
            <div id="ihtiyac-basliklari" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
        </div>

        <div class="card" style="border-top: 4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">2. Aşama: Öğrenci İhtiyaç Takibi</h3>
                <button id="btn-ihtiyac-yazdir" class="btn btn-primary" style="padding: 8px 15px; font-size: 0.9em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🖨️ Listeyi Yazdır / PDF Al
                </button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Bir öğrencinin üzerine tıklayarak ihtiyaç malzemelerini görebilir ve tek dokunuşla X atabilirsiniz.</p>
            <div id="ogrenci-liste-alani"><p>⏳ Öğrenciler yükleniyor...</p></div>
        </div>

        <!-- ÖĞRENCİ DETAY MODALI (POPUP) -->
        <div id="ogrenci-detay-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:3000; align-items:center; justify-content:center;">
            <div style="background:white; width:90%; max-width:450px; border-radius:16px; padding:20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height:85vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <div>
                        <h3 id="modal-ogr-ad" style="margin:0; font-size:1.2em; color:var(--primary);">Öğrenci Adı</h3>
                        <span id="modal-ogr-no" style="font-size:0.85em; color:#666;">Okul No: -</span>
                    </div>
                    <button id="modal-kapat" style="background:none; border:none; font-size:1.4em; cursor:pointer; color:#666;"><i class="fas fa-times">✕</i></button>
                </div>
                <div id="modal-malzeme-listesi" style="display:flex; flex-direction:column; gap:10px;">
                    <!-- Malzemeler dinamik eklenecek -->
                </div>
            </div>
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
            btn.disabled = false; btn.innerText = "İhtiyaç Ekle";
            await arayuzuGuncelle();
        }
    });

    // Modal Kapatma
    const modal = document.getElementById('ogrenci-detay-modal');
    document.getElementById('modal-kapat').addEventListener('click', () => {
        modal.style.display = 'none';
        arayuzuGuncelle(); // Listeyi güncelle ki ana ekrandaki özet sayaçlar yenilensin
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            arayuzuGuncelle();
        }
    });

    // YAZDIRMA İŞLEMİ
    document.getElementById('btn-ihtiyac-yazdir').addEventListener('click', async () => {
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('ihtiyac_kalemleri'),
            db.getAll('users'),
            db.getAll('ihtiyac_matrisi')
        ]);
        
        if (kalemler.length === 0) {
            alert("Yazdırılacak herhangi bir ihtiyaç kalemi bulunmuyor.");
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
                <title>Sınıf İhtiyaç Takip Tablosu</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #000; padding: 6px 8px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .dolu { background-color: #d1fae5 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
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
                printContent += `<td class="merkez ${islemGorduMu ? 'dolu' : ''}">${hucreDegeri}</td>`;
            });
            printContent += `</tr>`;
        });

        printContent += `</tbody></table>
                <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }</script>
            </body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('ihtiyac_kalemleri'),
        db.getAll('users'),
        db.getAll('ihtiyac_matrisi')
    ]);
    
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    // İhtiyaç Kalemlerini Üstte Rozet Şeklinde Göster
    let basliklarHtml = '';
    kalemler.forEach(k => {
        basliklarHtml += `
            <div style="background: #f1f1f1; padding: 5px 12px; border-radius: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #ddd;">
                <span style="font-size: 0.9em; font-weight: bold;">${k.ad}</span>
                <button class="btn-kalem-sil" data-id="${k.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;">✕</button>
            </div>
        `;
    });
    document.getElementById('ihtiyac-basliklari').innerHTML = basliklarHtml || '<span style="color:#666; font-size:0.9em;">Henüz ihtiyaç kalemi eklenmemiş.</span>';

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu sütunu silmek istediğinize emin misiniz?")) {
                await db.delete('ihtiyac_kalemleri', e.target.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    if (ogrenciler.length === 0) {
        document.getElementById('ogrenci-liste-alani').innerHTML = '<p style="color:var(--secondary);">Kayıtlı öğrenci bulunmuyor.</p>';
        return;
    }

    // Öğrenci Liste Kartları
    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    ogrenciler.forEach((ogr, index) => {
        // Bu öğrencinin getirdiği toplam X sayısını hesapla
        let getirilenSayisi = kalemler.filter(k => {
            let val = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
            return val && val !== '';
        }).length;

        let rozetRenk = getirilenSayisi > 0 ? '#d1fae5' : '#f1f5f9';
        let rozetYazi = getirilenSayisi > 0 ? `✅ ${getirilenSayisi}/${kalemler.length} Tamamlandı` : '⏳ Eksik';

        listeHtml += `
            <div class="ogrenci-karti" data-id="${ogr.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: background 0.2s, transform 0.1s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="background: #e2e8f0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.8em; font-weight: bold; color: #475569;">${index + 1}</span>
                    <div>
                        <strong style="font-size: 0.95em; color: #1e293b;">${ogr.name}</strong>
                        <div style="font-size: 0.75em; color: #64748b;">No: ${ogr.okulno || '-'}</div>
                    </div>
                </div>
                <div style="background: ${rozetRenk}; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; color: #334155;">
                    ${rozetYazi} →
                </div>
            </div>
        `;
    });
    listeHtml += '</div>';

    document.getElementById('ogrenci-liste-alani').innerHTML = listeHtml;

    // Öğrenciye Tıklayınca Modal Açma
    document.querySelectorAll('.ogrenci-karti').forEach(kart => {
        kart.addEventListener('click', async () => {
            const ogrId = kart.getAttribute('data-id');
            const ogr = ogrenciler.find(u => u.id === ogrId);
            
            document.getElementById('modal-ogr-ad').innerText = ogr.name;
            document.getElementById('modal-ogr-no').innerText = `Okul No: ${ogr.okulno || '-'}`;

            const malzemeContainer = document.getElementById('modal-malzeme-listesi');
            
            if (kalemler.length === 0) {
                malzemeContainer.innerHTML = '<p style="text-align:center; color:#666;">Önce yukarıdan ihtiyaç kalemi eklemelisiniz.</p>';
            } else {
                let mHtml = '';
                kalemler.forEach(k => {
                    let mevcutDeger = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
                    let isXVar = mevcutDeger === 'X' || mevcutDeger === 'x';

                    mHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                            <span style="font-weight: 600; font-size: 0.9em; color: #334155;">${k.ad}</span>
                            <button class="btn-x-toggle" data-ogr="${ogr.id}" data-kalem="${k.id}" data-durum="${isXVar ? 'var' : 'yok'}" 
                                    style="padding: 6px 14px; font-weight: bold; border-radius: 8px; border: none; cursor: pointer; background: ${isXVar ? '#22c55e' : '#e2e8f0'}; color: ${isXVar ? '#fff' : '#64748b'}; transition: 0.2s;">
                                ${isXVar ? '✔ X Atıldı' : '+ X At'}
                            </button>
                        </div>
                    `;
                });
                malzemeContainer.innerHTML = mHtml;

                // X Atma / Kaldırma Butonu İşlevi
                document.querySelectorAll('.btn-x-toggle').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const bOgrId = btn.getAttribute('data-ogr');
                        const bKalemId = btn.getAttribute('data-kalem');
                        const durumm = btn.getAttribute('data-durum');

                        btn.innerText = '...';
                        if (durumm === 'yok') {
                            await db.saveMatrixStatus('ihtiyac_matrisi', bOgrId, bKalemId, 'X');
                            btn.setAttribute('data-durum', 'var');
                            btn.style.background = '#22c55e';
                            btn.style.color = '#fff';
                            btn.innerText = '✔ X Atıldı';
                        } else {
                            await db.saveMatrixStatus('ihtiyac_matrisi', bOgrId, bKalemId, '');
                            btn.setAttribute('data-durum', 'yok');
                            btn.style.background = '#e2e8f0';
                            btn.style.color = '#64748b';
                            btn.innerText = '+ X At';
                        }
                    });
                });
            }

            document.getElementById('ogrenci-detay-modal').style.display = 'flex';
        });
    });
}