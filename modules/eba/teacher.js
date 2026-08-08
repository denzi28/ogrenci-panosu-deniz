import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ EBA Şifreleri buluttan getiriliyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('eba');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
            <div><h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü (Misafirler İçin)</h3></div>
            <div><button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button></div>
        </div>
        <div class="card" style="border-top: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: center;"><h3>🔑 EBA Şifre Yönetimi</h3></div>
            <p style="font-size: 0.9em; color: #666; margin-top: 10px;">Öğrencilerin EBA şifrelerini aşağıdaki tablodan yönetebilirsiniz.</p>
        </div>
        <div class="card" style="overflow-x: auto;" id="eba-listesi"><p>⏳ Liste yükleniyor...</p></div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('eba'));
        await db.toggleModuleVisibility('eba', newStatus);
        
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    await listeyiGuncelle();
}

async function listeyiGuncelle() {
    const users = await db.getAll('users');
    const ogrenciler = users.filter(u => u.role === 'student');
    
    // --- YENİ: OKUL NUMARASINA GÖRE SIRALAMA ---
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });
    // -------------------------------------------

    let html = `<h3>Sınıf Listesi (${ogrenciler.length} Öğrenci)</h3>`;
    
    if (ogrenciler.length === 0) {
        html += `<p style="color: var(--danger);">Sınıfa henüz öğrenci eklenmemiş.</p>`;
    } else {
        html += `<table style="width: 100%; border-collapse: collapse; min-width: 800px; font-size: 0.9em; margin-top: 15px;">
            <thead><tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 10px; width: 40px;">SN</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 80px;">Okul No</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Adı Soyadı</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 220px; text-align: left;">EBA Şifresi</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 140px;">İşlemler</th>
            </tr></thead><tbody>`;

        ogrenciler.forEach((ogr, index) => {
            const mevcutSifre = ogr.ebaPassword || '';
            const bgRenk = mevcutSifre ? '#f4faf6' : '#fff'; 
            
            html += `<tr style="background: ${bgRenk};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${ogr.okulno || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: var(--primary);">${ogr.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">
                    <input type="text" id="eba-input-${ogr.id}" value="${mevcutSifre}" placeholder="Şifre Girin..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; letter-spacing: 1px; box-sizing: border-box;">
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-primary btn-eba-kaydet" data-id="${ogr.id}" style="padding: 6px 10px; font-size: 0.85em;">Kaydet</button>
                        <button class="btn btn-danger btn-eba-sil" data-id="${ogr.id}" style="padding: 6px 10px; font-size: 0.85em;" ${!mevcutSifre ? 'disabled' : ''}>Sil</button>
                    </div>
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }
    
    const listContainer = document.getElementById('eba-listesi');
    listContainer.innerHTML = html;

    listContainer.querySelectorAll('.btn-eba-kaydet').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const inputVal = document.getElementById(`eba-input-${id}`).value.trim();
            if(!inputVal) return alert("Lütfen kaydetmek için bir şifre giriniz.");
            
            e.target.innerText = "...";
            await db.update('users', id, { ebaPassword: inputVal });
            
            e.target.innerText = "Kaydedildi ✔";
            e.target.className = "btn btn-success btn-eba-kaydet";
            setTimeout(() => { listeyiGuncelle(); }, 800);
        });
    });

    listContainer.querySelectorAll('.btn-eba-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if(confirm("EBA şifresini kaldırmak istediğinize emin misiniz?")) {
                e.target.innerText = "...";
                await db.update('users', id, { ebaPassword: "" }); 
                await listeyiGuncelle();
            }
        });
    });
}