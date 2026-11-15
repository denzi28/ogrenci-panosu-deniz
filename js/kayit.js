// Davet koduyla öğretmen kaydı.
// Güvenlik veritabanı kurallarındadır (firestore.rules > davetleKayit): öğretmen rolü sadece geçerli bir davet koduyla
// ve kod aynı işlemde silinerek açılabilir. Bu dosya sadece o işlemi doğru sırayla yapar.
import { createUserWithEmailAndPassword, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, writeBatch, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore, firebaseAuth } from './firebase.js';
import { kullaniciEpostasi, firebaseSifresi } from './hesaplar.js';
import { ANA_SINIF, sinifKisaltmasi } from './sinif.js';

// "4/A" -> "4a"; alınmışsa "4a-2", "4a-3" ...
export async function kullanilabilirSinifId(ad) {
    const kok = sinifKisaltmasi(ad);
    for (let i = 1; i < 50; i++) {
        const aday = i === 1 ? kok : `${kok}-${i}`;
        if (aday === ANA_SINIF) continue;
        const snap = await getDoc(doc(firestore, 'siniflar', aday));
        if (!snap.exists()) return aday;
    }
    throw new Error('Bu sınıf adıyla yer bulunamadı, adı biraz değiştirin');
}

export async function ogretmenKaydi({ davet, ad, sinifAdi, kullaniciAdi, sifre }) {
    const sinifId = await kullanilabilirSinifId(sinifAdi);

    // 1) Giriş hesabı (kullanıcı adı alınmışsa burada durur)
    let kimlik;
    try {
        kimlik = await createUserWithEmailAndPassword(firebaseAuth, kullaniciEpostasi(kullaniciAdi), firebaseSifresi(sifre));
    } catch (e) {
        if (String(e.code).includes('email-already-in-use')) throw new Error('Bu kullanıcı adı alınmış, başka bir tane deneyin');
        if (String(e.code).includes('network')) throw new Error('İnternet bağlantısı yok');
        throw new Error('Hesap açılamadı, tekrar deneyin');
    }
    const uid = kimlik.user.uid;
    const userId = doc(collection(firestore, 'siniflar', sinifId, 'users')).id;

    // 2) Rol + davet kodunu silme + sınıfı açma: tek işlem. Kod geçersizse kurallar reddeder.
    try {
        const islem = writeBatch(firestore);
        islem.set(doc(firestore, 'roller', uid), { role: 'teacher', userId, sinifId, davet });
        islem.delete(doc(firestore, 'davetler', davet));
        islem.set(doc(firestore, 'siniflar', sinifId), {
            ad: sinifAdi, ogretmenUid: uid, ogretmenAdi: ad, kurulumBitti: false, olusturma: new Date().toISOString(),
        });
        await islem.commit();
    } catch (e) {
        // Kod geçersizse açılan giriş hesabı silinir; kullanıcı adı boşa gitmesin
        await deleteUser(kimlik.user).catch(() => signOut(firebaseAuth));
        if (String(e.code).includes('permission-denied')) throw new Error('Davet kodu geçersiz ya da daha önce kullanılmış');
        throw new Error('Hesap açılamadı, tekrar deneyin');
    }

    // 3) Öğretmenin sınıftaki kaydı
    await setDoc(doc(firestore, 'siniflar', sinifId, 'users', userId), { name: ad, role: 'teacher', createdAt: new Date().toISOString() });
    await setDoc(doc(firestore, 'siniflar', sinifId, 'users_gizli', userId), { username: kullaniciAdi, password: sifre, uid });

    const kullanici = { id: userId, name: ad, okulno: '', role: 'teacher', username: kullaniciAdi, sinifId };
    localStorage.setItem('currentUser', JSON.stringify(kullanici));
    localStorage.setItem('sonGirisTarihi', Date.now().toString());
    return { sinifId, userId };
}

// Yönetici: yeni davet kodu (karışmasın diye 0/O, 1/I/İ yok)
const HARFLER = 'ABCDEFGHJKLMNPRSTUVYZ', RAKAMLAR = '23456789';
export function davetKoduUret() {
    const sec = (k, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), x => k[x % k.length]).join('');
    return `${sec(HARFLER, 4)}-${sec(RAKAMLAR, 4)}`;
}
