// modules/rozetler/teacher.js
import { db } from '../../js/db.js';

let aktifSiralama = 'alfabetik';

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
        return `<img src="${iconVal}" alt="Rozet" style="width: 45px; height: 45px; object-fit: contain; vertical-align: middle;">`;
    }

    const bg = style1 && style2 ? `linear-gradient(145deg, ${style1}, ${style2})` : 'linear-gradient(145deg, #fbbf24, #d97706)';
    
    let shapeStyle = `border-radius: ${shape};`;
    if (shape === 'kalkan') {
        shapeStyle = `border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;`;
    }

    // 10 karaktere kadar izin veren, rozet içine tam oturan şık yazı bandı
    let yaziHtml = altYazi ? `<div style="position: absolute; bottom: 3px; font-size: 7px; font-weight: 900; color: #1e293b; background: rgba(255,255,255,0.92); padding: 0px 3px; border-radius: 3px; width: 40px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">${altYazi}</div>` : '';

    return `
        <div style="width: 48px; height: 48px; background: ${bg}; ${shapeStyle} display: inline-flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2), inset 0 2px 4px rgba(255,255,255,0.4); border: 2px solid #fef3c7; vertical-align: middle;">
            <span style="font-size: ${altYazi ? '16px' : '22px'}; margin-top: ${altYazi ? '-6px' : '0'}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">${iconVal}</span>
            ${yaziHtml}
        </div>
    `;
}

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Rozet yönetimi modülü yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('rozetler');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            
            <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda veliler ve misafirler sınıfın rozet durumunu görebilir.</p>
                </div>
                <div>
                    <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
                </div>
            </div>

            <div class="card" style="border-top: 4px solid var(--primary);">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-weight: bold;">👥 Öğrenci Rozet Durumları</button>
                    <button id="tab-rozet-yonetimi" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-weight: bold;">🎖️ Rozet Stüdyosu & Katalog</button>
                </div>

                <!-- 1. SEKME: ÖĞRENCİ ROZET DURUMLARI -->
                <div id="view-ogrenciler" style="display: block;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: var(--success);">Öğrenci Başarı ve Rozet Panosu</h3>
                            <p style="font-size:0.85em; color:#64748b; margin: 0;">Kartlar üzerinden hızlıca rozet verebilir veya detayları inceleyebilirsiniz.</p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button id="btn-sirala" class="btn btn-secondary" style="padding: 10px 15px; font-size: 0.95em; font-weight: bold; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
                                <span id="siralama-ikon">🔤</span> <span id="siralama-metin">Alfabetik Sıralama</span> <span>🔄</span>
                            </button>
                        </div>
                    </div>
                    <div id="rozet-tablosu-alani"><p>⏳ Öğrenci kartları yükleniyor...</p></div>
                </div>

                <!-- 2. SEKME: ROZET STÜDYOSU & KATALOG YÖNETİMİ -->
                <div id="view-rozet-yonetimi" style="display: none;">
                    <h3 style="color: var(--primary); margin-bottom: 15px;">🎨 Rozet Stüdyosu ile Yeni Rozet Tasarla ve Ekle</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; align-items: center;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="font-weight: bold; font-size: 0.85em; color: #475569;">Kategori:</label>
                                <select id="yeni-rozet-kategori" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; font-weight: bold; background:white;">
                                    <option value="davranis">❤️ Davranış ve Değerler</option>
                                    <option value="akademik">📚 Akademik Başarı</option>
                                    <option value="gelisim">📈 Çaba ve Gelişim</option>
                                    <option value="sorumluluk">📋 Sorumluluk ve Düzen</option>
                                    <option value="yaraticilik">👥 Yaratıcılık ve İş Birliği</option>
                                </select>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 2;">
                                    <label style="font-weight: bold; font-size: 0.85em; color: #475569;">Rozet Adı:</label>
                                    <input type="text" id="yeni-rozet-ad" placeholder="Örn: Matematik Yıldızı" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.85em; color: #475569;">İkon / Emoji:</label>
                                    <select id="studioIconSelect" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; background:white;">
                                        <option value="⭐">⭐ Yıldız</option>
                                        <option value="📚">📚 Kitap</option>
                                        <option value="🏆">🏆 Kupa</option>
                                        <option value="🎓">🎓 Kep</option>
                                        <option value="✏️">✏️ Kalem</option>
                                        <option value="💡">💡 Fikir</option>
                                        <option value="🥇">🥇 1.lik</option>
                                        <option value="❤️">❤️ Kalp</option>
                                        <option value="🚀">🚀 Roket</option>
                                        <option value="🎯">🎯 Hedef</option>
                                        <option value="👑">👑 Kral</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.85em; color: #475569;">Şekil:</label>
                                    <select id="studioShape" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; background:white;">
                                        <option value="50%">Daire</option>
                                        <option value="kalkan">🛡️ Kalkan</option>
                                        <option value="12px">Yumuşak Kare</option>
                                        <option value="0px">Keskin Kare</option>
                                    </select>
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.75em; color: #475569;">Renk 1 (Üst)</label>
                                    <input type="color" id="studioColor1" value="#fbbf24" style="width:100%; height:34px; border:none; border-radius:6px; cursor:pointer; background:none;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.75em; color: #475569;">Renk 2 (Alt)</label>
                                    <input type="color" id="studioColor2" value="#d97706" style="width:100%; height:34px; border:none; border-radius:6px; cursor:pointer; background:none;">
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.85em; color: #475569;">İçine Yazı (Maks 10 Karakter):</label>
                                    <input type="text" id="yeni-rozet-altyazi" placeholder="Örn: 3-A ŞAMPİYON" maxlength="10" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-weight: bold; font-size: 0.85em; color: #475569;">Açıklama / Kriter:</label>
                                    <input type="text" id="yeni-rozet-aciklama" placeholder="Örn: 50 soru çözdü" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;">
                                </div>
                            </div>
                        </div>

                        <!-- Canlı Önizleme ve Ekle Butonu -->
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; padding: 20px; border-radius: 10px; border: 2px dashed #cbd5e1;">
                            <span style="font-size: 0.75rem; color: #64748b; margin-bottom: 10px; font-weight: bold;">Canlı Önizleme</span>
                            
                            <div id="studioPrevMedal" style="width: 80px; height: 80px; background: linear-gradient(145deg, #fbbf24, #d97706); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.2), inset 0 2px 4px rgba(255,255,255,0.4); border: 2px solid #fef3c7; margin-bottom: 15px;">
                                <span id="studioPrevIcon" style="font-size: 32px; margin-top: 0px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3);">⭐</span>
                                <div id="studioPrevAltYazi" style="position: absolute; bottom: 5px; font-size: 9px; font-weight: 900; color: #1e293b; background: rgba(255,255,255,0.92); padding: 0px 4px; border-radius: 3px; display: none; text-align: center; width: 68px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
                            </div>

                            <button id="btn-rozet-ekle" class="btn btn-primary" style="width: 100%; font-weight: bold; padding: 10px;">💾 Kataloğa Ekle</button>
                        </div>
                    </div>

                    <div style="margin-top: 30px;">
                        <h3 style="margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Katalog Rozetleri (<span id="rozet-sayaci">0</span>)</h3>
                        <div id="rozet-basliklari"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- DETAY GÖRÜNÜMÜ -->
        <div id="detay-gorunum" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary); min-height: 50vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="detay-baslik" style="margin: 0; color: var(--primary);">📖 Öğrenci Rozet Listesi</h2>
                    <button id="btn-detay-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em;">⬅ Listeye Dön</button>
                </div>
                <div id="detay-rozet-listesi"></div>
            </div>
        </div>
    `;

    document.getElementById('tab-ogrenciler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'block';
        document.getElementById('view-rozet-yonetimi').style.display = 'none';
        document.getElementById('tab-ogrenciler').className = 'btn btn-primary';
        document.getElementById('tab-rozet-yonetimi').className = 'btn btn-secondary';
    });

    document.getElementById('tab-rozet-yonetimi').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'none';
        document.getElementById('view-rozet-yonetimi').style.display = 'block';
        document.getElementById('tab-ogrenciler').className = 'btn btn-secondary';
        document.getElementById('tab-rozet-yonetimi').className = 'btn btn-primary';
    });

    const updatePreview = () => {
        const icon = document.getElementById('studioIconSelect').value;
        const shape = document.getElementById('studioShape').value;
        const c1 = document.getElementById('studioColor1').value;
        const c2 = document.getElementById('studioColor2').value;
        const altYazi = document.getElementById('yeni-rozet-altyazi').value.trim();

        document.getElementById('studioPrevIcon').textContent = icon;
        const medal = document.getElementById('studioPrevMedal');
        
        if (shape === 'kalkan') {
            medal.style.borderRadius = '50% 50% 50% 50% / 20% 20% 80% 80%';
        } else {
            medal.style.borderRadius = shape;
        }

        medal.style.background = `linear-gradient(145deg, ${c1}, ${c2})`;

        const yaziDiv = document.getElementById('studioPrevAltYazi');
        const iconSpan = document.getElementById('studioPrevIcon');
        
        if (altYazi) {
            yaziDiv.textContent = altYazi;
            yaziDiv.style.display = 'block';
            iconSpan.style.marginTop = '-8px';
            iconSpan.style.fontSize = '26px';
        } else {
            yaziDiv.style.display = 'none';
            iconSpan.style.marginTop = '0px';
            iconSpan.style.fontSize = '32px';
        }
    };

    document.getElementById('studioIconSelect').addEventListener('change', updatePreview);
    document.getElementById('studioShape').addEventListener('change', updatePreview);
    document.getElementById('studioColor1').addEventListener('input', updatePreview);
    document.getElementById('studioColor2').addEventListener('input', updatePreview);
    document.getElementById('yeni-rozet-altyazi').addEventListener('input', updatePreview);

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('rozetler'));
        await db.toggleModuleVisibility('rozetler', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-rozet-ekle').addEventListener('click', async () => {
        const kategori = document.getElementById('yeni-rozet-kategori').value;
        const ad = document.getElementById('yeni-rozet-ad').value.trim();
        const aciklama = document.getElementById('yeni-rozet-aciklama').value.trim();
        const altYazi = document.getElementById('yeni-rozet-altyazi').value.trim();
        const ikon = document.getElementById('studioIconSelect').value;
        const shape = document.getElementById('studioShape').value;
        const c1 = document.getElementById('studioColor1').value;
        const c2 = document.getElementById('studioColor2').value;
        
        if (ad) {
            const btn = document.getElementById('btn-rozet-ekle');
            btn.disabled = true; btn.innerText = "⏳ Kaydediliyor...";
            
            await db.add('rozetler_kalemleri', { 
                kategori, 
                icon: ikon, 
                ad, 
                aciklama,
                altYazi,
                style1: c1,
                style2: c2,
                shape: shape
            });
            
            document.getElementById('yeni-rozet-ad').value = '';
            document.getElementById('yeni-rozet-aciklama').value = '';
            document.getElementById('yeni-rozet-altyazi').value = '';
            btn.disabled = false; btn.innerText = "💾 Kataloğa Ekle";
            await arayuzuGuncelle();
        } else {
            alert("Lütfen rozet adını yazın.");
        }
    });

    document.getElementById('btn-detay-kapat').addEventListener('click', async () => {
        document.getElementById('detay-gorunum').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        await arayuzuGuncelle(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-sirala').addEventListener('click', () => {
        aktifSiralama = aktifSiralama === 'alfabetik' ? 'encok' : 'alfabetik';
        arayuzuGuncelle();
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const [rozetler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('rozetler_kalemleri'),
        db.getAll('users'),
        db.getAll('rozet_matrisi')
    ]);

    document.getElementById('rozet-sayaci').innerText = rozetler.length;
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    ogrenciler.forEach(ogr => {
        let kazanilanSayisi = 0;
        rozetler.forEach(r => {
            let m = matris.find(m => m.ogrId === ogr.id && m.targetId === r.id);
            if (m && m.deger === '✔️') kazanilanSayisi++;
        });
        ogr.kazanilanSayisi = kazanilanSayisi;
    });

    const ikonSpan = document.getElementById('siralama-ikon');
    const metinSpan = document.getElementById('siralama-metin');
    
    if (aktifSiralama === 'alfabetik') {
        ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        if(ikonSpan) { ikonSpan.innerText = '🔤'; metinSpan.innerText = 'Alfabetik Sıralama'; }
    } else {
        ogrenciler.sort((a, b) => b.kazanilanSayisi - a.kazanilanSayisi);
        if(ikonSpan) { ikonSpan.innerText = '🏆'; metinSpan.innerText = 'En Çok Rozeti Olanlar'; }
    }

    let basliklarHtml = '';
    Object.keys(KATEGORILER).forEach(katKey => {
        const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
        if (katRozetleri.length === 0) return;

        basliklarHtml += `<div style="margin-bottom: 25px;"><h4 style="color: ${KATEGORILER[katKey].renk}; border-bottom: 2px solid ${KATEGORILER[katKey].renk}; padding-bottom: 5px; margin-bottom: 12px;">${KATEGORILER[katKey].ad}</h4>`;
        basliklarHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">';
        
        katRozetleri.forEach(r => {
            let alanSayisi = matris.filter(m => m.targetId === r.id && m.deger === '✔️').length;
            basliklarHtml += `
                <div style="background: white; border: 1px solid #e2e8f0; border-left: 5px solid ${KATEGORILER[katKey].renk}; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-size: 1.05em; font-weight: bold; display: flex; align-items: center; gap: 10px;">
                            ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)} <span>${r.ad}</span>
                        </div>
                        <p style="font-size: 0.8em; color: #64748b; margin: 6px 0 4px 0;">${r.aciklama || ''}</p>
                        <p style="font-size: 0.75em; color: var(--success); font-weight: bold; margin: 4px 0;">${alanSayisi} öğrenci kazandı</p>
                    </div>
                    <button class="btn-rozet-sil btn btn-danger" data-id="${r.id}" style="margin-top: 8px; padding: 4px; font-size: 0.8em;">✕ Sil</button>
                </div>
            `;
        });
        basliklarHtml += '</div></div>';
    });

    if(rozetler.length === 0) basliklarHtml = '<div style="color:#64748b; padding: 15px; text-align: center; background: #f8fafc; border-radius: 8px; font-style: italic;">Henüz tanımlanmış rozet bulunmuyor.</div>';
    document.getElementById('rozet-basliklari').innerHTML = basliklarHtml;

    let kartlarHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">`;
    ogrenciler.forEach((ogr, index) => {
        kartlarHtml += `
            <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div>
                        <div style="font-size: 0.8em; color: #94a3b8; font-weight: bold; margin-bottom: 5px;">#${index + 1} | No: ${ogr.okulno || '-'}</div>
                        <div style="font-weight: bold; font-size: 1.15em; color: #1e293b; line-height: 1.2;">${ogr.name}</div>
                    </div>
                    <div style="background: #f0fdf4; border: 2px solid #22c55e; color: #16a34a; border-radius: 10px; padding: 5px 12px; text-align: center; min-width: 60px;">
                        <span style="font-size: 1.4em; font-weight: 900; display: block; line-height: 1;">${ogr.kazanilanSayisi}</span>
                        <span style="font-size: 0.65em; font-weight: bold;">ROZET</span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-detay-ac" data-ogrid="${ogr.id}" data-ogrname="${ogr.name}" style="width: 100%; padding: 10px; font-weight: bold; font-size: 0.9em; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; cursor: pointer;">
                    🎖️ Rozetleri Yönet / Ver
                </button>
            </div>
        `;
    });
    kartlarHtml += `</div>`;
    document.getElementById('rozet-tablosu-alani').innerHTML = kartlarHtml;

    document.querySelectorAll('.btn-rozet-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu rozeti silmek istediğinize emin misiniz?")) {
                await db.delete('rozetler_kalemleri', e.currentTarget.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-detay-ac').forEach(btn => {
        btn.addEventListener('click', (e) => {
            ogrenciDetayiniAc(e.currentTarget.getAttribute('data-ogrid'), e.currentTarget.getAttribute('data-ogrname'), rozetler, matris);
        });
    });
}

function ogrenciDetayiniAc(ogrId, ogrName, rozetler, matris) {
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('detay-gorunum').style.display = 'block';
    document.getElementById('detay-baslik').innerText = `🎖️ ${ogrName} - Rozet Listesi`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    Object.keys(KATEGORILER).forEach(katKey => {
        const katRozetleri = rozetler.filter(r => (r.kategori || 'akademik') === katKey);
        if (katRozetleri.length === 0) return;

        listeHtml += `<div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">`;
        listeHtml += `<h4 style="color: ${KATEGORILER[katKey].renk}; margin: 0 0 10px 0;">${KATEGORILER[katKey].ad}</h4>`;
        
        katRozetleri.forEach((r) => {
            let kayit = matris.find(m => m.ogrId === ogrId && m.targetId === r.id);
            let sahipMi = kayit && kayit.deger === '✔️';
            
            listeHtml += `
                <div style="background: white; padding: 10px 15px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${renderRozetGorseli(r.icon, r.style1, r.style2, r.shape, r.altYazi)}
                        <div>
                            <div style="font-weight: bold; color: #334155;">${r.ad}</div>
                            <div style="font-size: 0.8em; color: #64748b;">${r.aciklama || ''}</div>
                        </div>
                    </div>
                    <button class="btn-durum-degistir" data-ogr="${ogrId}" data-kalem="${r.id}" data-val="${sahipMi ? '✔️' : ''}"
                        style="padding: 8px 15px; border-radius: 6px; font-weight: bold; font-size: 0.9em; cursor: pointer; border: 2px solid ${sahipMi ? '#10b981' : '#cbd5e1'}; background: ${sahipMi ? '#d1fae5' : '#f1f5f9'}; color: ${sahipMi ? '#059669' : '#64748b'};">
                        ${sahipMi ? '✅ Sahip (Kaldır)' : '➕ Rozet Ver'}
                    </button>
                </div>
            `;
        });
        listeHtml += `</div>`;
    });

    listeHtml += '</div>';
    document.getElementById('detay-rozet-listesi').innerHTML = listeHtml;

    document.querySelectorAll('.btn-durum-degistir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const oId = e.currentTarget.getAttribute('data-ogr');
            const kId = e.currentTarget.getAttribute('data-kalem');
            const val = e.currentTarget.getAttribute('data-val');
            
            let newValue = val === '✔️' ? '' : '✔️';
            e.currentTarget.setAttribute('data-val', newValue);
            e.currentTarget.innerText = newValue === '✔️' ? '✅ Sahip (Kaldır)' : '➕ Rozet Ver';
            e.currentTarget.style.backgroundColor = newValue === '✔️' ? '#d1fae5' : '#f1f5f9';
            e.currentTarget.style.color = newValue === '✔️' ? '#059669' : '#64748b';
            e.currentTarget.style.borderColor = newValue === '✔️' ? '#10b981' : '#cbd5e1';

            await db.saveMatrixStatus('rozet_matrisi', oId, kId, newValue);
        });
    });
}