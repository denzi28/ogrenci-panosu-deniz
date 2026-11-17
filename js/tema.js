// Görünüm: sitenin tamamı renkli temayla açılır (öğretmen, öğrenci, veli, giriş sayfaları).
// Sayfa çizilmeden önce çalışır ki renk sonradan değişmesin. Eski "sade" seçimi artık dikkate alınmaz.
(function () {
    var html = document.documentElement;
    html.classList.add('tema-renkli');
    try { localStorage.removeItem('gorunum-temasi'); } catch (e) { }

    // TEMA ÖNİZLEMESİ (öneri dalı): adrese ?tema=defter | uzay | seker eklenir; sekme kapanana kadar hatırlanır.
    // Tema dosyası renkli temanın üstüne biner (css/temalar/*.css). Seçilen tema kalıcı olunca bu kısım sadeleşir.
    var TEMALAR = ['defter', 'uzay', 'seker'], t = null;
    try {
        var q = new URLSearchParams(location.search).get('tema');
        if (q !== null) sessionStorage.setItem('tema-onizleme', q);
        t = sessionStorage.getItem('tema-onizleme');
    } catch (e) { }
    if (TEMALAR.indexOf(t) >= 0) {
        html.setAttribute('data-tema', t);
        document.write('<link rel="stylesheet" href="css/temalar/' + t + '.css">');
    }
})();
