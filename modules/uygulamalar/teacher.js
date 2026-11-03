import { db } from '../../js/db.js';

let seciliGorevId = null; 
let aktifGorevSiralama = 'yeni'; // Varsayılan sıralama

// SINIF MODU İÇİN DEĞİŞKENLER
let sinifModuAktif = false;
let sinifModuTipi = 'tekli'; // 'tekli' veya 'ciftli'
let gercekOgretmenVerisi = null; // Öğretmen hesabını yedeklemek için
let sinifModuAktifGorevLink = null;
let sinifModuAktifGorevId = null;

// Çiftli mod için seçilen öğrenciler ve taraf durumları
let ciftliSolOgrenci = null;
let ciftliSagOgrenci = null;

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Görevler hızla yükleniyor...</p></div>';

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
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px;">
                <h3 style="margin: 0; color: #334155;">📋 Eklenen Görevler <span style="font-size: 0.6em; color: #888; font-weight: normal;">(Test etmek için ikonlara tıklayın)</span></h3>
                
                <select id="siralama-secim" style="padding: 6px 12px; border-radius: 6px; border: 2px solid #cbd5e1; font-weight: bold; color: #475569; outline: none; cursor: pointer; background: #f8fafc;">
                    <option value="yeni" ${aktifGorevSiralama === 'yeni' ? 'selected' : ''}>🔽 Önce Yeni Eklenenler</option>
                    <option value="varsayilan" ${aktifGorevSiralama === 'varsayilan' ? 'selected' : ''}>🔼 Eklenme Sırası (Eskiler Üstte)</option>
                    <option value="alfabetik" ${aktifGorevSiralama === 'alfabetik' ? 'selected' : ''}>🔤 Alfabetik (A-Z)</option>
                    <option value="yayinda" ${aktifGorevSiralama === 'yayinda' ? 'selected' : ''}>🟢 Önce Yayında Olanlar</option>
                </select>
            </div>
            
            <div id="gorev-listesi" style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;"></div>
        </div>

        <div class="card" id="takip-karti" style="display: none; border-top: 4px solid var(--success); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <h3 id="takip-baslik" style="margin: 0;">Görev Takip Tablosu</h3>
                <button id="btn-yazdir" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9em; font-weight: bold; background-color: #0284c7; border: none; display: none;">🖨️ Yazdır / PDF Al</button>
            </div>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Eğer oyunun bir limiti varsa hücre otomatik olarak ilerleme çubuğuna dönüşür. Limiti olmayan oyunlar düz yeşil olarak işaretlenir. <strong>Puanları değiştirmek için doğrudan tablodaki ilgili hücreye tıklayıp yazabilirsiniz.</strong></p>
            <div id="gorev-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    container.innerHTML += `
        <!-- NORMAL ÖĞRETMEN TEST MODALI -->
        <div id="oyun-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; flex-direction: column;">
            <div style="padding: 10px 20px; background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--primary);">
                <h3 style="margin: 0; color: var(--primary);">🛠️ Öğretmen Test Ekranı</h3>
                <button id="btn-oyun-kapat" class="btn btn-danger" style="padding: 8px 15px; font-weight: bold; border: none; border-radius: 5px; cursor: pointer;">Kapat</button>
            </div>
            <iframe id="oyun-iframe" style="width: 100%; flex: 1; border: none; background: #f0fdf4;"></iframe>
        </div>

        <!-- 🌟 SINIF MODU MODALI -->
        <div id="sinif-modu-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f8fafc; z-index: 10000; flex-direction: column; overflow-y: auto;">
            
            <div style="padding: 15px 20px; background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid var(--success); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 10001;">
                <h2 id="sinif-modu-baslik" style="margin: 0; color: var(--success); display: flex; align-items: center; gap: 10px;">
                    🏫 Sınıf Modu
                </h2>
                <button id="btn-sinif-modu-cikis" class="btn btn-danger" style="padding: 10px 25px; font-size: 1.1em; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🚪 Öğretmen Paneline Dön</button>
            </div>

            <!-- MOD SEÇİM EKRANI -->
            <div id="sinif-modu-secim-ekrani" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 30px; text-align: center;">
                <h2 style="color: #1e293b; font-size: 2.2em; margin-bottom: 10px;">Oynatma Modunu Seçin</h2>
                <p style="color: #64748b; font-size: 1.2em; margin-bottom: 40px;">Tahtada tek bir öğrenci mi oynasın, yoksa ekran ikiye bölünerek iki öğrenci bağımsız yarışsın mı?</p>
                
                <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content: center;">
                    <button id="btn-mod-tekli" style="background: white; border: 3px solid #3b82f6; border-radius: 20px; padding: 30px 40px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 15px; box-shadow: 0 10px 25px rgba(59,130,246,0.15); transition: 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <span style="font-size: 3.5em;">👤</span>
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.5em;">Tekli Sınıf Modu</h3>
                            <p style="margin: 0; color: #64748b; font-size: 1em;">Tek öğrenci tam ekran oynar.</p>
                        </div>
                    </button>

                    <button id="btn-mod-ciftli" style="background: white; border: 3px solid #10b981; border-radius: 20px; padding: 30px 40px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 15px; box-shadow: 0 10px 25px rgba(16,185,129,0.15); transition: 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <span style="font-size: 3.5em;">👥</span>
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.5em;">Çiftli Sınıf Modu (2'li)</h3>
                            <p style="margin: 0; color: #64748b; font-size: 1em;">Ekran ikiye bölünür, herkes bağımsız oynar.</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- ÖĞRENCİ LİSTELEME EKRANI (Tekli Mod İçin) -->
            <div id="sinif-modu-liste-ekrani" style="display: none; flex: 1; padding: 30px 20px; text-align: center;">
                <h2 style="color: #334155; margin-bottom: 10px; font-size: 2em;">👋 Tahtaya Kim Geliyor?</h2>
                <p style="color: #64748b; font-size: 1.2em; margin-bottom: 30px;">Oyuna başlamak için kendi ismine tıkla.</p>
                <div id="sinif-modu-ogrenciler" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 50px;"></div>
            </div>

            <!-- TEKLİ OYUN EKRANI -->
            <div id="sinif-modu-oyun-ekrani" style="display: none; flex: 1; flex-direction: column;">
                 <div style="background: #1e293b; color: #f8fafc; padding: 12px 25px; display: flex; justify-content: space-between; align-items: center;">
                     <span id="sinif-modu-oynayan-isim" style="font-weight: bold; font-size: 1.3em;">🎮 Oynayan: ...</span>
                     <button id="btn-sinif-oyun-iptal" class="btn" style="background: #ef4444; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">❌ Oyundan Çık (Vazgeç)</button>
                 </div>
                 <iframe id="sinif-oyun-iframe" style="width: 100%; height: 100%; border: none; flex: 1; background: #fff;"></iframe>
            </div>

            <!-- ÇİFTLİ (BÖLÜNMÜŞ) BAĞIMSIZ OYUN EKRANI -->
            <div id="sinif-modu-ciftli-oyun-ekrani" style="display: none; flex: 1; flex-direction: column;">
                 <div style="background: #1e293b; color: #f8fafc; padding: 12px 25px; display: flex; justify-content: space-between; align-items: center;">
                     <span style="font-weight: bold; font-size: 1.2em;">⚔️ Çiftli Sınıf Modu (Bağımsız Yarışma)</span>
                     <button id="btn-ciftli-oyun-iptal" class="btn" style="background: #ef4444; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">❌ Çiftli Modu Kapat</button>
                 </div>
                 
                 <div style="flex: 1; display: flex; width: 100%; height: 100%; background: #e2e8f0; gap: 4px;">
                     <!-- Sol Taraf -->
                     <div style="flex: 1; display: flex; flex-direction: column; background: #ffffff;" id="ciftli-sol-kapsayici">
                         <div style="background: #3b82f6; color: white; padding: 10px 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                             <span id="ciftli-sol-baslik">Sol Taraf: Oyuncu Seçilmedi</span>
                             <button id="btn-sol-sec" class="btn" style="background: white; color: #3b82f6; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold; cursor: pointer;">👤 Öğrenci Seç</button>
                         </div>
                         <div id="ciftli-sol-icerik" style="flex: 1; display: flex; flex-direction: column;">
                             <iframe id="ciftli-sol-iframe" style="width: 100%; flex: 1; border: none; display: none;"></iframe>
                             <div id="ciftli-sol-liste" style="flex: 1; padding: 15px; overflow-y: auto; text-align: center; background: #f8fafc;">
                                 <p style="color: #64748b; font-weight: bold; margin-bottom: 15px;">Sol taraf için oynamak isteyecek öğrenciyi seçin:</p>
                                 <div class="sol-ogrenci-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;"></div>
                             </div>
                         </div>
                     </div>

                     <!-- Sağ Taraf -->
                     <div style="flex: 1; display: flex; flex-direction: column; background: #ffffff;" id="ciftli-sag-kapsayici">
                         <div style="background: #10b981; color: white; padding: 10px 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                             <span id="ciftli-sag-baslik">Sağ Taraf: Oyuncu Seçilmedi</span>
                             <button id="btn-sag-sec" class="btn" style="background: white; color: #10b981; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold; cursor: pointer;">👤 Öğrenci Seç</button>
                         </div>
                         <div id="ciftli-sag-icerik" style="flex: 1; display: flex; flex-direction: column;">
                             <iframe id="ciftli-sag-iframe" style="width: 100%; flex: 1; border: none; display: none;"></iframe>
                             <div id="ciftli-sag-liste" style="flex: 1; padding: 15px; overflow-y: auto; text-align: center; background: #f8fafc;">
                                 <p style="color: #64748b; font-weight: bold; margin-bottom: 15px;">Sağ taraf için oynamak isteyecek öğrenciyi seçin:</p>
                                 <div class="sag-ogrenci-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;"></div>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>

        </div>
    `;

    document.getElementById('siralama-secim').addEventListener('change', (e) => {
        aktifGorevSiralama = e.target.value;
        arayuzuGuncelle();
    });

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
            if (id) await db.update('uygulama_kalemleri', id, veri);
            else {
                await db.add('uygulama_kalemleri', veri);
                aktifGorevSiralama = 'yeni'; 
                document.getElementById('siralama-secim').value = 'yeni';
            }
            formuTemizle();
            await arayuzuGuncelle();
        } else alert("Lütfen ad ve link giriniz.");
    });

    document.getElementById('btn-gorev-iptal').addEventListener('click', formuTemizle);

    document.getElementById('btn-oyun-kapat').addEventListener('click', () => {
        document.getElementById('oyun-iframe').src = '';
        document.getElementById('oyun-modal').style.display = 'none';
    });

    // MOD SEÇİMİ
    document.getElementById('btn-mod-tekli').addEventListener('click', () => {
        sinifModuTipi = 'tekli';
        document.getElementById('sinif-modu-secim-ekrani').style.display = 'none';
        document.getElementById('sinif-modu-liste-ekrani').style.display = 'block';
        sinifModuArayuzunuCiz();
    });

    document.getElementById('btn-mod-ciftli').addEventListener('click', () => {
        sinifModuTipi = 'ciftli';
        ciftliSolOgrenci = null;
        ciftliSagOgrenci = null;
        document.getElementById('sinif-modu-secim-ekrani').style.display = 'none';
        document.getElementById('sinif-modu-ciftli-oyun-ekrani').style.display = 'flex';
        ciftliEkranlariGuncelle();
    });

    // Çiftli mod yan panel öğrenci değiştirme butonları
    document.getElementById('btn-sol-sec').addEventListener('click', () => {
        ciftliSolOgrenci = null;
        document.getElementById('ciftli-sol-iframe').src = '';
        document.getElementById('ciftli-sol-iframe').style.display = 'none';
        document.getElementById('ciftli-sol-liste').style.display = 'block';
        document.getElementById('ciftli-sol-baslik').innerText = "Sol Taraf: Oyuncu Seçilmedi";
        ciftliEkranlariGuncelle();
    });

    document.getElementById('btn-sag-sec').addEventListener('click', () => {
        ciftliSagOgrenci = null;
        document.getElementById('ciftli-sag-iframe').src = '';
        document.getElementById('ciftli-sag-iframe').style.display = 'none';
        document.getElementById('ciftli-sag-liste').style.display = 'block';
        document.getElementById('ciftli-sag-baslik').innerText = "Sağ Taraf: Oyuncu Seçilmedi";
        ciftliEkranlariGuncelle();
    });

    // PUAN KAYDETME DİNLEYİCİSİ
    if (!window.ogretmenOyunDinleyiciEklendi) {
        window.addEventListener('message', async (event) => {
            if (event.data && event.data.islem === 'gorev_bitti') {
                
                if (sinifModuAktif) {
                    let kaydedilecekPuan = '✔️'; 
                    if (event.data.deger !== undefined) {
                        kaydedilecekPuan = event.data.deger;
                    } else if (event.data.puan !== undefined) {
                        if (event.data.limit !== undefined) {
                            kaydedilecekPuan = `${event.data.puan}/${event.data.limit}`;
                        } else {
                            kaydedilecekPuan = event.data.puan;
                        }
                    }

                    // TEKLİ MOD PUAN KAYDI
                    if (sinifModuTipi === 'tekli') {
                        const aktifOgrenci = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        if (aktifOgrenci.id && sinifModuAktifGorevId) {
                            await db.saveMatrixStatus('uygulama_matrisi', aktifOgrenci.id, sinifModuAktifGorevId, String(kaydedilecekPuan));
                        }

                        setTimeout(() => {
                            document.getElementById('sinif-oyun-iframe').src = '';
                            document.getElementById('sinif-modu-oyun-ekrani').style.display = 'none';
                            if(gercekOgretmenVerisi) localStorage.setItem('currentUser', gercekOgretmenVerisi);
                            document.getElementById('sinif-modu-liste-ekrani').style.display = 'block';
                            sinifModuArayuzunuCiz(); 
                            arayuzuGuncelle(); 
                        }, 1500);
                    } 
                    // ÇİFTLİ MOD (Biri bitince sadece kendi tarafı listeye döner, diğeri oynamaya devam eder)
                    else if (sinifModuTipi === 'ciftli') {
                        const solElem = document.getElementById('ciftli-sol-iframe');
                        const sagElem = document.getElementById('ciftli-sag-iframe');

                        let hedefOgrenciId = null;
                        let taraf = null;

                        if (solElem && event.source === solElem.contentWindow && ciftliSolOgrenci) {
                            hedefOgrenciId = ciftliSolOgrenci.id;
                            taraf = 'sol';
                        } else if (sagElem && event.source === sagElem.contentWindow && ciftliSagOgrenci) {
                            hedefOgrenciId = ciftliSagOgrenci.id;
                            taraf = 'sag';
                        }

                        if (hedefOgrenciId && sinifModuAktifGorevId) {
                            await db.saveMatrixStatus('uygulama_matrisi', hedefOgrenciId, sinifModuAktifGorevId, String(kaydedilecekPuan));
                            arayuzuGuncelle(); // Tabloyu anında güncelle

                            // Bitiren tarafı otomatik olarak tekrar öğrenci seçme listesine döndür
                            setTimeout(() => {
                                if (taraf === 'sol') {
                                    ciftliSolOgrenci = null;
                                    solElem.src = '';
                                    solElem.style.display = 'none';
                                    document.getElementById('ciftli-sol-liste').style.display = 'block';
                                    document.getElementById('ciftli-sol-baslik').innerText = "Sol Taraf: Oyuncu Seçilmedi";
                                    ciftliEkranlariGuncelle();
                                } else if (taraf === 'sag') {
                                    ciftliSagOgrenci = null;
                                    sagElem.src = '';
                                    sagElem.style.display = 'none';
                                    document.getElementById('ciftli-sag-liste').style.display = 'block';
                                    document.getElementById('ciftli-sag-baslik').innerText = "Sağ Taraf: Oyuncu Seçilmedi";
                                    ciftliEkranlariGuncelle();
                                }
                            }, 1500);
                        }
                    }
                } 
                else {
                    setTimeout(() => {
                        const modal = document.getElementById('oyun-modal');
                        if (modal && modal.style.display === 'flex') {
                            document.getElementById('oyun-iframe').src = '';
                            modal.style.display = 'none';
                        }
                    }, 1500);
                }
            }
        });
        
        window.addEventListener('beforeunload', () => {
            if (sinifModuAktif && gercekOgretmenVerisi) {
                localStorage.setItem('currentUser', gercekOgretmenVerisi);
            }
        });
        
        window.ogretmenOyunDinleyiciEklendi = true;
    }

    // ÇIKIŞ BUTONLARI
    document.getElementById('btn-sinif-oyun-iptal').addEventListener('click', () => {
        document.getElementById('sinif-oyun-iframe').src = '';
        document.getElementById('sinif-modu-oyun-ekrani').style.display = 'none';
        if(gercekOgretmenVerisi) localStorage.setItem('currentUser', gercekOgretmenVerisi); 
        document.getElementById('sinif-modu-liste-ekrani').style.display = 'block';
    });

    document.getElementById('btn-ciftli-oyun-iptal').addEventListener('click', () => {
        document.getElementById('ciftli-sol-iframe').src = '';
        document.getElementById('ciftli-sag-iframe').src = '';
        document.getElementById('sinif-modu-ciftli-oyun-ekrani').style.display = 'none';
        if(gercekOgretmenVerisi) localStorage.setItem('currentUser', gercekOgretmenVerisi); 
        document.getElementById('sinif-modu-secim-ekrani').style.display = 'flex';
    });

    document.getElementById('btn-sinif-modu-cikis').addEventListener('click', () => {
        sinifModuAktif = false;
        if(gercekOgretmenVerisi) localStorage.setItem('currentUser', gercekOgretmenVerisi); 
        document.getElementById('sinif-modu-modal').style.display = 'none';
        document.getElementById('sinif-oyun-iframe').src = '';
        document.getElementById('ciftli-sol-iframe').src = '';
        document.getElementById('ciftli-sag-iframe').src = '';
        document.getElementById('sinif-modu-oyun-ekrani').style.display = 'none';
        document.getElementById('sinif-modu-ciftli-oyun-ekrani').style.display = 'none';
        document.getElementById('sinif-modu-secim-ekrani').style.display = 'flex';
        arayuzuGuncelle(); 
    });

    document.getElementById('btn-yazdir').addEventListener('click', async () => {
        if (!seciliGorevId) return;
        
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('uygulama_kalemleri'),
            db.getAll('users'),
            db.getAll('uygulama_matrisi')
        ]);
        
        const aktifGorev = kalemler.find(k => k.id === seciliGorevId);
        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
        const tabloOgrenciler = [...ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>${aktifGorev.ad} - Rapor</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    th, td { border: 1px solid #000; padding: 8px 10px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .yesil { background-color: #d1fae5 !important; font-weight: bold; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .gri { color: #64748b; font-style: italic; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>${aktifGorev.ad}</h2>
                <div class="tarih">Görev Sonuç Raporu | Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">SN</th>
                            <th style="text-align: left;">Öğrenci Adı Soyadı</th>
                            <th style="width: 180px; text-align: center;">Sonuç / Puan</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        tabloOgrenciler.forEach((ogr, index) => {
            let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === aktifGorev.id)?.deger || '';
            let islemGorduMu = hucreDegeri !== '';
            let sonucHucresi = islemGorduMu ? `<td class="merkez yesil">${hucreDegeri}</td>` : `<td class="merkez gri">Bekleniyor</td>`;
            
            printContent += `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td>${ogr.name}</td>
                    ${sonucHucresi}
                </tr>
            `;
        });

        printContent += `</tbody></table><script>window.onload=function(){window.print();setTimeout(()=>window.close(),500);};</script></body></html>`;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    });

    await arayuzuGuncelle();
}

function formuTemizle() {
    document.getElementById('gorev-id').value = ''; document.getElementById('gorev-ad').value = '';
    document.getElementById('gorev-link').value = ''; document.getElementById('gorev-aciklama').value = '';
    document.getElementById('gorev-baslangic').value = ''; document.getElementById('gorev-bitis').value = '';
    document.getElementById('form-baslik').innerText = "Yeni Etkileşimli Görev/Oyun Ekle";
    document.getElementById('btn-gorev-kaydet').disabled = false;
    document.getElementById('btn-gorev-kaydet').innerText = "Görev Ekle";
    document.getElementById('btn-gorev-iptal').style.display = 'none';
}

function tarihFormatla(tarihStr) {
    if (!tarihStr) return 'Belirtilmedi';
    return tarihStr.split('-').reverse().join('.');
}

async function sinifModuArayuzunuCiz() {
    const [tumKullanicilar, matris] = await Promise.all([
        db.getAll('users'),
        db.getAll('uygulama_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const container = document.getElementById('sinif-modu-ogrenciler');
    let html = '';

    ogrenciler.forEach(ogr => {
        let puanDurumu = matris.find(m => m.ogrId === ogr.id && m.targetId === sinifModuAktifGorevId)?.deger || '';
        
        let bgRenk = '#ffffff';
        let borderRenk = '#cbd5e1';
        let ekYazi = '<span style="font-size: 0.7em; color: #94a3b8; font-weight: normal; margin-top: 5px;">Oynamadı</span>';

        if (puanDurumu !== '') {
            bgRenk = '#f0fdf4'; 
            borderRenk = '#22c55e'; 
            ekYazi = `<span style="font-size: 0.8em; color: #16a34a; font-weight: bold; margin-top: 5px;">✅ Puan: ${puanDurumu}</span>`;
        }

        const ogrDataStr = encodeURIComponent(JSON.stringify(ogr));

        html += `
            <button class="btn-sinif-ogrenci" data-ogr="${ogrDataStr}" 
                style="aspect-ratio: 1; background: ${bgRenk}; border: 3px solid ${borderRenk}; border-radius: 16px; 
                display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px;
                cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.2s;"
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 10px 15px rgba(0,0,0,0.1)';" 
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)';">
                
                <span style="font-size: 1.2em; font-weight: bold; color: #1e293b; line-height: 1.2;">${ogr.name}</span>
                ${ekYazi}
            </button>
        `;
    });

    container.innerHTML = html;

    document.querySelectorAll('.btn-sinif-ogrenci').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrObj = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-ogr')));
            localStorage.setItem('currentUser', JSON.stringify(ogrObj));
            document.getElementById('sinif-modu-oynayan-isim').innerText = `🎮 Oynayan: ${ogrObj.name}`;
            document.getElementById('sinif-oyun-iframe').src = sinifModuAktifGorevLink;
            document.getElementById('sinif-modu-liste-ekrani').style.display = 'none';
            document.getElementById('sinif-modu-oyun-ekrani').style.display = 'flex';
        });
    });
}

// Çiftli mod için sol ve sağ taraftaki öğrenci listelerini dolduran fonksiyon
async function ciftliEkranlariGuncelle() {
    const [tumKullanicilar, matris] = await Promise.all([
        db.getAll('users'),
        db.getAll('uygulama_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student').sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Sol liste grid
    const solGrid = document.querySelector('.sol-ogrenci-grid');
    let solHtml = '';
    ogrenciler.forEach(ogr => {
        let puan = matris.find(m => m.ogrId === ogr.id && m.targetId === sinifModuAktifGorevId)?.deger || '';
        let renk = puan !== '' ? '#d1fae5' : '#ffffff';
        let ogrStr = encodeURIComponent(JSON.stringify(ogr));
        solHtml += `<button class="cift-sol-sec" data-ogr="${ogrStr}" style="padding: 10px; background: ${renk}; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9em; text-align: center;">${ogr.name}</button>`;
    });
    solGrid.innerHTML = solHtml;

    // Sağ liste grid
    const sagGrid = document.querySelector('.sag-ogrenci-grid');
    let sagHtml = '';
    ogrenciler.forEach(ogr => {
        let puan = matris.find(m => m.ogrId === ogr.id && m.targetId === sinifModuAktifGorevId)?.deger || '';
        let renk = puan !== '' ? '#d1fae5' : '#ffffff';
        let ogrStr = encodeURIComponent(JSON.stringify(ogr));
        sagHtml += `<button class="cift-sag-sec" data-ogr="${ogrStr}" style="padding: 10px; background: ${renk}; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9em; text-align: center;">${ogr.name}</button>`;
    });
    sagGrid.innerHTML = sagHtml;

    // Sol öğrenci tıklama olayı
    document.querySelectorAll('.cift-sol-sec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrObj = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-ogr')));
            ciftliSolOgrenci = ogrObj;
            document.getElementById('ciftli-sol-baslik').innerText = `Sol: ${ogrObj.name}`;
            document.getElementById('ciftli-sol-liste').style.display = 'none';
            const solIframe = document.getElementById('ciftli-sol-iframe');
            solIframe.style.display = 'block';
            solIframe.src = sinifModuAktifGorevLink;
        });
    });

    // Sağ öğrenci tıklama olayı
    document.querySelectorAll('.cift-sag-sec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrObj = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-ogr')));
            ciftliSagOgrenci = ogrObj;
            document.getElementById('ciftli-sag-baslik').innerText = `Sağ: ${ogrObj.name}`;
            document.getElementById('ciftli-sag-liste').style.display = 'none';
            const sagIframe = document.getElementById('ciftli-sag-iframe');
            sagIframe.style.display = 'block';
            sagIframe.src = sinifModuAktifGorevLink;
        });
    });
}

async function arayuzuGuncelle() {
    const [kalemlerHam, tumKullanicilar, matris] = await Promise.all([
        db.getAll('uygulama_kalemleri'),
        db.getAll('users'),
        db.getAll('uygulama_matrisi')
    ]);

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    const bugunObj = new Date();
    const yyyy = bugunObj.getFullYear();
    const mm = String(bugunObj.getMonth() + 1).padStart(2, '0');
    const dd = String(bugunObj.getDate()).padStart(2, '0');
    const bugun = `${yyyy}-${mm}-${dd}`;

    let siraliGorevler = [...kalemlerHam];
    if (aktifGorevSiralama === 'yeni') siraliGorevler.reverse();
    else if (aktifGorevSiralama === 'alfabetik') siraliGorevler.sort((a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr-TR'));
    else if (aktifGorevSiralama === 'yayinda') {
        siraliGorevler.sort((a, b) => {
            let aYayinda = (!a.baslangic || bugun >= a.baslangic) && (!a.bitis || bugun <= a.bitis) ? 1 : 0;
            let bYayinda = (!b.baslangic || bugun >= b.baslangic) && (!b.bitis || bugun <= b.bitis) ? 1 : 0;
            if (aYayinda !== bYayinda) return bYayinda - aYayinda;
            return (a.ad || '').localeCompare(b.ad || '', 'tr-TR');
        });
    }

    const toplamOgrenciSayisi = ogrenciler.length;
    let listHtml = '';
    
    if (siraliGorevler.length === 0) {
        listHtml = '<div style="color:#64748b; padding: 15px; text-align: center; background: #f8fafc; border-radius: 8px; font-style: italic;">Henüz sisteme bir görev/oyun eklenmemiş.</div>';
    } else {
        siraliGorevler.forEach(k => {
            const isSelected = k.id === seciliGorevId;
            const borderStil = isSelected ? 'border: 2px solid var(--primary);' : 'border: 1px solid #cbd5e1;';
            const displayDurum = isSelected ? 'block' : 'none';
            const okYon = isSelected ? 'rotate(180deg)' : 'rotate(0deg)';

            const tamamlayanSayisi = matris.filter(m => m.targetId === k.id && m.deger && m.deger !== '').length;
            const tamamlandiMi = (tamamlayanSayisi === toplamOgrenciSayisi && toplamOgrenciSayisi > 0);
            const rozetBg = tamamlandiMi ? '#d1fae5' : '#e2e8f0';
            const rozetText = tamamlandiMi ? '#065f46' : '#475569';
            const katilimRozeti = `<span style="background: ${rozetBg}; color: ${rozetText}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">📊 Katılım: ${tamamlayanSayisi} / ${toplamOgrenciSayisi} Öğrenci</span>`;

            let durumText = "🟢 Yayında";
            let durumBg = "#dcfce7"; let durumColor = "#166534"; 
            if (k.baslangic && bugun < k.baslangic) { durumText = "⏳ Beklemede"; durumBg = "#fef9c3"; durumColor = "#854d0e"; } 
            else if (k.bitis && bugun > k.bitis) { durumText = "⛔ Süre Doldu"; durumBg = "#fee2e2"; durumColor = "#991b1b"; }

            const durumRozeti = `<span style="background: ${durumBg}; color: ${durumColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">${durumText}</span>`;

            listHtml += `
                <div style="background: white; border-radius: 8px; margin-bottom: 5px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); ${borderStil} transition: all 0.2s;">
                    <div class="gorev-baslik-tikla" data-hedef="detay-${k.id}" data-ok="ok-${k.id}" style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: ${isSelected ? '#e8f4fd' : '#f8fafc'}; border-bottom: 1px solid ${isSelected ? '#cbd5e1' : 'transparent'};">
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <span class="btn-oyun-dene" data-link="${k.link}" style="font-size: 1.4em; cursor: pointer; padding: 2px 5px; border-radius: 4px; transition: 0.2s;" onmouseover="this.style.background='#dbeafe';" onmouseout="this.style.background='transparent';" title="Kendin Test Et">🎮</span>
                            <h4 style="margin: 0; color: #0284c7; font-size: 1.1em;">${k.ad}</h4>
                            ${durumRozeti}
                        </div>
                        <div id="ok-${k.id}" style="font-size: 1em; color: #64748b; font-weight: bold; transition: transform 0.3s; transform: ${okYon};">▼</div>
                    </div>

                    <div id="detay-${k.id}" style="display: ${displayDurum}; padding: 15px; background: #ffffff;">
                        ${k.aciklama ? `<p style="margin: 0 0 10px 0; color: #475569; font-style: italic;">📝 ${k.aciklama}</p>` : ''}
                        <p style="margin: 0 0 5px 0; color: #64748b; font-size: 0.9em;">📂 Yol: ${k.link}</p>
                        <p style="margin: 0 0 15px 0; color: #64748b; font-size: 0.9em;">📅 Tarih: ${tarihFormatla(k.baslangic)} - ${tarihFormatla(k.bitis)}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>${katilimRozeti}</div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn btn-success btn-sinif-oynat" data-id="${k.id}" data-link="${k.link}" data-ad="${k.ad}" style="padding: 6px 12px; font-size: 0.9em; font-weight: bold;">
                                    🏫 Sınıfta Oynat
                                </button>
                                
                                <button class="btn btn-primary btn-incele" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.9em;">
                                    ${isSelected ? '👀 Sonuçlar' : '🔍 Sonuçlar'}
                                </button>
                                <button class="btn btn-secondary btn-gorev-duzenle" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.9em;">Düzenle</button>
                                <button class="btn btn-danger btn-gorev-sil" data-id="${k.id}" style="padding: 6px 12px; font-size: 0.9em;">Sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('gorev-listesi').innerHTML = listHtml;

    document.querySelectorAll('.gorev-baslik-tikla').forEach(baslik => {
        baslik.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-oyun-dene')) return;

            const hedefId = e.currentTarget.getAttribute('data-hedef');
            const okId = e.currentTarget.getAttribute('data-ok');
            const detayPaneli = document.getElementById(hedefId);
            const okIkonu = document.getElementById(okId);

            if (detayPaneli.style.display === 'none') {
                detayPaneli.style.display = 'block';
                e.currentTarget.style.borderBottomColor = '#e2e8f0'; 
                okIkonu.style.transform = 'rotate(180deg)'; 
            } else {
                detayPaneli.style.display = 'none';
                e.currentTarget.style.borderBottomColor = 'transparent';
                okIkonu.style.transform = 'rotate(0deg)'; 
            }
        });
    });

    document.querySelectorAll('.btn-oyun-dene').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const link = e.currentTarget.getAttribute('data-link');
            document.getElementById('oyun-iframe').src = link;
            document.getElementById('oyun-modal').style.display = 'flex';
        });
    });

    document.querySelectorAll('.btn-sinif-oynat').forEach(btn => {
        btn.addEventListener('click', (e) => {
            sinifModuAktif = true;
            sinifModuAktifGorevId = e.currentTarget.getAttribute('data-id');
            sinifModuAktifGorevLink = e.currentTarget.getAttribute('data-link');
            const oyunAd = e.currentTarget.getAttribute('data-ad');
            
            gercekOgretmenVerisi = localStorage.getItem('currentUser');
            document.getElementById('sinif-modu-baslik').innerText = `🏫 Sınıf Modu: ${oyunAd}`;
            
            document.getElementById('sinif-modu-secim-ekrani').style.display = 'flex';
            document.getElementById('sinif-modu-liste-ekrani').style.display = 'none';
            document.getElementById('sinif-modu-oyun-ekrani').style.display = 'none';
            document.getElementById('sinif-modu-ciftli-oyun-ekrani').style.display = 'none';

            document.getElementById('sinif-modu-modal').style.display = 'flex';
        });
    });

    document.querySelectorAll('.btn-incele').forEach(btn => {
        btn.addEventListener('click', (e) => {
            seciliGorevId = e.target.getAttribute('data-id');
            arayuzuGuncelle();
            setTimeout(() => { document.getElementById('takip-karti').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
        });
    });

    document.querySelectorAll('.btn-gorev-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const gorev = kalemlerHam.find(k => k.id === id);
            if (gorev) {
                document.getElementById('gorev-id').value = gorev.id; document.getElementById('gorev-ad').value = gorev.ad;
                document.getElementById('gorev-link').value = gorev.link; document.getElementById('gorev-aciklama').value = gorev.aciklama || '';
                document.getElementById('gorev-baslangic').value = gorev.baslangic || ''; document.getElementById('gorev-bitis').value = gorev.bitis || '';
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
    const yazdirButonu = document.getElementById('btn-yazdir');
    
    if (!seciliGorevId) {
        takipKarti.style.display = 'none'; yazdirButonu.style.display = 'none'; return;
    }

    const aktifGorev = kalemlerHam.find(k => k.id === seciliGorevId);
    if (!aktifGorev) {
        seciliGorevId = null; takipKarti.style.display = 'none'; yazdirButonu.style.display = 'none'; return;
    }

    takipKarti.style.display = 'block'; yazdirButonu.style.display = 'block';
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
            if (hucreDegeri.includes('/')) {
                let parcalar = hucreDegeri.split('/');
                let puan = parseInt(parcalar[0]); let limit = parseInt(parcalar[1]);
                if (!isNaN(puan) && !isNaN(limit) && limit > 0) {
                    let yuzde = Math.min((puan / limit) * 100, 100);
                    bgStil = `linear-gradient(90deg, #d1fae5 ${yuzde}%, #ffffff ${yuzde}%)`;
                } else bgStil = '#e6ffed';
            } else bgStil = '#e6ffed';
        }
        
        let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
        
        tabloHtml += `<tr style="background-color: ${satirArkaPlan}; transition: background-color 0.2s;">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #555;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #333;">${ogr.name}</td>
            <td style="border: 1px solid #ddd; padding: 0;">
                <div style="display: flex; align-items: center; width: 100%; height: 100%; background: ${bgStil}; border-radius: 4px; transition: 0.2s;">
                    <input type="text" class="hucre-input" data-ogr="${ogr.id}" data-gorev="${aktifGorev.id}" value="${hucreDegeri}" placeholder="✏️ Puan Gir..."
                        title="Manuel puan girmek için tıklayın ve yazın"
                        onfocus="this.parentElement.parentElement.parentElement.style.backgroundColor='#fff3cd'; this.style.border='1px dashed #94a3b8';"
                        onblur="this.parentElement.parentElement.parentElement.style.backgroundColor='${satirArkaPlan}'; this.style.border='none';"
                        style="flex: 1; padding: 12px; border: none; text-align: center; box-sizing: border-box; outline: none; background: transparent; font-weight: bold; color: ${islemGorduMu ? 'var(--success)' : '#888'}; cursor: text; transition: 0.2s;">
                    
                    ${islemGorduMu ? `<button class="btn btn-danger btn-temizle" data-ogr="${ogr.id}" data-gorev="${aktifGorev.id}" style="margin-right: 8px; padding: 4px 8px; font-size: 0.75em;" title="Sıfırla">Temizle</button>` : ''}
                </div>
            </td>
        </tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('gorev-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            await db.saveMatrixStatus('uygulama_matrisi', e.target.getAttribute('data-ogr'), e.target.getAttribute('data-gorev'), e.target.value.trim());
            setTimeout(() => { arayuzuGuncelle(); }, 300);
        });
    });

    document.querySelectorAll('.btn-temizle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Sıfırlamak istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.saveMatrixStatus('uygulama_matrisi', e.target.getAttribute('data-ogr'), e.target.getAttribute('data-gorev'), ''); 
                setTimeout(() => { arayuzuGuncelle(); }, 300);
            }
        });
    });
}