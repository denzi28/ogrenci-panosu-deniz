import { db } from '../../js/db.js';

// Sıralama durumu hafızada tutulur (Varsayılan: Alfabetik)
let aktifSiralama = 'alfabetik'; 

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Kitap okuma modülü yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('kitap');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            
            <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda veliler sınıfın kitap okuma durumunu görebilir.</p>
                </div>
                <div>
                    <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
                </div>
            </div>

            <div class="card" style="border-top: 4px solid var(--primary);">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">👥 Öğrenci Takip Listesi</button>
                    <button id="tab-kitap-yonetimi" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">📚 Kitap Yönetimi (Ekle/Sil)</button>
                </div>

                <!-- 1. SEKME: ÖĞRENCİ LİSTESİ -->
                <div id="view-ogrenciler" style="display: block;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="margin: 0; color: var(--success);">Öğrenci Okuma Durumları</h3>
                        <button id="btn-kitap-yazdir" class="btn btn-primary" style="padding: 10px 20px; font-size: 1em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🖨️ Rapor Yazdır / PDF Al
                        </button>
                    </div>
                    <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">
                        Öğrencilerin okuduğu kitapları işaretlemek için yanlarındaki <strong>"📚 İşaretle"</strong> butonuna tıklayın. Sütun başlığındaki butona tıklayarak sıralamayı değiştirebilirsiniz.
                    </p>
                    <div id="kitap-tablosu-alani" style="overflow-x: auto;"><p>⏳ Liste yükleniyor...</p></div>
                </div>

                <!-- 2. SEKME: KİTAP YÖNETİMİ -->
                <div id="view-kitap-yonetimi" style="display: none;">
                    <h3 style="color: var(--primary);">Sınıf Kitaplığına Yeni Kitap Ekle</h3>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <input type="text" id="yeni-kitap-ad" placeholder="Tek bir kitap ekle (Örn: Küçük Prens)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <button id="btn-kitap-ekle" class="btn btn-primary">Tek Ekle</button>
                    </div>

                    <div style="margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 0.85em; color: #475569; margin-bottom: 8px; font-weight: bold;">📥 Toplu Kitap Ekleme</p>
                        <textarea id="toplu-kitap-ad" placeholder="Kitap isimlerini alt alta veya virgülle ayırarak yazın" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
                        <button id="btn-toplu-kitap-ekle" class="btn btn-success" style="margin-top: 8px;">Listeyi Toplu Ekle</button>
                    </div>

                    <div style="margin-top: 30px;">
                        <h3 style="margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Mevcut Kitaplar (<span id="kitap-sayaci">0</span>)</h3>
                        <div id="kitap-basliklari"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ÖĞRENCİ DETAY GÖRÜNÜMÜ -->
        <div id="detay-gorunum" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary); min-height: 50vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="detay-baslik" style="margin: 0; color: var(--primary);">📖 Öğrenci Adı - Kitap Listesi</h2>
                    <button id="btn-detay-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅️ Listeye Dön</button>
                </div>
                
                <div style="background: #e8f4fd; border: 1px dashed var(--primary); padding: 12px; border-radius: 8px; font-size: 0.95em; margin-bottom: 20px; color: #1e293b; text-align: center;">
                    Kitabın durumunu değiştirmek için sağdaki butona tıklayın: <br>
                    <strong>Okumadı (Gri) ➔ ⏳ Okuyor (Sarı) ➔ ✔️ Okudu (Yeşil)</strong>
                </div>

                <div id="detay-kitap-listesi"></div>
            </div>
        </div>
    `;

    document.getElementById('tab-ogrenciler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'block';
        document.getElementById('view-kitap-yonetimi').style.display = 'none';
        document.getElementById('tab-ogrenciler').className = 'btn btn-primary';
        document.getElementById('tab-kitap-yonetimi').className = 'btn btn-secondary';
    });

    document.getElementById('tab-kitap-yonetimi').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'none';
        document.getElementById('view-kitap-yonetimi').style.display = 'block';
        document.getElementById('tab-ogrenciler').className = 'btn btn-secondary';
        document.getElementById('tab-kitap-yonetimi').className = 'btn btn-primary';
    });

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
        btn.disabled = true; btn.innerText = "⏳ Ekleniyor...";

        const kitaplar = metin.split(/[\n,]+/).map(k => k.trim()).filter(k => k !== "");
        for (const kitap of kitaplar) { await db.add('kitaplar_kalemleri', { ad: kitap }); }

        document.getElementById('toplu-kitap-ad').value = '';
        btn.disabled = false; btn.innerText = "Listeyi Toplu Ekle";
        await arayuzuGuncelle();
    });

    document.getElementById('btn-detay-kapat').addEventListener('click', async () => {
        document.getElementById('detay-gorunum').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        await arayuzuGuncelle(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-kitap-yazdir').addEventListener('click', async () => {
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('kitaplar_kalemleri'),
            db.getAll('users'),
            db.getAll('kitap_matrisi')
        ]);
        
        if (kalemler.length === 0) return alert("Sistemde kitap bulunmuyor.");

        kalemler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'));

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
        
        // Ekranda görünen sıralamayı aynen yazdırma işlemine de uygula
        ogrenciler.forEach(ogr => {
            ogr.okunanSayisi = 0;
            ogr.suAnOkuduguKitaplar = [];
            kalemler.forEach(k => {
                let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
                if (durum === '✔️') ogr.okunanSayisi++;
                if (durum === '⏳') ogr.suAnOkuduguKitaplar.push(k.ad);
            });
        });

        if (aktifSiralama === 'alfabetik') {
            ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } else if (aktifSiralama === 'encok') {
            ogrenciler.sort((a, b) => {
                if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
                return (a.name || '').localeCompare(b.name || '', 'tr-TR');
            });
        } else if (aktifSiralama === 'okuyan') {
            ogrenciler.sort((a, b) => {
                let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
                return (a.name || '').localeCompare(b.name || '', 'tr-TR');
            });
        }

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Sınıf Kitap Okuma Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .kitap-listesi { font-size: 12px; color: #444; margin-top: 5px; font-style: italic; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>SINIF KİTAP OKUMA RAPORU</h2>
                <div class="tarih">Sıralama: ${aktifSiralama === 'alfabetik' ? 'Alfabetik' : (aktifSiralama === 'encok' ? 'En Çok Okuyanlar' : 'Şu An Okuyanlar')} | Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">SN</th>
                            <th style="width: 60px;">Okul No</th>
                            <th style="width: 200px; text-align: left;">Öğrenci Adı Soyadı</th>
                            <th style="width: 80px;">Toplam</th>
                            <th style="text-align: left;">Okuduğu / Okumakta Olduğu Kitaplar</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ogrenciler.forEach((ogr, index) => {
            let okunanlarVeSari = [];
            kalemler.forEach(k => {
                let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
                if (durum === '✔️') okunanlarVeSari.push(`<b>${k.ad}</b>`);
                else if (durum === '⏳') okunanlarVeSari.push(`${k.ad} (Okuyor)`);
            });

            let kitapYazisi = okunanlarVeSari.length > 0 ? okunanlarVeSari.join(', ') : 'Henüz kitap kaydı yok.';

            printContent += `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td class="merkez"><strong>${ogr.okulno || '-'}</strong></td>
                    <td><strong>${ogr.name}</strong></td>
                    <td class="merkez" style="font-size: 16px;"><strong>${ogr.okunanSayisi}</strong></td>
                    <td class="kitap-listesi">${kitapYazisi}</td>
                </tr>
            `;
        });

        printContent += `</tbody></table>
            <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };</script>
            </body></html>`;

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

    kalemler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'));
    document.getElementById('kitap-sayaci').innerText = kalemler.length;

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    // 1. Önce her öğrencinin okuduğu kitapları hesapla
    ogrenciler.forEach(ogr => {
        ogr.okunanSayisi = 0;
        ogr.suAnOkuduguKitaplar = [];
        kalemler.forEach(k => {
            let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
            if (durum === '✔️') ogr.okunanSayisi++;
            if (durum === '⏳') ogr.suAnOkuduguKitaplar.push(k.ad);
        });
    });

    // 2. Belirlenen aktif moda göre sıralamayı yap
    if (aktifSiralama === 'alfabetik') {
        ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    } else if (aktifSiralama === 'encok') {
        ogrenciler.sort((a, b) => {
            if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
            return (a.name || '').localeCompare(b.name || '', 'tr-TR');
        });
    } else if (aktifSiralama === 'okuyan') {
        ogrenciler.sort((a, b) => {
            let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
            return (a.name || '').localeCompare(b.name || '', 'tr-TR');
        });
    }

    // --- KİTAP YÖNETİM ALANI ---
    let basliklarHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">';
    kalemler.forEach(k => {
        let okuyanSayisi = 0;
        let suAnOkuyanlar = [];
        
        matris.forEach(m => {
            if(m.targetId === k.id) {
                if(m.deger === '✔️') okuyanSayisi++;
                else if(m.deger === '⏳') {
                    let ogr = ogrenciler.find(o => o.id === m.ogrId);
                    if(ogr) suAnOkuyanlar.push(ogr.name);
                }
            }
        });
        
        let okuduText = okuyanSayisi > 0 ? `Bu kitabı <strong>${okuyanSayisi} öğrenci</strong> okudu.` : `Bu kitabı henüz okuyan olmadı.`;
        let suAnText = suAnOkuyanlar.length > 0 
            ? `<span style="color: #d97706; font-weight: bold;">Şu an ${suAnOkuyanlar.join(', ')} okuyor.</span>`
            : `<span style="color: #059669; font-weight: bold;">Şu an okunmayı bekliyor (Rafta).</span>`;
        let ikon = suAnOkuyanlar.length > 0 ? '⏳' : '✔️';
        let bgRenk = suAnOkuyanlar.length > 0 ? '#fef3c7' : '#ffffff';
        let borderRenk = suAnOkuyanlar.length > 0 ? '#f59e0b' : 'var(--primary)';
        
        basliklarHtml += `
            <div style="background: ${bgRenk}; border: 1px solid #e2e8f0; border-left: 5px solid ${borderRenk}; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                        <span>${ikon}</span> ${k.ad}
                    </h4>
                    <div style="font-size: 0.9em; color: #475569; display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                        <div>${suAnText}</div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px;">${okuduText}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
                    <button class="btn-kalem-duzenle btn btn-secondary" data-id="${k.id}" data-ad="${k.ad}" style="flex: 1; padding: 6px; font-size: 0.85em;">✏️ Düzenle</button>
                    <button class="btn-kalem-sil btn btn-danger" data-id="${k.id}" style="flex: 1; padding: 6px; font-size: 0.85em;">✕ Sil</button>
                </div>
            </div>
        `;
    });
    basliklarHtml += '</div>';
    
    if(kalemler.length === 0) basliklarHtml = '<div style="color:#64748b; padding: 15px; text-align: center; background: #f8fafc; border-radius: 8px; font-style: italic;">Henüz sınıf kitaplığına eklenmiş kitap bulunmuyor.</div>';
    document.getElementById('kitap-basliklari').innerHTML = basliklarHtml;

    document.querySelectorAll('.btn-kalem-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const eskiAd = e.currentTarget.getAttribute('data-ad');
            const yeniAd = prompt("Kitabın adını düzeltin:", eskiAd);
            if (yeniAd !== null && yeniAd.trim() !== "" && yeniAd.trim() !== eskiAd) {
                await db.update('kitaplar_kalemleri', id, { ad: yeniAd.trim() });
                await arayuzuGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu kitabı listeden silmek istediğinize emin misiniz?")) {
                await db.delete('kitaplar_kalemleri', e.currentTarget.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    // --- ANA ÖĞRENCİ LİSTESİ ---
    if (kalemler.length === 0) {
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:var(--secondary); padding: 20px;">Lütfen önce "Kitap Yönetimi" sekmesinden en az bir kitap ekleyin.</p>';
        return;
    }

    let btnTextSiralama = aktifSiralama === 'alfabetik' ? '🔤 Alfabetik' : (aktifSiralama === 'encok' ? '🏆 En Çok Okuyan' : '⏳ Okuyanlar');

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 500px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 60px;">NO</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>ADI SOYADI</span>
                            <button id="btn-sirala" style="background: var(--primary); color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.85em; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Sıralamayı Değiştir">
                                ${btnTextSiralama} <span>🔄</span>
                            </button>
                        </div>
                    </th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 90px; color: var(--primary);">TOPLAM</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 140px; text-align: center;">KİTAP İŞLEMLERİ</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let durumText = ogr.suAnOkuduguKitaplar.length > 0
            ? `<div style="font-size: 0.85em; color: #d97706; margin-top: 5px; font-weight: normal;">⏳ <strong>Okuyor:</strong> ${ogr.suAnOkuduguKitaplar.join(', ')}</div>`
            : `<div style="font-size: 0.85em; color: #94a3b8; margin-top: 5px; font-weight: normal; font-style: italic;">Şu an kitap okumuyor</div>`;

        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        tabloHtml += `<tr style="background-color: ${satirArkaPlan}; transition: background-color 0.2s;">
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${ogr.okulno || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 12px; color: #333;">
                <div style="font-weight: bold; font-size: 1.05em;">${ogr.name}</div>
                ${durumText}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.2em; background: #f1f5f9;">${ogr.okunanSayisi}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                <button class="btn btn-primary btn-detay-ac" data-ogrid="${ogr.id}" data-ogrname="${ogr.name}" style="padding: 8px 15px; font-weight: bold; font-size: 0.9em;">
                    📚 İşaretle / Gör
                </button>
            </td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = tabloHtml;

    // Sıralama Butonu Tıklama Olayı
    document.getElementById('btn-sirala').addEventListener('click', () => {
        if (aktifSiralama === 'alfabetik') aktifSiralama = 'encok';
        else if (aktifSiralama === 'encok') aktifSiralama = 'okuyan';
        else aktifSiralama = 'alfabetik';
        arayuzuGuncelle();
    });

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
        
        let btnText = 'Okumadı';
        let bgRenk = '#f1f5f9';
        let textColor = '#64748b';
        let borderRenk = '#cbd5e1';

        if (mevcutDeger === '⏳') {
            btnText = '⏳ Okuyor';
            bgRenk = '#fef3c7'; textColor = '#d97706'; borderRenk = '#f59e0b';
        } else if (mevcutDeger === '✔️') {
            btnText = '✔️ Okudu';
            bgRenk = '#d1fae5'; textColor = '#059669'; borderRenk = '#10b981';
        }

        listeHtml += `
            <div style="background: white; padding: 15px 20px; border-radius: 12px; border: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 1.15em; font-weight: bold; color: #334155; flex: 1; min-width: 200px;">
                    <span style="color: #94a3b8; margin-right: 10px;">${index + 1}.</span>${k.ad}
                </div>
                <button class="btn-durum-degistir" data-ogr="${ogrId}" data-kalem="${k.id}" data-val="${mevcutDeger}"
                    style="padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 1.05em; cursor: pointer; border: 2px solid ${borderRenk}; background: ${bgRenk}; color: ${textColor}; min-width: 140px; transition: all 0.2s ease-in-out; user-select: none;">
                    ${btnText}
                </button>
            </div>
        `;
    });

    listeHtml += '</div>';
    document.getElementById('detay-kitap-listesi').innerHTML = listeHtml;

    document.querySelectorAll('.btn-durum-degistir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const oId = e.currentTarget.getAttribute('data-ogr');
            const kId = e.currentTarget.getAttribute('data-kalem');
            const val = e.currentTarget.getAttribute('data-val');
            
            let newValue = '';
            let btnText = 'Okumadı';
            let bgRenk = '#f1f5f9';
            let textColor = '#64748b';
            let borderRenk = '#cbd5e1';

            if (val === '') {
                newValue = '⏳'; btnText = '⏳ Okuyor'; bgRenk = '#fef3c7'; textColor = '#d97706'; borderRenk = '#f59e0b';
            } else if (val === '⏳') {
                newValue = '✔️'; btnText = '✔️ Okudu'; bgRenk = '#d1fae5'; textColor = '#059669'; borderRenk = '#10b981';
            } else {
                newValue = '';
            }
            
            e.currentTarget.setAttribute('data-val', newValue);
            e.currentTarget.innerText = btnText;
            e.currentTarget.style.backgroundColor = bgRenk;
            e.currentTarget.style.color = textColor;
            e.currentTarget.style.borderColor = borderRenk;

            db.saveMatrixStatus('kitap_matrisi', oId, kId, newValue);
        });
    });
}