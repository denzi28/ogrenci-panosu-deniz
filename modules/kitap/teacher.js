import { db } from '../../js/db.js';

let aktifSiralama = 'alfabetik'; 
let minimumOkumaGunu = 1; 

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Kitap okuma modülü yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('kitap');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    try {
        const ayarlar = await db.getAll('system_settings');
        const kitapAyari = ayarlar.find(a => a.id === 'kitap_ayarlari');
        if (kitapAyari && kitapAyari.minGun !== undefined) {
            minimumOkumaGunu = parseInt(kitapAyari.minGun);
        }
    } catch (e) { console.error("Ayar çekilemedi", e); }

    container.innerHTML = `
        <div id="ana-gorunum" style="display: block;">
            
            <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda veliler sınıfın kitap okuma durumunu görebilir.</p>
                </div>
                <div>
                    <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
                </div>
            </div>

            <div class="card" style="border-top: 4px solid var(--primary);">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="tab-ogrenciler" class="btn btn-primary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">👥 Öğrenci Takip Listesi</button>
                    <button id="tab-kitap-yonetimi" class="btn btn-secondary" style="flex: 1; min-width: 200px; font-size: 1.05em; font-weight: bold;">📚 Kitap Yönetimi (Ekle/Sil)</button>
                </div>

                <div id="view-ogrenciler" style="display: block;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: var(--success);">Öğrenci Okuma Durumları</h3>
                            <p style="font-size:0.85em; color:#64748b; margin: 0;">Kartlar üzerinden hızlıca kitap verebilir veya teslim alabilirsiniz.</p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button id="btn-sirala" class="btn btn-secondary" style="padding: 10px 15px; font-size: 0.95em; font-weight: bold; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 8px;" title="Sıralamayı Değiştir">
                                <span id="siralama-ikon">🔤</span> <span id="siralama-metin">Alfabetik Sıralama</span> <span>🔄</span>
                            </button>
                            <button id="btn-kitap-yazdir" class="btn btn-primary" style="padding: 10px 15px; font-size: 0.95em; font-weight: bold; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                🖨️ Rapor Yazdır / PDF Al
                            </button>
                        </div>
                    </div>
                    <div id="kitap-tablosu-alani"><p>⏳ Öğrenci kartları yükleniyor...</p></div>
                </div>

                <div id="view-kitap-yonetimi" style="display: none;">
                    
                    <div style="background: #fff8f1; padding: 15px 20px; border-radius: 8px; border: 1px solid #fed7aa; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <h4 style="margin: 0 0 8px 0; color: #ea580c; font-size: 1.1em;">⏱️ Kitap Değiştirme Süresi Kuralı</h4>
                        <p style="font-size: 0.9em; color: #9a3412; margin: 0 0 12px 0;">Öğrenci kitabı aldıktan sonra <strong>en az kaç gün</strong> elinde tutmalı? (Aynı gün hemen iade etmelerini engellemek için en az 1 yapın).</p>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="ayar-min-gun" value="${minimumOkumaGunu}" min="0" style="width: 80px; padding: 10px; border: 2px solid #fdba74; border-radius: 6px; font-weight: bold; font-size: 1.1em; color: #ea580c; outline: none;"> 
                            <span style="font-weight: bold; color: #ea580c;">Gün</span>
                            <button id="btn-ayar-kaydet" class="btn" style="background: #f97316; color: white; border: none; font-weight: bold; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#ea580c';" onmouseout="this.style.background='#f97316';">Kuralı Kaydet</button>
                        </div>
                    </div>

                    <h3 style="color: var(--primary);">Sınıf Kitaplığına Yeni Kitap Ekle</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <input type="number" id="yeni-kitap-no" placeholder="No (Örn: 1)" style="width: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <input type="text" id="yeni-kitap-ad" placeholder="Kitap Adı (Örn: Küçük Prens)" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <button id="btn-kitap-ekle" class="btn btn-primary">Tek Ekle</button>
                    </div>

                    <div style="margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 0.85em; color: #475569; margin-bottom: 8px; font-weight: bold;">📥 Toplu Kitap Ekleme (Numaralı Tanıma Sistemi)</p>
                        <p style="font-size: 0.75em; color: #64748b; margin-top: 0;">Excel veya Word'den yapıştırırken numara kullanırsanız sistem otomatik algılar (Örn: <i>1- Küçük Prens</i> veya <i>1. Şeker Portakalı</i>).</p>
                        <textarea id="toplu-kitap-ad" placeholder="1- Küçük Prens&#10;2- Şeker Portakalı&#10;3- Sol Ayağım" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
                        <button id="btn-toplu-kitap-ekle" class="btn btn-success" style="margin-top: 8px;">Listeyi Toplu Ekle</button>
                    </div>

                    <div style="margin-top: 30px;">
                        <h3 style="margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Mevcut Kitaplar (<span id="kitap-sayaci">0</span>)</h3>
                        <div id="kitap-basliklari"></div>
                    </div>
                </div>
            </div>
        </div>

        <div id="detay-gorunum" style="display: none;">
            <div class="card" style="border-top: 4px solid var(--primary); min-height: 50vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2 id="detay-baslik" style="margin: 0; color: var(--primary);">📖 Öğrenci Adı - Kitap Listesi</h2>
                    <button id="btn-detay-kapat" class="btn btn-secondary" style="font-weight: bold; padding: 10px 20px; font-size: 1.1em; box-shadow: 0 4px 0 #94a3b8;">⬅ Listeye Dön</button>
                </div>
                
                <div style="background: #e8f4fd; border: 1px dashed var(--primary); padding: 12px; border-radius: 8px; font-size: 0.95em; margin-bottom: 20px; color: #1e293b; text-align: center;">
                    Tüm listeyi manuel işaretlemek isterseniz sağdaki butonları kullanabilirsiniz.
                </div>

                <div id="detay-kitap-listesi"></div>
            </div>
        </div>

        <!-- 🌟 ÖZEL NUMARATÖR (NUMPAD) MODALI -->
        <div id="numpad-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:4000; align-items:center; justify-content:center;">
            <div style="background:white; width:280px; border-radius:16px; padding:20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display:flex; flex-direction:column; gap:15px; border: 2px solid #0ea5e9;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; color:#0ea5e9; font-size:1em;">Kitap Numarası Gir</span>
                    <button id="numpad-kapat" style="background:none; border:none; font-size:1.2em; cursor:pointer; color:#666; font-weight:bold;">✕</button>
                </div>
                <div id="numpad-ekran" style="background:#f1f5f9; padding:12px; border-radius:8px; font-size:1.5em; font-weight:bold; text-align:center; color:#1e293b; letter-spacing:2px; min-height:30px; border: 1px solid #cbd5e1;"></div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                    <button class="numpad-tus btn btn-secondary" data-val="1" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">1</button>
                    <button class="numpad-tus btn btn-secondary" data-val="2" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">2</button>
                    <button class="numpad-tus btn btn-secondary" data-val="3" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">3</button>
                    <button class="numpad-tus btn btn-secondary" data-val="4" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">4</button>
                    <button class="numpad-tus btn btn-secondary" data-val="5" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">5</button>
                    <button class="numpad-tus btn btn-secondary" data-val="6" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">6</button>
                    <button class="numpad-tus btn btn-secondary" data-val="7" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">7</button>
                    <button class="numpad-tus btn btn-secondary" data-val="8" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">8</button>
                    <button class="numpad-tus btn btn-secondary" data-val="9" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">9</button>
                    <button class="numpad-tus btn btn-secondary" data-val="sil" style="padding:15px; font-size:1em; font-weight:bold; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">⌫ Sil</button>
                    <button class="numpad-tus btn btn-secondary" data-val="0" style="padding:15px; font-size:1.2em; font-weight:bold; background:#f8fafc; color:#1e293b; border:1px solid #cbd5e1;">0</button>
                    <button id="numpad-tamam" class="btn btn-primary" style="padding:15px; font-size:1em; font-weight:bold; background:#0ea5e9; color:white; border:none;">✔ OK</button>
                </div>
            </div>
        </div>
    `;

    let aktifInputId = null;
    const numpadModal = document.getElementById('numpad-modal');
    const numpadEkran = document.getElementById('numpad-ekran');

    function numpadAc(inputId) {
        aktifInputId = inputId;
        const inputEl = document.getElementById(inputId);
        numpadEkran.innerText = inputEl ? inputEl.getAttribute('data-gercek-no') || '' : '';
        numpadModal.style.display = 'flex';
    }

    document.getElementById('numpad-kapat').addEventListener('click', () => {
        numpadModal.style.display = 'none';
        aktifInputId = null;
    });

    numpadModal.addEventListener('click', (e) => {
        if (e.target === numpadModal) {
            numpadModal.style.display = 'none';
            aktifInputId = null;
        }
    });

    document.querySelectorAll('.numpad-tus').forEach(tus => {
        tus.addEventListener('click', () => {
            const val = tus.getAttribute('data-val');
            let mevcut = numpadEkran.innerText;
            if (val === 'sil') {
                numpadEkran.innerText = mevcut.slice(0, -1);
            } else {
                if (mevcut.length < 5) {
                    numpadEkran.innerText = mevcut + val;
                }
            }
        });
    });

    // 🌟 OK DENDİĞİNDE KİTAP ADINI BUL VE EKRANA YANSIT
    document.getElementById('numpad-tamam').addEventListener('click', async () => {
        if (aktifInputId) {
            const ogrId = aktifInputId.replace('hizli-no-', '');
            const girilenNo = numpadEkran.innerText.trim();
            
            const inputEl = document.getElementById(aktifInputId);
            const kitapAdiGosterge = document.getElementById(`kitap-adi-gosterge-${ogrId}`);
            
            if (inputEl) {
                inputEl.setAttribute('data-gercek-no', girilenNo);
                
                if (girilenNo !== "") {
                    const kalemler = await db.getAll('kitaplar_kalemleri');
                    const kNo = parseInt(girilenNo);
                    const bulunanKitap = kalemler.find(k => k.no === kNo);
                    
                    if (bulunanKitap) {
                        inputEl.value = `#${bulunanKitap.no}`;
                        if(kitapAdiGosterge) {
                            kitapAdiGosterge.innerText = bulunanKitap.ad;
                            kitapAdiGosterge.style.color = "#059669";
                        }
                    } else {
                        inputEl.value = `#${girilenNo}`;
                        if(kitapAdiGosterge) {
                            kitapAdiGosterge.innerText = "⚠️ Kitap bulunamadı!";
                            kitapAdiGosterge.style.color = "#dc2626";
                        }
                    }
                } else {
                    inputEl.value = "";
                    if(kitapAdiGosterge) {
                        kitapAdiGosterge.innerText = "Kitap seçilmedi";
                        kitapAdiGosterge.style.color = "#64748b";
                    }
                }
            }
        }
        numpadModal.style.display = 'none';
        aktifInputId = null;
    });

    document.getElementById('btn-ayar-kaydet').addEventListener('click', async (e) => {
        const val = document.getElementById('ayar-min-gun').value;
        if(val !== "" && val >= 0) {
            e.target.innerText = "⏳ Kaydediliyor...";
            minimumOkumaGunu = parseInt(val);
            if (db.setWithId) {
                await db.setWithId('system_settings', 'kitap_ayarlari', { minGun: minimumOkumaGunu });
            }
            setTimeout(() => { e.target.innerText = "✅ Kaydedildi"; setTimeout(() => e.target.innerText = "Kuralı Kaydet", 2000); }, 500);
        }
    });

    document.getElementById('tab-ogrenciler').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'block';
        document.getElementById('view-kitap-yonetimi').style.display = 'none';
        document.getElementById('tab-ogrenciler').className = 'btn btn-primary';
        document.getElementById('tab-kitap-yonetimi').className = 'btn btn-secondary';
    });

    document.getElementById('tab-kitap-yonetimi').addEventListener('click', () => {
        document.getElementById('view-ogrenciler').style.display = 'none';
        document.getElementById('view-kitap-yonetimi').style.display = 'block';
        document.getElementById('tab-ogrenciler').className = 'btn btn-secondary';
        document.getElementById('tab-kitap-yonetimi').className = 'btn btn-primary';
    });

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('kitap'));
        await db.toggleModuleVisibility('kitap', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-kitap-ekle').addEventListener('click', async () => {
        const noVal = document.getElementById('yeni-kitap-no').value.trim();
        const ad = document.getElementById('yeni-kitap-ad').value.trim();
        
        if (ad) {
            const no = noVal !== "" ? parseInt(noVal) : 999;
            const btn = document.getElementById('btn-kitap-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('kitaplar_kalemleri', { no: no, ad: ad });
            
            document.getElementById('yeni-kitap-no').value = '';
            document.getElementById('yeni-kitap-ad').value = '';
            btn.disabled = false; btn.innerText = "Tek Ekle";
            await arayuzuGuncelle();
        } else {
            alert("Lütfen en azından kitabın adını yazın.");
        }
    });

    document.getElementById('btn-toplu-kitap-ekle').addEventListener('click', async () => {
        const metin = document.getElementById('toplu-kitap-ad').value;
        if (!metin.trim()) return alert("Lütfen eklenecek kitap isimlerini yazın.");

        const btn = document.getElementById('btn-toplu-kitap-ekle');
        btn.disabled = true; btn.innerText = "⏳ Ekleniyor...";

        const satirlar = metin.split('\n').filter(k => k.trim() !== "");
        for (let satir of satirlar) { 
            let no = 999;
            let ad = satir.trim();
            const match = ad.match(/^(\d+)[\s\-\.]+(.*)/);
            if(match) {
                no = parseInt(match[1]);
                ad = match[2].trim();
            }
            await db.add('kitaplar_kalemleri', { no: no, ad: ad }); 
        }

        document.getElementById('toplu-kitap-ad').value = '';
        btn.disabled = false; btn.innerText = "Listeyi Toplu Ekle";
        await arayuzuGuncelle();
    });

    document.getElementById('btn-detay-kapat').addEventListener('click', async () => {
        document.getElementById('detay-gorunum').style.display = 'none';
        document.getElementById('ana-gorunum').style.display = 'block';
        await arayuzuGuncelle(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-kitap-yazdir').addEventListener('click', async () => {
        const [kalemler, tumKullanicilar, matris] = await Promise.all([
            db.getAll('kitaplar_kalemleri'),
            db.getAll('users'),
            db.getAll('kitap_matrisi')
        ]);
        
        if (kalemler.length === 0) return alert("Sistemde kitap bulunmuyor.");

        kalemler.sort((a, b) => {
            const noA = (a.no !== undefined && a.no !== null) ? parseInt(a.no) : 999;
            const noB = (b.no !== undefined && b.no !== null) ? parseInt(b.no) : 999;
            if (noA === noB) return (a.ad || '').localeCompare(b.ad || '', 'tr-TR');
            return noA - noB;
        });

        const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
        
        ogrenciler.forEach(ogr => {
            ogr.okunanSayisi = 0;
            ogr.suAnOkuduguKitaplar = [];
            kalemler.forEach(k => {
                let m = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id);
                if (m) {
                    let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                    if (m.deger === '✔️') ogr.okunanSayisi++;
                    if (m.deger === '⏳') ogr.suAnOkuduguKitaplar.push(`${kNoStr}${k.ad}`);
                }
            });
        });

        if (aktifSiralama === 'alfabetik') {
            ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } else if (aktifSiralama === 'encok') {
            ogrenciler.sort((a, b) => {
                if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
                let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
                return (a.name || '').localeCompare(b.name || '', 'tr-TR');
            });
        } else if (aktifSiralama === 'okuyan') {
            ogrenciler.sort((a, b) => {
                let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
                if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
                return (a.name || '').localeCompare(b.name || '', 'tr-TR');
            });
        }

        let printContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Sınıf Kitap Okuma Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
                    .tarih { text-align: center; color: #444; font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    td.merkez { text-align: center; }
                    .kitap-listesi { font-size: 12px; color: #444; margin-top: 5px; font-style: italic; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                </style>
            </head>
            <body>
                <h2>SINIF KİTAP OKUMA RAPORU</h2>
                <div class="tarih">Sıralama: ${aktifSiralama === 'alfabetik' ? 'Alfabetik' : (aktifSiralama === 'encok' ? 'En Çok Okuyanlar' : 'Şu An Okuyanlar')} | Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">SN</th>
                            <th style="width: 60px;">Okul No</th>
                            <th style="width: 200px; text-align: left;">Öğrenci Adı Soyadı</th>
                            <th style="width: 80px;">Toplam</th>
                            <th style="text-align: left;">Okuduğu / Okumakta Olduğu Kitaplar</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ogrenciler.forEach((ogr, index) => {
            let okunanlarVeSari = [];
            kalemler.forEach(k => {
                let m = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id);
                if (m) {
                    let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                    if (m.deger === '✔️') okunanlarVeSari.push(`<b>${kNoStr}${k.ad}</b>`);
                    else if (m.deger === '⏳') {
                        let sureMetni = m.tarih ? (gunFarkiHesapla(m.tarih) === 0 ? "Bugün aldı" : `${gunFarkiHesapla(m.tarih)} gündür`) : "Eski kayıt";
                        okunanlarVeSari.push(`${kNoStr}${k.ad} (Okuyor: ${sureMetni})`);
                    }
                }
            });

            let kitapYazisi = okunanlarVeSari.length > 0 ? okunanlarVeSari.join(', ') : 'Henüz kitap kaydı yok.';

            printContent += `
                <tr>
                    <td class="merkez">${index + 1}</td>
                    <td class="merkez"><strong>${ogr.okulno || '-'}</strong></td>
                    <td><strong>${ogr.name}</strong></td>
                    <td class="merkez" style="font-size: 16px;"><strong>${ogr.okunanSayisi}</strong></td>
                    <td class="kitap-listesi">${kitapYazisi}</td>
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

    document.getElementById('btn-sirala').addEventListener('click', () => {
        if (aktifSiralama === 'alfabetik') aktifSiralama = 'encok';
        else if (aktifSiralama === 'encok') aktifSiralama = 'okuyan';
        else aktifSiralama = 'alfabetik';
        arayuzuGuncelle();
    });

    await arayuzuGuncelle();

    window.acNumpad = numpadAc;
}

function gunFarkiHesapla(verilisTarihiStr) {
    if (!verilisTarihiStr) return 999; 
    const alis = new Date(verilisTarihiStr);
    const bugun = new Date();
    alis.setHours(0,0,0,0); 
    bugun.setHours(0,0,0,0);
    return Math.floor((bugun - alis) / (1000 * 60 * 60 * 24));
}

async function arayuzuGuncelle() {
    const [kalemler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('kitaplar_kalemleri'),
        db.getAll('users'),
        db.getAll('kitap_matrisi')
    ]);

    kalemler.sort((a, b) => {
        const noA = (a.no !== undefined && a.no !== null) ? parseInt(a.no) : 999;
        const noB = (b.no !== undefined && b.no !== null) ? parseInt(b.no) : 999;
        if (noA === noB) return (a.ad || '').localeCompare(b.ad || '', 'tr-TR');
        return noA - noB;
    });

    const sayacEl = document.getElementById('kitap-sayaci');
    if(sayacEl) sayacEl.innerText = kalemler.length;

    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    ogrenciler.forEach(ogr => {
        let okunanSayisi = 0;
        let suAnOkuyanlarDetay = []; 
        
        kalemler.forEach(k => {
            let m = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id);
            if (m) {
                if (m.deger === '✔️') okunanSayisi++;
                if (m.deger === '⏳') suAnOkuyanlarDetay.push({ ...k, tarih: m.tarih }); 
            }
        });
        
        ogr.okunanSayisi = okunanSayisi;
        ogr.suAnOkuduguKitaplar = suAnOkuyanlarDetay.map(k => k.ad); 
        ogr.suAnOkuyanlarDetay = suAnOkuyanlarDetay; 
    });

    const ikonSpan = document.getElementById('siralama-ikon');
    const metinSpan = document.getElementById('siralama-metin');
    
    if (aktifSiralama === 'alfabetik') {
        ogrenciler.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        if(ikonSpan) { ikonSpan.innerText = '🔤'; metinSpan.innerText = 'Alfabetik Sıralama'; }
    } else if (aktifSiralama === 'encok') {
        ogrenciler.sort((a, b) => {
            if (b.okunanSayisi !== a.okunanSayisi) return b.okunanSayisi - a.okunanSayisi;
            let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
            return (a.name || '').localeCompare(b.name || '', 'tr-TR');
        });
        if(ikonSpan) { ikonSpan.innerText = '🏆'; metinSpan.innerText = 'En Çok Okuyanlar'; }
    } else if (aktifSiralama === 'okuyan') {
        ogrenciler.sort((a, b) => {
            let aOkuyor = a.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            let bOkuyor = b.suAnOkuduguKitaplar.length > 0 ? 1 : 0;
            if (bOkuyor !== aOkuyor) return bOkuyor - aOkuyor;
            return (a.name || '').localeCompare(b.name || '', 'tr-TR');
        });
        if(ikonSpan) { ikonSpan.innerText = '⏳'; metinSpan.innerText = 'Şu An Okuyanlar'; }
    }

    let basliklarHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">';
    kalemler.forEach(k => {
        let okuyanSayisi = 0;
        let suAnOkuyanlar = [];
        
        matris.forEach(m => {
            if(m.targetId === k.id) {
                if(m.deger === '✔️') okuyanSayisi++;
                else if(m.deger === '⏳') {
                    let ogr = ogrenciler.find(o => o.id === m.ogrId);
                    if(ogr) suAnOkuyanlar.push(ogr.name);
                }
            }
        });
        
        let okuduText = okuyanSayisi > 0 ? `Bu kitabı <strong>${okuyanSayisi} öğrenci</strong> okudu.` : `Bu kitabı henüz okuyan olmadı.`;
        let suAnText = suAnOkuyanlar.length > 0 
            ? `<span style="color: #d97706; font-weight: bold;">Şu an ${suAnOkuyanlar.join(', ')} okuyor.</span>`
            : `<span style="color: #059669; font-weight: bold;">Şu an okunmayı bekliyor (Rafta).</span>`;
        let ikon = suAnOkuyanlar.length > 0 ? '⏳' : '✔';
        let bgRenk = suAnOkuyanlar.length > 0 ? '#fef3c7' : '#ffffff';
        let borderRenk = suAnOkuyanlar.length > 0 ? '#f59e0b' : 'var(--primary)';
        let noGosterimi = (k.no && k.no !== 999) ? `<span style="color:#94a3b8; margin-right:5px; font-size: 0.9em;">#${k.no}</span>` : '';
        
        basliklarHtml += `
            <div style="background: ${bgRenk}; border: 1px solid #e2e8f0; border-left: 5px solid ${borderRenk}; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                        <span>${ikon}</span> ${noGosterimi}${k.ad}
                    </h4>
                    <div style="font-size: 0.9em; color: #475569; display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                        <div>${suAnText}</div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px;">${okuduText}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
                    <button class="btn-kalem-duzenle btn btn-secondary" data-id="${k.id}" data-no="${k.no||''}" data-ad="${k.ad}" style="flex: 1; padding: 6px; font-size: 0.85em;">✏️ Düzenle</button>
                    <button class="btn-kalem-sil btn btn-danger" data-id="${k.id}" style="flex: 1; padding: 6px; font-size: 0.85em;">✕ Sil</button>
                </div>
            </div>
        `;
    });
    basliklarHtml += '</div>';
    
    if(kalemler.length === 0) basliklarHtml = '<div style="color:#64748b; padding: 15px; text-align: center; background: #f8fafc; border-radius: 8px; font-style: italic;">Henüz sınıf kitaplığına eklenmiş kitap bulunmuyor.</div>';
    
    const kitapBasliklariEl = document.getElementById('kitap-basliklari');
    if(kitapBasliklariEl) kitapBasliklariEl.innerHTML = basliklarHtml;

    const tabloAlaniEl = document.getElementById('kitap-tablosu-alani');
    if (!tabloAlaniEl) return;

    if (kalemler.length === 0) {
        tabloAlaniEl.innerHTML = '<p style="color:var(--secondary); padding: 20px;">Lütfen önce "Kitap Yönetimi" sekmesinden en az bir kitap ekleyin.</p>';
        return;
    }

    let kartlarHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">`;

    ogrenciler.forEach((ogr, index) => {
        let hizliIslemHtml = `<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">`;

        if (ogr.suAnOkuyanlarDetay.length > 0) {
            ogr.suAnOkuyanlarDetay.forEach(k => {
                let kNoStr = (k.no && k.no !== 999) ? `#${k.no} ` : '';
                let sureMetni = "";
                if (k.tarih) {
                    let gunFarki = gunFarkiHesapla(k.tarih);
                    sureMetni = gunFarki === 0 ? " (Bugün aldı)" : ` (${gunFarki} gündür okuyor)`;
                } else {
                    sureMetni = " (Eski kayıt)";
                }

                hizliIslemHtml += `
                    <div style="display: flex; flex-direction: column; gap: 6px; background: #fef3c7; padding: 10px; border-radius: 8px; border: 1px solid #f59e0b;">
                        <span style="color: #d97706; font-size: 0.9em; font-weight: bold; line-height: 1.3;">
                            ⏳ Okuyor: ${kNoStr}${k.ad}<br>
                            <span style="font-size: 0.85em; color: #b45309;">${sureMetni}</span>
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-hizli-bitir" data-ogr="${ogr.id}" data-kitap="${k.id}" style="flex: 1; background: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 0.85em; cursor: pointer; font-weight: bold;" title="Kitabı Okudu Olarak İşaretle">✔️ Bitirdi</button>
                            <button class="btn-hizli-iade" data-ogr="${ogr.id}" data-kitap="${k.id}" style="flex: 1; background: #ef4444; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 0.85em; cursor: pointer; font-weight: bold;" title="Okumadan Geri Verdi">❌ Bırak</button>
                        </div>
                    </div>
                `;
            });
        }

        // 🌟 KİTAP NO VE ANLIK GÖRÜNEN KİTAP ADI ALANI
        hizliIslemHtml += `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 5px;">
                <div style="display: flex; gap: 5px;">
                    <input type="text" readonly id="hizli-no-${ogr.id}" placeholder="No Seç..." class="numpad-trigger-input" data-ogrid="${ogr.id}" style="width: 80px; padding: 8px 5px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95em; outline: none; background: #fff; cursor: pointer; text-align: center; font-weight: bold; color: #0284c7;" title="Klavyeyi Açmak İçin Tıkla">
                    <div id="kitap-adi-gosterge-${ogr.id}" style="flex: 1; display: flex; align-items: center; padding: 0 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85em; color: #64748b; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">Kitap seçilmedi</div>
                    <button class="btn-hizli-ver" id="btn-ver-${ogr.id}" data-ogr="${ogr.id}" style="background: #0ea5e9; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 0.95em; cursor: pointer; font-weight: bold; box-shadow: 0 2px 0 #0284c7;">📥 Ver</button>
                </div>
            </div>
        `;
        
        hizliIslemHtml += `</div>`;

        kartlarHtml += `
            <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; gap: 15px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div>
                        <div style="font-size: 0.8em; color: #94a3b8; font-weight: bold; margin-bottom: 5px;">#${index + 1} | No: ${ogr.okulno || '-'}</div>
                        <div style="font-weight: bold; font-size: 1.15em; color: #1e293b; line-height: 1.2;">${ogr.name}</div>
                    </div>
                    <div style="background: #f0fdf4; border: 2px solid #22c55e; color: #16a34a; border-radius: 10px; padding: 5px 12px; text-align: center; min-width: 60px;">
                        <span style="font-size: 1.4em; font-weight: 900; display: block; line-height: 1;">${ogr.okunanSayisi}</span>
                        <span style="font-size: 0.65em; font-weight: bold;">KİTAP</span>
                    </div>
                </div>

                ${hizliIslemHtml}

                <button class="btn btn-secondary btn-detay-ac" data-ogrid="${ogr.id}" data-ogrname="${ogr.name}" style="width: 100%; padding: 10px; font-weight: bold; font-size: 0.9em; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; transition: 0.2s; cursor: pointer;" onmouseover="this.style.background='#e2e8f0';" onmouseout="this.style.background='#f8fafc';">
                    📚 Tüm Listeyi Gör
                </button>
            </div>
        `;
    });

    kartlarHtml += `</div>`;
    tabloAlaniEl.innerHTML = kartlarHtml;

    document.querySelectorAll('.numpad-trigger-input').forEach(input => {
        input.onclick = (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogrid');
            if(window.acNumpad) {
                window.acNumpad(`hizli-no-${ogrId}`);
            }
        };
    });

    document.querySelectorAll('.btn-kalem-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const eskiNo = e.currentTarget.getAttribute('data-no');
            const eskiAd = e.currentTarget.getAttribute('data-ad');
            
            const varsayilanYazi = (eskiNo && eskiNo !== '999') ? `${eskiNo}- ${eskiAd}` : eskiAd;
            const input = prompt("Kitabın numarasını ve adını düzeltin (Örn: 1- Kitap Adı):", varsayilanYazi);
            
            if (input !== null && input.trim() !== "") {
                let yeniNo = 999;
                let yeniAd = input.trim();
                
                const match = yeniAd.match(/^(\d+)[\s\-\.]+(.*)/);
                if(match) {
                    yeniNo = parseInt(match[1]);
                    yeniAd = match[2].trim();
                }

                await db.update('kitaplar_kalemleri', id, { ad: yeniAd, no: yeniNo });
                await arayuzuGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu kitabı listeden silmek istediğinize emin misiniz?")) {
                await db.delete('kitaplar_kalemleri', e.currentTarget.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-detay-ac').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogrid');
            const ogrName = e.currentTarget.getAttribute('data-ogrname');
            ogrenciDetayiniAc(ogrId, ogrName, kalemler, matris);
        });
    });

    document.querySelectorAll('.btn-hizli-bitir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const kitapId = e.currentTarget.getAttribute('data-kitap');
            
            const kayit = matris.find(m => m.ogrId === ogrId && m.targetId === kitapId && m.deger === '⏳');
            if (kayit && kayit.tarih) {
                const farkGun = gunFarkiHesapla(kayit.tarih);
                if (farkGun < minimumOkumaGunu) {
                    const mesaj = `⚠️ KİTAP DEĞİŞTİRME SÜRESİ UYARISI\n\nBu kitap öğrenciye henüz ${farkGun === 0 ? 'BUGÜN' : farkGun + ' gün önce'} verilmiş! Kurala göre bir kitap en az ${minimumOkumaGunu} gün okunmalıdır.\n\n(Not: Eğer kitabı az önce yanlışlıkla verdiyseniz 'Tamam' diyerek işlemi zorla yapabilirsiniz. İptal etmek istiyor musunuz?)`;
                    if(!confirm(mesaj)) return; 
                }
            }

            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitapId, '✔️');
            arayuzuGuncelle();
        });
    });

    document.querySelectorAll('.btn-hizli-iade').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const kitapId = e.currentTarget.getAttribute('data-kitap');
            
            const kayit = matris.find(m => m.ogrId === ogrId && m.targetId === kitapId && m.deger === '⏳');
            if (kayit && kayit.tarih) {
                const farkGun = gunFarkiHesapla(kayit.tarih);
                if (farkGun < minimumOkumaGunu) {
                    const mesaj = `⚠️ DİKKAT: Bu kitap ${farkGun === 0 ? 'BUGÜN' : farkGun + ' gün önce'} verilmiş.\nKitabı okumadan iade almak/silmek istediğinize emin misiniz?`;
                    if(!confirm(mesaj)) return; 
                }
            }

            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitapId, '');
            arayuzuGuncelle();
        });
    });

    document.querySelectorAll('.btn-hizli-ver').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const ogrId = e.currentTarget.getAttribute('data-ogr');
            const inputEl = document.getElementById(`hizli-no-${ogrId}`);
            const gercekNoAttr = inputEl.getAttribute('data-gercek-no');
            
            if (!gercekNoAttr) return alert("Lütfen önce kitap numarası seçin.");
            
            const kNo = parseInt(gercekNoAttr);
            const kitap = kalemler.find(k => k.no === kNo);
            
            if (!kitap) return alert(`${kNo} numaralı kitap kütüphanede bulunamadı!`);

            const baskasiOkuyorMu = matris.find(m => m.targetId === kitap.id && m.deger === '⏳' && m.ogrId !== ogrId);
            if (baskasiOkuyorMu) {
                const baskasi = tumKullanicilar.find(u => u.id === baskasiOkuyorMu.ogrId);
                const isim = baskasi ? baskasi.name : 'başka bir öğrencide';
                if (!confirm(`Bu kitap şu an "${isim}" üzerinde görünüyor. Yine de zorla alıp bu öğrenciye vermek istiyor musunuz?`)) {
                    return;
                }
                await db.saveMatrixStatus('kitap_matrisi', baskasiOkuyorMu.ogrId, kitap.id, '');
            }

            e.currentTarget.innerText = "...";
            await db.saveMatrixStatus('kitap_matrisi', ogrId, kitap.id, '⏳');
            arayuzuGuncelle();
        });
    });
}

function ogrenciDetayiniAc(ogrId, ogrName, kalemler, matris) {
    document.getElementById('ana-gorunum').style.display = 'none';
    document.getElementById('detay-gorunum').style.display = 'block';
    document.getElementById('detay-baslik').innerText = `📖 ${ogrName} - Kitap Listesi`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let listeHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    kalemler.forEach((k) => {
        let kayit = matris.find(m => m.ogrId === ogrId && m.targetId === k.id);
        let mevcutDeger = kayit ? kayit.deger : '';
        let tarih = kayit ? kayit.tarih : null;
        
        let btnText = 'Okumadı';
        let bgRenk = '#f1f5f9';
        let textColor = '#64748b';
        let borderRenk = '#cbd5e1';

        if (mevcutDeger === '⏳') {
            let sureMetni = "";
            if(tarih) {
                let gunFarki = gunFarkiHesapla(tarih);
                sureMetni = gunFarki === 0 ? " (Bugün aldı)" : ` (${gunFarki} gün)`;
            } else {
                sureMetni = " (Eski)";
            }
            btnText = '⏳ Okuyor' + sureMetni;
            bgRenk = '#fef3c7'; textColor = '#d97706'; borderRenk = '#f59e0b';
        } else if (mevcutDeger === '✔️') {
            btnText = '✔️ Okudu';
            bgRenk = '#d1fae5'; textColor = '#059669'; borderRenk = '#10b981';
        }

        let noGosterimi = (k.no && k.no !== 999) ? `<span style="color:#94a3b8; margin-right:8px;">#${k.no}</span>` : `<span style="color:#cbd5e1; margin-right:8px;">-</span>`;

        listeHtml += `
            <div style="background: white; padding: 15px 20px; border-radius: 12px; border: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 1.15em; font-weight: bold; color: #334155; flex: 1; min-width: 200px;">
                    ${noGosterimi}${k.ad}
                </div>
                <button class="btn-durum-degistir" data-ogr="${ogrId}" data-kalem="${k.id}" data-val="${mevcutDeger}"
                    style="padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 1.05em; cursor: pointer; border: 2px solid ${borderRenk}; background: ${bgRenk}; color: ${textColor}; min-width: 140px; transition: all 0.2s ease-in-out; user-select: none;">
                    ${btnText}
                </button>
            </div>
        `;
    });

    listeHtml += '</div>';
    document.getElementById('detay-kitap-listesi').innerHTML = listeHtml;

    document.querySelectorAll('.btn-durum-degistir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const oId = e.currentTarget.getAttribute('data-ogr');
            const kId = e.currentTarget.getAttribute('data-kalem');
            const val = e.currentTarget.getAttribute('data-val');
            
            if (val === '⏳') {
                const kayit = matris.find(m => m.ogrId === oId && m.targetId === kId && m.deger === '⏳');
                if (kayit && kayit.tarih) {
                    const farkGun = gunFarkiHesapla(kayit.tarih);
                    if (farkGun < minimumOkumaGunu) {
                        const mesaj = `⚠ KİTAP DEĞİŞTİRME SÜRESİ UYARISI\n\nBu kitap öğrenciye henüz ${farkGun === 0 ? 'BUGÜN' : farkGun + ' gün önce'} verilmiş! Kurala göre bir kitap en az ${minimumOkumaGunu} gün okunmalıdır.\n\n(Not: Eğer kitabı az önce yanlışlıkla verdiyseniz 'Tamam' diyerek işlemi zorla yapabilirsiniz. İptal etmek istiyor musunuz?)`;
                        if(!confirm(mesaj)) return;
                    }
                }
            }

            let newValue = '';
            let btnText = 'Okumadı';
            let bgRenk = '#f1f5f9';
            let textColor = '#64748b';
            let borderRenk = '#cbd5e1';

            if (val === '') {
                newValue = '⏳'; btnText = '⏳ Okuyor (Bugün aldı)'; bgRenk = '#fef3c7'; textColor = '#d97706'; borderRenk = '#f59e0b';
            } else if (val === '⏳') {
                newValue = '✔️'; btnText = '✔️ Okudu'; bgRenk = '#d1fae5'; textColor = '#059669'; borderRenk = '#10b981';
            } else {
                newValue = '';
            }
            
            e.currentTarget.setAttribute('data-val', newValue);
            e.currentTarget.innerText = btnText;
            e.currentTarget.style.backgroundColor = bgRenk;
            e.currentTarget.style.color = textColor;
            e.currentTarget.style.borderColor = borderRenk;

            db.saveMatrixStatus('kitap_matrisi', oId, kId, newValue);
        });
    });
}