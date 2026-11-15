// Görünüm seçimi: "sade" ya da "renkli". Sayfa çizilmeden önce çalışır ki renk sonradan değişmesin.
// Seçim her cihazda ayrı hatırlanır. Seçim yoksa sayfanın varsayılanı kullanılır
// (<html data-varsayilan-tema="renkli"> öğrenci sayfasında).
(function () {
    var ANAHTAR = 'gorunum-temasi';
    function kayitli() { try { return localStorage.getItem(ANAHTAR); } catch (e) { return null; } }
    function uygula(tema) { document.documentElement.classList.toggle('tema-renkli', tema === 'renkli'); }
    var varsayilan = document.documentElement.getAttribute('data-varsayilan-tema') || 'sade';
    uygula(kayitli() || varsayilan);
    window.gorunumTemasi = {
        simdiki: function () { return document.documentElement.classList.contains('tema-renkli') ? 'renkli' : 'sade'; },
        degistir: function () {
            var yeni = this.simdiki() === 'renkli' ? 'sade' : 'renkli';
            uygula(yeni);
            try { localStorage.setItem(ANAHTAR, yeni); } catch (e) { }
            return yeni;
        },
    };
})();
