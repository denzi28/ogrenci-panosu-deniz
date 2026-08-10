import { db } from '../../js/db.js';

let seciliGorevId = null; 

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Görevler yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('uygulamalar');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Misafirler görevlerin sadece listesini görebilir, puanları göremez.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 id="form-baslik">Yeni Etkileşimli Görev/Oyun Ekle</h3>
            <input type="hidden" id="gorev-id">
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="gorev-ad" placeholder="Görev Adı (Örn: Matematik Testi)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <input type="text" id="gorev-link" placeholder="Dosya Yolu (Örn: oyunlar/test1.html)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            
            <div style="margin-top: 10px;">
                <textarea id="gorev-aciklama" placeholder="Görev Açıklaması (Öğrencilerin ve velilerin göreceği talimatlar...)" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" rows="2"></textarea>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <label style="font-size: 0.85em; color: #666; font-weight: bold;">Başlangıç:</label>
                    <input type="date" id="gorev-baslangic" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <label style="font-size: 0.85em; color: #666; font-weight: bold;">Bitiş:</label>
                    <input type="date" id="gorev-bitis" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                
                <div style="margin-left: auto; display: flex; gap: 5px;">
                    <button id="btn-gorev-kaydet" class="btn btn-primary">Görev Ekle</button>
                    <button id="btn-gorev-iptal" class="btn btn-secondary" style="display:none;">Vazgeç</button>
                </div>
            </div>
            
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 25px;">📋 Eklenen Görevler</h3>
            <div id="gorev-listesi" style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;"></div>
        </div>

        <div class="card" id="takip-karti" style="display: none; border-top: 4px solid var(--success); overflow-x: auto;">
            <h3 id="takip-baslik">Görev Takip Tablosu</h3>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Eğer oyunun bir limiti varsa hücre otomatik olarak ilerleme çubuğuna dönüşür. Limiti olmayan oyunlar düz yeşil olarak işaretlenir.</p>
            <div id="gorev-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('uygulamalar'));
        await db.toggleModuleVisibility('uygulamalar', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-gorev-kaydet').addEventListener('click', async () => {
        const id = document.getElementById('gorev-id').value;
        const ad = document.getElementById('gorev-ad').value.trim();
        const link = document.getElementById('gorev-link').value.trim();
        const aciklama = document.getElementById('gorev-aciklama').value.trim();
        const baslangic = document.getElementById('gorev-baslangic').value;
        const bitis = document.getElementById('gorev-bitis').value;

        if (ad && link) {
            const btn = document.getElementById('btn-gorev-kaydet');
            btn.disabled = true; btn.innerText = "Kaydediliyor...";
            
            const veri = { ad, link, aciklama, baslangic, bitis };

            if (id) {
                await db.update('uygulama_kalemleri', id, veri);
            } else {
                await db.add('uygulama_kalemleri', veri);
            }
            
            formuTemizle();
            await arayuzuGuncelle();
        } else {
            alert("Lütfen ad ve link giriniz.");
        }
    });

    document.getElementById('btn-gorev-iptal').addEventListener('click', formuTemizle);

    await arayuzuGuncelle();
}

function formuTemizle() {
    document.getElementById('gorev-id').value = '';
    document.getElementById('gorev-ad').value = '';
    document.getElementById('gorev-link').value = '';
    document.getElementById('gorev-aciklama').value = '';
    document.getElementById('gorev-baslangic').value = '';
    document.getElementById('gorev-bitis').value = '';
    
    document.getElementById('form-baslik').innerText = "Yeni Etkileşimli Görev/Oyun Ekle";
    
    const btnKaydet = document.getElementById('btn-gorev-kaydet');
    btnKaydet.disabled = false;
    btnKaydet.innerText = "Görev Ekle";
    
    document.getElementById('btn-gorev-iptal').style.display = 'none';
}

function tarihFormatla(tarihStr) {
    if (!tarihStr) return 'Belirtilmedi';
    return tarihStr.split('-').reverse().join('.');
}

async function arayuzuGuncelle() {
    const kalemler = await db.getAll('uygulama_kalemleri');
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const matris = await db.getAll('uygulama_matrisi'); 

    const toplamOgrenciSayisi = ogrenciler.length;
    let listHtml = '';
    
    if (kalemler.length === 0) {
        listHtml = '<p style="color:#888;">Henüz görev eklenmemiş.</p>';
    } else {
        kalemler.forEach(k => {
            const isSelected = k.id === seciliGorevId;
            const bgRenk = isSelected ? '#e8f4fd' : '#f9f9f9';
            const borderStil = isSelected ? 'border: 2px solid var(--primary);' : 'border: 1px solid #ddd;';

            // BU GÖREVİ TAMAMLAYAN ÖĞRENCİ SAYISINI HESAPLIYORUZ
            const tamamlayanSayisi = matris.filter(m => m.targetId === k.id && m.deger && m.deger !== '').length;
            const tamamlandiMi = (tamamlayanSayisi === toplamOgrenciSayisi && toplamOgrenciSayisi > 0);
            
            // KATILIM ROZETİ (Tümü tamamladıysa yeşil, eksik varsa gri)
            const rozetBg = tamamlandiMi ? '#d1fae5' : '#e2e8f0';
            const rozetText = tamamlandiMi ? '#065f46' : '#475569';
            const katilimRozeti = `<span style="display: inline-block; margin-top: 8px; background: ${rozetBg}; color: ${rozetText}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">📊 Katılım: ${tamamlayanSayisi} / ${toplamOgrenciSayisi} Öğrenci</span>`;

            listHtml += `
                <div style="background: ${bgRenk}; padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; ${borderStil} transition: all 0.2s; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1; min-width: 200px;">
                        <span style="font-weight: bold; color: var(--primary); font-size: 1.1em;">${k.ad}</span><br>
                        ${k.aciklama ? `<div style="font-size: 0.85em; color: #444; margin: 4px 0; font-style: italic;">📝 ${k.aciklama}</div>` : ''}
                        <span style="font-size: 0.8em; color: #888;">Yol: ${k.link}</span><br>
                        <span style="font-size: 0.8em; color: #555;">📅 Tarih: ${tarihFormatla(k.baslangic)} - ${tarihFormatla(k.bitis)}</span><br>
                        ${katilimRozeti}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 5px;">
                        <button class="btn btn-primary btn-incele" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.85em; font-weight: bold;">
                            ${isSelected ? '👀 İnceleniyor' : '🔍 İncele'}
                        </button>
                        <button class="btn btn-secondary btn-gorev-duzenle" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.85em;">Düzenle</button>
                        <button class="btn btn-danger btn-gorev-sil" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.85em;">Sil</button>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('gorev-listesi').innerHTML = listHtml;

    document.querySelectorAll('.btn-incele').forEach(btn => {
        btn.addEventListener('click', (e) => {
            seciliGorevId = e.target.getAttribute('data-id');
            arayuzuGuncelle();
            setTimeout(() => {
                document.getElementById('takip-karti').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    });

    document.querySelectorAll('.btn-gorev-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const gorev = kalemler.find(k => k.id === id);
            
            if (gorev) {
                document.getElementById('gorev-id').value = gorev.id;
                document.getElementById('gorev-ad').value = gorev.ad;
                document.getElementById('gorev-link').value = gorev.link;
                document.getElementById('gorev-aciklama').value = gorev.aciklama || '';
                document.getElementById('gorev-baslangic').value = gorev.baslangic || '';
                document.getElementById('gorev-bitis').value = gorev.bitis || '';
                
                document.getElementById('form-baslik').innerText = "Görevi Düzenle";
                document.getElementById('btn-gorev-kaydet').innerText = "Görevi Güncelle";
                document.getElementById('btn-gorev-iptal').style.display = 'inline-block';
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.btn-gorev-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu görevi silmek istediğinize emin misiniz? Öğrenci sonuçları da kaybolur.")) {
                const silinecekId = e.target.getAttribute('data-id');
                if(seciliGorevId === silinecekId) seciliGorevId = null; 
                e.target.innerText = "...";
                await db.delete('uygulama_kalemleri', silinecekId);
                await arayuzuGuncelle();
            }
        });
    });

    const takipKarti = document.getElementById('takip-karti');
    
    if (!seciliGorevId) {
        takipKarti.style.display = 'none';
        return;
    }

    const aktifGorev = kalemler.find(k => k.id === seciliGorevId);
    if (!aktifGorev) {
        seciliGorevId = null;
        takipKarti.style.display = 'none';
        return;
    }

    takipKarti.style.display = 'block'; 
    document.getElementById('takip-baslik').innerText = `📊 Takip Tablosu: ${aktifGorev.ad}`;

    const tabloOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 400px; font-size: 0.95em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 10px; width: 40px; text-align: center;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Öğrenci Adı Soyadı</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 220px; color: var(--primary);">Sonuç / Puan</th>
                </tr>
            </thead>
            <tbody>
    `;

    tabloOgrenciler.forEach((ogr, index) => {
        let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === aktifGorev.id)?.deger || '';
        let islemGorduMu = hucreDegeri !== '';
        
        let bgStil = 'transparent';
        
        if (islemGorduMu) {
            // Eğer değer içinde '/' varsa (Oyun limit gönderdiyse) İlerleme Çubuğu Çiz
            if (hucreDegeri.includes('/')) {
                let parcalar = hucreDegeri.split('/');
                let puan = parseInt(parcalar[0]);
                let limit = parseInt(parcalar[1]);
                
                if (!isNaN(puan) && !isNaN(limit) && limit > 0) {
                    let yuzde = Math.min((puan / limit) * 100, 100);
                    bgStil = `linear-gradient(90deg, #d1fae5 ${yuzde}%, #ffffff ${yuzde}%)`;
                } else {
                    bgStil = '#e6ffed';
                }
            } else {
                // Limit yoksa sadece yeşil yap
                bgStil = '#e6ffed';
            }
        }
        
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #555;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #333;">${ogr.name}</td>
            <td style="border: 1px solid #ddd; padding: 0;">
                <div style="display: flex; align-items: center; width: 100%; height: 100%; background: ${bgStil};">
                    <input type="text" class="hucre-input" data-ogr="${ogr.id}" data-gorev="${aktifGorev.id}" value="${hucreDegeri}" placeholder="Bekleniyor..."
                           style="flex: 1; padding: 12px; border: none; text-align: center; box-sizing: border-box; outline: none; background: transparent; font-weight: bold; color: ${islemGorduMu ? 'var(--success)' : '#888'};">
                    ${islemGorduMu ? `<button class="btn btn-danger btn-temizle" data-ogr="${ogr.id}" data-gorev="${aktifGorev.id}" style="margin-right: 8px; padding: 4px 8px; font-size: 0.75em;" title="Sıfırla">Temizle</button>` : ''}
                </div>
            </td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('gorev-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const ogrId = e.target.getAttribute('data-ogr');
            const gorevId = e.target.getAttribute('data-gorev');
            const deger = e.target.value.trim();
            
            e.target.parentElement.style.backgroundColor = '#fff3cd'; 
            await db.saveMatrixStatus('uygulama_matrisi', ogrId, gorevId, deger);
            
            setTimeout(() => { arayuzuGuncelle(); }, 300);
        });
    });

    document.querySelectorAll('.btn-temizle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu öğrencinin puanını sıfırlamak istediğinize emin misiniz?")) {
                const ogrId = e.target.getAttribute('data-ogr');
                const gorevId = e.target.getAttribute('data-gorev');
                
                e.target.innerText = "...";
                await db.saveMatrixStatus('uygulama_matrisi', ogrId, gorevId, ''); 
                
                setTimeout(() => { arayuzuGuncelle(); }, 300);
            }
        });
    });
}