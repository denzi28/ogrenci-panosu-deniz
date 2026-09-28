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
                        Kitapları hızlıca vermek/teslim almak için listedeki <strong>Hızlı İşlem Kutucuklarını</strong> kullanabilirsiniz.<br>
                        <em>Not: Bir öğrenci elindeki kitabı teslim etmeden (Bitirdi/Bırak) yeni kitap alamaz.</em>
                    </p>
                    <div id="kitap-tablosu-alani" style="overflow-x: auto;"><p>⏳ Liste yükleniyor...</p></div>
                </div>

                <!-- 2. SEKME: KİTAP YÖNETİMİ -->
                <div id="view-kitap-yonetimi" style="display: none;">
                    <h3 style="color: var(--primary);">Sınıf Kitaplığına Yeni Kitap Ekle</h3>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <input type="number" id="yeni-kitap-no" placeholder="No (Örn: 1)" style="width: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <input type="text" id="yeni-kitap-ad" placeholder="Kitap Adı (Örn: Küçük Prens)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <button id="btn-kitap-ekle" class="btn btn-primary">Tek Ekle</button>
                    </div>

                    <div style="margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 0.85em; color: #475569; margin-bottom: 8px; font-weight: bold;">📥 Toplu Kitap Ekleme (Numaralı Tanıma Sistemi)</p>
                        <p style="font-size: 0.75em; color: #64748b; margin-top: 0;">Excel veya Word'den yapıştırırken numara kullanırsanız sistem otomatik algılar (Örn: <i>1- Küçük Prens</i> veya <i>1. Şeker Portakalı</i>).</p>
                        <textarea id="toplu-kitap-ad" placeholder="1- Küçük Prens&#10;2- Şeker Portakalı&#10;3- Sol Ayağım" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
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
                    Tüm listeyi manuel işaretlemek isterseniz sağdaki butonları kullanabilirsiniz.
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
        const noVal = document.getElementById('yeni-kitap-no').value.trim();
        const ad = document.getElementById('yeni-kitap-ad').value.trim();
        
        if (ad) {
            const no = noVal !== "" ? parseInt(noVal) : 999;
            const btn = document.getElementById('btn-kitap-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('kitaplar_kalemleri', { no: no, ad: ad });
            
            document.getElementById('yeni-kitap-no').value = '';
            document.getElementById('yeni-kitap-ad').value = '';
            btn.disabled = false; btn.innerText = "Tek Ekle";
            await arayuzuGuncelle();
        } else {
            alert("Lütfen en azından kitabın adını yazın.");
        }
    });

    document.getElementById('btn-toplu-kitap-ekle').addEventListener('click', async () => {
        const metin = document.getElementById('toplu-kitap-ad').value;
        if (!metin.trim()) return alert("Lütfen eklenecek kitap isimlerini yazın.");

        const btn = document.getElementById('btn-toplu-kitap-ekle');
        btn.disabled = true; btn.innerText = "⏳ Ekleniyor...";

        const satirlar = metin.split('\n').filter(k => k.trim() !== "");
        for (let satir of satirlar) { 
            let no = 999;
            let ad = satir.trim();
            const match = ad.match(/^(\d+)[\s\-\.]+(.*)/);
            if(match) {
                no = parseInt(match[1]);
                ad = match[2].trim();
            }
            await db.add('kitaplar_kalemleri', { no: no, ad: ad }); 
        }

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

        kalemler.sort((a, b) => {
            const noA = (a.no !== undefined && a.no !== null) ? parseInt(a.no) : 999;
            const noB = (b.no !== undefined && b.no !== null) ? parseInt(b.no) : 999;
            if (noA === noB) return (a.ad || '').localeCompare(b.ad || '', 'tr-TR');
            return noA - noB;
        });

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
        
        ogrenciler.forEach(ogr => {
            ogr.okunanSayisi = 0;
            ogr.suAnOkuduguKitaplar = [];
            kalemler.forEach(k => {
                let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
                let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                if (durum === '✔️') ogr.okunanSayisi++;
                if (durum === '⏳') ogr.suAnOkuduguKitaplar.push(`${kNoStr}${k.ad}`);
            });
        });

        if (aktifSiralama === 'alfabetik') {
            ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } else if (aktifSiralama === 'encok') {
            ogrenciler.sort((a, b) => {
                if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
                let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
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
                let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                if (durum === '✔️') okunanlarVeSari.push(`<b>${kNoStr}${k.ad}</b>`);
                else if (durum === '⏳') okunanlarVeSari.push(`${kNoStr}${k.ad} (Okuyor)`);
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

    kalemler.sort((a, b) => {
        const noA = (a.no !== undefined && a.no !== null) ? parseInt(a.no) : 999;
        const noB = (b.no !== undefined && b.no !== null) ? parseInt(b.no) : 999;
        if (noA === noB) return (a.ad || '').localeCompare(b.ad || '', 'tr-TR');
        return noA - noB;
    });

    document.getElementById('kitap-sayaci').innerText = kalemler.length;

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    // Her öğrenci için detaylı veri topla
    ogrenciler.forEach(ogr => {
        let okunanSayisi = 0;
        let suAnOkuyanlarDetay = []; 
        
        kalemler.forEach(k => {
            let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
            if (durum === '✔️') okunanSayisi++;
            if (durum === '⏳') suAnOkuyanlarDetay.push(k);
        });
        
        ogr.okunanSayisi = okunanSayisi;
        ogr.suAnOkuduguKitaplar = suAnOkuyanlarDetay.map(k => k.ad); 
        ogr.suAnOkuyanlarDetay = suAnOkuyanlarDetay; 
    });

    // EKRANDAKİ TABLO İÇİN SIRALAMA MANTIĞI
    if (aktifSiralama === 'alfabetik') {
        ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    } else if (aktifSiralama === 'encok') {
        ogrenciler.sort((a, b) => {
            if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
            let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
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
        let noGosterimi = (k.no && k.no !== 999) ? `<span style="color:#94a3b8; margin-right:5px; font-size: 0.9em;">#${k.no}</span>` : '';
        
        basliklarHtml += `
            <div style="background: ${bgRenk}; border: 1px solid #e2e8f0; border-left: 5px solid ${borderRenk}; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                        <span>${ikon}</span> ${noGosterimi}${k.ad}
                    </h4>
                    <div style="font-size: 0.9em; color: #475569; display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                        <div>${suAnText}</div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px;">${okuduText}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
                    <button class="btn-kalem-duzenle btn btn-secondary" data-id="${k.id}" data-no="${k.no||''}" data-ad="${k.ad}" style="flex: 1; padding: 6px; font-size: 0.85em;">✏️ Düzenle</button>
                    <button class="btn-kalem-sil btn btn-danger" data-id="${k.id}" style="flex: 1; padding: 6px; font-size: 0.85em;">✕ Sil</button>
                </div>
            </div>
        `;
    });
    basliklarHtml += '</div>';
    
    if(kalemler.length === 0) basliklarHtml = '<div style="color:#64748b; padding: 15px; text-align: center; background: #f8fafc; border-radius: 8px; font-style: italic;">Henüz sınıf kitaplığına eklenmiş kitap bulunmuyor.</div>';
    document.getElementById('kitap-basliklari').innerHTML = basliklarHtml;

    // --- ANA ÖĞRENCİ LİSTESİ ---
    if (kalemler.length === 0) {
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:var(--secondary); padding: 20px;">Lütfen önce "Kitap Yönetimi" sekmesinden en az bir kitap ekleyin.</p>';
        return;
    }

    let btnTextSiralama = aktifSiralama === 'alfabetik' ? '🔤 Alfabetik' : (aktifSiralama === 'encok' ? '🏆 En Çok Okuyan' : '⏳ Okuyanlar');

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 250px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>ADI SOYADI VE KİTAP DURUMU</span>
                            <button id="btn-sirala" style="background: var(--primary); color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.85em; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Sıralamayı Değiştir">
                                ${btnTextSiralama} <span>🔄</span>
                            </button>
                        </div>
                    </th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 90px; color: var(--primary); text-align: center;">TOPLAM</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 100px;">TÜM LİSTE</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        // 🌟 HIZLI KİTAP İŞLEMLERİ MANTIĞI
        let hizliIslemHtml = `<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">`;

        if (ogr.suAnOkuyanlarDetay.length > 0) {
            // ÖĞRENCİNİN ELİNDE KİTAP VARSA -> "Ver" Kutusu Gizlenir, Sadece Bitirdi/Bırak görünür
            ogr.suAnOkuyanlarDetay.forEach(k => {
                let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                hizliIslemHtml += `
                    <div style="display: flex; align-items: center; gap: 5px; background: #fef3c7; padding: 4px 8px; border-radius: 4px; border: 1px solid #f59e0b;">
                        <span style="color: #d97706; font-size: 0.85em; flex: 1;">⏳ <strong>Okuyor:</strong> ${kNoStr}${k.ad}</span>
                        <button class="btn-hizli-bitir" data-ogr="${ogr.id}" data-kitap="${k.id}" style="background: #10b981; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer; font-weight: bold;" title="Kitabı Okudu Olarak İşaretle">✔️ Bitirdi</button>
                        <button class="btn-hizli-iade" data-ogr="${ogr.id}" data-kitap="${k.id}" style="background: #ef4444; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer; font-weight: bold;" title="Okumadan Geri Verdi">❌ Bırak</button>
                    </div>
                `;
            });
        } else {
            // ÖĞRENCİNİN ELİNDE KİTAP YOKSA -> Yan Yana Kırmızı Arka Planlı Ver Kutusu
            hizliIslemHtml += `
                <div style="display: flex; align-items: center; gap: 5px; background: #fee2e2; padding: 4px 8px; border-radius: 4px; border: 1px solid #fca5a5;">
                    <span style="color: #b91c1c; font-size: 0.85em; font-style: italic; flex: 1;">Şu an elinde kitap yok.</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" id="hizli-no-${ogr.id}" placeholder="No" style="width: 50px; padding: 3px 5px; border: 1px solid #fca5a5; border-radius: 4px; font-size: 0.8em; outline: none;" onkeypress="if(event.key === 'Enter'){ document.getElementById('btn-ver-${ogr.id}').click(); }">
                        <button class="btn-hizli-ver" id="btn-ver-${ogr.id}" data-ogr="${ogr.id}" style="background: #ef4444; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer; font-weight: bold;">📥 Ver</button>
                    </div>
                </div>
            `;
        }
        
        hizliIslemHtml += `</div>`; // İç div kapatma

        tabloHtml += `<tr style="background-color: ${satirArkaPlan}; transition: background-color 0.2s;">
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 12px; color: #333;">
                <div style="font-weight: bold; font-size: 1.05em; color: #1e293b;">${ogr.name} <span style="font-size: 0.75em; color: #94a3b8; font-weight: normal;">(No: ${ogr.okulno || '-'})</span></div>
                ${hizliIslemHtml}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.3em; background: #f1f5f9;">${ogr.okunanSayisi}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                <button class="btn btn-secondary btn-detay-ac" data-ogrid="${ogr.id}" data-ogrname="${ogr.name}" style="padding: 6px 12px; font-weight: bold; font-size: 0.85em; border: 1px solid #cbd5e1;">
                    📚 Tüm Listesi
                </button>
            </td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = tabloHtml;

    // --- ETKİLEŞİMLER (EVENT LİSTENER'LAR) ---

    // 1. Düzenle ve Sil (Kitap Yönetimi)
    document.querySelectorAll('.btn-kalem-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const eskiNo = e.currentTarget.getAttribute('data-no');
            const eskiAd = e.currentTarget.getAttribute('data-ad');
            
            const varsayilanYazi = (eskiNo && eskiNo !== '999') ? `${eskiNo}- ${eskiAd}` : eskiAd;
            const input = prompt("Kitabın numarasını ve adını düzeltin (Örn: 1- Kitap Adı):", varsayilanYazi);
            
            if (input !== null && input.trim() !== "") {
                let yeniNo = 999;
                let yeniAd = input.trim();
                
                const match = yeniAd.match(/^(\d+)[\s\-\.]+(.*)/);
                if(match) {
                    yeniNo = parseInt(match[1]);
                    yeniAd = match[2].trim();
                }

                await db.update('kitaplar_kalemleri', id, { ad: yeniAd, no: yeniNo });
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

    // 2. Tablo Sıralaması
    document.getElementById('btn-sirala').addEventListener('click', () => {
        if (aktifSiralama === 'alfabetik') aktifSiralama = 'encok';
        else if (aktifSiralama === 'encok') aktifSiralama = 'okuyan';
        else aktifSiralama = 'alfabetik';
        arayuzuGuncelle();
    });

    // 3. Detay Ekranı
    document.querySelectorAll('.btn-detay-ac').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogrid');
            const ogrName = e.currentTarget.getAttribute('data-ogrname');
            ogrenciDetayiniAc(ogrId, ogrName, kalemler, matris);
        });
    });

    // 🌟 4. HIZLI İŞLEMLER: Bitirdi
    document.querySelectorAll('.btn-hizli-bitir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const kitapId = e.currentTarget.getAttribute('data-kitap');
            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitapId, '✔️');
            arayuzuGuncelle();
        });
    });

    // 🌟 5. HIZLI İŞLEMLER: Bırak / İade (Okumadı)
    document.querySelectorAll('.btn-hizli-iade').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const kitapId = e.currentTarget.getAttribute('data-kitap');
            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitapId, '');
            arayuzuGuncelle();
        });
    });

    // 🌟 6. HIZLI İŞLEMLER: Kitap Ver (Numaradan bulup atama)
    document.querySelectorAll('.btn-hizli-ver').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const noInput = document.getElementById(`hizli-no-${ogrId}`).value.trim();
            
            if (!noInput) return alert("Lütfen verilecek kitabın numarasını girin.");
            
            const kNo = parseInt(noInput);
            const kitap = kalemler.find(k => k.no === kNo);
            
            if (!kitap) return alert(`${kNo} numaralı kitap kütüphanede bulunamadı! Lütfen numarayı kontrol edin.`);

            // Kitap başka birindeyse öğretmeni uyar
            const baskasiOkuyorMu = matris.find(m => m.targetId === kitap.id && m.deger === '⏳' && m.ogrId !== ogrId);
            if (baskasiOkuyorMu) {
                const baskasi = tumKullanicilar.find(u => u.id === baskasiOkuyorMu.ogrId);
                const isim = baskasi ? baskasi.name : 'başka bir öğrencide';
                if (!confirm(`Bu kitap şu an "${isim}" üzerinde görünüyor. Yine de zorla alıp bu öğrenciye vermek istiyor musunuz?`)) {
                    return;
                }
                // Eski öğrenciden kitabı sil
                await db.saveMatrixStatus('kitap_matrisi', baskasiOkuyorMu.ogrId, kitap.id, '');
            }

            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitap.id, '⏳');
            arayuzuGuncelle();
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

        let noGosterimi = (k.no && k.no !== 999) ? `<span style="color:#94a3b8; margin-right:8px;">#${k.no}</span>` : `<span style="color:#cbd5e1; margin-right:8px;">-</span>`;

        listeHtml += `
            <div style="background: white; padding: 15px 20px; border-radius: 12px; border: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 1.15em; font-weight: bold; color: #334155; flex: 1; min-width: 200px;">
                    ${noGosterimi}${k.ad}
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