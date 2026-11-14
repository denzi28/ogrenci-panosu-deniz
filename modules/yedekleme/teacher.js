// Sistem yedekleme — öğretmen: tüm tabloları tek .json dosyasına indir, yedekten geri yükle, kayıtları tek tek düzelt.
// Yedek dosyası biçimi eskisiyle aynıdır: { olusturulmaTarihi, bulunanTabloSayisi, veriler: { tablo: [ {id, ...} ] } }
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, kaydedildiIsareti } from '../../js/arayuz.js';

const SON_YEDEK = 'son-yedek-tarihi';
let kok, tablolar = [], yuklenecek = null, duzenlenen = { tablo: '', kayitlar: [] };

export async function render(container) {
    container.innerHTML = `<div id="yedek-kok"></div>`;
    kok = container.firstElementChild;
    tablolar = (await db.getCollectionList()).sort();
    kok.innerHTML = `
        ${modulBasligi({ baslik: 'Sistem yedekleme', aciklama: 'Ayda bir yedek almanız önerilir. Yedek dosyasında öğrencilerin TC ve şifreleri de vardır, güvenli bir yerde saklayın' })}
        <div class="yedek-izgara">
            <section class="panel">
                <div class="panel-ust"><h2><i class="fas fa-download" style="color:var(--primary);margin-right:8px"></i>Yedek al</h2><small id="son-yedek"></small></div>
                <div class="panel-ic">
                    <p class="yedek-yazi">Sınıfın tüm bilgileri (${sayi(tablolar.length)} tablo) bilgisayarınıza tek bir dosya olarak iner</p>
                    <button type="button" class="btn btn-primary btn-buyuk" id="yedek-al"${tablolar.length ? '' : ' disabled'}><i class="fas fa-download"></i>Yedeği indir</button>
                    <p class="yedek-durum" id="yedek-al-durum" role="status"></p>
                </div>
            </section>
            <section class="panel">
                <div class="panel-ust"><h2><i class="fas fa-rotate-left" style="color:var(--danger);margin-right:8px"></i>Yedekten geri yükle</h2></div>
                <div class="panel-ic">
                    <p class="yedek-yazi">Yedekteki kayıtlar aynı kimlikle geri yazılır. Sonradan eklenen kayıtlar silinmez</p>
                    <label class="dosya-sec" id="dosya-sec">
                        <input type="file" id="yedek-dosya" accept=".json,application/json">
                        <i class="fas fa-file-arrow-up"></i><span id="dosya-adi">Yedek dosyasını seçin (.json)</span>
                    </label>
                    <div id="yedek-onizleme"></div>
                    <button type="button" class="btn btn-danger btn-buyuk" id="yedek-yukle" disabled><i class="fas fa-rotate-left"></i>Geri yükle</button>
                    <p class="yedek-durum" id="yedek-yukle-durum" role="status"></p>
                </div>
            </section>
        </div>
        <details class="panel acilir-panel" id="gelismis">
            <summary class="panel-ust"><h2>Gelişmiş: kayıtları tek tek düzelt</h2><small>Değişiklikler hemen kaydedilir</small></summary>
            <div class="panel-ic">
                <p class="uyari-not"><i class="fas fa-triangle-exclamation"></i>Burası sadece bir şey bozulursa düzeltmek için. Yanlış bir kaydı silmek geri alınamaz</p>
                <div class="satir-form" style="max-width:480px;margin-top:12px">
                    <select id="tablo-sec" aria-label="Tablo"><option value="">Tablo seçin</option>${tablolar.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
                    <button type="button" class="btn btn-secondary" id="tablo-getir">Kayıtları getir</button>
                </div>
            </div>
            <div id="kayitlar"></div>
        </details>`;

    sonYedegiYaz();
    kok.querySelector('#yedek-al').addEventListener('click', yedekAl);
    kok.querySelector('#yedek-dosya').addEventListener('change', dosyaSecildi);
    kok.querySelector('#yedek-yukle').addEventListener('click', geriYukle);
    kok.querySelector('#tablo-getir').addEventListener('click', tabloGetir);
    kok.querySelector('#kayitlar').addEventListener('click', kayitIslemi);
}

function sonYedegiYaz() {
    let t = null;
    try { t = localStorage.getItem(SON_YEDEK); } catch { /* gizli sekme */ }
    const alan = kok.querySelector('#son-yedek');
    if (!t) { alan.textContent = 'Bu cihazdan henüz yedek alınmadı'; return; }
    const gun = Math.floor((Date.now() - new Date(t)) / 864e5);
    alan.textContent = `Son yedek: ${gun === 0 ? 'bugün' : gun === 1 ? 'dün' : `${gun} gün önce`}`;
    alan.style.color = gun > 30 ? 'var(--warning)' : '';
}

// ---------------------------------------------------------------- Yedek al
async function yedekAl() {
    const dugme = kok.querySelector('#yedek-al'), durum = kok.querySelector('#yedek-al-durum');
    dugme.disabled = true;
    durum.style.color = '';
    try {
        const yedek = { olusturulmaTarihi: new Date().toISOString(), bulunanTabloSayisi: tablolar.length, veriler: {} };
        let kayit = 0;
        for (const [i, tablo] of tablolar.entries()) {
            durum.textContent = `Toplanıyor ${i + 1}/${tablolar.length}: ${tablo}`;
            const veriler = await db.getAll(tablo);
            if (veriler.length) { yedek.veriler[tablo] = veriler; kayit += veriler.length; }
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(yedek, null, 2)], { type: 'application/json' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: `Sinif_Akilli_Yedek_${yedek.olusturulmaTarihi.split('T')[0]}.json` });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        try { localStorage.setItem(SON_YEDEK, yedek.olusturulmaTarihi); } catch { /* gizli sekme */ }
        sonYedegiYaz();
        durum.textContent = `İndirildi: ${sayi(Object.keys(yedek.veriler).length)} tablo, ${sayi(kayit)} kayıt`;
        durum.style.color = 'var(--primary)';
    } catch (e) {
        console.error(e);
        durum.textContent = 'Yedek alınamadı, internet bağlantısını kontrol edip tekrar deneyin';
        durum.style.color = 'var(--danger)';
    }
    dugme.disabled = false;
}

// ---------------------------------------------------------------- Geri yükle
async function dosyaSecildi(e) {
    const dosya = e.target.files[0];
    const onizleme = kok.querySelector('#yedek-onizleme'), dugme = kok.querySelector('#yedek-yukle');
    yuklenecek = null;
    dugme.disabled = true;
    onizleme.innerHTML = '';
    kok.querySelector('#dosya-adi').textContent = dosya ? dosya.name : 'Yedek dosyasını seçin (.json)';
    kok.querySelector('#dosya-sec').classList.toggle('secili', !!dosya);
    if (!dosya) return;
    try {
        const yedek = JSON.parse(await dosya.text());
        if (!yedek || typeof yedek.veriler !== 'object' || Array.isArray(yedek.veriler)) throw new Error('biçim');
        const liste = Object.entries(yedek.veriler).filter(([, k]) => Array.isArray(k));
        if (!liste.length) throw new Error('boş');
        yuklenecek = liste;
        const toplam = liste.reduce((t, [, k]) => t + k.length, 0);
        const tarih = new Date(yedek.olusturulmaTarihi);
        onizleme.innerHTML = `
            <div class="yedek-ozet">
                <strong>${isNaN(tarih) ? 'Tarihi bilinmeyen yedek' : `${tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihli yedek`}</strong>
                <span>${sayi(liste.length)} tablo, ${sayi(toplam)} kayıt</span>
                <small>${liste.map(([t, k]) => `${esc(t)} (${sayi(k.length)})`).join(', ')}</small>
            </div>`;
        dugme.disabled = false;
    } catch (err) {
        onizleme.innerHTML = '<p class="yedek-durum" style="color:var(--danger)">Bu dosya bir sınıf panosu yedeği değil ya da bozuk</p>';
    }
}

async function geriYukle() {
    if (!yuklenecek) return;
    const toplam = yuklenecek.reduce((t, [, k]) => t + k.length, 0);
    if (!confirm(`${sayi(toplam)} kayıt yedekteki haliyle geri yazılacak. Aynı kayıtlarda sonradan yapılan değişiklikler kaybolur. Devam edilsin mi?`)) return;
    const dugme = kok.querySelector('#yedek-yukle'), durum = kok.querySelector('#yedek-yukle-durum');
    dugme.disabled = true;
    durum.style.color = '';
    let yazilan = 0, hatali = 0;
    for (const [tablo, kayitlar] of yuklenecek) {
        for (const kayit of kayitlar) {
            const { id, ...veri } = kayit || {};
            const basarili = id ? await db.setWithId(tablo, String(id), veri) : !!(await db.add(tablo, veri).catch(() => null));
            basarili ? yazilan++ : hatali++;
            if ((yazilan + hatali) % 10 === 0) durum.textContent = `Yükleniyor ${sayi(yazilan + hatali)}/${sayi(toplam)}`;
        }
    }
    durum.textContent = hatali ? `${sayi(yazilan)} kayıt geri yüklendi, ${sayi(hatali)} kayıt yazılamadı. Tekrar deneyebilirsiniz` : `${sayi(yazilan)} kayıt geri yüklendi`;
    durum.style.color = hatali ? 'var(--danger)' : 'var(--primary)';
    dugme.disabled = false;
}

// ---------------------------------------------------------------- Gelişmiş: kayıt düzenleyici
// Değerin türü korunur: sayı sayı, doğru/yanlış doğru/yanlış, liste/nesne JSON olarak kalır.
const metne = (v) => (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v ?? '');
function eskiTurde(yazi, eski) {
    if (typeof eski === 'number') { const n = Number(yazi.replace(',', '.')); return yazi.trim() === '' || isNaN(n) ? yazi : n; }
    if (typeof eski === 'boolean') return yazi === 'true' ? true : yazi === 'false' ? false : yazi;
    if (eski !== null && typeof eski === 'object') { try { return JSON.parse(yazi); } catch { return yazi; } }
    return yazi;
}

async function tabloGetir() {
    const tablo = kok.querySelector('#tablo-sec').value;
    const alan = kok.querySelector('#kayitlar');
    if (!tablo) return;
    alan.innerHTML = '<p class="bos-not">Yükleniyor</p>';
    const kayitlar = await db.getAll(tablo);
    duzenlenen = { tablo, kayitlar };
    const anahtarlar = [...new Set(kayitlar.flatMap(k => Object.keys(k)).filter(k => k !== 'id'))].sort();
    alan.innerHTML = kayitlar.length ? `
        <p class="kayit-sayi">${sayi(kayitlar.length)} kayıt</p>
        ${kayitlar.map(k => `
            <div class="db-kayit" data-id="${esc(k.id)}">
                <div class="db-kayit-ust"><code>${esc(k.id)}</code>
                    <span><button type="button" class="btn btn-secondary btn-kucuk" data-islem="kaydet">Kaydet</button>
                    <button type="button" class="ikon-dugme tehlike" data-islem="sil" title="Kaydı sil" aria-label="Kaydı sil"><i class="fas fa-trash"></i></button></span>
                </div>
                <div class="db-alanlar">${anahtarlar.map(a => `
                    <label><span>${esc(a)}</span><input type="text" data-alan="${esc(a)}" value="${esc(metne(k[a]))}" spellcheck="false"></label>`).join('')}
                </div>
            </div>`).join('')}` : '<p class="bos-not">Bu tabloda kayıt yok</p>';
}

async function kayitIslemi(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    const kart = d.closest('.db-kayit');
    const id = kart.dataset.id;
    const eski = duzenlenen.kayitlar.find(k => k.id === id) || {};
    const { tablo } = duzenlenen;
    d.disabled = true;
    if (d.dataset.islem === 'kaydet') {
        const yeni = {};
        kart.querySelectorAll('input[data-alan]').forEach(g => {
            const a = g.dataset.alan;
            if (g.value === metne(eski[a])) return; // değişmeyen alan yazılmaz
            yeni[a] = eskiTurde(g.value, eski[a]);
        });
        try {
            if (Object.keys(yeni).length) { await db.update(tablo, id, yeni); Object.assign(eski, yeni); }
            kaydedildiIsareti(kart);
        } catch (err) { alert(`Kaydedilemedi: ${err.message || 'bilinmeyen hata'}`); }
    } else if (d.dataset.islem === 'sil') {
        if (!confirm(`${tablo} tablosundaki ${id} kaydı silinsin mi? Geri alınamaz`)) { d.disabled = false; return; }
        try { await db.delete(tablo, id); kart.remove(); duzenlenen.kayitlar = duzenlenen.kayitlar.filter(k => k.id !== id); }
        catch (err) { alert(`Silinemedi: ${err.message || 'bilinmeyen hata'}`); }
    }
    d.disabled = false;
}
