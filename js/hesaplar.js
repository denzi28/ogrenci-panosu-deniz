// Firebase Authentication hesap işlemleri.
//
// Öğrenciler sisteme "kullanıcı adı + şifre" ile girer. Firebase ise e-posta + en az 6 karakterlik şifre ister.
// Bu yüzden:
//  - Kullanıcı adı, ona özel sabit bir e-postaya çevrilir (Türkçe karakter/boşluk sorun olmasın diye onaltılık kodlanır).
//    Bu e-postalara hiçbir zaman posta gönderilmez; sadece kimlik olarak kullanılır.
//  - Şifrenin sonuna sabit bir ek konur; böylece "123" gibi kısa şifreler de çalışmaya devam eder.
//    (Bu ek bir gizlilik sağlamaz, sadece Firebase'in uzunluk kuralını karşılar.)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    updatePassword, deleteUser, signOut, reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig, firebaseAuth } from './firebase.js';

export const SIFRE_EKI = '#3D-pano';
const EPOSTA_ALANI = 'sinifpanosu.app';

export function kullaniciEpostasi(kullaniciAdi) {
    const baytlar = new TextEncoder().encode(String(kullaniciAdi).trim());
    const hex = Array.from(baytlar, b => b.toString(16).padStart(2, '0')).join('');
    return `k${hex}@${EPOSTA_ALANI}`;
}

export function firebaseSifresi(sifre) {
    return String(sifre) + SIFRE_EKI;
}

// Öğretmen, öğrencinin hesabını yönetirken kendi oturumu kapanmasın diye
// işlemler ikinci (yardımcı) bir Firebase örneğinde, kalıcı olmayan oturumla yapılır.
async function yardimciAuth() {
    const yardimciApp = getApps().find(a => a.name === 'hesap-yardimcisi') || initializeApp(firebaseConfig, 'hesap-yardimcisi');
    const a = getAuth(yardimciApp);
    await setPersistence(a, inMemoryPersistence);
    return a;
}

function anlasilirHata(err) {
    const kod = err?.code || '';
    if (kod.includes('email-already-in-use')) return new Error('Bu kullanıcı adı zaten kullanılıyor.');
    if (kod.includes('invalid-credential') || kod.includes('wrong-password') || kod.includes('user-not-found'))
        return new Error('Hesabın eski bilgileri doğrulanamadı.');
    if (kod.includes('too-many-requests')) return new Error('Çok fazla deneme yapıldı, birkaç dakika sonra tekrar deneyin.');
    if (kod.includes('network')) return new Error('İnternet bağlantısı yok.');
    return err;
}

export async function hesapOlustur(kullaniciAdi, sifre) {
    const a = await yardimciAuth();
    try {
        const sonuc = await createUserWithEmailAndPassword(a, kullaniciEpostasi(kullaniciAdi), firebaseSifresi(sifre));
        return sonuc.user.uid;
    } catch (err) { throw anlasilirHata(err); }
    finally { await signOut(a).catch(() => {}); }
}

// Kullanıcı adı veya şifre değiştiyse Firebase hesabını da günceller. Geriye (yeni) uid döner.
export async function hesapGuncelle(eski, yeni) {
    const adDegisti = eski.kullaniciAdi !== yeni.kullaniciAdi;
    const sifreDegisti = eski.sifre !== yeni.sifre;
    if (!adDegisti && !sifreDegisti) return null;

    // Kişi kendi şifresini değiştiriyorsa ana oturum üzerinden yapılır; böylece oturumu kapanmaz.
    const benim = firebaseAuth.currentUser;
    if (!adDegisti && benim && benim.email === kullaniciEpostasi(eski.kullaniciAdi)) {
        try {
            const kimlik = EmailAuthProvider.credential(benim.email, firebaseSifresi(eski.sifre));
            await reauthenticateWithCredential(benim, kimlik);
            await updatePassword(benim, firebaseSifresi(yeni.sifre));
            return benim.uid;
        } catch (err) { throw anlasilirHata(err); }
    }

    const a = await yardimciAuth();
    try {
        const giris = await signInWithEmailAndPassword(a, kullaniciEpostasi(eski.kullaniciAdi), firebaseSifresi(eski.sifre));
        if (!adDegisti) {
            await updatePassword(giris.user, firebaseSifresi(yeni.sifre));
            return giris.user.uid;
        }
        // Kullanıcı adı değiştiyse: yeni adla hesap aç, eskisini sil.
        await signOut(a);
        const yeniHesap = await createUserWithEmailAndPassword(a, kullaniciEpostasi(yeni.kullaniciAdi), firebaseSifresi(yeni.sifre));
        const yeniUid = yeniHesap.user.uid;
        await signOut(a);
        const eskiGiris = await signInWithEmailAndPassword(a, kullaniciEpostasi(eski.kullaniciAdi), firebaseSifresi(eski.sifre));
        await deleteUser(eskiGiris.user);
        return yeniUid;
    } catch (err) { throw anlasilirHata(err); }
    finally { await signOut(a).catch(() => {}); }
}

export async function hesapSil(kullaniciAdi, sifre) {
    const a = await yardimciAuth();
    try {
        const giris = await signInWithEmailAndPassword(a, kullaniciEpostasi(kullaniciAdi), firebaseSifresi(sifre));
        await deleteUser(giris.user);
    } catch (err) { throw anlasilirHata(err); }
    finally { await signOut(a).catch(() => {}); }
}
