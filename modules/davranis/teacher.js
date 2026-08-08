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
                <h3>1. Davranış / Kriter Ekle</h3>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <input type="text" id="yeni-kriter-ad" placeholder="Örn: Ödevini Yaptı, Derse Katıldı, Saygılı Davrandı vb." style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <button id="btn-kriter-ekle" class="btn btn-primary">Kriter Ekle</button>
                </div>
                <div id="kriter-basliklari" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
            </div>

            <div class="card" style="overflow-x: auto;">
                <h3>2. Öğrenci Yıldız Tablosu</h3>
                <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Hücrelere tıklayıp 1-5 arası yıldız verebilirsiniz. Seçim yaptığınız an buluta otomatik kaydedilir ve toplam puan hesaplanır.</p>
                <div id="puan-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
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

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const kriterler = await db.getAll('davranis_kriterleri');
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const matris = await db.getAll('davranis_matrisi'); 

    // Her öğrencinin toplam yıldızını hesapla
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

    // 1. KRİTER BAŞLIKLARINI YÖNETİM EKRANINA ÇİZ
    let basliklarHtml = '';
    kriterler.forEach(k => {
        basliklarHtml += `
            <div style="background: #f1f1f1; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #ddd;">
                <span style="font-size: 0.9em; font-weight: bold;">${k.ad}</span>
                <button class="btn-kriter-sil" data-id="${k.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;">✕</button>
            </div>
        `;
    });
    document.getElementById('kriter-basliklari').innerHTML = basliklarHtml;

    document.querySelectorAll('.btn-kriter-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu kriteri silmek istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.delete('davranis_kriterleri', e.target.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    // 2. ÖĞRENCİ YILDIZ TABLOSUNU ÇİZ
    if (kriterler.length === 0) {
        document.getElementById('puan-tablosu-alani').innerHTML = '<p style="color:var(--secondary);">Lütfen önce yukarıdan puanlama yapmak için bir kriter ekleyin.</p>';
        document.getElementById('pano-alani').innerHTML = '<p style="text-align:center; color:#888;">Panoda listelenecek veri yok.</p>';
        return;
    }

    const tabloOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.9em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px; width: 30px;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ADI SOYADI</th>
                    ${kriterler.map(k => `<th style="border: 1px solid #ddd; padding: 8px; text-align:center;">${k.ad}</th>`).join('')}
                    <th style="border: 1px solid #ddd; padding: 8px; width: 80px; color: var(--primary);">TOPLAM YILDIZ</th>
                </tr>
            </thead>
            <tbody>
    `;

    tabloOgrenciler.forEach((ogr, index) => {
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${ogr.name}</td>
        `;

        kriterler.forEach(k => {
            let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '0';
            
            tabloHtml += `
                <td style="border: 1px solid #ddd; padding: 0;">
                    <select class="hucre-input" data-ogr="${ogr.id}" data-kriter="${k.id}" 
                            style="width: 100%; height: 100%; padding: 8px; border: none; text-align: center; box-sizing: border-box; outline: none; background: transparent; cursor: pointer; font-size: 1.1em;">
                        <option value="0" ${hucreDegeri === '0' ? 'selected' : ''}>Boş</option>
                        <option value="1" ${hucreDegeri === '1' ? 'selected' : ''}>⭐</option>
                        <option value="2" ${hucreDegeri === '2' ? 'selected' : ''}>⭐⭐</option>
                        <option value="3" ${hucreDegeri === '3' ? 'selected' : ''}>⭐⭐⭐</option>
                        <option value="4" ${hucreDegeri === '4' ? 'selected' : ''}>⭐⭐⭐⭐</option>
                        <option value="5" ${hucreDegeri === '5' ? 'selected' : ''}>⭐⭐⭐⭐⭐</option>
                    </select>
                </td>
            `;
        });
        
        tabloHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 1.1em; font-weight: bold; color: var(--danger); background: #fdf5f5;">${ogr.score} <span style="font-size:0.8em">⭐</span></td></tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('puan-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const ogrId = e.target.getAttribute('data-ogr');
            const kriterId = e.target.getAttribute('data-kriter');
            const deger = e.target.value;
            
            e.target.style.backgroundColor = '#fff3cd'; 
            await db.saveMatrixStatus('davranis_matrisi', ogrId, kriterId, deger);
            e.target.style.backgroundColor = '#e6ffed'; 
            
            setTimeout(() => { arayuzuGuncelle(); }, 600);
        });
    });

    // 3. PANO (LİDERLİK) GÖRÜNÜMÜNÜ ÇİZ
    const panoOgrenciler = [...ogrenciler].sort((a, b) => b.score - a.score);

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

    document.getElementById('pano-alani').innerHTML = panoHtml;
}