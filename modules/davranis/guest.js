import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Pano hızla yükleniyor...</p></div>';
    
    // Tüm verileri buluttan tek seferde (paralel) çekiyoruz
    const [kriterler, tumKullanicilar, matris] = await Promise.all([
        db.getAll('davranis_kriterleri'),
        db.getAll('users'),
        db.getAll('davranis_matrisi')
    ]);
    
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');

    // 1. Her öğrencinin toplam yıldızını hesapla
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

    // 2. Yıldız sayısına göre öğrencileri büyükten küçüğe sırala
    ogrenciler.sort((a, b) => b.score - a.score);

    // 3. Eşit puanlılara aynı madalyayı vermek için benzersiz (farklı) puanları bul
    const benzersizPuanlar = [...new Set(ogrenciler.map(o => o.score))].filter(p => p > 0).sort((a, b) => b - a);
    const birinciPuan = benzersizPuanlar[0] || -1;
    const ikinciPuan = benzersizPuanlar[1] || -1;
    const ucuncuPuan = benzersizPuanlar[2] || -1;

    let html = `
        <div class="card" style="border-top: 4px solid var(--success);">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 20px;">🏆 Sınıf Liderlik Panosu</h2>
            <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    if (ogrenciler.length === 0) {
        html += `<p style="text-align:center; color:#888;">Henüz öğrenci bulunmuyor.</p>`;
    } else {
        ogrenciler.forEach((ogr) => {
            let madalya = '';
            let bgRenk = '#f8f9fa';
            let borderRenk = '#eee';
            let gosterilecekSira = '';

            // 0'dan büyük bir puanı varsa sıralamaya sok
            if (ogr.score > 0) {
                if (ogr.score === birinciPuan) { 
                    madalya = '🥇'; bgRenk = '#fffbec'; borderRenk = '#ffc107'; 
                } else if (ogr.score === ikinciPuan) { 
                    madalya = '🥈'; bgRenk = '#f8f9fa'; borderRenk = '#cbd5e1'; 
                } else if (ogr.score === ucuncuPuan) { 
                    madalya = '🥉'; bgRenk = '#fff7ed'; borderRenk = '#fb923c'; 
                }
                
                // Madalyası yoksa, benzersiz puanlardaki kaçıncı sıradaysa o sayıyı yaz (Örn: 4, 5)
                gosterilecekSira = madalya || (benzersizPuanlar.indexOf(ogr.score) + 1);
            } else {
                gosterilecekSira = '-'; // 0 puanlılara - koy
            }

            html += `
            <div style="background: ${bgRenk}; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${borderRenk}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 1.8em; width: 40px; text-align: center; font-weight: bold; color: #555;">${gosterilecekSira}</span>
                    <span style="font-size: 1.2em; font-weight: bold; color: var(--primary);">${ogr.name}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 2em; font-weight: 900; color: var(--danger);">${ogr.score} <span style="font-size:0.6em;">⭐</span></span>
                    <span style="font-size: 0.8em; font-weight: bold; color: #888; display: block; margin-top: -5px;">TOPLAM YILDIZ</span>
                </div>
            </div>`;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}