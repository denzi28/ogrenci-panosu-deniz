// Firebase SDK modüllerini internet üzerinden (CDN) projeye dahil ediyoruz
// DİKKAT: arrayUnion komutu eklendi!
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCbTQAZL8z6xKH96tGUzEuKW7NnUM9CYDI",
    authDomain: "davranis-pano.firebaseapp.com",
    projectId: "davranis-pano",
    storageBucket: "davranis-pano.firebasestorage.app",
    messagingSenderId: "423671387254",
    appId: "1:423671387254:web:fce33a41444d0bf5c53b57",
    measurementId: "G-L8EKLGBRW8"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

class Database {
    constructor() {
        // Hafızada tutulan tablo listesi (veritabanını yormamak için)
        this.kayitliKoleksiyonlar = new Set();
    }

    // --- YENİ: OTOMATİK TABLO DEDEKTİFİ ---
    // Her işlemde tablonun adını "koleksiyon_listesi"ne kaydeder
    async registerCollection(collectionName) {
        // Sistem ayar tablolarını veya zaten kaydettiğimiz tabloları atla
        if (this.kayitliKoleksiyonlar.has(collectionName) || collectionName.includes('setting')) return;
        
        try {
            const docRef = doc(firestore, "system_settings", "koleksiyon_listesi");
            // arrayUnion: Listede yoksa ekler, varsa dokunmaz
            await setDoc(docRef, { isimler: arrayUnion(collectionName) }, { merge: true });
            this.kayitliKoleksiyonlar.add(collectionName);
        } catch(e) { console.error("Tablo listeye eklenemedi:", e); }
    }

    // --- YENİ: YEDEKLEME İÇİN TÜM TABLOLARIN İSİMLERİNİ GETİRİR ---
    async getCollectionList() {
        const docRef = doc(firestore, "system_settings", "koleksiyon_listesi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isimler) {
            return docSnap.data().isimler;
        }
        return [];
    }

    async getAll(collectionName) {
        this.registerCollection(collectionName); // Okuğunda listeye ekle
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    }

    async getPublic(collectionName) {
        this.registerCollection(collectionName);
        const q = query(collection(firestore, collectionName), where("visibleToGuest", "==", true));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    }

    async add(collectionName, itemData) {
        this.registerCollection(collectionName); // Yazdığında listeye ekle
        const newItem = { 
            createdAt: new Date().toISOString(), 
            ...itemData 
        };
        const docRef = await addDoc(collection(firestore, collectionName), newItem);
        return { id: docRef.id, ...newItem };
    }

    async update(collectionName, id, updatedFields) {
        this.registerCollection(collectionName);
        const docRef = doc(firestore, collectionName, id);
        await updateDoc(docRef, updatedFields);
        return { id, ...updatedFields };
    }

    async delete(collectionName, id) {
        const docRef = doc(firestore, collectionName, id);
        await deleteDoc(docRef);
    }

    async toggleVisibility(collectionName, id) {
        const docRef = doc(firestore, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentVisibility = docSnap.data().visibleToGuest;
            await updateDoc(docRef, { visibleToGuest: !currentVisibility });
        }
    }

    async setWithId(collectionName, id, itemData) {
        this.registerCollection(collectionName);
        try {
            const docRef = doc(firestore, collectionName, id);
            await setDoc(docRef, itemData);
            return true;
        } catch (error) {
            console.error("Yedek yükleme hatası:", error);
            return false;
        }
    }

    async getModuleVisibility(moduleId) {
        const docRef = doc(firestore, "module_settings", moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().guestVisible;
        }
        return true; 
    }

    async toggleModuleVisibility(moduleId, isVisible) {
        const docRef = doc(firestore, "module_settings", moduleId);
        await setDoc(docRef, { guestVisible: isVisible }, { merge: true });
    }

    async saveMatrixStatus(collectionName, ogrId, targetId, value) {
        this.registerCollection(collectionName);
        const docId = `${ogrId}_${targetId}`; 
        const docRef = doc(firestore, collectionName, docId);
        await setDoc(docRef, { ogrId, targetId, deger: value }, { merge: true });
    }
}

export const db = new Database();