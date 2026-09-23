import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Davranış modülü yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('davranis');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <!-- ANA GÖRÜNÜM (Pano ve Yönetim) -->
        <div id="ana-gorunum" style="display: block;">
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
        </div>

        <!-- TAM SAYFA PUANLAMA EKRANI (Başlangıçta Gizli) -->
        <div id="view-puanlama" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="puanlama-criteria-name" style="color: var(--primary); margin: 0; font-size: 1.5em;">Davranış Adı</h2>
                    <button id="btn-puanlama-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅️ Yönetime Geri Dön</button>
                </div>
                <div style="background: #e8f4fd; border: 1px dashed var(--primary); padding: 12px; border-radius: 8px; font-size: 1em; margin-bottom: 20px; color: #1e293b; font-weight: bold; text-align: center;">
                    Kaç yıldız vermek istiyorsanız o yıldıza dokunun. (Örn: 3 yıldıza dokunursanız ilk 3 yıldız dolar). Anında kaydedilir.
                </div>
                <div id="puanlama-student-list"></div>
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

    // Puanlama Ekranından Geri Dönme İşlemi
    document.getElementById('btn-puanlama-kapat').addEventListener('click', async () => {
        document.getElementById('view-puanlama').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        // Ekrana geri dönüldüğünde puanların panoya yansıması için listeyi yenile
        await arayuzuGuncelle(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    // HIZLANDIRMA: Tüm verileri aynı anda çek (Turbo)
    const [kriterler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('davranis_kriterleri'),
        db.getAll('users'),
        db.getAll('davranis_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

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
                        <button class="btn btn-primary btn-kriter-puanla" data-id="${k.id}" data-name="${k.ad}" style="font-weight: bold; padding: 8px 15px; font-size: 1em;">
                            ⭐ Sınıfı Puanla
                        </button>
                        <button class="btn btn-danger btn-kriter-sil" data-id="${k.id}">Sil</button>
                    </div>
                </div>
            `;
        });
        
        kriterHtml += '</div>';
        kriterListesiAlani.innerHTML = kriterHtml;

        // "Sınıfı Puanla" Butonları - Artık tam ekranı açıyor
        document.querySelectorAll('.btn-kriter-puanla').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const kriterId = e.target.getAttribute('data-id');
                const kriterName = e.target.getAttribute('data-name');
                tamSayfaPuanlamayiAc(kriterId, kriterName, ogrenciler, matris);
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

// 5 YILDIZLI İNTERAKTİF TAM SAYFA PUANLAMA EKRANI
function tamSayfaPuanlamayiAc(kriterId, kriterName, ogrenciler, matris) {
    document.getElementById('puanlama-criteria-name').innerText = `⭐ ${kriterName}`;
    
    // Sınıf listesini isme göre sırala
    const siraliOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 15px;">';
    
    siraliOgrenciler.forEach((ogr, index) => {
        let mevcutDeger = parseInt(matris.find(m => m.ogrId === ogr.id && m.targetId === kriterId)?.deger || '0');
        
        // 5 Yıldızı Oluştur (Dolu olanlar Altın, Boş olanlar Gri)
        let starsHtml = '';
        for(let i = 1; i <= 5; i++) {
            let renk = i <= mevcutDeger ? '#fbbf24' : '#e2e8f0'; // Doluysa Sarı, Boşsa Gri
            starsHtml += `<span class="star-btn" data-ogr="${ogr.id}" data-kriter="${kriterId}" data-val="${i}" style="cursor:pointer; font-size: 2.2em; color: ${renk}; transition: color 0.2s; user-select: none; -webkit-tap-highlight-color: transparent;">★</span>`;
        }
        
        listeHtml += `
        <div class="puan-satiri" data-ogr="${ogr.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-radius: 12px; background: #f8fafc; border: 2px solid #e2e8f0; transition: background-color 0.3s, border-color 0.3s; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 15px; min-width: 150px;">
                <span style="color: #94a3b8; font-weight: bold; font-size: 1.2em; width: 25px;">${index + 1}.</span>
                <span style="font-weight: bold; font-size: 1.2em; color: #334155;">${ogr.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <!-- Sıfırlama Butonu (Sadece puan 0'dan büyükse görünür) -->
                <button class="btn-sifirla" data-ogr="${ogr.id}" data-kriter="${kriterId}" style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 1.2em; padding: 5px; display: ${mevcutDeger > 0 ? 'block' : 'none'};" title="Puanı Sıfırla">✖</button>
                
                <!-- Yıldızların Bulunduğu Alan -->
                <div class="stars-container" data-ogr="${ogr.id}" style="display: flex; gap: 2px;">
                    ${starsHtml}
                </div>
            </div>
        </div>`;
    });
    
    listeHtml += '</div>';
    
    document.getElementById('puanlama-student-list').innerHTML = listeHtml;
    
    // Ekranları Gizle / Göster
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('view-puanlama').style.display = 'block';
    
    // Ekranın en tepesine kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // YILDIZA TIKLAMA OLAYLARI
    document.querySelectorAll('.star-btn').forEach(star => {
        star.addEventListener('click', async (e) => {
            const val = parseInt(e.target.getAttribute('data-val'));
            const oId = e.target.getAttribute('data-ogr');
            const kId = e.target.getAttribute('data-kriter');
            
            // 1. Yıldızların renklerini anında güncelle
            const container = document.querySelector(`.stars-container[data-ogr="${oId}"]`);
            container.querySelectorAll('.star-btn').forEach((s, idx) => {
                s.style.color = (idx < val) ? '#fbbf24' : '#e2e8f0';
            });
            
            // 2. Sıfırlama (✖) butonunu görünür yap
            document.querySelector(`.btn-sifirla[data-ogr="${oId}"]`).style.display = 'block';

            // 3. Satırı geçici olarak yeşil yak (Kaydedildi efekti)
            const satir = document.querySelector(`.puan-satiri[data-ogr="${oId}"]`);
            satir.style.borderColor = '#10b981';
            satir.style.backgroundColor = '#d1fae5';
            
            // 4. Veritabanına kaydet
            await db.saveMatrixStatus('davranis_matrisi', oId, kId, val.toString());
            
            // 5. Yarım saniye sonra satırın rengini normale döndür
            setTimeout(() => {
                satir.style.borderColor = '#e2e8f0';
                satir.style.backgroundColor = '#f8fafc';
            }, 500);
        });
    });

    // SIFIRLAMA (✖) TIKLAMA OLAYLARI
    document.querySelectorAll('.btn-sifirla').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const oId = e.target.getAttribute('data-ogr');
            const kId = e.target.getAttribute('data-kriter');
            
            // 1. Bütün yıldızları griye çevir
            const container = document.querySelector(`.stars-container[data-ogr="${oId}"]`);
            container.querySelectorAll('.star-btn').forEach(s => {
                s.style.color = '#e2e8f0';
            });
            
            // 2. Sıfırlama butonunu tekrar gizle
            e.target.style.display = 'none';

            // 3. Satırı geçici olarak sarı yak (Silindi efekti)
            const satir = document.querySelector(`.puan-satiri[data-ogr="${oId}"]`);
            satir.style.borderColor = '#fbbf24';
            satir.style.backgroundColor = '#fef3c7';

            // 4. Veritabanından sıfırla
            await db.saveMatrixStatus('davranis_matrisi', oId, kId, '0');

            // 5. Yarım saniye sonra satırın rengini normale döndür
            setTimeout(() => {
                satir.style.borderColor = '#e2e8f0';
                satir.style.backgroundColor = '#f8fafc';
            }, 500);
        });
    });
}