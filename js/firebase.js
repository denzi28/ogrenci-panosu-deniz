// Firebase'in tek başlangıç noktası. Diğer dosyalar uygulamayı buradan alır.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig, YASAKLI_PROJELER } from './firebase-config.js';

// Kopya site yanlışlıkla orijinal veritabanına bağlanmasın diye her şeyden önce kontrol edilir.
if (YASAKLI_PROJELER.includes(firebaseConfig.projectId) || firebaseConfig.projectId.startsWith("BURAYA")) {
    const mesaj = YASAKLI_PROJELER.includes(firebaseConfig.projectId)
        ? "Bu kopya, orijinal sitenin veritabanına bağlanmaya çalışıyor. Güvenlik için durduruldu."
        : "Firebase ayarları henüz girilmemiş. js/firebase-config.js dosyasını doldurun.";
    const goster = () => {
        document.body.innerHTML = `<div style="max-width:520px;margin:60px auto;padding:24px;border:2px solid #e74c3c;border-radius:12px;font-family:sans-serif;color:#333"><h2 style="color:#e74c3c;margin-bottom:10px">⛔ Veritabanı bağlantısı engellendi</h2><p>${mesaj}</p></div>`;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', goster); else goster();
    throw new Error(mesaj);
}

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const firebaseAuth = getAuth(app);
export { firebaseConfig };
