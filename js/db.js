// Firebase SDK modüllerini internet üzerinden (CDN) projeye dahil ediyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Senin Firebase yapılandırma ayarların
const firebaseConfig = {
    apiKey: "AIzaSyCbTQAZL8z6xKH96tGUzEuKW7NnUM9CYDI",
    authDomain: "davranis-pano.firebaseapp.com",
    projectId: "davranis-pano",
    storageBucket: "davranis-pano.firebasestorage.app",
    messagingSenderId: "423671387254",
    appId: "1:423671387254:web:fce33a41444d0bf5c53b57",
    measurementId: "G-L8EKLGBRW8"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

class Database {
    // 1. İstenen koleksiyondaki tüm verileri getir
    async getAll(collectionName) {
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    }

    // 2. Misafirlere (Velilere) açık olan verileri getir
    async getPublic(collectionName) {
        const q = query(collection(firestore, collectionName), where("visibleToGuest", "==", true));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    }

    // 3. Yeni veri ekle
    async add(collectionName, itemData) {
        const newItem = { 
            createdAt: new Date().toISOString(), 
            ...itemData 
        };
        const docRef = await addDoc(collection(firestore, collectionName), newItem);
        return { id: docRef.id, ...newItem };
    }

    // 4. Mevcut veriyi ID'sine göre güncelle
    async update(collectionName, id, updatedFields) {
        const docRef = doc(firestore, collectionName, id);
        await updateDoc(docRef, updatedFields);
        return { id, ...updatedFields };
    }

    // 5. Veriyi ID'sine göre sil
    async delete(collectionName, id) {
        const docRef = doc(firestore, collectionName, id);
        await deleteDoc(docRef);
    }

    // 6. Tekil bir içeriğin misafire görünürlüğünü aç/kapat
    async toggleVisibility(collectionName, id) {
        const docRef = doc(firestore, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentVisibility = docSnap.data().visibleToGuest;
            await updateDoc(docRef, { visibleToGuest: !currentVisibility });
        }
    }

    // --- MODÜL GÖRÜNÜRLÜK AYARLARI ---
    async getModuleVisibility(moduleId) {
        const docRef = doc(firestore, "module_settings", moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().guestVisible;
        }
        return true; // Varsayılan olarak açık
    }

    async toggleModuleVisibility(moduleId, isVisible) {
        const docRef = doc(firestore, "module_settings", moduleId);
        await setDoc(docRef, { guestVisible: isVisible }, { merge: true });
    }

    // --- İLİŞKİSEL DURUM KAYDEDİCİ ---
    async saveMatrixStatus(collectionName, ogrId, targetId, value) {
        const docId = `${ogrId}_${targetId}`; // Hızlı bulmak için ID'leri birleştiriyoruz
        const docRef = doc(firestore, collectionName, docId);
        await setDoc(docRef, { ogrId, targetId, deger: value }, { merge: true });
    }
}

export const db = new Database();