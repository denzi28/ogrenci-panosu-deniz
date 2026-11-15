// Giriş / çıkış. Şifre kontrolü artık tarayıcıda değil, Firebase Authentication'da yapılır.
// Tarayıcıda (localStorage) sadece ekranda göstermek için ad, rol ve kayıt numarası tutulur; şifre tutulmaz.
// Asıl yetki kontrolü veritabanı kurallarındadır (firestore.rules), localStorage'ı değiştirmek yetki kazandırmaz.
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore, firebaseAuth } from './firebase.js';
import { kullaniciEpostasi, firebaseSifresi } from './hesaplar.js';
import { ANA_SINIF, tabloYolu } from './sinif.js';

const PANEL_SAYFALARI = ['teacher.html', 'student.html', 'kurulum.html'];

class Auth {
    constructor() {
        try { this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null; }
        catch { this.currentUser = null; }

        // Firebase oturumu düşmüşse (çıkış yapılmış, şifre değişmiş vb.) eski ekran bilgisini de temizle.
        onAuthStateChanged(firebaseAuth, (fbKullanici) => {
            if (!fbKullanici && this.currentUser) {
                this._yerelTemizle();
                const sayfa = location.pathname.split('/').pop();
                if (PANEL_SAYFALARI.includes(sayfa)) location.replace('login.html');
            }
        });
    }

    async login(username, password) {
        let kimlik;
        try {
            kimlik = await signInWithEmailAndPassword(firebaseAuth, kullaniciEpostasi(username), firebaseSifresi(password));
        } catch (error) {
            if (!String(error.code).includes('invalid-credential')) console.error("Giriş hatası:", error);
            return false;
        }

        try {
            const rolSnap = await getDoc(doc(firestore, 'roller', kimlik.user.uid));
            if (!rolSnap.exists()) { await signOut(firebaseAuth); return false; }
            const { role, userId } = rolSnap.data();
            const sinifId = rolSnap.data().sinifId || ANA_SINIF;   // eski kayıtlarda sınıf yok: ana sınıf
            const kayitSnap = await getDoc(doc(firestore, ...tabloYolu('users', sinifId), userId));
            const kayit = kayitSnap.exists() ? kayitSnap.data() : {};

            const user = { id: userId, name: kayit.name || username, okulno: kayit.okulno || '', role, username, sinifId };
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('sonGirisTarihi', Date.now().toString());

            window.location.href = role === 'teacher' ? 'teacher.html' : 'student.html';
            return true;
        } catch (error) {
            console.error("Giriş sonrası bilgiler okunamadı:", error);
            await signOut(firebaseAuth).catch(() => {});
            return false;
        }
    }

    _yerelTemizle() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sonGirisTarihi');
    }

    async logout() {
        this._yerelTemizle(); // önce: oturum düşünce giriş sayfasına yönlendiren dinleyici tetiklenmesin
        await signOut(firebaseAuth).catch(() => {});
        window.location.href = 'index.html';
    }
}
export const auth = new Auth();
