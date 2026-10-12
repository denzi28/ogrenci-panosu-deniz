import { db } from '../../js/db.js';

// Açık olan panellerin listesini hafızada tutar
let acikPaneller = new Set(); 

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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h2 style="color: var(--primary); margin: 0;">🏆 Sınıf Liderlik Panosu</h2>
                            <p style="font-size: 0.85em; color: #64748b; margin: 0;">Öğrencileri listeden anında puanlamak için "➕" butonunu kullanın.</p>
                        </div>
                        <button id="btn-pano-yazdir" class="btn btn-primary" style="padding: 10px 15px; font-size: 0.95em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            🖨️ Panoyu Yazdır / PDF Al
                        </button>
                    </div>
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
                    <h3>2. Davranışlar ve Sınıfı Toplu Puanlama</h3>
                    <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Tüm sınıfa aynı anda tek bir davranış üzerinden yıldız vermek isterseniz <strong>"⭐ Sınıfı Puanla"</strong> butonunu kullanın.</p>
                    <div id="kriter-listesi-alani"><p>⏳ Kriterler yükleniyor...</p></div>
                </div>
            </div>
        </div>

        <!-- TAM SAYFA PUANLAMA EKRANI -->
        <div id="view-puanlama" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="puanlama-criteria-name" style="color: var(--primary); margin: 0; font-size: 1.5em;">Davranış Adı</h2>
                    <button id="btn-puanlama-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅ Yönetime Geri Dön</button>
                </div>
                
                <div id="toplu-islem-alani"></div>

                <div id="puanlama-student-list"></div>
            </div>
        </div>
    `;

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

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('davranis'));
        await db.toggleModuleVisibility('davranis', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

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

    document.getElementById('btn-puanlama-kapat').addEventListener('click', async () => {
        document.getElementById('view-puanlama').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        await arayuzuGuncelle(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-pano-yazdir').addEventListener('click', async () => {
        const [kriterler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('davranis_kriterleri'),
            db.getAll('users'),
            db.getAll('davranis_matrisi')
        ]);

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

        ogrenciler.forEach(ogr => {
            let total = 0;
            kriterler.forEach(k => {
                const kayit = matris.find(m => String(m.ogrId) === String(ogr.id) && String(m.targetId) === String(k.id));
                if (kayit && kayit.deger) {
                    total += parseInt(kayit.deger) || 0;
                }
            });
            ogr.score = total;
        });

        const siraliOgrenciler = [...ogrenciler].sort((a, b) => b.score - a.score);
        const benzersizPuanlar = [...new Set(siraliOgrenciler.map(o => o.score))].filter(p => p > 0).sort((a, b) => b - a);

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Sınıf Liderlik Panosu Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 16px; }
                    th, td { border: 1px solid #000; padding: 10px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .sira { font-weight: bold; font-size: 1.2em; color: #555; }
                    .puan { font-weight: bold; font-size: 1.2em; color: #b91c1c; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>SINIF LİDERLİK PANOSU (YILDIZ TABLOSU)</h2>
                <div class="tarih">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 60px; text-align: center;">Sıra</th>
                            <th style="width: 80px; text-align: center;">Okul No</th>
                            <th style="text-align: left;">Öğrenci Adı Soyadı</th>
                            <th style="width: 120px; text-align: center;">Toplam Yıldız</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        siraliOgrenciler.forEach((ogr) => {
            let siraStr = '-';
            if (ogr.score > 0) {
                siraStr = (benzersizPuanlar.indexOf(ogr.score) + 1).toString();
            }
            
            printContent += `
                <tr>
                    <td class="merkez sira">${siraStr}</td>
                    <td class="merkez">${ogr.okulno || '-'}</td>
                    <td><strong>${ogr.name}</strong></td>
                    <td class="merkez puan">${ogr.score} ⭐</td>
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
    const [kriterler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('davranis_kriterleri'),
        db.getAll('users'),
        db.getAll('davranis_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    ogrenciler.forEach(ogr => {
        let total = 0;
        kriterler.forEach(k => {
            const kayit = matris.find(m => String(m.ogrId) === String(ogr.id) && String(m.targetId) === String(k.id));
            if (kayit && kayit.deger) {
                total += parseInt(kayit.deger) || 0;
            }
        });
        ogr.score = total;
    });

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

        document.querySelectorAll('.btn-kriter-puanla').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const kriterId = e.target.getAttribute('data-id');
                const kriterName = e.target.getAttribute('data-name');
                tamSayfaPuanlamayiAc(kriterId, kriterName, ogrenciler, matris);
            });
        });

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

    const panoAlani = document.getElementById('pano-alani');
    const panoOgrenciler = [...ogrenciler].sort((a, b) => b.score - a.score);

    const benzersizPuanlar = [...new Set(panoOgrenciler.map(o => o.score))].filter(p => p > 0).sort((a, b) => b - a);
    const birinciPuan = benzersizPuanlar[0] || -1;
    const ikinciPuan = benzersizPuanlar[1] || -1;
    const ucuncuPuan = benzersizPuanlar[2] || -1;

    if (panoOgrenciler.length === 0) {
        panoAlani.innerHTML = '<p style="text-align:center; color:#888;">Panoda gösterilecek öğrenci bulunamadı.</p>';
    } else {
        let panoHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        
        panoOgrenciler.forEach((ogr) => {
            let madalya = '';
            let bgRenk = '#f8f9fa';
            let borderRenk = '#eee';
            let gosterilecekSira = '';

            if (ogr.score > 0) {
                if (ogr.score === birinciPuan) { 
                    madalya = '🥇'; bgRenk = '#fffbec'; borderRenk = '#ffc107'; 
                } else if (ogr.score === ikinciPuan) { 
                    madalya = '🥈'; bgRenk = '#f8f9fa'; borderRenk = '#cbd5e1'; 
                } else if (ogr.score === ucuncuPuan) { 
                    madalya = '🥉'; bgRenk = '#fff7ed'; borderRenk = '#fb923c'; 
                }
                gosterilecekSira = madalya || (benzersizPuanlar.indexOf(ogr.score) + 1);
            } else {
                gosterilecekSira = '-'; 
            }

            // 🌟 Veri Tipi Hatasını Çözen Kısım (String'e çevrilerek kontrol edilir)
            let panelDisplay = acikPaneller.has(String(ogr.id)) ? 'block' : 'none';
            let btnText = acikPaneller.has(String(ogr.id)) ? '➖ Kapat' : '➕ Hızlı Değerlendir';

            panoHtml += `
            <div style="background: ${bgRenk}; border-radius: 8px; border: 1px solid ${borderRenk}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;">
                
                <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 1.8em; width: 40px; text-align: center; font-weight: bold; color: #555;">${gosterilecekSira}</span>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 1.2em; font-weight: bold; color: var(--primary);">${ogr.name}</span>
                            <button class="btn-hizli-panel-ac" data-ogr="${ogr.id}" style="text-align: left; background: none; border: none; padding: 0; color: #0ea5e9; font-size: 0.85em; font-weight: bold; cursor: pointer; display: inline-block; margin-top: 5px;">${btnText}</button>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 2em; font-weight: 900; color: var(--danger);">${ogr.score} <span style="font-size:0.6em;">⭐</span></span>
                        <span style="font-size: 0.8em; font-weight: bold; color: #888; display: block; margin-top: -5px;">TOPLAM YILDIZ</span>
                    </div>
                </div>

                <div id="hizli-panel-${ogr.id}" style="display: ${panelDisplay}; background: #ffffff; border-top: 1px dashed ${borderRenk}; padding: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 0.85em; color: #64748b; font-weight: bold;">Davranışlara Puan Ver (Değişiklikler anında panoya yansır):</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">`;
                        
                        if (kriterler.length === 0) {
                            panoHtml += `<div style="font-size: 0.85em; color: #ef4444;">Önce Yönetim sekmesinden kriter ekleyin.</div>`;
                        } else {
                            kriterler.forEach(k => {
                                let mevcutDeger = parseInt(matris.find(m => String(m.ogrId) === String(ogr.id) && String(m.targetId) === String(k.id))?.deger || '0');
                                
                                let starsHtml = '';
                                for(let i = 1; i <= 5; i++) {
                                    let renk = i <= mevcutDeger ? '#fbbf24' : '#e2e8f0'; 
                                    starsHtml += `<span class="hizli-star-btn" data-ogr="${ogr.id}" data-kriter="${k.id}" data-val="${i}" style="cursor:pointer; font-size: 1.6em; color: ${renk}; transition: 0.2s; user-select: none;">★</span>`;
                                }

                                panoHtml += `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <span style="font-size: 0.95em; color: #334155; font-weight: 500;">${k.ad}</span>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <button class="btn-hizli-sifirla" data-ogr="${ogr.id}" data-kriter="${k.id}" style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 1em; padding: 2px 5px; display: ${mevcutDeger > 0 ? 'block' : 'none'};" title="Sıfırla">✖</button>
                                        <div class="hizli-stars-container" data-ogr="${ogr.id}" data-kriter="${k.id}" style="display: flex; gap: 1px;">
                                            ${starsHtml}
                                        </div>
                                    </div>
                                </div>`;
                            });
                        }
                    
            panoHtml += `
                    </div>
                </div>
            </div>`;
        });
        panoHtml += '</div>';
        panoAlani.innerHTML = panoHtml;

        document.querySelectorAll('.btn-hizli-panel-ac').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ogrId = String(e.target.getAttribute('data-ogr'));
                const panel = document.getElementById(`hizli-panel-${ogrId}`);
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    e.target.innerText = '➖ Kapat';
                    acikPaneller.add(ogrId); // Sıkı mühürleme
                } else {
                    panel.style.display = 'none';
                    e.target.innerText = '➕ Hızlı Değerlendir';
                    acikPaneller.delete(ogrId);
                }
            });
        });

        document.querySelectorAll('.hizli-star-btn').forEach(star => {
            star.addEventListener('click', async (e) => {
                const val = parseInt(e.target.getAttribute('data-val'));
                const oId = String(e.target.getAttribute('data-ogr'));
                const kId = String(e.target.getAttribute('data-kriter'));
                
                const container = document.querySelector(`.hizli-stars-container[data-ogr="${oId}"][data-kriter="${kId}"]`);
                container.querySelectorAll('.hizli-star-btn').forEach((s, idx) => {
                    s.style.color = (idx < val) ? '#fbbf24' : '#e2e8f0';
                });
                
                document.querySelector(`.btn-hizli-sifirla[data-ogr="${oId}"][data-kriter="${kId}"]`).style.display = 'block';
                
                await db.saveMatrixStatus('davranis_matrisi', oId, kId, val.toString());
                setTimeout(() => { arayuzuGuncelle(); }, 300);
            });
        });

        document.querySelectorAll('.btn-hizli-sifirla').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const oId = String(e.target.getAttribute('data-ogr'));
                const kId = String(e.target.getAttribute('data-kriter'));
                
                const container = document.querySelector(`.hizli-stars-container[data-ogr="${oId}"][data-kriter="${kId}"]`);
                container.querySelectorAll('.hizli-star-btn').forEach(s => {
                    s.style.color = '#e2e8f0';
                });
                
                e.target.style.display = 'none';

                await db.saveMatrixStatus('davranis_matrisi', oId, kId, '0');
                setTimeout(() => { arayuzuGuncelle(); }, 300);
            });
        });
    }
}

function tamSayfaPuanlamayiAc(kriterId, kriterName, ogrenciler, matris) {
    document.getElementById('puanlama-criteria-name').innerText = `⭐ ${kriterName}`;
    const siraliOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    const topluIslemHtml = `
        <div style="background: #fffbeb; border: 2px dashed #f59e0b; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <h4 style="margin: 0 0 5px 0; color: #b45309; font-size: 1.2em;">⚡ Toplu Sınıf Puanlama</h4>
                <p style="margin: 0; font-size: 0.9em; color: #d97706;">Herkesin puanını aynı anda 1 artırıp azaltabilir veya sıfırlayabilirsiniz.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <button id="btn-toplu-arti" class="btn" style="background: #10b981; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.95em; cursor: pointer; box-shadow: 0 4px 0 #059669; transition: transform 0.1s;">➕ Herkese +1 Yıldız</button>
                <button id="btn-toplu-eksi" class="btn" style="background: #f59e0b; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.95em; cursor: pointer; box-shadow: 0 4px 0 #d97706; transition: transform 0.1s;">➖ Herkesten -1 Yıldız</button>
                <button id="btn-toplu-sifirla" class="btn" style="background: #ef4444; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.95em; cursor: pointer; box-shadow: 0 4px 0 #b91c1c; transition: transform 0.1s;">❌ Tümünü Temizle</button>
            </div>
        </div>
    `;
    document.getElementById('toplu-islem-alani').innerHTML = topluIslemHtml;

    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 15px;">';
    
    siraliOgrenciler.forEach((ogr, index) => {
        let mevcutDeger = parseInt(matris.find(m => String(m.ogrId) === String(ogr.id) && String(m.targetId) === String(kriterId))?.deger || '0');
        
        let starsHtml = '';
        for(let i = 1; i <= 5; i++) {
            let renk = i <= mevcutDeger ? '#fbbf24' : '#e2e8f0'; 
            starsHtml += `<span class="star-btn" data-ogr="${ogr.id}" data-kriter="${kriterId}" data-val="${i}" style="cursor:pointer; font-size: 2.2em; color: ${renk}; transition: color 0.2s; user-select: none; -webkit-tap-highlight-color: transparent;">★</span>`;
        }
        
        listeHtml += `
        <div class="puan-satiri" data-ogr="${ogr.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-radius: 12px; background: #f8fafc; border: 2px solid #e2e8f0; transition: background-color 0.3s, border-color 0.3s; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 15px; min-width: 150px;">
                <span style="color: #94a3b8; font-weight: bold; font-size: 1.2em; width: 25px;">${index + 1}.</span>
                <span style="font-weight: bold; font-size: 1.2em; color: #334155;">${ogr.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-sifirla" data-ogr="${ogr.id}" data-kriter="${kriterId}" style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 1.2em; padding: 5px; display: ${mevcutDeger > 0 ? 'block' : 'none'};" title="Puanı Sıfırla">✖</button>
                <div class="stars-container" data-ogr="${ogr.id}" data-val="${mevcutDeger}" style="display: flex; gap: 2px;">
                    ${starsHtml}
                </div>
            </div>
        </div>`;
    });
    
    listeHtml += '</div>';
    document.getElementById('puanlama-student-list').innerHTML = listeHtml;
    
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('view-puanlama').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('btn-toplu-arti').addEventListener('click', async (e) => {
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "⏳ İşleniyor...";
        btn.disabled = true;

        const guncellemeIslemleri = [];
        
        siraliOgrenciler.forEach(ogr => {
            const container = document.querySelector(`.stars-container[data-ogr="${ogr.id}"]`);
            if(container) {
                let currentVal = parseInt(container.getAttribute('data-val') || '0');
                if (currentVal < 5) {
                    currentVal++; 
                    container.setAttribute('data-val', currentVal);
                    
                    container.querySelectorAll('.star-btn').forEach((s, idx) => {
                        s.style.color = (idx < currentVal) ? '#fbbf24' : '#e2e8f0';
                    });
                    
                    const sifirlaBtn = document.querySelector(`.btn-sifirla[data-ogr="${ogr.id}"]`);
                    if(sifirlaBtn) sifirlaBtn.style.display = 'block';

                    const satir = document.querySelector(`.puan-satiri[data-ogr="${ogr.id}"]`);
                    if(satir) {
                        satir.style.borderColor = '#10b981';
                        satir.style.backgroundColor = '#d1fae5';
                        setTimeout(() => {
                            satir.style.borderColor = '#e2e8f0';
                            satir.style.backgroundColor = '#f8fafc';
                        }, 500);
                    }
                    
                    guncellemeIslemleri.push(db.saveMatrixStatus('davranis_matrisi', String(ogr.id), String(kriterId), currentVal.toString()));
                }
            }
        });

        await Promise.all(guncellemeIslemleri); 
        btn.innerText = originalText;
        btn.disabled = false;
    });

    document.getElementById('btn-toplu-eksi').addEventListener('click', async (e) => {
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "⏳ İşleniyor...";
        btn.disabled = true;

        const guncellemeIslemleri = [];
        
        siraliOgrenciler.forEach(ogr => {
            const container = document.querySelector(`.stars-container[data-ogr="${ogr.id}"]`);
            if(container) {
                let currentVal = parseInt(container.getAttribute('data-val') || '0');
                if (currentVal > 0) {
                    currentVal--; 
                    container.setAttribute('data-val', currentVal);
                    
                    container.querySelectorAll('.star-btn').forEach((s, idx) => {
                        s.style.color = (idx < currentVal) ? '#fbbf24' : '#e2e8f0';
                    });
                    
                    const sifirlaBtn = document.querySelector(`.btn-sifirla[data-ogr="${ogr.id}"]`);
                    if(sifirlaBtn && currentVal === 0) sifirlaBtn.style.display = 'none';

                    const satir = document.querySelector(`.puan-satiri[data-ogr="${ogr.id}"]`);
                    if(satir) {
                        satir.style.borderColor = '#f59e0b';
                        satir.style.backgroundColor = '#fef3c7';
                        setTimeout(() => {
                            satir.style.borderColor = '#e2e8f0';
                            satir.style.backgroundColor = '#f8fafc';
                        }, 500);
                    }
                    
                    guncellemeIslemleri.push(db.saveMatrixStatus('davranis_matrisi', String(ogr.id), String(kriterId), currentVal.toString()));
                }
            }
        });

        await Promise.all(guncellemeIslemleri);
        btn.innerText = originalText;
        btn.disabled = false;
    });

    document.getElementById('btn-toplu-sifirla').addEventListener('click', async (e) => {
        if(!confirm("DİKKAT: Tüm sınıfın bu davranıştaki puanları tamamen SIFIRLANACAK! Geri alınamaz. Emin misiniz?")) return;

        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "⏳ Siliniyor...";
        btn.disabled = true;

        const guncellemeIslemleri = [];
        
        siraliOgrenciler.forEach(ogr => {
            const container = document.querySelector(`.stars-container[data-ogr="${ogr.id}"]`);
            if(container) {
                container.setAttribute('data-val', '0');
                container.querySelectorAll('.star-btn').forEach(s => s.style.color = '#e2e8f0');
            }
            
            const sifirlaBtn = document.querySelector(`.btn-sifirla[data-ogr="${ogr.id}"]`);
            if(sifirlaBtn) sifirlaBtn.style.display = 'none';

            const satir = document.querySelector(`.puan-satiri[data-ogr="${ogr.id}"]`);
            if(satir) {
                satir.style.borderColor = '#ef4444';
                satir.style.backgroundColor = '#fee2e2';
                setTimeout(() => {
                    satir.style.borderColor = '#e2e8f0';
                    satir.style.backgroundColor = '#f8fafc';
                }, 500);
            }

            guncellemeIslemleri.push(db.saveMatrixStatus('davranis_matrisi', String(ogr.id), String(kriterId), '0'));
        });

        await Promise.all(guncellemeIslemleri);
        btn.innerText = originalText;
        btn.disabled = false;
    });

    document.querySelectorAll('.star-btn').forEach(star => {
        star.addEventListener('click', async (e) => {
            const val = parseInt(e.target.getAttribute('data-val'));
            const oId = String(e.target.getAttribute('data-ogr'));
            const kId = String(e.target.getAttribute('data-kriter'));
            
            const container = document.querySelector(`.stars-container[data-ogr="${oId}"]`);
            container.setAttribute('data-val', val);
            container.querySelectorAll('.star-btn').forEach((s, idx) => {
                s.style.color = (idx < val) ? '#fbbf24' : '#e2e8f0';
            });
            
            document.querySelector(`.btn-sifirla[data-ogr="${oId}"]`).style.display = 'block';

            const satir = document.querySelector(`.puan-satiri[data-ogr="${oId}"]`);
            satir.style.borderColor = '#10b981';
            satir.style.backgroundColor = '#d1fae5';
            
            await db.saveMatrixStatus('davranis_matrisi', oId, kId, val.toString());
            
            setTimeout(() => {
                satir.style.borderColor = '#e2e8f0';
                satir.style.backgroundColor = '#f8fafc';
            }, 500);
        });
    });

    document.querySelectorAll('.btn-sifirla').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const oId = String(e.target.getAttribute('data-ogr'));
            const kId = String(e.target.getAttribute('data-kriter'));
            
            const container = document.querySelector(`.stars-container[data-ogr="${oId}"]`);
            container.setAttribute('data-val', '0'); 
            container.querySelectorAll('.star-btn').forEach(s => {
                s.style.color = '#e2e8f0';
            });
            
            e.target.style.display = 'none';

            const satir = document.querySelector(`.puan-satiri[data-ogr="${oId}"]`);
            satir.style.borderColor = '#fbbf24';
            satir.style.backgroundColor = '#fef3c7';

            await db.saveMatrixStatus('davranis_matrisi', oId, kId, '0');

            setTimeout(() => {
                satir.style.borderColor = '#e2e8f0';
                satir.style.backgroundColor = '#f8fafc';
            }, 500);
        });
    });
}