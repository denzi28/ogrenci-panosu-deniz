import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ İhtiyaç tablosu buluttan getiriliyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('ihtiyaclar');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda misafirler (veliler) sadece neye ihtiyaç olduğunu liste halinde görür, kimin getirip getirmediğini göremez.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3>1. Aşama: İhtiyaç Kalemlerini Belirle</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="yeni-ihtiyac-ad" placeholder="Örn: A4 Kağıdı, Peçete, 200+200 TL" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <button id="btn-ihtiyac-ekle" class="btn btn-primary">Sütun Ekle</button>
            </div>
            <div id="ihtiyac-basliklari" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
        </div>

        <div class="card" style="overflow-x: auto;">
            <h3>2. Aşama: Sınıf Takip Tablosu</h3>
            <p style="font-size:0.85em; color:#666; margin-bottom: 15px;">Hücrelere "x", "Devamsız" veya miktar yazabilirsiniz. Başka yere tıkladığınız an buluta otomatik kaydedilir.</p>
            <div id="ihtiyac-tablosu-alani"><p>⏳ Tablo yükleniyor...</p></div>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('ihtiyaclar'));
        await db.toggleModuleVisibility('ihtiyaclar', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-ihtiyac-ekle').addEventListener('click', async () => {
        const ad = document.getElementById('yeni-ihtiyac-ad').value.trim();
        if (ad) {
            const btn = document.getElementById('btn-ihtiyac-ekle');
            btn.disabled = true; btn.innerText = "...";
            await db.add('ihtiyac_kalemleri', { ad: ad });
            document.getElementById('yeni-ihtiyac-ad').value = '';
            btn.disabled = false; btn.innerText = "Sütun Ekle";
            await arayuzuGuncelle();
        }
    });

    await arayuzuGuncelle();
}

async function arayuzuGuncelle() {
    const kalemler = await db.getAll('ihtiyac_kalemleri');
    const tumKullanicilar = await db.getAll('users');
    const ogrenciler = tumKullanicilar.filter(u => u.role === 'student');
    const matris = await db.getAll('ihtiyac_matrisi');

    // --- YENİ: OKUL NUMARASINA GÖRE SIRALAMA ---
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });
    // -------------------------------------------

    let basliklarHtml = '';
    kalemler.forEach(k => {
        basliklarHtml += `
            <div style="background: #f1f1f1; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #ddd;">
                <span style="font-size: 0.9em; font-weight: bold;">${k.ad}</span>
                <button class="btn-kalem-sil" data-id="${k.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;">✕</button>
            </div>
        `;
    });
    document.getElementById('ihtiyac-basliklari').innerHTML = basliklarHtml;

    document.querySelectorAll('.btn-kalem-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Bu sütunu silmek istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.delete('ihtiyac_kalemleri', e.target.getAttribute('data-id'));
                await arayuzuGuncelle();
            }
        });
    });

    if (kalemler.length === 0) {
        document.getElementById('ihtiyac-tablosu-alani').innerHTML = '<p style="color:var(--secondary);">Lütfen önce yukarıdan en az bir ihtiyaç kalemi ekleyin.</p>';
        return;
    }

    let tabloHtml = `
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.9em;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px; width: 30px;">SN</th>
                    <th style="border: 1px solid #ddd; padding: 8px; width: 60px;">OKUL NO</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ADI SOYADI</th>
                    ${kalemler.map(k => `<th style="border: 1px solid #ddd; padding: 8px;">${k.ad}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    ogrenciler.forEach((ogr, index) => {
        tabloHtml += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${ogr.okulno || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${ogr.name}</td>
        `;

        kalemler.forEach(k => {
            let hucreDegeri = matris.find(m => m.ogrId === ogr.id && m.targetId === k.id)?.deger || '';
            let textColor = hucreDegeri.toLowerCase() === 'devamsız' ? 'red' : 'inherit';
            
            tabloHtml += `
                <td style="border: 1px solid #ddd; padding: 0;">
                    <input type="text" class="hucre-input" data-ogr="${ogr.id}" data-kalem="${k.id}" value="${hucreDegeri}" 
                           style="width: 100%; height: 100%; padding: 8px; border: none; text-align: center; color: ${textColor}; font-weight: ${hucreDegeri ? 'bold' : 'normal'}; box-sizing: border-box; outline: none; background: transparent;">
                </td>
            `;
        });
        tabloHtml += `</tr>`;
    });

    tabloHtml += `</tbody></table>`;
    document.getElementById('ihtiyac-tablosu-alani').innerHTML = tabloHtml;

    document.querySelectorAll('.hucre-input').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.style.color = e.target.value.toLowerCase() === 'devamsız' ? 'red' : 'inherit';
            e.target.style.fontWeight = e.target.value ? 'bold' : 'normal';
        });

        input.addEventListener('change', async (e) => {
            const ogrId = e.target.getAttribute('data-ogr');
            const kalemId = e.target.getAttribute('data-kalem');
            const deger = e.target.value.trim();
            
            e.target.style.backgroundColor = '#fff3cd'; 
            await db.saveMatrixStatus('ihtiyac_matrisi', ogrId, kalemId, deger);
            e.target.style.backgroundColor = '#e6ffed'; 
            setTimeout(() => { e.target.style.backgroundColor = 'transparent'; }, 800);
        });
    });
}