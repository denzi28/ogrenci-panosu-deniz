import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';

let aktifGorevId = null; 

function tarihFormatla(tarihStr) {
    if (!tarihStr) return 'Belirtilmedi';
    return tarihStr.split('-').reverse().join('.');
}

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Etkileşimli Görevler yükleniyor...</p></div>';

    const userId = auth.currentUser.id;
    const kalemler = await db.getAll('uygulama_kalemleri');
    const matris = await db.getAll('uygulama_matrisi');
    
    // Katılım hesaplaması için tüm öğrencileri çekiyoruz
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const toplamOgrenciSayisi = ogrenciler.length;

    let html = `
        <div class="card" style="border-left: 4px solid var(--primary);">
            <h2 style="color: var(--primary);">🎮 İnteraktif Görevlerim</h2>
            <p style="color: #666; margin-bottom: 20px;">Aşağıdaki görevlere tıklayarak etkinlikleri başlatabilirsiniz.</p>
            <div style="display: flex; flex-direction: column; gap: 15px;">
    `;

    if (kalemler.length === 0) {
        html += `<p style="color: #888;">Henüz atanmış bir görev bulunmuyor.</p>`;
    } else {
        kalemler.forEach(k => {
            let kayit = matris.find(m => m.ogrId === userId && m.targetId === k.id);
            let durum = kayit ? kayit.deger : null;
            
            let btnMetin = durum ? `Tamamlandı (Sonuç: ${durum})` : "▶️ Görevi Başlat";
            let btnClass = durum ? `btn-success` : `btn-primary`;

            // Katılım Rozeti Hesaplama
            const tamamlayanSayisi = matris.filter(m => m.targetId === k.id && m.deger && m.deger !== '').length;
            const tamamlandiMiSınıf = (tamamlayanSayisi === toplamOgrenciSayisi && toplamOgrenciSayisi > 0);
            
            const rozetBg = tamamlandiMiSınıf ? '#d1fae5' : '#e2e8f0';
            const rozetText = tamamlandiMiSınıf ? '#065f46' : '#475569';
            const katilimRozeti = `<span style="display: inline-block; margin-top: 8px; background: ${rozetBg}; color: ${rozetText}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">📊 Sınıf Katılımı: ${tamamlayanSayisi} / ${toplamOgrenciSayisi}</span>`;

            html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span style="font-weight: bold; font-size: 1.1em; color: #333;">${k.ad}</span>
                    <button class="btn ${btnClass} btn-baslat" data-id="${k.id}" data-link="${k.link}">${btnMetin}</button>
                </div>
                ${k.aciklama ? `<div style="font-size: 0.95em; color: #444; background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid var(--primary);">📝 ${k.aciklama}</div>` : ''}
                <div style="font-size: 0.85em; color: #777; font-weight: bold;">
                    📅 Tarih: ${tarihFormatla(k.baslangic)} - ${tarihFormatla(k.bitis)}
                    <br>${katilimRozeti}
                </div>
            </div>`;
        });
    }

    html += `</div></div>`;

    html += `
        <div id="oyun-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; flex-direction: column;">
            <div style="background: #fff; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                <h3 id="modal-baslik" style="margin: 0; color: var(--primary);">Görev</h3>
                <button id="btn-kapat" class="btn btn-danger">Kapat (Çıkış)</button>
            </div>
            <div style="flex: 1; width: 100%; background: #000;">
                <iframe id="oyun-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        </div>
    `;

    container.innerHTML = html;

    document.querySelectorAll('.btn-baslat').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const link = e.target.getAttribute('data-link');
            aktifGorevId = e.target.getAttribute('data-id'); 
            
            const parentDiv = e.target.closest('div').parentElement;
            const baslikElementi = parentDiv.querySelector('span');
            document.getElementById('modal-baslik').innerText = baslikElementi.innerText;
            
            document.getElementById('oyun-iframe').src = link;
            document.getElementById('oyun-modal').style.display = 'flex';
        });
    });

    document.getElementById('btn-kapat').addEventListener('click', () => {
        document.getElementById('oyun-modal').style.display = 'none';
        document.getElementById('oyun-iframe').src = "";
        aktifGorevId = null;
    });

    window.addEventListener('message', async (event) => {
        if (event.data && event.data.islem === 'gorev_bitti' && aktifGorevId) {
            const alinanPuan = event.data.puan !== undefined ? event.data.puan : "Tamamlandı";
            const oyunLimiti = event.data.limit; 
            
            let kaydedilecekDeger = alinanPuan;
            
            if (oyunLimiti && !isNaN(alinanPuan)) {
                kaydedilecekDeger = `${alinanPuan}/${oyunLimiti}`;
            }
            
            kaydedilecekDeger = String(kaydedilecekDeger);
            
            document.getElementById('oyun-modal').style.display = 'none';
            document.getElementById('oyun-iframe').src = "";
            
            await db.saveMatrixStatus('uygulama_matrisi', userId, aktifGorevId, kaydedilecekDeger);
            
            alert(`Tebrikler! Görevi başarıyla tamamladınız. Sonucunuz (${kaydedilecekDeger}) öğretmeninize iletildi.`);
            aktifGorevId = null;
            
            render(container); 
        }
    });
}