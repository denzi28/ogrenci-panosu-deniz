import { db } from '../../js/db.js';
import { utils } from '../../js/utils.js';

export async function render(container) {
    const isModuleVisible = await db.getModuleVisibility('etkinlikler');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Herkese Açık (Kapat)' : 'Gizli (Misafirlere Aç)';

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda misafirler de (veliler) etkinlik takvimini görebilir.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--primary);">
            <h3 id="form-baslik">Yeni Etkinlik Ekle</h3>
            <input type="hidden" id="etkinlik-id">
            
            <div class="form-group">
                <input type="text" id="etkinlik-baslik" placeholder="Etkinlik Adı (Örn: Müze Gezisi, Veli Toplantısı)">
            </div>
            <div class="form-group" style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label style="font-size: 0.85em; color: #666; font-weight: bold;">Etkinlik Tarihi ve Saati</label>
                    <input type="datetime-local" id="etkinlik-tarih" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
            <div class="form-group" style="margin-top: 15px;">
                <textarea id="etkinlik-detay" placeholder="Etkinlik Detayları (Nerede yapılacak, ne getirilecek vs. - Link ekleyebilirsiniz)" rows="3"></textarea>
            </div>
            
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="etkinlik-misafir"> 
                <span style="font-weight: bold; color: #444;">Bu etkinliği misafirler de görebilsin</span>
            </label><br>
            
            <button id="btn-etkinlik-kaydet" class="btn btn-primary">Etkinlik Ekle</button>
            <button id="btn-etkinlik-iptal" class="btn btn-secondary" style="display:none;">Vazgeç</button>
        </div>
        
        <div class="card" id="etkinlik-listesi"><p>⏳ Etkinlikler yükleniyor...</p></div>
    `;

    // Modül Aç/Kapat
    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('etkinlikler'));
        await db.toggleModuleVisibility('etkinlikler', newStatus);
        
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Herkese Açık (Kapat)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Gizli (Misafirlere Aç)"; }
    });

    // Kaydet / Güncelle
    document.getElementById('btn-etkinlik-kaydet').addEventListener('click', async () => {
        const id = document.getElementById('etkinlik-id').value;
        const baslik = document.getElementById('etkinlik-baslik').value.trim();
        const tarih = document.getElementById('etkinlik-tarih').value;
        const detay = document.getElementById('etkinlik-detay').value.trim();
        const misafirGorsunMu = document.getElementById('etkinlik-misafir').checked;

        if (!baslik || !tarih) return alert("Lütfen etkinlik adı ve tarihini giriniz.");
        
        const btn = document.getElementById('btn-etkinlik-kaydet');
        btn.disabled = true; btn.innerText = "Kaydediliyor...";
        
        if (id) {
            await db.update('etkinlikler', id, { baslik, tarih, detay, visibleToGuest: misafirGorsunMu });
        } else {
            await db.add('etkinlikler', { baslik, tarih, detay, visibleToGuest: misafirGorsunMu });
        }
        
        formuTemizle();
        await listeyiGuncelle();
    });

    document.getElementById('btn-etkinlik-iptal').addEventListener('click', formuTemizle);

    await listeyiGuncelle();
}

function formuTemizle() {
    document.getElementById('etkinlik-id').value = '';
    document.getElementById('etkinlik-baslik').value = '';
    document.getElementById('etkinlik-tarih').value = '';
    document.getElementById('etkinlik-detay').value = '';
    document.getElementById('etkinlik-misafir').checked = false;
    
    document.getElementById('form-baslik').innerText = "Yeni Etkinlik Ekle";
    const btn = document.getElementById('btn-etkinlik-kaydet');
    btn.disabled = false; btn.innerText = "Etkinlik Ekle";
    document.getElementById('btn-etkinlik-iptal').style.display = 'none';
}

async function listeyiGuncelle() {
    const list = await db.getAll('etkinlikler');
    // Tarihi en yakın olan en üstte çıksın diye sıralıyoruz
    list.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    let html = `<h3>Planlanan Etkinlikler (${list.length})</h3>`;
    
    if(list.length === 0) {
        html += `<p style="color: #666;">Şu an planlanmış bir etkinlik bulunmuyor.</p>`;
    }

    list.forEach(item => {
        const etkinlikZamani = new Date(item.tarih);
        const gectiMi = etkinlikZamani < new Date(); // Tarihi geçmiş mi kontrolü
        
        html += `
        <div class="item-row" style="align-items: flex-start; ${gectiMi ? 'opacity: 0.6; background: #f9f9f9;' : 'border-left: 4px solid var(--primary);'}">
            <div style="flex: 1; padding-right: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <strong style="font-size: 1.1em; color: ${gectiMi ? '#888' : '#333'};">${item.baslik}</strong> 
                    ${gectiMi ? '<span class="badge" style="background:#ddd; color:#555;">Süresi Geçti</span>' : ''}
                    <span class="badge ${item.visibleToGuest ? 'public' : ''}">${item.visibleToGuest ? 'Herkese Açık' : 'Sadece Öğrenciler'}</span>
                </div>
                <div style="font-weight: bold; color: var(--danger); font-size: 0.95em; margin-bottom: 8px;">
                    🗓️ ${utils.formatDate(item.tarih)}
                </div>
                <p style="margin:8px 0; font-size:0.95em; line-height: 1.5; white-space: pre-wrap;">${utils.linkify(item.detay)}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-primary btn-duzenle" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Düzenle</button>
                <button class="btn btn-secondary btn-gizle" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Aç/Kapat</button>
                <button class="btn btn-danger btn-sil" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.85em;">Sil</button>
            </div>
        </div>`;
    });
    
    document.getElementById('etkinlik-listesi').innerHTML = html;

    // İşlem Butonları
    document.querySelectorAll('.btn-sil').forEach(btn => btn.addEventListener('click', async (e) => { 
        if(confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
            e.target.innerText = "...";
            await db.delete('etkinlikler', e.target.getAttribute('data-id')); 
            await listeyiGuncelle(); 
        }
    }));
    
    document.querySelectorAll('.btn-gizle').forEach(btn => btn.addEventListener('click', async (e) => { 
        e.target.innerText = "...";
        await db.toggleVisibility('etkinlikler', e.target.getAttribute('data-id')); 
        await listeyiGuncelle(); 
    }));

    document.querySelectorAll('.btn-duzenle').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const tumEtkinlikler = await db.getAll('etkinlikler');
        const etkinlik = tumEtkinlikler.find(d => d.id === id);
        
        if (etkinlik) {
            document.getElementById('etkinlik-id').value = etkinlik.id;
            document.getElementById('etkinlik-baslik').value = etkinlik.baslik;
            document.getElementById('etkinlik-tarih').value = etkinlik.tarih;
            document.getElementById('etkinlik-detay').value = etkinlik.detay || '';
            document.getElementById('etkinlik-misafir').checked = etkinlik.visibleToGuest || false;
            
            document.getElementById('form-baslik').innerText = "Etkinliği Düzenle";
            document.getElementById('btn-etkinlik-kaydet').innerText = "Etkinliği Güncelle";
            document.getElementById('btn-etkinlik-iptal').style.display = 'inline-block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }));
}