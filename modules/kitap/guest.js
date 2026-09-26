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
        <!-- ANA GÖRÜNÜM (Sekmeler) -->
        <div id="ana-gorunum" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">📚 Sınıf Kitap Okuma Panosu</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">👥 Öğrenci Listesi</button>
                    <button id="tab-kitaplar" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">📖 Sınıf Kitaplığı Durumu</button>
                </div>

                <!-- 1. SEKME: ÖĞRENCİ LİSTESİ -->
                <div id="view-ogrenciler" style="display: block;">
                    <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Öğrencilerin okudukları toplam kitap sayısını ve şu an okumakta oldukları kitabı bu tablodan takip edebilirsiniz.</p>
                    <div id="kitap-tablosu-alani" style="overflow-x: auto;"><p>⏳ Liste yükleniyor...</p></div>
                </div>

                <!-- 2. SEKME: KİTAPLIK DURUMU -->
                <div id="view-kitaplar" style="display: none;">
                    <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Sınıfımızdaki kitapların güncel okunma durumları ve kimde oldukları aşağıda listelenmiştir.</p>
                    <div id="kitaplar-listesi-alani"><p>⏳ Kitaplık yükleniyor...</p></div>
                </div>
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

    await listeyiYukle();
}

async function listeyiYukle() {
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    if (kalemler.length === 0) {
        document.getElementById('kitap-tablosu-alani').innerHTML = '<p style="color:#888;">Henüz listeye kitap eklenmemiş.</p>';
        document.getElementById('kitaplar-listesi-alani').innerHTML = '<p style="color:#888;">Henüz sınıf kitaplığı oluşturulmamış.</p>';
        return;
    }

    kalemler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'));

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    // --- 1. SEKME: ÖĞRENCİ LİSTESİ ÇİZİMİ ---
    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 500px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">ADI SOYADI</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 110px; color: var(--primary); text-align: center;">TOPLAM OKUNAN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">ŞU AN OKUDUĞU KİTAP</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let okunanSayisi = 0;
        let suAnOkuduguKitaplar = [];

        kalemler.forEach(k => {
            let durum = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger;
            if (durum === '✔️') okunanSayisi++;
            if (durum === '⏳') suAnOkuduguKitaplar.push(k.ad);
        });

        // Şu an okuduğu kitabı yaz, okumuyorsa tire çek
        let suAnText = suAnOkuduguKitaplar.length > 0 
            ? `<span style="color: #d97706; font-weight: bold;">⏳ ${suAnOkuduguKitaplar.join(', ')}</span>` 
            : `<span style="color: #94a3b8; font-style: italic;">-</span>`;

        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        tabloHtml += `
            <tr style="background-color: ${satirArkaPlan};">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #334155;">${ogr.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.2em; background: #f1f5f9;">${okunanSayisi}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${suAnText}</td>
            </tr>
        `;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('kitap-tablosu-alani').innerHTML = tabloHtml;

    // --- 2. SEKME: KİTAPLIK DURUMU ÇİZİMİ ---
    let kitaplarHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">';
    
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
        
        let suAnText = '';
        let ikon = '📚';
        let bgRenk = '#ffffff';
        let borderRenk = 'var(--primary)';
        
        if (suAnOkuyanlar.length > 0) {
            suAnText = `<span style="color: #d97706; font-weight: bold;">Şu an ${suAnOkuyanlar.join(', ')} okuyor.</span>`;
            ikon = '⏳';
            bgRenk = '#fef3c7'; // Sarımsı
            borderRenk = '#f59e0b';
        } else {
            suAnText = `<span style="color: #059669; font-weight: bold;">Şu an okunmayı bekliyor (Rafta).</span>`;
            ikon = '✔️';
            bgRenk = '#d1fae5'; // Yeşilimsi
            borderRenk = '#10b981';
        }
        
        kitaplarHtml += `
            <div style="background: ${bgRenk}; border: 1px solid #e2e8f0; border-left: 5px solid ${borderRenk}; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                    <span>${ikon}</span> ${k.ad}
                </h4>
                <div style="font-size: 0.9em; color: #475569; display: flex; flex-direction: column; gap: 6px;">
                    <div>${suAnText}</div>
                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px;">${okuduText}</div>
                </div>
            </div>
        `;
    });
    
    kitaplarHtml += '</div>';
    document.getElementById('kitaplar-listesi-alani').innerHTML = kitaplarHtml;
}