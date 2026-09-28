import { db } from './db.js';

class Auth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.initDefaultTeacher();
    }

    async initDefaultTeacher() {
        try {
            const users = await db.getAll('users');
            if (!users.find(u => u.role === 'teacher')) {
                await db.add('users', { name: 'Sınıf Öğretmeni', username: 'ogretmen', password: 'recep', role: 'teacher' });
                console.log("Varsayılan öğretmen hesabı oluşturuldu.");
            }
        } catch (error) {
            console.error("Öğretmen kontrolü sırasında hata oluştu:", error);
        }
    }

    async login(username, password) {
        try {
            const users = await db.getAll('users');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // EKSİK OLAN PARÇA: Giriş yapıldığı anın tarihini mühürlüyoruz
                localStorage.setItem('sonGirisTarihi', Date.now().toString());
                
                window.location.href = user.role === 'teacher' ? 'teacher.html' : 'student.html';
                return true;
            }
            return false;
        } catch (error) {
            console.error("Giriş işlemi sırasında hata:", error);
            return false;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sonGirisTarihi'); // Çıkış yapınca tarihi de temizle
        window.location.href = 'index.html';
    }
}
export const auth = new Auth();