import { db } from './db.js';

class Auth {
    constructor() {
        // Oturum bilgisi cihazda kalmaya devam edebilir (Böylece her sayfa yenilemede hesaptan çıkmaz)
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.initDefaultTeacher();
    }

    // async ekledik çünkü internetten (Firebase) kullanıcıları çekeceğiz
    async initDefaultTeacher() {
        try {
            const users = await db.getAll('users');
            if (!users.find(u => u.role === 'teacher')) {
                await db.add('users', { name: 'Sınıf Öğretmeni', username: 'ogretmen', password: '123', role: 'teacher' });
                console.log("Varsayılan öğretmen hesabı oluşturuldu.");
            }
        } catch (error) {
            console.error("Öğretmen kontrolü sırasında hata oluştu:", error);
        }
    }

    // Giriş yapma işlemi de artık internet üzerinden kontrol ediliyor
    async login(username, password) {
        try {
            const users = await db.getAll('users');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
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
        window.location.href = 'index.html';
    }
}
export const auth = new Auth();