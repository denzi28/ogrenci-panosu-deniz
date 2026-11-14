import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { firebaseConfig, YASAKLI_PROJELER } from './firebase-config.js';

// Kopya site yanlışlıkla orijinal veritabanına bağlanmasın diye her şeyden önce kontrol edilir.
if (YASAKLI_PROJELER.includes(firebaseConfig.projectId) || firebaseConfig.projectId.startsWith("BURAYA")) {
    const mesaj = YASAKLI_PROJELER.includes(firebaseConfig.projectId)
        ? "Bu kopya, orijinal sitenin veritabanına bağlanmaya çalışıyor. Güvenlik için durduruldu."
        : "Firebase ayarları henüz girilmemiş. js/firebase-config.js dosyasını doldurun.";
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `<div style="max-width:520px;margin:60px auto;padding:24px;border:2px solid #e74c3c;border-radius:12px;font-family:sans-serif;color:#333"><h2 style="color:#e74c3c;margin-bottom:10px">⛔ Veritabanı bağlantısı engellendi</h2><p>${mesaj}</p></div>`;
    });
    throw new Error(mesaj);
}

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

class Database {
    constructor() {
        this.kayitliKoleksiyonlar = new Set();
    }

    async registerCollection(collectionName) {
        if (this.kayitliKoleksiyonlar.has(collectionName) || collectionName.includes('setting')) return;
        try {
            const docRef = doc(firestore, "system_settings", "koleksiyon_listesi");
            await setDoc(docRef, { isimler: arrayUnion(collectionName) }, { merge: true });
            this.kayitliKoleksiyonlar.add(collectionName);
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
        this.registerCollection(collectionName);
        const newItem = { createdAt: new Date().toISOString(), ...itemData };
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
        } catch (error) { return false; }
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