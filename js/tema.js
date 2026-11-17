// Görünüm: sitenin tamamı renkli temayla açılır (öğretmen, öğrenci, veli, giriş sayfaları).
// Sayfa çizilmeden önce çalışır ki renk sonradan değişmesin. Eski "sade" seçimi artık dikkate alınmaz.
(function () {
    document.documentElement.classList.add('tema-renkli');
    try { localStorage.removeItem('gorunum-temasi'); } catch (e) { }
})();
