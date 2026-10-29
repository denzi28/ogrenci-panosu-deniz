// modules/rozetler/guest.js
import { db } from '../../js/db.js';

const KATEGORILER = {
    'davranis': { ad: '❤️ Davranış ve Değerler', renk: '#e11d48' },
    'akademik': { ad: '📚 Akademik Başarı', renk: '#2563eb' },
    'gelisim': { ad: '📈 Çaba ve Gelişim', renk: '#d97706' },
    'sorumluluk': { ad: '📋 Sorumluluk ve Düzen', renk: '#7c3aed' },
    'yaraticilik': { ad: '👥 Yaratıcılık ve İş Birliği', renk: '#059669' }
};

function renderRozetGorseli(iconVal, style1 = '#fbbf24', style2 = '#d97706', shape = '50%', altYazi = '') {
    if (!iconVal) iconVal = '⭐';
    
    if (!style1 && (iconVal.endsWith('.png') || iconVal.includes('/'))) {
        return `<img src="${iconVal}" alt="Rozet" style="width: 40px; height: 40px; object-fit: contain; vertical-align: middle;">`;
    }

    const bg = style1 && style2 ? `linear-gradient(145deg, ${style1}, ${style2})` : 'linear-gradient(145deg, #fbbf24, #d97706)';
    
    let shapeStyle = `border-radius: ${shape};`;
    if (shape === 'kalkan') {
        shapeStyle = `border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;`;
    }

    let yaziHtml = altYazi ? `<div style="position: absolute; bottom: 3px; font-size: 7.5px; font-weight: 900; color: #1e293b; background: rgba(255,255,255,0.92); padding: 0px 3px; border-radius: 3px; width: 40px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;">${altYazi}</div>` : '';

    return `
        <div style="width: 44px; height: 44px; background: ${bg}; ${shapeStyle} display: inline-flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2), inset 0 2px 4px rgba(255,255,255,0.4); border: 2px solid #fef3c7; vertical-align: middle;">
            <span style="font-size: ${altYazi ? '16px' : '20px'}; margin-top: ${altYazi ? '-6px' : '0'}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">${iconVal}</span>
            ${yaziHtml}
        </div>
    `;
}

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Rozet kataloğu yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('rozetler');
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">🏆 Rozet Panosu Şimdilik Gizli</h3>
                <p style="color: #666;">Sınıf öğretmenimiz panoyu güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">🏆 Sınıf Başarı ve Rozet Kataloğu</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-weight: bold;">👥 Öğrenci Listesi</button>
                    <button id="tab-rozetler" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-weight: bold;">🎖️ Rozet Katalog Vitrini</button>
                </div>

                <div id="view-ogrenciler" style="display: block;">
                    <div id="ogrenci-tablosu-alani" style="overflow-x: auto;"><p>⏳ Liste yükleniyor...</p></div>
                </div>

                <div id="view-rozetler" style="display: none;">
                    <div id="rozetler-listesi-alani"><p>⏳ Katalog yükleniyor...</p></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('tab-ogrenciler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'block';
        document.getElementById('view-rozetler').style.display = 'none';
        document.getElementById('tab-ogrenciler').className = 'btn btn-primary';
        document.getElementById('tab-rozetler').className = 'btn btn-secondary';
    });

    document.getElementById('tab-rozetler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'none';
        document.getElementById('view-rozetler').style.display = 'block';
        document.getElementById('tab-ogrenciler').className = 'btn btn-secondary';
        document.getElementById('tab-rozetler').className = 'btn btn-primary';
    });

    await listeyiYukle();
}

async function listeyiYukle() {
    const [rozetler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('rozetler_kalemleri'),
        db.getAll('users'),
        db.getAll('rozet_matrisi')
    ]);

    if (rozetler.length === 0) {
        document.getElementById('ogrenci-tablosu-alani').innerHTML = '<p style="color:#888;">Henüz listeye rozet eklenmemiş.</p>';
        document.getElementById('rozetler-listesi-alani').innerHTML = '<p style="color:#888;">Henüz tanımlı rozet bulunmuyor.</p>';
        return;
    }

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 500px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">ADI SOYADI</th>
                    <th style="border: 1px solid #ddd; padding: 12px; width: 140px; color: var(--primary); text-align: center;">TOPLAM ROZET</th>
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        let rozetSayisi = rozetler.filter(r => matris.find(m => m.ogrId === ogr.id && m.targetId === r.id)?.deger === '✔️').length;
        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        
        tabloHtml += `
            <tr style="background-color: ${satirArkaPlan};">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #334155;">${ogr.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: var(--primary); font-size: 1.2em; background: #f1f5f9;">${rozetSayisi}</td>
            </tr>
        `;
    });
    tabloHtml += `</tbody></table>`;
    document.getElementById('ogrenci-tablosu-alani').innerHTML = tabloHtml;

    let rozetlerHtml = '';
    Object.keys(KATEGORILER).forEach(katKey => {
        const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
        if (katRozetleri.length === 0) return;

        rozetlerHtml += `<div style="margin-bottom: 25px;"><h4 style="color: ${KATEGORILER[katKey].renk}; border-bottom: 2px solid ${KATEGORILER[katKey].renk}; padding-bottom: 5px;">${KATEGORILER[katKey].ad}</h4>`;
        rozetlerHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px;">';
        
        katRozetleri.forEach(r => {
            let alanSayisi = matris.filter(m => m.targetId === r.id && m.deger === '✔️').length;
            rozetlerHtml += `
                <div style="background: white; border: 1px solid #e2e8f0; border-left: 5px solid ${KATEGORILER[katKey].renk}; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)}
                        <div>
                            <h4 style="margin: 0; color: #1e293b; font-size: 1em;">${r.ad}</h4>
                            <span style="font-size: 0.75em; color: #64748b;">${r.aciklama || ''}</span>
                        </div>
                    </div>
                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 0.8em; color: var(--success); font-weight: bold; text-align: right;">
                        Bu rozeti ${alanSayisi} öğrenci kazandı.
                    </div>
                </div>
            `;
        });
        rozetlerHtml += '</div></div>';
    });
    document.getElementById('rozetler-listesi-alani').innerHTML = rozetlerHtml;
}