import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div style="padding: 20px; color: #64748b;">⏳ Modern yedekleme paneli yükleniyor...</div>';

    const isModuleVisible = await db.getModuleVisibility('yedekleme');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <!-- ÜST AYAR ÇUBUĞU -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                    <span style="color: #64748b;">👁️</span> Modül Görünürlüğü
                </h3>
                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Menüdeki "Sistem Yedekleme" butonunu misafirlerden (velilerden) gizleyebilirsiniz.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}" style="border-radius: 8px; font-weight: 500; transition: all 0.2s;">${btnText}</button>
            </div>
        </div>

        <!-- ANA YÖNETİM KARTLARI -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin-bottom: 25px;">
            
            <!-- YEDEK AL KARTI -->
            <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; padding: 30px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'; this.style.borderColor='#cbd5e1';" onmouseout="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'; this.style.borderColor='#e2e8f0';">
                <div>
                    <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </div>
                    <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 1.25em;">Sistemi Yedekle</h3>
                    <p style="margin: 0 0 25px 0; color: #64748b; font-size: 0.95em; line-height: 1.6;">Veritabanınızdaki tüm modülleri otomatik olarak tespit edip tek bir <strong>.json</strong> dosyası olarak indirir.</p>
                </div>
                <button id="btn-yedek-al" style="width: 100%; background: #2563eb; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1d4ed8';" onmouseout="this.style.background='#2563eb';">
                    Buluttan Cihaza İndir
                </button>
            </div>

            <!-- GERİ YÜKLE KARTI -->
            <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; padding: 30px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'; this.style.borderColor='#cbd5e1';" onmouseout="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'; this.style.borderColor='#e2e8f0';">
                <div>
                    <div style="width: 48px; height: 48px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                    </div>
                    <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 1.25em;">Sistemi Kurtar / Geri Yükle</h3>
                    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.95em; line-height: 1.6;">Daha önceden indirdiğiniz bir yedek dosyasını yükleyerek sistemi eski haline döndürün. Orijinal kayıt kimlikleri (ID eşleşmeleri) korunur.</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <label id="dosya-sec-label" for="yedek-dosya" style="display: block; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.2s;" onmouseover="this.style.borderColor='#94a3b8'; this.style.background='#f1f5f9';" onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc';">
                        <span id="dosya-yazi" style="font-size: 0.9em; color: #475569; font-weight: 500;">📁 Dosya Seç (.json)</span>
                        <input type="file" id="yedek-dosya" accept=".json" style="display: none;">
                    </label>
                    
                    <button id="btn-yedek-yukle" disabled style="width: 100%; background: #e2e8f0; color: #94a3b8; border: none; padding: 14px; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: not-allowed; transition: all 0.2s;">
                        Sistemi Geri Yükle
                    </button>
                </div>
            </div>
        </div>

        <!-- GELİŞMİŞ VERİTABANI YÖNETİCİSİ -->
        <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 1.3em; display: flex; align-items: center; gap: 8px;">
                        <span>🗄️</span> Gelişmiş Veritabanı Yöneticisi (Düzenleyici)
                    </h3>
                    <p style="margin: 0; color: #ef4444; font-size: 0.9em;"><strong>DİKKAT:</strong> Burada yaptığınız her değişiklik veritabanına anında işlenir. Yanlış bir tabloyu silmemeye dikkat edin!</p>
                </div>
                
                <div style="display: flex; gap: 10px; width: 100%; max-width: 400px;">
                    <select id="koleksiyon-secim" style="flex: 1; padding: 10px 15px; border-radius: 8px; border: 2px solid #cbd5e1; outline: none; background: #f8fafc; font-weight: bold; color: #334155; cursor: pointer;">
                        <option value="">-- Tablo Seçin --</option>
                    </select>
                    <button id="btn-tablo-getir" style="background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#0f172a';" onmouseout="this.style.background='#334155';">
                        Verileri Getir
                    </button>
                </div>
            </div>

            <!-- VERİLERİN LİSTELENECEĞİ ALAN -->
            <div id="veritabani-sonuclar" style="display: flex; flex-direction: column; gap: 15px; min-height: 100px;">
                <div style="text-align: center; color: #94a3b8; padding: 30px; font-style: italic;">
                    Veritabanındaki kayıtları görmek ve düzenlemek için yukarıdan bir tablo seçip "Verileri Getir" butonuna tıklayın.
                </div>
            </div>
        </div>
    `;

    // 0. MODÜL GÖRÜNÜRLÜĞÜ 
    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('yedekleme'));
        await db.toggleModuleVisibility('yedekleme', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    // --- VERİTABANI YÖNETİCİSİ İŞLEMLERİ ---
    const aktifKoleksiyonlar = await db.getCollectionList();
    const selectBox = document.getElementById('koleksiyon-secim');
    aktifKoleksiyonlar.sort().forEach(koleksiyonAdi => {
        selectBox.innerHTML += `<option value="${koleksiyonAdi}">${koleksiyonAdi}</option>`;
    });

    document.getElementById('btn-tablo-getir').addEventListener('click', async () => {
        const seciliTablo = selectBox.value;
        if (!seciliTablo) return alert("Lütfen önce listeden bir tablo seçin.");

        const sonucAlani = document.getElementById('veritabani-sonuclar');
        sonucAlani.innerHTML = '<div style="text-align:center; padding:20px; color:#3b82f6; font-weight:bold;">⏳ Veriler buluttan çekiliyor...</div>';

        const veriler = await db.getAll(seciliTablo);

        if(veriler.length === 0) {
            sonucAlani.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b; font-style:italic;">Bu tabloda (${seciliTablo}) henüz hiçbir kayıt bulunmuyor.</div>`;
            return;
        }

        // 🌟 YENİ: TABLODAKİ TÜM BENZERSİZ BAŞLIKLARI TOPLA VE ALFABETİK SIRALA
        const tumAnahtarlar = new Set();
        veriler.forEach(v => Object.keys(v).forEach(k => { 
            if(k !== 'id') tumAnahtarlar.add(k); 
        }));
        const siraliAnahtarlar = Array.from(tumAnahtarlar).sort();

        let html = `<div style="margin-bottom: 10px; font-weight: bold; color: #10b981;">✅ Toplam ${veriler.length} kayıt bulundu.</div>`;

        veriler.forEach((veri) => {
            html += `
            <div class="db-kayit-karti" style="border: 1px solid #cbd5e1; padding: 20px; border-radius: 12px; background: #f8fafc; position: relative;">
                <div style="font-size: 0.75em; color: #94a3b8; margin-bottom: 15px; font-family: monospace;">Kayıt ID: ${veri.id}</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">`;
            
            // Sıralı anahtarlar üzerinden dönerek hizalamayı sabitliyoruz
            siraliAnahtarlar.forEach(key => {
                let val = veri[key] !== undefined ? veri[key] : ''; // Eğer alanda veri yoksa boş bırak
                let valStr = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val; 
                
                html += `
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85em; font-weight: bold; color: #334155;">${key}</label>
                        <input type="text" data-id="${veri.id}" data-key="${key}" value='${valStr}' 
                            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-family: ${key.includes('sifre')||key.includes('id') ? 'monospace' : 'inherit'};"
                            onfocus="this.style.borderColor='#3b82f6'; this.style.outline='none'; this.style.background='#eff6ff';"
                            onblur="this.style.borderColor='#cbd5e1'; this.style.background='white';">
                    </div>
                `;
            });
            
            html += `</div>
                <div style="margin-top: 20px; display: flex; gap: 10px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                    <button class="btn-db-guncelle" data-tablo="${seciliTablo}" data-id="${veri.id}" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#059669';" onmouseout="this.style.background='#10b981';">Kaydet</button>
                    <button class="btn-db-sil" data-tablo="${seciliTablo}" data-id="${veri.id}" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#dc2626';" onmouseout="this.style.background='#ef4444';">Bu Kaydı Sil</button>
                </div>
            </div>`;
        });

        sonucAlani.innerHTML = html;

        // KAYDET BUTONU OLAYI
        document.querySelectorAll('.btn-db-guncelle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const tablo = e.target.getAttribute('data-tablo');
                const kart = e.target.closest('.db-kayit-karti');
                const inputs = kart.querySelectorAll('input');
                
                let updatedData = {};
                inputs.forEach(input => {
                    const key = input.getAttribute('data-key');
                    let val = input.value;
                    
                    // Boş bırakılan alanları silmek yerine veritabanından güncellemeden önce atla veya boş bırak
                    if(val === 'true') val = true;
                    else if(val === 'false') val = false;
                    else if(val === 'null') val = null;
                    else if(!isNaN(val) && val.trim() !== '' && key !== 'tcno' && key !== 'okulno' && key !== 'password') {
                        val = Number(val);
                    }

                    updatedData[key] = val;
                });

                e.target.innerText = '⏳ Kaydediliyor...';
                e.target.disabled = true;

                try {
                    await db.update(tablo, id, updatedData);
                    e.target.innerText = '✅ Başarılı';
                    e.target.style.background = '#3b82f6';
                    setTimeout(() => {
                        e.target.innerText = 'Kaydet';
                        e.target.style.background = '#10b981';
                        e.target.disabled = false;
                    }, 2000);
                } catch(err) {
                    alert("Kayıt güncellenemedi!");
                    e.target.innerText = 'Kaydet';
                    e.target.disabled = false;
                }
            });
        });

        // SİL BUTONU OLAYI
        document.querySelectorAll('.btn-db-sil').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('DİKKAT: Bu kaydı tamamen silmek istediğinize emin misiniz? Geri dönüşü yoktur!')) {
                    const id = e.target.getAttribute('data-id');
                    const tablo = e.target.getAttribute('data-tablo');
                    
                    e.target.innerText = '⏳ Siliniyor...';
                    e.target.disabled = true;
                    
                    try {
                        await db.delete(tablo, id);
                        const kart = e.target.closest('.db-kayit-karti');
                        kart.style.opacity = '0.5';
                        setTimeout(() => kart.remove(), 500);
                    } catch(err) {
                        alert("Kayıt silinemedi!");
                        e.target.innerText = 'Bu Kaydı Sil';
                        e.target.disabled = false;
                    }
                }
            });
        });
    });

    // 1. YEDEK ALMA İŞLEMİ
    document.getElementById('btn-yedek-al').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerText = "⏳ Toplanıyor...";
        btn.disabled = true;

        try {
            if (aktifKoleksiyonlar.length === 0) {
                alert("Sistemde henüz yedeklenecek bir tablo bulunamadı!");
                btn.innerText = "Buluttan Cihaza İndir";
                btn.disabled = false;
                return;
            }

            let yedekVerisi = {
                olusturulmaTarihi: new Date().toISOString(),
                bulunanTabloSayisi: aktifKoleksiyonlar.length,
                veriler: {}
            };

            for (let i = 0; i < aktifKoleksiyonlar.length; i++) {
                const koleksiyon = aktifKoleksiyonlar[i];
                const veriler = await db.getAll(koleksiyon);
                if (veriler && veriler.length > 0) {
                    yedekVerisi.veriler[koleksiyon] = veriler;
                }
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(yedekVerisi, null, 2));
            const indirmeLinki = document.createElement('a');
            const tarih = new Date().toISOString().split('T')[0];
            indirmeLinki.setAttribute("href", dataStr);
            indirmeLinki.setAttribute("download", `Sinif_Akilli_Yedek_${tarih}.json`);
            document.body.appendChild(indirmeLinki);
            indirmeLinki.click();
            indirmeLinki.remove();

            btn.innerText = `✅ İndirildi (${aktifKoleksiyonlar.length} Tablo)`;
            btn.style.background = "#10b981"; 
            
            setTimeout(() => {
                btn.innerText = "Buluttan Cihaza İndir";
                btn.style.background = "#2563eb";
                btn.disabled = false;
            }, 5000);

        } catch (error) {
            console.error(error);
            alert("Yedekleme sırasında bir hata oluştu!");
            btn.innerText = "❌ Hata. Tekrar Dene";
            btn.disabled = false;
        }
    });

    // 2. YEDEKTEN GERİ YÜKLEME İŞLEMİ
    const fileInput = document.getElementById('yedek-dosya');
    const btnYukle = document.getElementById('btn-yedek-yukle');
    const dosyaYazi = document.getElementById('dosya-yazi');
    const dosyaLabel = document.getElementById('dosya-sec-label');

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const dosyaAdi = fileInput.files[0].name;
            dosyaYazi.innerHTML = `<span style="color:#0ea5e9;">📄 ${dosyaAdi}</span>`;
            dosyaLabel.style.borderColor = "#0ea5e9";
            dosyaLabel.style.background = "#f0f9ff";

            btnYukle.disabled = false;
            btnYukle.style.background = "#ef4444"; 
            btnYukle.style.color = "white";
            btnYukle.style.cursor = "pointer";
            btnYukle.onmouseover = function() { this.style.background = '#dc2626'; };
            btnYukle.onmouseout = function() { this.style.background = '#ef4444'; };
        } else {
            dosyaYazi.innerHTML = `📁 Dosya Seç (.json)`;
            dosyaLabel.style.borderColor = "#cbd5e1";
            dosyaLabel.style.background = "#f8fafc";

            btnYukle.disabled = true;
            btnYukle.style.background = "#e2e8f0";
            btnYukle.style.color = "#94a3b8";
            btnYukle.style.cursor = "not-allowed";
        }
    });

    btnYukle.addEventListener('click', async () => {
        const dosya = fileInput.files[0];
        if (!dosya) return;

        if(!confirm("DİKKAT! Bu işlem mevcut bulut sistemindeki verileri, seçtiğiniz dosyadaki orijinal verilerle değiştirecektir. Emin misiniz?")) return;

        btnYukle.innerText = "⏳ Veriler Kurtarılıyor...";
        btnYukle.disabled = true;
        btnYukle.style.background = "#94a3b8";

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const yuklenenYedek = JSON.parse(e.target.result);
                if (!yuklenenYedek.veriler) throw new Error("Geçersiz yedek formatı!");

                let kurtarilanKayitSayisi = 0;
                let kurtarilanTabloSayisi = 0;

                for (const [koleksiyonAdi, kayitlar] of Object.entries(yuklenenYedek.veriler)) {
                    kurtarilanTabloSayisi++;
                    for (const kayit of kayitlar) {
                        const { id, ...gercekVeri } = kayit; 
                        if (db.setWithId) await db.setWithId(koleksiyonAdi, id, gercekVeri);
                        else await db.add(koleksiyonAdi, gercekVeri);
                        kurtarilanKayitSayisi++;
                    }
                }

                alert(`🎉 Kurtarma Başarılı! Toplam ${kurtarilanTabloSayisi} tablodaki ${kurtarilanKayitSayisi} kayıt buluta aktarıldı. Sayfa yenileniyor.`);
                window.location.reload();
            } catch (error) {
                alert("Dosya yüklenirken hata oluştu.");
                btnYukle.innerText = "Sistemi Geri Yükle";
                btnYukle.style.background = "#ef4444";
                btnYukle.disabled = false;
            }
        };
        reader.readAsText(dosya);
    });
}