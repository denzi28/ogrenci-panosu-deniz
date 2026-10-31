import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Kitap okuma tablosu yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('kitap');
    
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">📚 Kitap Okuma Tablosu Şimdilik Gizli</h3>
                <p style="color: #666;">Öğretmeniniz tabloyu güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">📚 Sınıf Kitap Okuma Panosu</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">👤 Benim Kitaplarım</button>
                    <button id="tab-kitaplar" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">📖 Kitap Modu</button>
                </div>

                <!-- 1. SEKME: ÖĞRENCİ MODU (KİŞİSEL DETAY GÖRÜNÜMÜ) -->
                <div id="view-ogrenciler" style="display: block;">
                    <div id="kisisel-detay-alani"><p>⏳ Bilgileriniz yükleniyor...</p></div>
                </div>

                <!-- 2. SEKME: KİTAP MODU (TÜM KİTAPLAR LİSTESİ) -->
                <div id="view-kitaplar" style="display: none;">
                    <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Sınıf kitaplığındaki kitapları kimlerin okuduğunu görmek için kitabın yanındaki <strong>"👥 Kimler Okudu?"</strong> butonuna tıklayın.</p>
                    <div id="kitap-tablosu-alani" style="overflow-x: auto;"><p>⏳ Kitaplar yükleniyor...</p></div>
                </div>
            </div>
        </div>

        <!-- KİTAP DETAY GÖRÜNÜMÜ (Kimler Okudu İçin) -->
        <div id="detay-gorunum" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--success); min-height: 50vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="detay-baslik" style="margin: 0; color: var(--primary);">📖 Detay Listesi</h2>
                    <button id="btn-detay-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅️ Geri Dön</button>
                </div>
                <div id="detay-icerik-listesi"></div>
            </div>
        </div>
    `;

    // Sekme Geçişleri
    document.getElementById('tab-ogrenciler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'block';
        document.getElementById('view-kitaplar').style.display = 'none';
        document.getElementById('tab-ogrenciler').className = 'btn btn-primary';
        document.getElementById('tab-kitaplar').className = 'btn btn-secondary';
    });

    document.getElementById('tab-kitaplar').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'none';
        document.getElementById('view-kitaplar').style.display = 'block';
        document.getElementById('tab-ogrenciler').className = 'btn btn-secondary';
        document.getElementById('tab-kitaplar').className = 'btn btn-primary';
    });

    // Detaydan Geri Dönüş
    document.getElementById('btn-detay-kapat').addEventListener('click', () => {
        document.getElementById('detay-gorunum').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    await listeyiYukle();
}

async function listeyiYukle() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    if (kalemler.length === 0) {
        document.getElementById('kisisel-detay-alani').innerHTML = '<p style="color:#888;">Henüz listeye kitap eklenmemiş.</p>';
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:#888;">Henüz listeye kitap eklenmemiş.</p>';
        return;
    }

    // Kitapları Alfabetik Sırala
    kalemler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'));

    // Öğrencileri Sırala
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    // ==========================================
    // 1. ÖĞRENCİ MODU (KİŞİSEL KUTULU GÖRÜNÜM)
    // ==========================================
    ogrenciKisiselDetayiGoster(currentUser, kalemler, matris);

    // ==========================================
    // 2. KİTAP MODU TABLOSUNU ÇİZ
    // ==========================================
    let kitapTabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">KİTAP ADI</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 100px; color: var(--success); text-align: center;">OKUYAN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">ŞU AN OKUYANLAR</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 150px; text-align: center;">LİSTE</th>
                </tr>
            </thead>
            <tbody>
    `;

    kalemler.forEach((k, index) => {
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

        let suAnText = suAnOkuyanlar.length > 0 
            ? `<span style="color: #d97706; font-weight: bold;">⏳ ${suAnOkuyanlar.join(', ')}</span>` 
            : `<span style="color: #94a3b8; font-style: italic;">Rafta (Okuyan Yok)</span>`;

        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        kitapTabloHtml += `
            <tr style="background-color: ${satirArkaPlan};">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #334155;">${k.ad}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: var(--success); font-size: 1.2em;">${okuyanSayisi}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${suAnText}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <button class="btn btn-success btn-kitap-detay" data-kitapid="${k.id}" data-kitapname="${k.ad}" style="padding: 6px 12px; font-weight: bold; font-size: 0.85em; background: #059669; border:none;">
                        👥 Kimler Okudu?
                    </button>
                </td>
            </tr>
        `;
    });

    kitapTabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = kitapTabloHtml;

    // Kitap Detay Butonları Etkileşimi
    document.querySelectorAll('.btn-kitap-detay').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kitapId = e.currentTarget.getAttribute('data-kitapid');
            const kitapName = e.currentTarget.getAttribute('data-kitapname');
            kitapDetayiniAc(kitapId, kitapName, ogrenciler, matris);
        });
    });
}

// ----------------------------------------------------
// ÖĞRENCİNİN KENDİ EKRANI (Kutulu Kişisel Görünüm)
// ----------------------------------------------------
function ogrenciKisiselDetayiGoster(currentUser, kalemler, matris) {
    let okudu = [];
    let okuyor = [];
    let bekliyor = [];

    kalemler.forEach((k) => {
        let mevcutDeger = matris.find(m => m.ogrId === currentUser.id && m.targetId === k.id)?.deger || '';
        if (mevcutDeger === '✔️') okudu.push(k);
        else if (mevcutDeger === '⏳') okuyor.push(k);
        else bekliyor.push(k);
    });

    let listeHtml = `
        <div style="margin-bottom: 15px; background: #e8f4fd; padding: 12px 15px; border-radius: 8px; border: 1px solid #bde0fe;">
            <h4 style="margin: 0 0 5px 0; color: var(--primary);">Merhaba, ${currentUser.name}! 👋</h4>
            <p style="margin: 0; font-size: 0.9em; color: #334155;">Okuduğun kitapların durumunu ve kütüphanedeki diğer kitapları aşağıdan takip edebilirsin.</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 20px;">
    `;

    // 1. ŞU AN OKUDUĞU KİTAPLAR (SARI KUTU)
    listeHtml += `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 15px;">
            <h3 style="margin-top: 0; color: #d97706; border-bottom: 2px solid #fcd34d; padding-bottom: 8px;">⏳ Şu An Okuduğun Kitap(lar)</h3>
    `;
    if (okuyor.length > 0) {
        listeHtml += '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
        okuyor.forEach(k => {
            let noStr = (k.no && k.no !== 999) ? `#${k.no} - ` : '';
            listeHtml += `<div style="background: white; padding: 10px 15px; border-radius: 8px; font-weight: bold; color: #334155; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">📖 ${noStr}${k.ad}</div>`;
        });
        listeHtml += '</div>';
    } else {
        listeHtml += `<div style="color: #92400e; font-style: italic; margin-top: 10px;">Şu an elinde okuduğun bir kitap bulunmuyor. Öğretmeninden kitap alabilirsin.</div>`;
    }
    listeHtml += `</div>`;

    // 2. BİTİRDİĞİ KİTAPLAR (YEŞİL KUTU)
    listeHtml += `
        <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 12px; padding: 15px;">
            <h3 style="margin-top: 0; color: #059669; border-bottom: 2px solid #6ee7b7; padding-bottom: 8px;">✔️ Bitirdiğin Kitaplar (${okudu.length})</h3>
    `;
    if (okudu.length > 0) {
        listeHtml += '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
        okudu.forEach(k => {
            let noStr = (k.no && k.no !== 999) ? `#${k.no} - ` : '';
            listeHtml += `<div style="background: white; padding: 10px 15px; border-radius: 8px; font-weight: bold; color: #334155; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">📚 ${noStr}${k.ad}</div>`;
        });
        listeHtml += '</div>';
    } else {
        listeHtml += `<div style="color: #065f46; font-style: italic; margin-top: 10px;">Henüz bitirdiğin bir kitap görünmüyor.</div>`;
    }
    listeHtml += `</div>`;

    // 3. OKUNMAYI BEKLEYEN KİTAPLAR (GRİ KUTU)
    listeHtml += `
        <div style="background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 15px;">
            <h3 style="margin-top: 0; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">📁 Okunmayı Bekleyen Kitaplar (${bekliyor.length})</h3>
    `;
    if (bekliyor.length > 0) {
        listeHtml += '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
        bekliyor.forEach(k => {
            let noStr = (k.no && k.no !== 999) ? `#${k.no} - ` : '';
            listeHtml += `<div style="background: white; padding: 10px 15px; border-radius: 8px; color: #64748b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">📘 ${noStr}${k.ad}</div>`;
        });
        listeHtml += '</div>';
    } else {
        listeHtml += `<div style="color: #475569; font-style: italic; margin-top: 10px;">Sınıf kitaplığındaki tüm kitapları okumuşsun! Tebrikler! 🏆</div>`;
    }
    listeHtml += `</div>`;

    listeHtml += '</div>';
    document.getElementById('kisisel-detay-alani').innerHTML = listeHtml;
}

// ----------------------------------------------------
// KİTAP DETAY EKRANI (Bu kitabı kimler okumuş?)
// ----------------------------------------------------
function kitapDetayiniAc(kitapId, kitapName, ogrenciler, matris) {
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('detay-gorunum').style.display = 'block';
    document.getElementById('detay-baslik').innerText = `👥 "${kitapName}" - Okuyanlar`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    let okuyanYadaOkumaktaOlanVarMi = false;

    ogrenciler.forEach((ogr) => {
        let mevcutDeger = matris.find(m => m.ogrId === ogr.id && m.targetId === kitapId)?.deger || '';
        
        if (mevcutDeger === '✔️' || mevcutDeger === '⏳') {
            okuyanYadaOkumaktaOlanVarMi = true;
            
            let durumText = mevcutDeger === '✔️' ? '✔️ Okudu' : '⏳ Şu An Okuyor';
            let bgRenk = mevcutDeger === '✔️' ? '#d1fae5' : '#fef3c7';
            let textColor = mevcutDeger === '✔️' ? '#059669' : '#d97706';
            let borderRenk = mevcutDeger === '✔️' ? '#10b981' : '#f59e0b';

            listeHtml += `
                <div style="background: white; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 6px solid ${borderRenk}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="font-size: 1.05em; font-weight: bold; color: #334155; flex: 1;">
                        👤 ${ogr.name}
                    </div>
                    <div style="padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 0.9em; background: ${bgRenk}; color: ${textColor}; text-align: center;">
                        ${durumText}
                    </div>
                </div>
            `;
        }
    });

    if (!okuyanYadaOkumaktaOlanVarMi) {
        listeHtml += `
            <div style="padding: 30px; text-align: center; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; color: #64748b;">
                <p style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">Rafta Bekliyor</p>
                <p>Bu kitabı sınıfımızdan henüz okuyan bir öğrenci bulunmuyor.</p>
            </div>
        `;
    }

    listeHtml += '</div>';
    document.getElementById('detay-icerik-listesi').innerHTML = listeHtml;
}