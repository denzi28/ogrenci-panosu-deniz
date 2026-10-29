// modules/rozetler/student.js
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
        return `<img src="${iconVal}" alt="Rozet" style="width: 50px; height: 50px; object-fit: contain; vertical-align: middle;">`;
    }

    const bg = style1 && style2 ? `linear-gradient(145deg, ${style1}, ${style2})` : 'linear-gradient(145deg, #fbbf24, #d97706)';
    
    let shapeStyle = `border-radius: ${shape};`;
    if (shape === 'kalkan') {
        shapeStyle = `border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;`;
    }

    let yaziHtml = altYazi ? `<div style="position: absolute; bottom: 4px; font-size: 8.5px; font-weight: 900; color: #1e293b; background: rgba(255,255,255,0.9); padding: 0px 4px; border-radius: 3px; max-width: 48px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${altYazi}</div>` : '';

    return `
        <div style="width: 56px; height: 56px; background: ${bg}; ${shapeStyle} display: inline-flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2), inset 0 2px 4px rgba(255,255,255,0.4); border: 2px solid #fef3c7; margin-bottom: 5px; vertical-align: middle;">
            <span style="font-size: ${altYazi ? '22px' : '28px'}; margin-top: ${altYazi ? '-6px' : '0'}; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">${iconVal}</span>
            ${yaziHtml}
        </div>
    `;
}

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Rozet panosu yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('rozetler');
    if (!isModuleVisible) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: var(--secondary);">🏆 Rozet Panosu Şimdilik Gizli</h3>
                <p style="color: #666;">Öğretmeniniz rozetleri güncelliyor olabilir, lütfen daha sonra tekrar kontrol edin.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px;">⭐ Sınıf Rozet Kataloğu ve Başarılarım</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-benim" class="btn btn-primary" style="flex: 1; min-width: 200px; font-weight: bold;">🏅 Benim Rozetlerim</button>
                    <button id="tab-vitrin" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-weight: bold;">🏫 Sınıf Rozet Kataloğu</button>
                </div>

                <div id="view-benim" style="display: block;">
                    <div id="benim-rozetler-alani"><p>⏳ Rozetleriniz yükleniyor...</p></div>
                </div>

                <div id="view-vitrin" style="display: none;">
                    <div id="vitrin-alani"><p>⏳ Vitrin yükleniyor...</p></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('tab-benim').addEventListener('click', () => {
        document.getElementById('view-benim').style.display = 'block';
        document.getElementById('view-vitrin').style.display = 'none';
        document.getElementById('tab-benim').className = 'btn btn-primary';
        document.getElementById('tab-vitrin').className = 'btn btn-secondary';
    });

    document.getElementById('tab-vitrin').addEventListener('click', () => {
        document.getElementById('view-benim').style.display = 'none';
        document.getElementById('view-vitrin').style.display = 'block';
        document.getElementById('tab-benim').className = 'btn btn-secondary';
        document.getElementById('tab-vitrin').className = 'btn btn-primary';
    });

    await listeyiYukle();
}

async function listeyiYukle() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [rozetler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('rozetler_kalemleri'),
        db.getAll('users'),
        db.getAll('rozet_matrisi')
    ]);

    if (rozetler.length === 0) {
        document.getElementById('benim-rozetler-alani').innerHTML = '<p style="color:#888;">Henüz sisteme rozet eklenmemiş.</p>';
        return;
    }

    if (currentUser) {
        let benimHtml = '';
        Object.keys(KATEGORILER).forEach(katKey => {
            const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
            if (katRozetleri.length === 0) return;

            benimHtml += `<div style="margin-bottom: 25px;"><h4 style="color: ${KATEGORILER[katKey].renk}; border-bottom: 2px solid ${KATEGORILER[katKey].renk}; padding-bottom: 5px;">${KATEGORILER[katKey].ad}</h4>`;
            benimHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
            
            katRozetleri.forEach(r => {
                let sahipMi = matris.find(m => m.ogrId === currentUser.id && m.targetId === r.id)?.deger === '✔️';
                benimHtml += `
                    <div style="background: ${sahipMi ? '#f0fdf4' : '#f8fafc'}; border: 2px solid ${sahipMi ? '#22c55e' : '#e2e8f0'}; border-radius: 12px; padding: 15px; text-align: center; opacity: ${sahipMi ? '1' : '0.5'};">
                        ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)}
                        <h4 style="margin: 5px 0 5px 0; color: #1e293b; font-size: 1em;">${r.ad}</h4>
                        <p style="font-size: 0.75em; color: #64748b; margin: 0 0 8px 0;">${r.aciklama || ''}</p>
                        <div style="font-weight: bold; font-size: 0.8em; color: ${sahipMi ? '#16a34a' : '#94a3b8'};">
                            ${sahipMi ? '✅ KAZANILDI' : '🔒 KİLİTLİ'}
                        </div>
                    </div>
                `;
            });
            benimHtml += '</div></div>';
        });
        document.getElementById('benim-rozetler-alani').innerHTML = benimHtml;
    }

    let vitrinHtml = '';
    Object.keys(KATEGORILER).forEach(katKey => {
        const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
        if (katRozetleri.length === 0) return;

        vitrinHtml += `<div style="margin-bottom: 25px;"><h4 style="color: ${KATEGORILER[katKey].renk}; border-bottom: 2px solid ${KATEGORILER[katKey].renk}; padding-bottom: 5px;">${KATEGORILER[katKey].ad}</h4>`;
        vitrinHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">';
        
        katRozetleri.forEach(r => {
            let alanSayisi = matris.filter(m => m.targetId === r.id && m.deger === '✔️').length;
            vitrinHtml += `
                <div style="background: white; border: 1px solid #e2e8f0; border-top: 4px solid ${KATEGORILER[katKey].renk}; border-radius: 10px; padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)}
                        <div>
                            <h4 style="margin: 0; color: #1e293b; font-size: 0.95em;">${r.ad}</h4>
                            <span style="font-size: 0.75em; color: #64748b;">${r.aciklama || ''}</span>
                        </div>
                    </div>
                    <div style="font-size: 0.8em; font-weight: bold; color: var(--success); border-top: 1px dashed #e2e8f0; padding-top: 6px; text-align: right;">
                        ${alanSayisi} kişi kazandı 🎖️
                    </div>
                </div>
            `;
        });
        vitrinHtml += '</div></div>';
    });
    document.getElementById('vitrin-alani').innerHTML = vitrinHtml;
}