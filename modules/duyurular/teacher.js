import { db } from '../../js/db.js';
import { utils } from '../../js/utils.js';

export async function render(container) {
    const isModuleVisible = await db.getModuleVisibility('duyurular');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Herkese Açık (Kapat)' : 'Gizli (Misafirlere Aç)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Bu modülü gizlerseniz, misafirlerin menüsünden kaybolur.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>
        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 id="form-baslik">Yeni Duyuru Ekle</h3>
            <input type="hidden" id="duyuru-id">
            
            <div class="form-group">
                <input type="text" id="duyuru-baslik" placeholder="Duyuru Başlığı">
            </div>
            <div class="form-group">
                <textarea id="duyuru-icerik" placeholder="Duyuru Detayı" rows="3"></textarea>
            </div>
            <!-- YENİ: LİNK KUTUSU -->
            <div class="form-group">
                <input type="text" id="duyuru-link" placeholder="🔗 Link / Bağlantı (İsteğe Bağlı - Örn: Google Drive veya EBA linki)">
            </div>
            <label><input type="checkbox" id="duyuru-misafir"> Bu duyuruyu misafirler de görebilsin</label><br><br>
            
            <button id="btn-duyuru-kaydet" class="btn btn-primary">Duyuru Ekle</button>
            <button id="btn-duyuru-iptal" class="btn btn-secondary" style="display:none;">Vazgeç</button>
        </div>
        <div class="card" id="duyuru-listesi"><p>⏳ Duyurular yükleniyor...</p></div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const currentStatus = await db.getModuleVisibility('duyurular');
        const newStatus = !currentStatus;
        await db.toggleModuleVisibility('duyurular', newStatus);
        
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Herkese Açık (Kapat)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Gizli (Misafirlere Aç)"; }
    });

    document.getElementById('btn-duyuru-kaydet').addEventListener('click', async () => {
        const id = document.getElementById('duyuru-id').value;
        const baslik = document.getElementById('duyuru-baslik').value.trim();
        const icerik = document.getElementById('duyuru-icerik').value.trim();
        const link = document.getElementById('duyuru-link').value.trim();
        const misafirGorsunMu = document.getElementById('duyuru-misafir').checked;

        if (!baslik || !icerik) return alert("Başlık ve içerik giriniz.");
        
        const btn = document.getElementById('btn-duyuru-kaydet');
        btn.disabled = true;
        btn.innerText = "Kaydediliyor...";
        
        if (id) {
            await db.update('duyurular', id, { baslik: baslik, icerik: icerik, link: link, visibleToGuest: misafirGorsunMu });
            alert("Duyuru başarıyla güncellendi.");
        } else {
            await db.add('duyurular', { baslik: baslik, icerik: icerik, link: link, visibleToGuest: misafirGorsunMu });
        }
        
        formuTemizle();
        await listeyiGuncelle();
    });

    document.getElementById('btn-duyuru-iptal').addEventListener('click', formuTemizle);

    await listeyiGuncelle();
}

function formuTemizle() {
    document.getElementById('duyuru-id').value = '';
    document.getElementById('duyuru-baslik').value = '';
    document.getElementById('duyuru-icerik').value = '';
    document.getElementById('duyuru-link').value = '';
    document.getElementById('duyuru-misafir').checked = false;
    
    document.getElementById('form-baslik').innerText = "Yeni Duyuru Ekle";
    
    const btnKaydet = document.getElementById('btn-duyuru-kaydet');
    btnKaydet.disabled = false;
    btnKaydet.innerText = "Duyuru Ekle";
    
    document.getElementById('btn-duyuru-iptal').style.display = 'none';
}

async function listeyiGuncelle() {
    const list = await db.getAll('duyurular');
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = `<h3>Tüm Duyurular (${list.length})</h3>`;
    list.forEach(item => {
        // Link varsa buton oluştur
        let linkBtn = '';
        if (item.link) {
            let href = item.link.startsWith('http') ? item.link : 'https://' + item.link;
            linkBtn = `<a href="${href}" target="_blank" class="btn" style="display:inline-block; margin-top:10px; background:#e8f4fd; color:var(--primary); border:1px solid var(--primary); padding:6px 12px; font-size:0.9em; font-weight:bold;">🔗 İlgili Bağlantıya Git</a>`;
        }

        html += `
        <div class="item-row" style="align-items: flex-start;">
            <div style="flex: 1; padding-right: 15px;">
                <strong>${item.baslik}</strong> <span class="badge ${item.visibleToGuest ? 'public' : ''}" style="margin-left: 5px;">${item.visibleToGuest ? 'Herkese Açık' : 'Sadece Öğrenciler'}</span>
                <p style="margin:8px 0; font-size:0.95em; line-height: 1.5; white-space: pre-wrap;">${utils.linkify(item.icerik)}</p>
                ${linkBtn}
                <br><small style="color: #888; display:inline-block; margin-top:8px;">${utils.formatDate(item.createdAt)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-primary btn-duzenle" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Düzenle</button>
                <button class="btn btn-secondary btn-gizle" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Aç/Kapat</button>
                <button class="btn btn-danger btn-sil" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Sil</button>
            </div>
        </div>`;
    });
    document.getElementById('duyuru-listesi').innerHTML = html;

    document.querySelectorAll('.btn-sil').forEach(btn => btn.addEventListener('click', async (e) => { 
        if(confirm("Silmek istediğinize emin misiniz?")) {
            e.target.innerText = "...";
            await db.delete('duyurular', e.target.getAttribute('data-id')); 
            await listeyiGuncelle(); 
        }
    }));
    
    document.querySelectorAll('.btn-gizle').forEach(btn => btn.addEventListener('click', async (e) => { 
        e.target.innerText = "...";
        await db.toggleVisibility('duyurular', e.target.getAttribute('data-id')); 
        await listeyiGuncelle(); 
    }));

    document.querySelectorAll('.btn-duzenle').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const tumDuyurular = await db.getAll('duyurular');
        const duyuru = tumDuyurular.find(d => d.id === id);
        
        if (duyuru) {
            document.getElementById('duyuru-id').value = duyuru.id;
            document.getElementById('duyuru-baslik').value = duyuru.baslik;
            document.getElementById('duyuru-icerik').value = duyuru.icerik;
            document.getElementById('duyuru-link').value = duyuru.link || '';
            document.getElementById('duyuru-misafir').checked = duyuru.visibleToGuest || false;
            
            document.getElementById('form-baslik').innerText = "Duyuruyu Düzenle";
            document.getElementById('btn-duyuru-kaydet').innerText = "Duyuruyu Güncelle";
            document.getElementById('btn-duyuru-iptal').style.display = 'inline-block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }));
}