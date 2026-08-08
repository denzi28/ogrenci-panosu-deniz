import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Profil bilgileriniz yükleniyor...</p></div>';
    
    // Buluttaki en güncel veriyi çekelim (Öğretmen bilgileri değiştirmiş olabilir)
    const users = await db.getAll('users');
    const user = users.find(u => u.id === auth.currentUser.id) || auth.currentUser;
    
    container.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--primary); margin-bottom: 20px;">
            <h2>Öğrenci Profilim</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="font-size: 1.2em; margin-bottom: 10px;"><b>Ad Soyad:</b> ${user.name}</p>
                <p><b>Okul Numarası:</b> ${user.okulno || '<i>Eklenmemiş</i>'}</p>
                <p><b>TC Kimlik No:</b> ${user.tcno || '<i>Eklenmemiş</i>'}</p>
            </div>
            <div style="margin-top: 15px;">
                <p><b>Sisteme Giriş Kullanıcı Adı:</b> ${user.username}</p>
            </div>
            ${user.ozellik ? `<hr style="margin: 15px 0; border-top: 1px solid #eee;"><p style="color: var(--secondary);"><b>Öğretmen Notu:</b> ${user.ozellik}</p>` : ''}
        </div>

        <div class="card" style="border-left: 4px solid var(--success);">
            <h3 style="color: var(--success); margin-bottom: 10px;">🔒 Şifremi Değiştir</h3>
            <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Sisteme giriş şifrenizi buradan güvenle güncelleyebilirsiniz.</p>
            
            <div class="form-group">
                <label style="font-weight: bold; color: #555;">Yeni Şifre</label>
                <input type="password" id="yeni-sifre" placeholder="Yeni şifrenizi girin" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
            </div>
            <div class="form-group">
                <label style="font-weight: bold; color: #555;">Yeni Şifre (Tekrar)</label>
                <input type="password" id="yeni-sifre-tekrar" placeholder="Yeni şifrenizi tekrar girin" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <button id="btn-sifre-degistir" class="btn btn-success" style="margin-top: 10px;">Şifremi Güncelle</button>
            <div id="sifre-mesaj" style="margin-top: 15px; font-weight: bold; font-size: 0.95em;"></div>
        </div>
    `;

    document.getElementById('btn-sifre-degistir').addEventListener('click', async () => {
        const yeniSifre = document.getElementById('yeni-sifre').value.trim();
        const yeniSifreTekrar = document.getElementById('yeni-sifre-tekrar').value.trim();
        const mesajAlani = document.getElementById('sifre-mesaj');

        if (!yeniSifre || !yeniSifreTekrar) {
            mesajAlani.style.color = 'var(--danger)';
            mesajAlani.innerText = "Lütfen her iki alanı da doldurun.";
            return;
        }

        if (yeniSifre !== yeniSifreTekrar) {
            mesajAlani.style.color = 'var(--danger)';
            mesajAlani.innerText = "Şifreler birbiriyle uyuşmuyor. Lütfen kontrol edin!";
            return;
        }

        const btn = document.getElementById('btn-sifre-degistir');
        btn.disabled = true;
        btn.innerText = "⏳ Güncelleniyor...";

        try {
            // 1. Buluttaki (Firebase) veriyi güncelle
            await db.update('users', user.id, { password: yeniSifre });
            
            // 2. Mevcut tarayıcıdaki oturum bilgilerini (auth objesi ve localStorage) güncelle
            // Bu sayede sayfa yenilendiğinde eski şifresiyle oturumdan atılmaz
            user.password = yeniSifre;
            auth.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));

            mesajAlani.style.color = 'var(--success)';
            mesajAlani.innerText = "Şifreniz başarıyla güncellendi! ✔";
            
            // Alanları temizle
            document.getElementById('yeni-sifre').value = '';
            document.getElementById('yeni-sifre-tekrar').value = '';
            
            // 3 saniye sonra mesajı gizle
            setTimeout(() => {
                mesajAlani.innerText = "";
            }, 3000);

        } catch (error) {
            mesajAlani.style.color = 'var(--danger)';
            mesajAlani.innerText = "Şifre güncellenirken sistemsel bir hata oluştu.";
            console.error(error);
        } finally {
            btn.disabled = false;
            btn.innerText = "Şifremi Güncelle";
        }
    });
}