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
    } else if (shape === 'tirtikli') {
        shapeStyle = `clip-path: polygon(50% 0%, 65% 10%, 80% 5%, 88% 20%, 98% 22%, 95% 38%, 100% 50%, 95% 62%, 98% 78%, 88% 80%, 80% 95%, 65% 90%, 50% 100%, 35% 90%, 20% 95%, 12% 80%, 2% 78%, 5% 62%, 0% 50%, 5% 38%, 2% 22%, 12% 20%, 20% 5%, 35% 10%);`;
    } else if (shape === 'yildizpatlama') {
        shapeStyle = `clip-path: polygon(50% 0%, 63% 15%, 82% 8%, 88% 27%, 100% 35%, 93% 54%, 100% 73%, 82% 78%, 75% 95%, 57% 88%, 43% 88%, 25% 95%, 18% 78%, 0% 73%, 7% 54%, 0% 35%, 12% 27%, 18% 8%, 37% 15%);`;
    } else if (shape === 'sekizgen') {
        shapeStyle = `clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);`;
    }

    let yaziHtml = altYazi ? `<div style="position: absolute; bottom: 2px; font-size: 6.5px; font-weight: 900; color: #1e293b; background: rgba(255,255,255,0.92); padding: 0px 2px; border-radius: 2px; width: 35px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;">${altYazi}</div>` : '';

    return `
        <div style="width: 40px; height: 40px; background: ${bg}; ${shapeStyle} display: inline-flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border: 1.5px solid #fef3c7; vertical-align: middle;">
            <span style="font-size: ${altYazi ? '15px' : '18px'}; margin-top: ${altYazi ? '-4px' : '0'}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">${iconVal}</span>
            ${yaziHtml}
        </div>
    `;
}

export async function render(container) {
    const isModuleVisible = await db.getModuleVisibility('rozetler');
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 30px 15px;">
                <h3 style="color: var(--secondary);">🏆 Rozet Panosu Gizli</h3>
                <p style="color: #666; font-size: 0.85em;">Şu anda rozet panosu misafir erişimine kapalıdır.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <h3 style="margin-top: 0; color: var(--primary); font-size: 1.2em; margin-bottom: 15px;">🏆 Sınıf Rozet Kataloğu ve Durumu</h3>
            
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; font-weight: bold; font-size: 0.9em;">👥 Öğrenci Listesi</button>
                <button id="tab-rozetler" class="btn btn-secondary" style="flex: 1; font-weight: bold; font-size: 0.9em;">🎖️ Rozet Vitrini</button>
            </div>

            <div id="view-ogrenciler" style="display: block;">
                <div id="ogrenci-tablosu-alani"><p>⏳ Öğrenci listesi yükleniyor...</p></div>
            </div>

            <div id="view-rozetler" style="display: none;">
                <div id="rozetler-listesi-alani"><p>⏳ Rozet vitrini yükleniyor...</p></div>
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

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    // Öğrenci Listesi Görünümü
    let tabloHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    ogrenciler.forEach((ogr, index) => {
        let rozetSayisi = rozetler.filter(r => matris.find(m => m.ogrId === ogr.id && m.targetId === r.id)?.deger === '✔️').length;
        tabloHtml += `
            <div style="background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div>
                    <span style="font-size: 0.8em; color: #94a3b8; font-weight: bold;">#${index + 1} | No: ${ogr.okulno || '-'}</span>
                    <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-top: 2px;">${ogr.name}</div>
                </div>
                <span style="background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-weight: 900; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">${rozetSayisi} Rozet</span>
            </div>
        `;
    });
    tabloHtml += '</div>';
    document.getElementById('ogrenci-tablosu-alani').innerHTML = tabloHtml || '<p>Kayıtlı öğrenci bulunmuyor.</p>';

    // Rozet Vitrini Görünümü
    let rozetlerHtml = '';
    Object.keys(KATEGORILER).forEach(katKey => {
        const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
        if (katRozetleri.length === 0) return;

        rozetlerHtml += `<div style="margin-bottom: 20px;"><h4 style="color: ${KATEGORILER[katKey].renk}; border-bottom: 2px solid ${KATEGORILER[katKey].renk}; padding-bottom: 4px; font-size: 0.95em; margin-bottom: 10px;">${KATEGORILER[katKey].ad}</h4>`;
        rozetlerHtml += '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        katRozetleri.forEach(r => {
            let alanSayisi = matris.filter(m => m.targetId === r.id && m.deger === '✔️').length;
            rozetlerHtml += `
                <div style="background: white; border: 1px solid #e2e8f0; border-left: 4px solid ${KATEGORILER[katKey].renk}; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)}
                        <div>
                            <div style="font-size: 0.9em; font-weight: bold; color: #1e293b;">${r.ad}</div>
                            <div style="font-size: 0.75em; color: #64748b;">${r.aciklama || 'Kriter belirtilmemiş'}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.8em; font-weight: bold; color: var(--success); background: #f0fdf4; padding: 4px 8px; border-radius: 6px;">${alanSayisi} öğrenci</span>
                </div>
            `;
        });
        rozetlerHtml += '</div></div>';
    });
    document.getElementById('rozetler-listesi-alani').innerHTML = rozetlerHtml || '<p style="color:#64748b; font-style:italic;">Henüz katalogda rozet bulunmuyor.</p>';
}