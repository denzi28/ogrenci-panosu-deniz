import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Davranış modülü yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('davranis');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda misafirler (veliler) sınıf panosundaki puan sıralamasını görebilir.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="tab-pano" class="btn btn-primary" style="flex: 1;">🏆 Pano (Liderlik Sıralaması)</button>
            <button id="tab-yonetim" class="btn btn-secondary" style="flex: 1;">⚙️ Kriter ve Yıldız Yönetimi</button>
        </div>

        <!-- PANO SEKMESİ -->
        <div id="view-pano" style="display: block;">
            <div class="card" style="border-top: 4px solid var(--success);">
                <h2 style="text-align: center; color: var(--primary); margin-bottom: 20px;">🏆 Sınıf Liderlik Panosu</h2>
                <div id="pano-alani"><p>⏳ Pano yükleniyor...</p></div>
            </div>
        </div>

        <!-- YÖNETİM SEKMESİ -->
        <div id="view-yonetim" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <h3>1. Yeni Davranış / Kriter Ekle</h3>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <input type="text" id="yeni-kriter-ad" placeholder="Örn: Ödevini Yaptı, Derse Katıldı, Saygılı Davrandı vb." style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <button id="btn-kriter-ekle" class="btn btn-primary">Kriter Ekle</button>
                </div>
            </div>

            <div class="card">
                <h3>2. Davranışlar ve Sınıfı Puanlama</h3>
                <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Öğrencilere yıldız vermek için değerlendirmek istediğiniz davranışın yanındaki <strong>"⭐ Puanla"</strong> butonuna tıklayın.</p>
                <div id="kriter-listesi-alani"><p>⏳ Kriterler yükleniyor...</p></div>
            </div>
        </div>

        <!-- YILDIZ VERME KUTUSU (MODAL) -->
        <div id="star-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 9999; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box; backdrop-filter: blur(3px);">
            <div class="card" style="background: white; width: 100%; max-width: 450px; max-height: 85vh; display: flex; flex-direction: column; padding: 0; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden;">
                <div style="background: var(--primary); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="modal-criteria-name" style="margin: 0; color: white; font-size: 1.1em;">Davranış Adı</h3>
                    <button id="modal-close" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s;">Kapat</button>
                </div>
                <div style="background: #f1f2f6; padding: 10px 20px; font-size: 0.85em; color: #555; text-align: center; border-bottom: 1px solid #ddd;">
                    Seçtiğiniz yıldıza tıklandığında anında buluta kaydedilir.
                </div>
                <div id="modal-student-list" style="padding: 10px 20px 20px 20px; overflow-y: auto; flex: 1; background: #fdfdfd;">
                    <p>Yükleniyor...</p>
                </div>
            </div>
        </div>
    `;

    // Sekme Geçişleri
    document.getElementById('tab-pano').addEventListener('click', () => {
        document.getElementById('view-pano').style.display = 'block';
        document.getElementById('view-yonetim').style.display = 'none';
        document.getElementById('tab-pano').className = 'btn btn-primary';
        document.getElementById('tab-yonetim').className = 'btn btn-secondary';
    });

    document.getElementById('tab-yonetim').addEventListener('click', () => {
        document.getElementById('view-pano').style.display = 'none';
        document.getElementById('view-yonetim').style.display = 'block';
        document.getElementById('tab-pano').className = 'btn btn-secondary';
        document.getElementById('tab-yonetim').className = 'btn btn-primary';
    });

    // Modül Aç/Kapa
    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('davranis'));
        await db.toggleModuleVisibility('davranis', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    // Yeni Kriter Ekleme
    document.getElementById('btn-kriter-ekle').addEventListener('click', async () => {
        const ad = document.getElementById('yeni-kriter-ad').value.trim();
        if (ad) {
            const btn = document.getElementById('btn-kriter-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('davranis_kriterleri', { ad: ad });
            document.getElementById('yeni-kriter-ad').value = '';
            btn.disabled = false; btn.innerText = "Kriter Ekle";
            await arayuzuGuncelle();
        }
    });

    // Modalı Kapatma
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('star-modal').style.display = 'none';
        arayuzuGuncelle(); // Modal kapandığında Pano'daki toplam puanları güncelle
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const kriterler = await db.getAll('davranis_kriterleri');
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const matris = await db.getAll('davranis_matrisi'); 

    // Her öğrencinin toplam yıldızını hesapla (Pano İçin)
    ogrenciler.forEach(ogr => {
        let total = 0;
        kriterler.forEach(k => {
            const kayit = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id);
            if (kayit && kayit.deger) {
                total += parseInt(kayit.deger) || 0;
            }
        });
        ogr.score = total;
    });

    // 1. KRİTER BAZLI YÖNETİM LİSTESİNİ ÇİZ
    const kriterListesiAlani = document.getElementById('kriter-listesi-alani');
    
    if (kriterler.length === 0) {
        kriterListesiAlani.innerHTML = '<p style="color:#888;">Henüz değerlendirilecek bir davranış/kriter eklemediniz.</p>';
    } else {
        let kriterHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        
        kriterler.forEach(k => {
            kriterHtml += `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
                    <span style="font-weight: bold; font-size: 1.1em; color: var(--primary);">${k.ad}</span>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary btn-kriter-puanla" data-id="${k.id}" data-name="${k.ad}" style="font-weight: bold;">
                            ⭐ Sınıfı Puanla
                        </button>
                        <button class="btn btn-danger btn-kriter-sil" data-id="${k.id}">Sil</button>
                    </div>
                </div>
            `;
        });
        
        kriterHtml += '</div>';
        kriterListesiAlani.innerHTML = kriterHtml;

        // "Sınıfı Puanla" Butonları
        document.querySelectorAll('.btn-kriter-puanla').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const kriterId = e.target.getAttribute('data-id');
                const kriterName = e.target.getAttribute('data-name');
                modaliAc(kriterId, kriterName, ogrenciler, matris);
            });
        });

        // "Sil" Butonları
        document.querySelectorAll('.btn-kriter-sil').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Bu davranışı tamamen silmek istediğinize emin misiniz? Öğrencilerin bu davranıştan aldığı tüm yıldızlar da silinecektir.")) {
                    e.target.innerText = "...";
                    await db.delete('davranis_kriterleri', e.target.getAttribute('data-id'));
                    await arayuzuGuncelle();
                }
            });
        });
    }

    // 2. PANO (LİDERLİK) GÖRÜNÜMÜNÜ ÇİZ
    const panoAlani = document.getElementById('pano-alani');
    const panoOgrenciler = [...ogrenciler].sort((a, b) => b.score - a.score);

    if (panoOgrenciler.length === 0) {
        panoAlani.innerHTML = '<p style="text-align:center; color:#888;">Panoda gösterilecek öğrenci bulunamadı.</p>';
    } else {
        let panoHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        panoOgrenciler.forEach((ogr, index) => {
            let madalya = '';
            let bgRenk = '#f8f9fa';
            let borderRenk = '#eee';

            if (index === 0 && ogr.score > 0) { madalya = '🥇'; bgRenk = '#fffbec'; borderRenk = '#ffc107'; }
            else if (index === 1 && ogr.score > 0) { madalya = '🥈'; bgRenk = '#f8f9fa'; borderRenk = '#cbd5e1'; }
            else if (index === 2 && ogr.score > 0) { madalya = '🥉'; bgRenk = '#fff7ed'; borderRenk = '#fb923c'; }

            panoHtml += `
            <div style="background: ${bgRenk}; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${borderRenk}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 1.8em; width: 40px; text-align: center; font-weight: bold; color: #555;">${madalya || (index + 1)}</span>
                    <span style="font-size: 1.2em; font-weight: bold; color: var(--primary);">${ogr.name}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 2em; font-weight: 900; color: var(--danger);">${ogr.score} <span style="font-size:0.6em;">⭐</span></span>
                    <span style="font-size: 0.8em; font-weight: bold; color: #888; display: block; margin-top: -5px;">TOPLAM YILDIZ</span>
                </div>
            </div>`;
        });
        panoHtml += '</div>';
        panoAlani.innerHTML = panoHtml;
    }
}

// MODAL İÇERİĞİNİ OLUŞTURAN FONKSİYON (Davranışa Göre Sınıf Listesi)
function modaliAc(kriterId, kriterName, ogrenciler, matris) {
    document.getElementById('modal-criteria-name').innerText = `⭐ ${kriterName}`;
    
    // Sınıf listesini isme göre sırala
    const siraliOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    let modalHtml = '';
    
    siraliOgrenciler.forEach((ogr, index) => {
        let mevcutDeger = matris.find(m => m.ogrId === ogr.id && m.targetId === kriterId)?.deger || '0';
        
        modalHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; padding-right: 10px;">
                <span style="color: #999; font-size: 0.9em;">${index + 1}.</span>
                <span style="font-weight: bold; color: #444;">${ogr.name}</span>
            </div>
            <select class="modal-hucre-input" data-ogr="${ogr.id}" data-kriter="${kriterId}" 
                    style="padding: 8px 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; cursor: pointer; outline: none; background: #fff; min-width: 130px;">
                <option value="0" ${mevcutDeger === '0' ? 'selected' : ''}>Boş (0)</option>
                <option value="1" ${mevcutDeger === '1' ? 'selected' : ''}>⭐ (1)</option>
                <option value="2" ${mevcutDeger === '2' ? 'selected' : ''}>⭐⭐ (2)</option>
                <option value="3" ${mevcutDeger === '3' ? 'selected' : ''}>⭐⭐⭐ (3)</option>
                <option value="4" ${mevcutDeger === '4' ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
                <option value="5" ${mevcutDeger === '5' ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
            </select>
        </div>`;
    });
    
    document.getElementById('modal-student-list').innerHTML = modalHtml;
    document.getElementById('star-modal').style.display = 'flex';

    // Seçim değiştiğinde anında buluta kaydet
    document.querySelectorAll('.modal-hucre-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const oId = e.target.getAttribute('data-ogr');
            const kId = e.target.getAttribute('data-kriter');
            const deger = e.target.value;
            
            // Görsel geri bildirim
            e.target.style.borderColor = '#ffc107'; 
            e.target.style.backgroundColor = '#fff3cd';
            
            await db.saveMatrixStatus('davranis_matrisi', oId, kId, deger);
            
            // İşlem bitince yeşile dön
            e.target.style.borderColor = '#28a745'; 
            e.target.style.backgroundColor = '#e6ffed';
        });
    });
}