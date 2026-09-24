import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Öğrenci verileri buluttan getiriliyor...</p></div>';
    
    const isModuleVisible = await db.getModuleVisibility('ogrenciler');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">
                    Bu butonu açarsanız, misafirler (veliler) sınıf listesini görebilir.<br>
                    <b>Not:</b> Güvenlik gereği misafirlere sadece "Ad Soyad" ve "Okul No" gösterilir.
                </p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <!-- EXCEL'DEN TOPLU EKLEME ALANI -->
        <div class="card" style="border-top: 4px solid var(--success); margin-bottom: 20px;">
            <h3 style="color: var(--success); margin-bottom: 10px;">📥 Excel'den Toplu Öğrenci Ekle</h3>
            <p style="font-size: 0.85em; color: #555; margin-bottom: 10px;">
                Excel'deki öğrenci listenizi sırasıyla <b>Ad Soyad, TC No, Okul No, Kullanıcı Adı, Şifre</b> olacak şekilde (5 sütun yan yana) kopyalayıp aşağıdaki alana yapıştırın.
            </p>
            <textarea id="bulk-input" rows="4" placeholder="Örn: Ali Yılmaz    12345678901    1453    ali123    sifre123" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; white-space: pre; overflow-wrap: normal; overflow-x: scroll;"></textarea>
            <button id="btn-bulk-kaydet" class="btn btn-success" style="margin-top: 10px;">Listeyi Toplu Sisteme Kaydet</button>
        </div>

        <!-- TEK TEK EKLEME / GÜNCELLEME ALANI -->
        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 id="form-baslik">Tekil Öğrenci Ekle / Düzenle</h3>
            <input type="hidden" id="ogr-id"> 
            
            <div class="form-group"><input type="text" id="ogr-ad" placeholder="Öğrencinin Adı Soyadı"></div>
            <div style="display:flex; gap:15px; margin-bottom:15px;">
                <div style="flex:1;"><label style="font-size:0.8em; color:#666;">TC Kimlik No</label><input type="text" id="ogr-tcno" placeholder="11 Haneli TC No" maxlength="11" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;"></div>
                <div style="flex:1;"><label style="font-size:0.8em; color:#666;">Okul Numarası</label><input type="text" id="ogr-okulno" placeholder="Örn: 1453" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;"></div>
            </div>
            <div class="form-group"><input type="text" id="ogr-kullanici" placeholder="Sisteme Giriş Kullanıcı Adı" autocomplete="off"></div>
            <div class="form-group"><input type="text" id="ogr-sifre" placeholder="Şifresi"></div>
            <div class="form-group"><input type="text" id="ogr-ozellik" placeholder="Veli Telefonu veya Özel Not (İsteğe Bağlı)"></div>
            
            <button id="btn-kaydet" class="btn btn-primary">Öğrenciyi Kaydet</button>
            <button id="btn-iptal" class="btn btn-secondary" style="display:none;">Düzenlemeyi İptal Et</button>
        </div>
        
        <div class="card" style="overflow-x: auto;" id="ogrenci-listesi"><p>⏳ Liste yükleniyor...</p></div>
    `;

    // Modül Aç/Kapa Butonu
    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const currentStatus = await db.getModuleVisibility('ogrenciler');
        const newStatus = !currentStatus;
        await db.toggleModuleVisibility('ogrenciler', newStatus);
        
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    // TOPLU KAYDETME İŞLEMİ
    document.getElementById('btn-bulk-kaydet').addEventListener('click', async () => {
        const text = document.getElementById('bulk-input').value.trim();
        if(!text) return alert("Lütfen kaydetmeden önce Excel'den verileri kopyalayıp kutuya yapıştırın.");
        
        const btn = document.getElementById('btn-bulk-kaydet');
        btn.disabled = true;
        btn.innerText = "⏳ Yükleniyor, lütfen bekleyin...";
        
        const satirlar = text.split('\n');
        const mevcutKullanicilar = await db.getAll('users');
        let basariliAdet = 0;
        let hataliAdet = 0;

        for(const satir of satirlar) {
            if(!satir.trim()) continue; 
            
            const sutunlar = satir.split('\t').map(s => s.trim());
            
            const ad = sutunlar[0] || '';
            const tcno = sutunlar[1] || '';
            const okulno = sutunlar[2] || '';
            const kullanici = sutunlar[3] || '';
            const sifre = sutunlar[4] || '';

            if(!ad || !kullanici || !sifre) {
                hataliAdet++;
                continue;
            }

            if(mevcutKullanicilar.find(u => u.username === kullanici)) {
                hataliAdet++;
                continue;
            }

            await db.add('users', {
                name: ad,
                tcno: tcno,
                okulno: okulno,
                username: kullanici,
                password: sifre,
                ozellik: '',
                role: 'student'
            });

            mevcutKullanicilar.push({ username: kullanici });
            basariliAdet++;
        }

        document.getElementById('bulk-input').value = '';
        btn.disabled = false;
        btn.innerText = "Listeyi Toplu Sisteme Kaydet";

        alert(`Toplu Yükleme Tamamlandı!\n\n✅ Başarıyla Eklenen: ${basariliAdet}\n❌ Hatalı/Eksik veya Aynı Kullanıcı Adı: ${hataliAdet}`);
        await listeyiGuncelle();
    });

    // Tekil Kaydetme İşlemi
    document.getElementById('btn-kaydet').addEventListener('click', async () => {
        const id = document.getElementById('ogr-id').value;
        const ad = document.getElementById('ogr-ad').value;
        const tcno = document.getElementById('ogr-tcno').value;
        const okulno = document.getElementById('ogr-okulno').value;
        const kullanici = document.getElementById('ogr-kullanici').value;
        const sifre = document.getElementById('ogr-sifre').value;
        const ozellik = document.getElementById('ogr-ozellik').value;

        if (!ad || !kullanici || !sifre) return alert("Ad, Kullanıcı Adı ve Şifre alanları zorunludur!");
        
        const btn = document.getElementById('btn-kaydet');
        btn.disabled = true; btn.innerText = "Kaydediliyor...";

        const yeniVeri = { name: ad, tcno: tcno, okulno: okulno, username: kullanici, password: sifre, ozellik: ozellik };

        if (id) {
            await db.update('users', id, yeniVeri);
            alert("Öğrenci bilgileri güncellendi.");
        } else {
            const mevcutKullanicilar = await db.getAll('users');
            if(mevcutKullanicilar.find(u => u.username === kullanici)) {
                btn.disabled = false; btn.innerText = "Öğrenciyi Kaydet";
                return alert("Bu kullanıcı adı zaten kullanılıyor. Lütfen farklı bir tane seçin.");
            }
            yeniVeri.role = 'student';
            await db.add('users', yeniVeri);
        }
        
        formuTemizle();
        await listeyiGuncelle();
    });

    document.getElementById('btn-iptal').addEventListener('click', formuTemizle);
    await listeyiGuncelle();
}

function formuTemizle() {
    document.getElementById('ogr-id').value = ''; document.getElementById('ogr-ad').value = '';
    document.getElementById('ogr-tcno').value = ''; document.getElementById('ogr-okulno').value = '';
    document.getElementById('ogr-kullanici').value = ''; document.getElementById('ogr-sifre').value = '';
    document.getElementById('ogr-ozellik').value = '';
    document.getElementById('form-baslik').innerText = "Tekil Öğrenci Ekle / Düzenle";
    document.getElementById('btn-kaydet').innerText = "Öğrenciyi Kaydet";
    document.getElementById('btn-kaydet').disabled = false;
    document.getElementById('btn-iptal').style.display = 'none';
}

async function listeyiGuncelle() {
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    
    // OKUL NUMARASINA GÖRE SIRALAMA
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });

    let html = `<h3>Sınıf Listesi (${ogrenciler.length} Öğrenci)</h3>`;
    
    if (ogrenciler.length === 0) { html += `<p>Sınıfa henüz öğrenci eklenmemiş.</p>`; } 
    else {
        html += `<table style="width: 100%; border-collapse: collapse; min-width: 800px; font-size: 0.9em; margin-top: 15px;">
            <thead><tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 10px; width: 40px;">SN</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 80px;">Okul No</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 110px;">TC No</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Adı Soyadı</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Kullanıcı Adı</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Şifre</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Not/Özellik</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 140px;">İşlemler</th>
            </tr></thead><tbody>`;

        ogrenciler.forEach((ogr, index) => {
            // ZEBRA DESENİ İÇİN SATIR RENGİ: Çift sayılar beyaz, tek sayılar çok hafif gri-mavi
            let satirArkaPlan = index % 2 === 0 ? '#ffffff' : '#f1f5f9';

            html += `<tr style="background-color: ${satirArkaPlan}; transition: background-color 0.2s;">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${ogr.okulno || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${ogr.tcno || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: var(--primary);">${ogr.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${ogr.username}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${ogr.password}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.9em; color: var(--secondary);">${ogr.ozellik || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-secondary btn-duzenle" data-id="${ogr.id}" style="padding: 4px 8px; font-size: 0.85em;">Düzenle</button>
                        <button class="btn btn-danger btn-sil" data-id="${ogr.id}" style="padding: 4px 8px; font-size: 0.85em;">Sil</button>
                    </div>
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }
    
    document.getElementById('ogrenci-listesi').innerHTML = html;

    document.querySelectorAll('.btn-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Silmek istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.delete('users', e.target.getAttribute('data-id'));
                await listeyiGuncelle();
            }
        });
    });

    document.querySelectorAll('.btn-duzenle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const tumKullanicilar = await db.getAll('users');
            const ogrenci = tumKullanicilar.find(u => u.id === id);
            
            if (ogrenci) {
                document.getElementById('ogr-id').value = ogrenci.id;
                document.getElementById('ogr-ad').value = ogrenci.name;
                document.getElementById('ogr-tcno').value = ogrenci.tcno || '';
                document.getElementById('ogr-okulno').value = ogrenci.okulno || '';
                document.getElementById('ogr-kullanici').value = ogrenci.username;
                document.getElementById('ogr-sifre').value = ogrenci.password;
                document.getElementById('ogr-ozellik').value = ogrenci.ozellik || '';
                
                document.getElementById('form-baslik').innerText = "Öğrenci Bilgilerini Güncelle";
                document.getElementById('btn-kaydet').innerText = "Değişiklikleri Kaydet";
                document.getElementById('btn-iptal').style.display = 'inline-block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}