// Modül listesi. Sıra, menüdeki ve ana sayfadaki sırayı belirler.
// renk: modülün kartında ve menüde kullanılan ana renk
// aciklama: ana sayfadaki kartta adın altında görünen kısa yazı
export const appConfig = {
    appName: "Sınıf Panosu",
    sinifAdi: "3/D",
    modules: [
        { id: 'duyurular',   name: 'Duyurular',           icon: '📢', renk: '#f97316', aciklama: 'Sınıftan haberler' },
        { id: 'etkinlikler', name: 'Etkinlikler',         icon: '📅', renk: '#ec4899', aciklama: 'Yaklaşan geziler ve günler' },
        { id: 'davranis',    name: 'Davranış Panosu',     icon: '⭐', renk: '#eab308', aciklama: 'Yıldızlar ve sıralama' },
        { id: 'kitap',       name: 'Kitap Okuma',         icon: '📚', renk: '#16a34a', aciklama: 'Okunan kitaplar' },
        { id: 'rozetler',    name: 'Rozetler',            icon: '🏅', renk: '#f59e0b', aciklama: 'Kazanılan rozetler' },
        { id: 'uygulamalar', name: 'İnteraktif Görevler', icon: '🎮', renk: '#6366f1', aciklama: 'Oyunlar ve görevler' },
        { id: 'program',     name: 'Ders Programı',       icon: '🗓️', renk: '#0ea5e9', aciklama: 'Haftalık dersler' },
        { id: 'beslenme',    name: 'Beslenme Programı',   icon: '🍎', renk: '#ef4444', aciklama: 'Günlük beslenme' },
        { id: 'ihtiyaclar',  name: 'İhtiyaçlar',          icon: '📦', renk: '#14b8a6', aciklama: 'Sınıf ihtiyaç listesi' },
        { id: 'ogrenciler',  name: 'Öğrenciler',          icon: '👥', renk: '#3b82f6', aciklama: 'Sınıf listesi ve profil' },
        { id: 'eba',         name: 'EBA Şifreleri',       icon: '🔑', renk: '#8b5cf6', aciklama: 'EBA giriş bilgileri' },
        { id: 'yedekleme',   name: 'Sistem Yedekleme',    icon: '💾', renk: '#64748b', aciklama: 'Yedek al ve geri yükle' }
    ]
};

// Rengin açık tonu (kart ve menü ikon zemini için)
export function acikTon(hex, oran = 0.86) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.round(c + (255 - c) * oran));
    return `rgb(${r}, ${g}, ${b})`;
}
