import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⚡ Beslenme programı yükleniyor...</p></div>';

    const isModuleVisible = await db.getModuleVisibility('beslenme');
    const btnClass = isModuleVisible ? 'btn-success' : 'btn-secondary';
    const btnText = isModuleVisible ? 'Menüde Görünüyor (Gizle)' : 'Menüde Gizli (Göster)';

    // Mevcut beslenme programını çek
    const kayitlar = await db.getAll('beslenme_programi');
    const plan = kayitlar.length > 0 ? kayitlar[0] : { pazartesi: '', sali: '', carsamba: '', persembe: '', cuma: '' };
    const planId = kayitlar.length > 0 ? plan.id : null;

    container.innerHTML = `
        <div class="card" style="background: #e8f4fd; border: 1px solid var(--primary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: var(--primary);">👀 Modül Görünürlüğü</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Açık olduğunda veliler ve öğrenciler haftalık beslenme menüsünü görebilir.</p>
            </div>
            <div>
                <button id="toggle-module-btn" class="btn ${btnClass}">${btnText}</button>
            </div>
        </div>

        <div class="card" style="border-top: 4px solid var(--success);">
            <h2 style="color: var(--primary); margin-top: 0;">🍎 Haftalık Beslenme Programı</h2>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 20px;">Günlere karşılık gelen besinleri yazıp kaydedin. Tabloyu boş bırakmak istediğiniz günleri silebilirsiniz.</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div class="input-group">
                    <label style="font-weight: bold; color: #334155;">Pazartesi</label>
                    <input type="text" id="gun-pzt" value="${plan.pazartesi || ''}" placeholder="Örn: Haşlanmış yumurta, zeytin, peynir, meyve suyu" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
                <div class="input-group">
                    <label style="font-weight: bold; color: #334155;">Salı</label>
                    <input type="text" id="gun-sal" value="${plan.sali || ''}" placeholder="Örn: Ev yapımı kek, süt, ceviz" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
                <div class="input-group">
                    <label style="font-weight: bold; color: #334155;">Çarşamba</label>
                    <input type="text" id="gun-car" value="${plan.carsamba || ''}" placeholder="Örn: Patates salatası, ayran, mevsim meyvesi" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
                <div class="input-group">
                    <label style="font-weight: bold; color: #334155;">Perşembe</label>
                    <input type="text" id="gun-per" value="${plan.persembe || ''}" placeholder="Örn: Tost, zeytin, bitki çayı" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
                <div class="input-group">
                    <label style="font-weight: bold; color: #334155;">Cuma</label>
                    <input type="text" id="gun-cum" value="${plan.cuma || ''}" placeholder="Örn: Gözleme, ayran, kuruyemiş" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
            </div>

            <button id="btn-kaydet" class="btn btn-primary" style="margin-top: 25px; width: 100%; padding: 12px; font-size: 1.1em; font-weight: bold;">💾 Programı Kaydet ve Yayınla</button>
        </div>
    `;

    document.getElementById('toggle-module-btn').addEventListener('click', async (e) => {
        const newStatus = !(await db.getModuleVisibility('beslenme'));
        await db.toggleModuleVisibility('beslenme', newStatus);
        const btn = e.target;
        if(newStatus) { btn.className = "btn btn-success"; btn.innerText = "Menüde Görünüyor (Gizle)"; } 
        else { btn.className = "btn btn-secondary"; btn.innerText = "Menüde Gizli (Göster)"; }
    });

    document.getElementById('btn-kaydet').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.innerText = "⏳ Kaydediliyor...";

        const yeniPlan = {
            pazartesi: document.getElementById('gun-pzt').value.trim(),
            sali: document.getElementById('gun-sal').value.trim(),
            carsamba: document.getElementById('gun-car').value.trim(),
            persembe: document.getElementById('gun-per').value.trim(),
            cuma: document.getElementById('gun-cum').value.trim()
        };

        if (planId) {
            await db.update('beslenme_programi', planId, yeniPlan);
        } else {
            await db.add('beslenme_programi', yeniPlan);
        }

        btn.className = "btn btn-success";
        btn.innerText = "✔️ Kaydedildi";
        
        setTimeout(() => {
            btn.className = "btn btn-primary";
            btn.innerText = "💾 Programı Kaydet ve Yayınla";
            btn.disabled = false;
        }, 2000);
    });
}