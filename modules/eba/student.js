import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ EBA şifreniz kontrol ediliyor...</p></div>';
    
    const users = await db.getAll('users');
    const user = users.find(u => u.id === auth.currentUser.id) || auth.currentUser;
    const ebaSifre = user.ebaPassword;
    
    let icerik = ebaSifre ? `
        <div style="background: #e8f4fd; padding: 30px; border-radius: 8px; text-align: center; margin-top: 15px; border: 2px dashed var(--primary);">
            <p style="font-size: 1.2em; color: #555; margin-bottom: 10px;">EBA Giriş Şifreniz:</p>
            <h2 style="font-size: 3em; color: var(--primary); letter-spacing: 3px; margin: 0; user-select: all;">${ebaSifre}</h2>
        </div>
        <p style="text-align: center; margin-top: 20px; font-size: 1em; color: var(--secondary);">EBA'ya giriş yaparken TC Kimlik numaranız (<b>${user.tcno || 'Bilinmiyor'}</b>) ve yukarıdaki şifreyi kullanabilirsiniz.</p>
    ` : `
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center; margin-top: 15px; color: #856404; border: 1px solid #ffeeba;">
            <h3 style="margin-bottom: 10px;">Şifreniz Henüz Tanımlanmamış</h3>
            <p>Öğretmeniniz henüz sizin için bir EBA şifresi girmemiş. Lütfen daha sonra tekrar kontrol ediniz.</p>
        </div>
    `;
    
    container.innerHTML = `<div class="card" style="border-left: 4px solid var(--primary);"><h2>🔑 EBA Şifre Bilgim</h2>${icerik}</div>`;
}