// Sınıf ayarları — öğretmen: sınıf adı, okul, veli linki, kurulum sihirbazı.
// Ana sınıfın öğretmeni (site yöneticisi) ayrıca yeni öğretmenler için tek kullanımlık davet kodu üretir ve sınıfları görür.
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore } from '../../js/firebase.js';
import { auth } from '../../js/auth.js';
import { appConfig } from '../../js/config.js';
import { esc, sayi, modulBasligi, kaydedildiIsareti } from '../../js/arayuz.js';
import { sinifBilgisi, aktifSinifId, veliLinki, ANA_SINIF } from '../../js/sinif.js';
import { davetKoduUret } from '../../js/kayit.js';

let kok, sinif;
const yonetici = () => aktifSinifId() === ANA_SINIF;

export async function render(container) {
    container.innerHTML = `<div id="ayar-kok"></div>`;
    kok = container.firstElementChild;
    sinif = await sinifBilgisi(aktifSinifId(), { yenile: true });
    const link = veliLinki();
    kok.innerHTML = `
        ${modulBasligi({ baslik: 'Sınıf ayarları', aciklama: yonetici() ? 'Sınıfınızın bilgileri ve yeni öğretmenler için davet kodları' : 'Sınıfınızın adı ve velilere vereceğiniz link' })}
        <section class="panel">
            <div class="panel-ust"><h2>Sınıf</h2></div>
            <form class="panel-ic" id="form-sinif" autocomplete="off">
                <div class="form-ikili">
                    <div class="form-group"><label for="a-ad">Sınıf / şube adı</label><input type="text" id="a-ad" maxlength="30" value="${esc(sinif?.ad || appConfig.sinifAdi)}" required></div>
                    <div class="form-group"><label for="a-okul">Okul <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><input type="text" id="a-okul" maxlength="80" value="${esc(sinif?.okul || '')}"></div>
                </div>
                <div class="form-eylem"><button type="submit" class="btn btn-primary">Kaydet</button><a class="btn btn-secondary" href="kurulum.html"><i class="fas fa-wand-magic-sparkles"></i>Kurulum sihirbazını aç</a></div>
            </form>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Veli linki</h2><small>Bu linki açan herkes "Velilere açık" bölümleri görür</small></div>
            <div class="panel-ic">
                <div class="kurulum-bilgi" style="margin:0"><i class="fas fa-link"></i><div style="flex:1;min-width:0"><strong style="overflow-wrap:anywhere">${esc(link)}</strong></div>
                    <button type="button" class="btn btn-secondary btn-kucuk" data-islem="kopyala" data-metin="${esc(link)}"><i class="fas fa-copy"></i>Kopyala</button></div>
                <p class="arac-not" style="margin-top:12px">Link yerine sınıf kodu da verebilirsiniz: <b class="sinif-kodu">${esc(aktifSinifId())}</b> Veli sitenin ana sayfasında bu kodu yazınca sınıfın sayfası açılır</p>
            </div>
        </section>
        ${yonetici() ? `
        <section class="panel">
            <div class="panel-ust"><h2>Öğretmen davet kodları</h2><small>Her kod bir kez kullanılır. Kodu alan öğretmen kendi sınıfını kurar</small></div>
            <form class="satir satir-form" id="form-davet" autocomplete="off">
                <input type="text" id="davet-not" maxlength="60" placeholder="Kime vereceksiniz? (isteğe bağlı, ör. Ayşe Hanım 4/A)" aria-label="Not">
                <button type="submit" class="btn btn-primary"><i class="fas fa-key"></i>Kod üret</button>
            </form>
            <div id="davet-liste"></div>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Sitedeki sınıflar</h2></div>
            <div id="sinif-liste"><p class="bos-not">Yükleniyor</p></div>
        </section>` : ''}`;
    kok.querySelector('#form-sinif').addEventListener('submit', sinifKaydet);
    kok.addEventListener('click', tikla);
    if (yonetici()) {
        kok.querySelector('#form-davet').addEventListener('submit', davetUret);
        davetleriCiz();
        siniflariCiz();
    }
}

async function sinifKaydet(e) {
    e.preventDefault();
    const ad = kok.querySelector('#a-ad').value.trim(), okul = kok.querySelector('#a-okul').value.trim();
    if (!ad) return;
    const dugme = e.target.querySelector('button[type="submit"]');
    dugme.disabled = true;
    try {
        await setDoc(doc(firestore, 'siniflar', aktifSinifId()), { ad, okul, ...(yonetici() ? { ana: true, kurulumBitti: true } : {}) }, { merge: true });
        appConfig.sinifAdi = ad;
        document.querySelectorAll('.marka-rozet').forEach(el => { el.textContent = ad; el.classList.toggle('uzun', ad.length > 4); });
        await sinifBilgisi(aktifSinifId(), { yenile: true });
        kaydedildiIsareti(e.target.closest('.panel'));
    } catch (err) { alert('Kaydedilemedi. Veritabanı kuralları güncel olmayabilir'); }
    dugme.disabled = false;
}

// ---------------------------------------------------------------- Davet kodları (sadece yönetici)
async function davetleriCiz() {
    const alan = kok.querySelector('#davet-liste');
    try {
        const snap = await getDocs(collection(firestore, 'davetler'));
        const kodlar = snap.docs.map(d => ({ kod: d.id, ...d.data() })).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
        alan.innerHTML = kodlar.map(k => `
            <div class="satir" data-kod="${esc(k.kod)}">
                <span class="satir-ad"><span class="davet-kodu">${esc(k.kod)}</span><small>${esc(k.not || 'Not yok')} · ${k.tarih ? new Date(k.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''}</small></span>
                <button type="button" class="btn btn-secondary btn-kucuk" data-islem="kopyala" data-metin="${esc(k.kod)}"><i class="fas fa-copy"></i>Kopyala</button>
                <button type="button" class="ikon-dugme tehlike" data-islem="davet-sil" title="Kodu iptal et" aria-label="Kodu iptal et"><i class="fas fa-trash"></i></button>
            </div>`).join('') || '<p class="bos-not">Kullanılmamış kod yok. Kullanılan kodlar listeden kendiliğinden düşer</p>';
    } catch (e) {
        alan.innerHTML = '<p class="bos-not">Kodlar okunamadı. Veritabanı kurallarının güncel olduğundan emin olun</p>';
    }
}

async function davetUret(e) {
    e.preventDefault();
    const not = kok.querySelector('#davet-not').value.trim();
    const kod = davetKoduUret();
    try {
        await setDoc(doc(firestore, 'davetler', kod), { not, olusturan: auth.currentUser?.name || '', tarih: new Date().toISOString() });
        kok.querySelector('#davet-not').value = '';
        await davetleriCiz();
        kaydedildiIsareti(kok.querySelector(`[data-kod="${CSS.escape(kod)}"]`));
    } catch (err) { alert('Kod üretilemedi. Veritabanı kuralları güncel olmayabilir'); }
}

async function siniflariCiz() {
    const alan = kok.querySelector('#sinif-liste');
    try {
        const snap = await getDocs(collection(firestore, 'siniflar'));
        const liste = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.id === ANA_SINIF) - (a.id === ANA_SINIF) || String(a.ad).localeCompare(String(b.ad), 'tr-TR'));
        alan.innerHTML = liste.map(s => `
            <div class="satir">
                <span class="ders-no" style="width:auto;padding:0 8px;border-radius:14px">${esc(s.ad)}</span>
                <span class="satir-ad">${esc(s.ogretmenAdi || (s.id === ANA_SINIF ? 'Ana sınıf' : ''))}<small>${s.okul ? `${esc(s.okul)} · ` : ''}${s.kurulumBitti ? 'Kuruldu' : 'Kurulum sürüyor'}</small></span>
                <button type="button" class="btn btn-secondary btn-kucuk" data-islem="kopyala" data-metin="${esc(veliLinki(s.id))}"><i class="fas fa-link"></i>Veli linki</button>
            </div>`).join('') || '<p class="bos-not">Henüz başka sınıf yok</p>';
    } catch (e) { alan.innerHTML = '<p class="bos-not">Sınıflar okunamadı</p>'; }
}

async function tikla(e) {
    const d = e.target.closest('[data-islem]');
    if (!d) return;
    if (d.dataset.islem === 'kopyala') {
        try { await navigator.clipboard.writeText(d.dataset.metin); const eski = d.innerHTML; d.innerHTML = '<i class="fas fa-check"></i>Kopyalandı'; setTimeout(() => { d.innerHTML = eski; }, 1500); }
        catch { prompt('Kopyalayın', d.dataset.metin); }
    }
    if (d.dataset.islem === 'davet-sil') {
        const kod = d.closest('[data-kod]').dataset.kod;
        if (!confirm(`${kod} kodu iptal edilsin mi? Artık kullanılamaz`)) return;
        try { await deleteDoc(doc(firestore, 'davetler', kod)); davetleriCiz(); } catch { alert('Silinemedi'); }
    }
}
