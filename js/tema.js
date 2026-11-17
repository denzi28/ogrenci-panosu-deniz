// Görünüm: sitenin tamamı renkli temayla açılır (öğretmen, öğrenci, veli, giriş sayfaları).
// Sayfa çizilmeden önce çalışır ki renk sonradan değişmesin. Eski "sade" seçimi artık dikkate alınmaz.
(function () {
    var html = document.documentElement;
    html.classList.add('tema-renkli');
    try { localStorage.removeItem('gorunum-temasi'); } catch (e) { }

    // TEMA ÖNİZLEMESİ (öneri dalı): adrese ?tema=<ad> eklenir ya da sol alttaki seçiciyle seçilir; sekme kapanana kadar hatırlanır.
    // Tema dosyası renkli temanın üstüne biner (css/temalar/*.css). Etkileşimli temaların ayrıca küçük bir betiği var (js/temalar/*.js).
    // Seçilen tema kalıcı olunca bu kısım sadeleşir, seçici kaldırılır.
    var TEMALAR = [
        ['', 'Şimdiki renkli tema'],
        ['tepe', 'Gün Doğumu Tepeleri', 'yeni · uçurtma'],
        ['bulut', 'Renk Bulutları', 'yeni · boya'],
        ['piksel', 'Piksel Dünyası', 'yeni · piksel'],
        ['okyanus', 'Okyanus', 'dokun: kabarcık'],
        ['bahce', 'Sihirli Bahçe', 'dokun: çiçek'],
        ['robot', 'Robot Atölyesi', 'dokun: Bip'],
        ['defter', 'Defter ve Çıkartma'],
        ['uzay', 'Uzay Macerası'],
        ['seker', 'Şeker Kili']
    ];
    var ETKILESIMLI = ['tepe', 'bulut', 'piksel', 'okyanus', 'bahce', 'robot'];
    var t = '';
    try {
        var q = new URLSearchParams(location.search).get('tema');
        if (q !== null) sessionStorage.setItem('tema-onizleme', q);
        t = sessionStorage.getItem('tema-onizleme') || '';
    } catch (e) { }
    var bilinen = TEMALAR.some(function (x) { return x[0] && x[0] === t; });
    if (!bilinen) t = '';
    document.write('<link rel="stylesheet" href="css/temalar/secici.css">');
    if (t) {
        html.setAttribute('data-tema', t);
        document.write('<link rel="stylesheet" href="css/temalar/' + t + '.css">');
        if (ETKILESIMLI.indexOf(t) >= 0) {
            document.write('<link rel="stylesheet" href="css/temalar/etkilesim.css">');
            document.write('<script type="module" src="js/temalar/' + t + '.js"><\/script>');
        }
    }

    // Sol altta "Tema" düğmesi: listeden seçince sayfa o temayla yeniden açılır
    function seciciKur() {
        var kap = document.createElement('div');
        kap.className = 'tema-secici';
        var dugme = document.createElement('button');
        dugme.type = 'button';
        dugme.setAttribute('aria-expanded', 'false');
        dugme.textContent = '🎨 Tema';
        var liste = document.createElement('ul');
        liste.hidden = true;
        liste.id = 'tema-secici-liste';
        dugme.setAttribute('aria-controls', liste.id);
        TEMALAR.forEach(function (x, i) {
            if (i === 1 || i === 7) { var ay = document.createElement('li'); ay.className = 'ayrac'; ay.setAttribute('aria-hidden', 'true'); liste.appendChild(ay); }
            var li = document.createElement('li'), a = document.createElement('a');
            a.href = '#';
            a.textContent = x[1];
            // Adres tıklama anında kurulur: o an açık olan bölüm (#...) ve sınıf (?sinif=) korunur
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var u = new URL(location.href);
                u.searchParams.set('tema', x[0]);
                location.href = u.pathname + u.search + u.hash;
            });
            if (x[2]) { var s = document.createElement('small'); s.textContent = x[2]; a.appendChild(s); }
            if (x[0] === t) a.setAttribute('aria-current', 'true');
            li.appendChild(a); liste.appendChild(li);
        });
        dugme.addEventListener('click', function () {
            liste.hidden = !liste.hidden;
            dugme.setAttribute('aria-expanded', String(!liste.hidden));
        });
        document.addEventListener('click', function (e) {
            if (!kap.contains(e.target)) { liste.hidden = true; dugme.setAttribute('aria-expanded', 'false'); }
        });
        kap.appendChild(liste); kap.appendChild(dugme);
        document.body.appendChild(kap);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', seciciKur);
    else seciciKur();
})();
