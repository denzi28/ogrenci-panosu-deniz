import { db } from '../../js/db.js';

// Yedeklenecek tabloların listesi
const KOLEKSIYONLAR = [
    'users', 
    'duyurular', 
    'etkinlikler', 
    'davranis_kriterleri', 
    'davranis_matrisi', 
    'uygulama_kalemleri', 
    'uygulama_matrisi',
    'settings'
];

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Yedekleme modülü yükleniyor...</p></div>';

    // Görünürlük ayarlarını veritabanından çekiyoruz
    const isModuleVisible = await db.getModuleVisibility('yedekleme');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Bu alanın içeriği zaten misafirlere kapalıdır ancak menüdeki "Sistem Yedekleme" butonunu misafirlerden gizleyebilirsiniz.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--danger); text-align: center;">
            <h2 style="color: var(--danger);">💾 Sistem Yedekleme ve Kurtarma</h2>
            <p style="color: #666; margin-bottom: 20px;">Bulut veritabanınızın silinme, çalınma veya bozulma ihtimaline karşı tüm verilerinizi (Öğrenciler, puanlar, görevler) bilgisayarınıza indirebilirsiniz.</p>
            
            <div style="background: #fdf5f5; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--danger); margin-top: 0;">1. Veritabanını Bilgisayara İndir</h3>
                <p style="font-size: 0.9em; color: #555;">Haftada bir kez bu işlemi yapmanız tavsiye edilir. İnen dosyayı güvenli bir yerde saklayın.</p>
                <button id="btn-yedek-al" class="btn btn-primary" style="font-size: 1.1em; padding: 10px 20px;">
                    ⬇️ Tüm Sistemi Yedekle (.json)
                </button>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 20px; border-radius: 8px;">
                <h3 style="color: #856404; margin-top: 0;">2. Yedekten Geri Yükle (Acil Durum)</h3>
                <p style="font-size: 0.9em; color: #856404; margin-bottom: 15px;">DİKKAT: Bu işlem mevcut veritabanınızı sıfırlar ve yüklediğiniz dosyadaki verileri yazar! Sadece verileriniz silindiyse kullanın.</p>
                <input type="file" id="yedek-dosya" accept=".json" style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px; width: 100%; box-sizing: border-box;">
                <button id="btn-yedek-yukle" class="btn btn-danger" disabled style="font-size: 1.1em; padding: 10px 20px; width: 100%;">
                    ⚠️ Dosyadan Sistemi Kurtar
                </button>
            </div>
        </div>
    `;

    // 0. MODÜL GÖRÜNÜRLÜĞÜ AÇ/KAPAT
    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('yedekleme'));
        await db.toggleModuleVisibility('yedekleme', newStatus);
        
        const btn = e.target;
        if(newStatus) { 
            btn.className = "btn btn-success"; 
            btn.innerText = "Menüde Görünüyor (Gizle)"; 
        } else { 
            btn.className = "btn btn-secondary"; 
            btn.innerText = "Menüde Gizli (Göster)"; 
        }
    });

    // 1. YEDEK ALMA İŞLEMİ
    document.getElementById('btn-yedek-al').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerText = "⏳ Veriler Toplanıyor, Lütfen Bekleyin...";
        btn.disabled = true;

        try {
            let yedekVerisi = {
                olusturulmaTarihi: new Date().toISOString(),
                veriler: {}
            };

            for (let i = 0; i < KOLEKSIYONLAR.length; i++) {
                const koleksiyon = KOLEKSIYONLAR[i];
                const veriler = await db.getAll(koleksiyon);
                if (veriler && veriler.length > 0) {
                    yedekVerisi.veriler[koleksiyon] = veriler;
                }
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(yedekVerisi, null, 2));
            const indirmeLinki = document.createElement('a');
            
            const tarih = new Date().toISOString().split('T')[0];
            indirmeLinki.setAttribute("href", dataStr);
            indirmeLinki.setAttribute("download", `Sinif_Yedek_${tarih}.json`);
            document.body.appendChild(indirmeLinki);
            indirmeLinki.click();
            indirmeLinki.remove();

            btn.innerText = "✅ Yedekleme Başarılı! (Tekrar İndir)";
            btn.className = "btn btn-success";
        } catch (error) {
            console.error(error);
            alert("Yedekleme sırasında bir hata oluştu!");
            btn.innerText = "❌ Hata Oluştu. Tekrar Dene";
        } finally {
            btn.disabled = false;
        }
    });

    // 2. YEDEKTEN GERİ YÜKLEME İŞLEMİ
    const fileInput = document.getElementById('yedek-dosya');
    const btnYukle = document.getElementById('btn-yedek-yukle');

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            btnYukle.disabled = false;
        } else {
            btnYukle.disabled = true;
        }
    });

    btnYukle.addEventListener('click', async () => {
        const dosya = fileInput.files[0];
        if (!dosya) return;

        if(!confirm("DİKKAT! Bu işlem mevcut bulut sistemindeki verileri, seçtiğiniz dosyadaki verilerle değiştirecektir. Emin misiniz?")) return;

        btnYukle.innerText = "⏳ Veriler Kurtarılıyor...";
        btnYukle.disabled = true;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const yuklenenYedek = JSON.parse(e.target.result);
                
                if (!yuklenenYedek.veriler) {
                    throw new Error("Geçersiz yedek dosyası formatı!");
                }

                let kurtarılanKayitSayisi = 0;

                for (const [koleksiyonAdi, kayitlar] of Object.entries(yuklenenYedek.veriler)) {
                    for (const kayit of kayitlar) {
                        const { id, ...gercekVeri } = kayit; 
                        await db.add(koleksiyonAdi, gercekVeri);
                        kurtarılanKayitSayisi++;
                    }
                }

                alert(`🎉 Kurtarma Başarılı! Toplam ${kurtarılanKayitSayisi} kayıt buluta aktarıldı. Sistemi tam görebilmek için sayfayı yenileyin.`);
                window.location.reload();

            } catch (error) {
                console.error(error);
                alert("Dosya okunurken veya yüklenirken bir hata oluştu. Lütfen doğru dosyayı seçtiğinizden emin olun.");
                btnYukle.innerText = "⚠️ Dosyadan Sistemi Kurtar";
                btnYukle.disabled = false;
            }
        };
        reader.readAsText(dosya);
    });
}