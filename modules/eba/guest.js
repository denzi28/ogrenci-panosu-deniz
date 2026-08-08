export async function render(container) {
    // Veritabanı sorgusuna gerek yok ancak fonksiyon uyumluluğu için async yaptık
    container.innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
            <h3 style="color:var(--danger); font-size: 2em; margin-bottom: 15px;">🔒 Gizlilik Uyarısı</h3>
            <p style="font-size: 1.1em; color: #555;">
                EBA şifreleri kişisel ve hassas veri olduğu için misafirlere kapalıdır.<br>
                Sadece sisteme giriş yapan öğrenciler kendi şifrelerini görebilir.
            </p>
        </div>
    `;
}