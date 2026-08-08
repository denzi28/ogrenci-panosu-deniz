import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Pano yükleniyor...</p></div>';
    
    const kriterler = await db.getAll('davranis_kriterleri');
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const matris = await db.getAll('davranis_matrisi');

    // Yıldızları hesapla
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

    // Yıldızlara göre büyükten küçüğe sırala
    ogrenciler.sort((a, b) => b.score - a.score);

    let html = `
        <div class="card" style="border-top: 4px solid var(--success);">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 20px;">🏆 Sınıf Liderlik Panosu</h2>
            <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    if (ogrenciler.length === 0) {
        html += `<p style="text-align:center; color:#888;">Henüz öğrenci bulunmuyor.</p>`;
    } else {
        ogrenciler.forEach((ogr, index) => {
            let madalya = '';
            let bgRenk = '#f8f9fa';
            let borderRenk = '#eee';

            if (index === 0 && ogr.score > 0) { madalya = '🥇'; bgRenk = '#fffbec'; borderRenk = '#ffc107'; }
            else if (index === 1 && ogr.score > 0) { madalya = '🥈'; bgRenk = '#f8f9fa'; borderRenk = '#cbd5e1'; }
            else if (index === 2 && ogr.score > 0) { madalya = '🥉'; bgRenk = '#fff7ed'; borderRenk = '#fb923c'; }

            html += `
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
    }

    html += `</div></div>`;
    container.innerHTML = html;
}