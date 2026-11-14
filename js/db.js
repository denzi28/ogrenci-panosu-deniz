import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore } from './firebase.js';
import { hesapOlustur, hesapGuncelle, hesapSil } from './hesaplar.js';

// ---------------------------------------------------------------------------
// KULLANICI VERİSİNİN GİZLİLİĞİ
// Eskiden tüm kullanıcı bilgileri (TC, şifre, EBA şifresi...) tek "users" tablosundaydı ve
// siteyi açan herkes hepsini indirebiliyordu. Artık iki tabloya ayrılıyor:
//   users        -> herkese açık: ad, okul no, rol           (panolar, liderlik tablosu)
//   users_gizli  -> sadece öğretmen ve öğrencinin kendisi:  TC, kullanıcı adı, şifre, EBA şifresi, not
//   roller/{uid} -> Firebase hesabı hangi öğrenci/öğretmen, rolü ne
// Modüller yine db.getAll('users') / db.update('users', ...) kullanır; ayırma işini bu dosya yapar.
// Erişim kuralları: firestore.rules
// ---------------------------------------------------------------------------
const ACIK_ALANLAR = ['name', 'okulno', 'role', 'createdAt'];
const GIZLI_TABLO = 'users_gizli';

function ayir(veri) {
    const acik = {}, gizli = {};
    for (const [k, v] of Object.entries(veri)) {
        if (k === 'id') continue;
        (ACIK_ALANLAR.includes(k) ? acik : gizli)[k] = v;
    }
    return { acik, gizli };
}

function aktifKullanici() {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
}

async function hamListe(collectionName, q = null) {
    const snap = await getDocs(q || collection(firestore, collectionName));
    const data = [];
    snap.forEach(d => data.push({ id: d.id, ...d.data() }));
    return data;
}

class Database {
    constructor() {
        this.kayitliKoleksiyonlar = new Set();
    }

    // Yedekleme modülü hangi tabloların var olduğunu bu listeden öğrenir. Sadece öğretmen yazabilir.
    async registerCollection(collectionName) {
        if (this.kayitliKoleksiyonlar.has(collectionName) || collectionName.includes('setting')) return;
        if (aktifKullanici()?.role !== 'teacher') return;
        this.kayitliKoleksiyonlar.add(collectionName);
        try {
            const docRef = doc(firestore, "system_settings", "koleksiyon_listesi");
            await setDoc(docRef, { isimler: arrayUnion(collectionName) }, { merge: true });
        } catch(e) { console.error("Tablo listeye eklenemedi:", e); }
    }

    async getCollectionList() {
        const docRef = doc(firestore, "system_settings", "koleksiyon_listesi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isimler) return docSnap.data().isimler;
        return [];
    }

    async getAll(collectionName) {
        this.registerCollection(collectionName);
        if (collectionName === 'users') return this._kullanicilariGetir();
        return hamListe(collectionName);
    }

    // Öğretmen: herkesin tam bilgisi. Öğrenci: herkesin açık bilgisi + kendi gizli bilgisi. Misafir: sadece açık bilgi.
    async _kullanicilariGetir() {
        const kullanicilar = await hamListe('users');
        const ben = aktifKullanici();
        try {
            if (ben?.role === 'teacher') {
                this.registerCollection(GIZLI_TABLO);
                const gizliler = new Map((await hamListe(GIZLI_TABLO)).map(g => [g.id, g]));
                kullanicilar.forEach(k => Object.assign(k, gizliler.get(k.id) || {}, { id: k.id }));
            } else if (ben?.role === 'student' && ben.id) {
                const snap = await getDoc(doc(firestore, GIZLI_TABLO, ben.id));
                const k = kullanicilar.find(k => k.id === ben.id);
                if (snap.exists() && k) Object.assign(k, snap.data(), { id: k.id });
            }
        } catch (e) {
            console.warn("Gizli kullanıcı bilgileri okunamadı (yetki yok veya oturum kapanmış):", e.code || e);
        }
        return kullanicilar;
    }

    async getPublic(collectionName) {
        this.registerCollection(collectionName);
        return hamListe(collectionName, query(collection(firestore, collectionName), where("visibleToGuest", "==", true)));
    }

    async add(collectionName, itemData) {
        this.registerCollection(collectionName);
        const newItem = { createdAt: new Date().toISOString(), ...itemData };
        if (collectionName === 'users') return this._kullaniciEkle(newItem);
        const docRef = await addDoc(collection(firestore, collectionName), newItem);
        return { id: docRef.id, ...newItem };
    }

    async _kullaniciEkle(veri) {
        const { acik, gizli } = ayir(veri);
        acik.role = acik.role || 'student';
        // Önce giriş hesabı açılır; kullanıcı adı alınmışsa hiçbir kayıt oluşmadan hata verir.
        const uid = await hesapOlustur(gizli.username, gizli.password);
        const docRef = await addDoc(collection(firestore, 'users'), acik);
        await setDoc(doc(firestore, GIZLI_TABLO, docRef.id), { ...gizli, uid });
        await setDoc(doc(firestore, 'roller', uid), { role: acik.role, userId: docRef.id });
        return { id: docRef.id, ...veri };
    }

    async update(collectionName, id, updatedFields) {
        this.registerCollection(collectionName);
        if (collectionName === 'users') return this._kullaniciGuncelle(id, updatedFields);
        const docRef = doc(firestore, collectionName, id);
        await updateDoc(docRef, updatedFields);
        return { id, ...updatedFields };
    }

    async _kullaniciGuncelle(id, alanlar) {
        const { acik, gizli } = ayir(alanlar);
        delete gizli.uid; // uid elle değiştirilemez, hesap işlemleriyle belirlenir

        if ('username' in gizli || 'password' in gizli) {
            const mevcutSnap = await getDoc(doc(firestore, GIZLI_TABLO, id));
            const mevcut = mevcutSnap.exists() ? mevcutSnap.data() : {};
            if (mevcut.uid) {
                const yeniUid = await hesapGuncelle(
                    { kullaniciAdi: mevcut.username, sifre: mevcut.password },
                    { kullaniciAdi: gizli.username ?? mevcut.username, sifre: gizli.password ?? mevcut.password }
                );
                if (yeniUid && yeniUid !== mevcut.uid) {
                    const rolSnap = await getDoc(doc(firestore, 'roller', mevcut.uid));
                    const rol = rolSnap.exists() ? rolSnap.data().role : (acik.role || 'student');
                    await setDoc(doc(firestore, 'roller', yeniUid), { role: rol, userId: id });
                    await deleteDoc(doc(firestore, 'roller', mevcut.uid));
                    gizli.uid = yeniUid;
                }
            }
            // Değişmeyen alanları tekrar yazma: öğrencinin sadece "password" alanını değiştirmesine izin var.
            for (const k of Object.keys(gizli)) if (k !== 'uid' && gizli[k] === mevcut[k]) delete gizli[k];
        }

        if (Object.keys(acik).length) await updateDoc(doc(firestore, 'users', id), acik);
        if (Object.keys(gizli).length) await setDoc(doc(firestore, GIZLI_TABLO, id), gizli, { merge: true });
        return { id, ...alanlar };
    }

    async delete(collectionName, id) {
        if (collectionName === 'users') return this._kullaniciSil(id);
        const docRef = doc(firestore, collectionName, id);
        await deleteDoc(docRef);
    }

    async _kullaniciSil(id) {
        const gizliSnap = await getDoc(doc(firestore, GIZLI_TABLO, id));
        if (gizliSnap.exists()) {
            const g = gizliSnap.data();
            if (g.uid) {
                try { await hesapSil(g.username, g.password); }
                catch (e) { console.warn("Giriş hesabı silinemedi, kayıt yine de silinecek:", e.message); }
                await deleteDoc(doc(firestore, 'roller', g.uid));
            }
            await deleteDoc(doc(firestore, GIZLI_TABLO, id));
        }
        await deleteDoc(doc(firestore, 'users', id));
    }

    async toggleVisibility(collectionName, id) {
        const docRef = doc(firestore, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentVisibility = docSnap.data().visibleToGuest;
            await updateDoc(docRef, { visibleToGuest: !currentVisibility });
        }
    }

    // Yedekten geri yüklemede kullanılır. Kullanıcı kayıtları yine açık/gizli olarak ayrılır.
    // Not: Giriş hesapları (Firebase Authentication) yedekte yoktur; aynı projeye geri yüklemede zaten durur.
    async setWithId(collectionName, id, itemData) {
        this.registerCollection(collectionName);
        try {
            if (collectionName === 'users') {
                const { acik, gizli } = ayir(itemData);
                await setDoc(doc(firestore, 'users', id), acik);
                if (Object.keys(gizli).length) await setDoc(doc(firestore, GIZLI_TABLO, id), gizli, { merge: true });
                return true;
            }
            await setDoc(doc(firestore, collectionName, id), itemData);
            return true;
        } catch (error) { console.error(error); return false; }
    }

    async getModuleVisibility(moduleId) {
        const docRef = doc(firestore, "module_settings", moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data().guestVisible;
        return true;
    }

    async toggleModuleVisibility(moduleId, isVisible) {
        const docRef = doc(firestore, "module_settings", moduleId);
        await setDoc(docRef, { guestVisible: isVisible }, { merge: true });
    }

    // 🌟 KİTAP SÜRE KONTROLÜ İÇİN TARİH BİLGİSİNİN KAYDEDİLDİĞİ YER
    async saveMatrixStatus(collectionName, ogrId, targetId, value) {
        this.registerCollection(collectionName);
        const docId = `${ogrId}_${targetId}`;
        const docRef = doc(firestore, collectionName, docId);
        const islemTarihi = new Date().toISOString();
        await setDoc(docRef, { ogrId, targetId, deger: value, tarih: islemTarihi }, { merge: true });
    }
}

export const db = new Database();
