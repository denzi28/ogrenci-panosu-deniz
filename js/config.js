// Modül listesi. Sıra, menüdeki ve ana sayfadaki sırayı belirler.
// ikon: Font Awesome ikon adı (tek ikon seti, tek boyut)
// aciklama: ana sayfada adın altında görünen kısa yazı
// roller: (isteğe bağlı) bölümü sadece bu rollere göster
export const appConfig = {
    appName: "Sınıf Panosu",
    sinifAdi: "3/D",
    modules: [
        { id: 'duyurular',   name: 'Duyurular',           ikon: 'fa-bullhorn',      aciklama: 'Sınıftan haberler' },
        { id: 'etkinlikler', name: 'Etkinlikler',         ikon: 'fa-calendar-days', aciklama: 'Geziler ve özel günler' },
        { id: 'odevler',     name: 'Ödevler',             ikon: 'fa-list-check',    aciklama: 'Verilen ödevler ve teslim tarihleri' },
        { id: 'davranis',    name: 'Davranış panosu',     ikon: 'fa-star',          aciklama: 'Yıldızlar ve sıralama' },
        { id: 'kitap',       name: 'Kitap okuma',         ikon: 'fa-book-open',     aciklama: 'Okunan ve okunmakta olan kitaplar' },
        { id: 'rozetler',    name: 'Rozetler',            ikon: 'fa-award',         aciklama: 'Kazanılan rozetler' },
        { id: 'uygulamalar', name: 'Etkileşimli görevler', ikon: 'fa-gamepad',      aciklama: 'Oyunlar ve puanlar' },
        { id: 'program',     name: 'Ders programı',       ikon: 'fa-table-cells',   aciklama: 'Haftalık dersler' },
        { id: 'beslenme',    name: 'Beslenme programı',   ikon: 'fa-apple-whole',   aciklama: 'Günlük beslenme' },
        { id: 'ihtiyaclar',  name: 'İhtiyaçlar',          ikon: 'fa-box-open',      aciklama: 'Sınıfın ortak ihtiyaç listesi' },
        { id: 'ogrenciler',  name: 'Öğrenciler',          ikon: 'fa-user-group',    aciklama: 'Sınıf listesi ve profil' },
        { id: 'araclar',     name: 'Tahta araçları',      ikon: 'fa-dice',          aciklama: 'Kura, sayaç ve grup oluşturma', roller: ['teacher'] },
        { id: 'rapor',       name: 'Gelişim raporu',      ikon: 'fa-file-lines',    aciklama: 'Veli toplantısı için öğrenci karnesi', roller: ['teacher'] },
        { id: 'eba',         name: 'EBA şifreleri',       ikon: 'fa-key',           aciklama: 'EBA giriş bilgileri', roller: ['teacher', 'student'] },
        { id: 'yedekleme',   name: 'Sistem yedekleme',    ikon: 'fa-database',      aciklama: 'Yedek al ve geri yükle', roller: ['teacher'] }
    ]
};
