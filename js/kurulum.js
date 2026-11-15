// Yeni öğretmenin sınıf kurulum sihirbazı.
// Zorunlu adımlar: sınıf adı ve öğrenciler. Diğerleri "Atla" ile geçilebilir; hepsi sonradan ilgili bölümden de yapılabilir.
// Veriler db.js üzerinden aktif sınıfa (giriş yapan öğretmenin sınıfı) yazılır.
import { auth } from './auth.js';
import { db } from './db.js';
import { appConfig } from './config.js';
import { esc, sayi } from './arayuz.js';
import { sinifBilgisi, aktifSinifId, veliLinki } from './sinif.js';
import { kullaniciAdiOner, sifreOner, yedekKullaniciAdi, satirCoz, girisKartlariniYazdir, DUZEN_ACIKLAMASI } from './girisBilgisi.js';
import { HAZIR_ROZETLER } from '../modules/rozetler/ortak.js';
import { GUNLER as PROGRAM_GUNLERI, DERS_SAYISI, TABLO as PROGRAM_TABLO } from '../modules/program/ortak.js';
import { GUNLER as BESLENME_GUNLERI, TABLO as BESLENME_TABLO } from '../modules/beslenme/ortak.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore } from './firebase.js';

const $ = (id) => document.getElementById(id);
let sinif, ogrenciler = [], sira = 0;
const yapildi = new Set();          // kaydedilen adımlar (özet için)
const eklenenGirisler = [];         // bu kurulumda eklenen öğrencilerin giriş bilgileri (yazdırmak için)

const DAVRANIS_ONERI = ['Ödevini yapma', 'Sınıf kurallarına uyma', 'Arkadaşına yardım', 'Derse katılım', 'Temizlik ve düzen', 'Zamanında gelme', 'Kitap okuma', 'Saygılı konuşma'];
const SIK_DERSLER = ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi ve Oyun', 'Din Kültürü', 'Serbest Etkinlikler'];
// Başlangıç rozet paketi: hazır görseller, bazıları kitap/ödev sayısına ulaşınca kendiliğinden verilir
const ROZET_PAKETI = [
    ['kitap-dostu', { altYazi: '5 kitap', kitapHedefi: 5, aciklama: '5 kitap bitirdi' }],
    ['kitap-kurdu', { altYazi: '10 kitap', kitapHedefi: 10, aciklama: '10 kitap bitirdi' }],
    ['kitap-kulesi', { altYazi: '20 kitap', kitapHedefi: 20, aciklama: '20 kitap bitirdi' }],
    ['odev-yildizi', { altYazi: '10 ödev', odevHedefi: 10, aciklama: '10 ödevi tam yaptı' }],
    ['yardimsever', {}], ['temizlik-kahramani', {}], ['haftanin-yildizi', {}], ['matematik-ustasi', {}],
    ['aktif-katilim', {}], ['iyi-arkadas', {}], ['super-caba', {}], ['dakik', {}],
];

// ---------------------------------------------------------------- ADIMLAR
const ADIMLAR = [
    {
        id: 'sinif', baslik: 'Sınıfınız', zorunlu: true,
        aciklama: 'Sınıfınızın adı her sayfanın üstünde ve velilerin gördüğü sayfada yazar',
        ciz: () => `
            <div class="form-group"><label for="k-ad">Sınıf / şube adı</label><input type="text" id="k-ad" maxlength="30" value="${esc(sinif.ad || '')}" placeholder="4/A"></div>
            <div class="form-group"><label for="k-okul">Okul adı <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><input type="text" id="k-okul" maxlength="80" value="${esc(sinif.okul || '')}" placeholder="Atatürk İlkokulu"></div>
            <div class="kurulum-bilgi"><i class="fas fa-link"></i><div><small>Velilere vereceğiniz link</small><strong>${esc(veliLinki())}</strong></div></div>`,
        kaydet: async () => {
            const ad = $('k-ad').value.trim(), okul = $('k-okul').value.trim();
            if (!ad) { hataGoster('Sınıf adını yazın'); return false; }
            await updateDoc(doc(firestore, 'siniflar', aktifSinifId()), { ad, okul });
            sinif.ad = ad; sinif.okul = okul;
            $('kurulum-rozet').textContent = ad;
            return true;
        },
    },
    {
        id: 'ogrenciler', baslik: 'Öğrenciler', zorunlu: true,
        aciklama: `Her satıra bir öğrenci yazın ya da Excel'den ad ve okul numarası sütunlarını yapıştırın. Giriş hesapları kendiliğinden açılır. ${DUZEN_ACIKLAMASI}`,
        ciz: () => `
            ${ogrenciler.length ? `<div class="kurulum-bilgi tamam"><i class="fas fa-check"></i><div><small>Sınıfınızda</small><strong>${sayi(ogrenciler.length)} öğrenci var</strong></div></div>` : ''}
            <div class="form-group"><label for="k-liste">${ogrenciler.length ? 'Başka öğrenci eklemek isterseniz' : 'Öğrenci listesi'}</label>
                <textarea id="k-liste" rows="6" spellcheck="false" placeholder="Ali Yılmaz&#9;101&#10;Ayşe Demir&#9;102&#10;Mehmet Kaya"></textarea></div>
            <div id="k-onizleme"></div>`,
        bagla: () => {
            $('k-liste').addEventListener('input', ogrenciOnizle);
            ogrenciOnizle();
        },
        kaydet: async () => {
            const satirlar = [...document.querySelectorAll('#k-onizleme tr[data-satir]')];
            if (satirlar.length) {
                const tamam = await ogrencileriEkle(satirlar);
                if (!tamam) return false;
            }
            if (!ogrenciler.length) { hataGoster('En az bir öğrenci ekleyin. Sonradan Öğrenciler bölümünden de ekleyebilirsiniz'); return false; }
            return true;
        },
    },
    {
        id: 'davranis', baslik: 'Davranış ölçütleri',
        aciklama: 'Davranış panosunda öğrencilere hangi davranışlar için yıldız vereceksiniz? Seçin ya da kendiniz yazın',
        ciz: () => `
            <div class="secim-cipleri" id="k-davranis">${DAVRANIS_ONERI.map((d, i) => `<label class="secim-cip"><input type="checkbox" value="${esc(d)}"${i < 4 ? ' checked' : ''}><span>${esc(d)}</span></label>`).join('')}</div>
            <div class="satir-form" style="margin-top:12px"><input type="text" id="k-davranis-yeni" placeholder="Başka bir davranış" maxlength="50"><button type="button" class="btn btn-secondary" id="k-davranis-ekle"><i class="fas fa-plus"></i>Ekle</button></div>`,
        bagla: () => {
            const ekle = () => {
                const v = $('k-davranis-yeni').value.trim();
                if (!v) return;
                $('k-davranis').insertAdjacentHTML('beforeend', `<label class="secim-cip"><input type="checkbox" value="${esc(v)}" checked><span>${esc(v)}</span></label>`);
                $('k-davranis-yeni').value = '';
            };
            $('k-davranis-ekle').addEventListener('click', ekle);
            $('k-davranis-yeni').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ekle(); } });
        },
        kaydet: async () => {
            const secilen = [...document.querySelectorAll('#k-davranis input:checked')].map(i => i.value);
            const mevcut = new Set((await db.getAll('davranis_kriterleri')).map(k => k.ad));
            for (const ad of secilen) if (!mevcut.has(ad)) await db.add('davranis_kriterleri', { ad });
            return true;
        },
    },
    {
        id: 'program', baslik: 'Ders programı',
        aciklama: 'Haftalık ders programınızı yazın. Ana sayfadaki kara tahtada her gün o günün dersleri görünür',
        ciz: () => `
            <datalist id="k-dersler">${SIK_DERSLER.map(d => `<option value="${esc(d)}">`).join('')}</datalist>
            <div class="kurulum-tablo-kap"><table class="kurulum-program">
                <thead><tr><th></th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<th>${i + 1}. ders</th>`).join('')}</tr>
                <tr><th>Saat</th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<td><input type="text" data-gun="SAATLER" data-ders="${i + 1}" placeholder="09:00 - 09:40" aria-label="${i + 1}. ders saati"></td>`).join('')}</tr></thead>
                <tbody>${PROGRAM_GUNLERI.map(g => `<tr><th>${g}</th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<td><input type="text" list="k-dersler" data-gun="${g}" data-ders="${i + 1}" aria-label="${g} ${i + 1}. ders"></td>`).join('')}</tr>`).join('')}</tbody>
            </table></div>`,
        kaydet: async () => {
            const kayit = {};
            document.querySelectorAll('.kurulum-program input').forEach(g => {
                if (!g.value.trim()) return;
                (kayit[g.dataset.gun] ||= { gun: g.dataset.gun })[`ders${g.dataset.ders}`] = g.value.trim();
            });
            if (!Object.keys(kayit).length) return true;
            const mevcut = await db.getAll(PROGRAM_TABLO);
            for (const k of Object.values(kayit)) {
                const eski = mevcut.find(m => m.gun === k.gun);
                eski ? await db.update(PROGRAM_TABLO, eski.id, k) : await db.add(PROGRAM_TABLO, k);
            }
            return true;
        },
    },
    {
        id: 'beslenme', baslik: 'Beslenme programı',
        aciklama: 'Her gün beslenme saatinde ne getirileceğini yazın',
        ciz: () => BESLENME_GUNLERI.map(g => `<div class="form-group"><label for="k-b-${g.anahtar}">${g.ad}</label><input type="text" id="k-b-${g.anahtar}" data-anahtar="${g.anahtar}" placeholder="${esc(g.ornek)}"></div>`).join(''),
        kaydet: async () => {
            const plan = {};
            BESLENME_GUNLERI.forEach(g => { const v = $(`k-b-${g.anahtar}`).value.trim(); if (v) plan[g.anahtar] = v; });
            if (!Object.keys(plan).length) return true;
            const mevcut = (await db.getAll(BESLENME_TABLO))[0];
            mevcut ? await db.update(BESLENME_TABLO, mevcut.id, plan) : await db.add(BESLENME_TABLO, plan);
            return true;
        },
    },
    {
        id: 'rozetler', baslik: 'Başlangıç rozetleri',
        aciklama: 'Hazır rozetlerden sınıfınıza eklemek istediklerinizi seçin. Kitap ve ödev rozetleri öğrenci o sayıya ulaşınca kendiliğinden verilir',
        ciz: () => `<div class="rozet-secim" id="k-rozetler">${ROZET_PAKETI.map(([dosya, ek]) => {
            const h = HAZIR_ROZETLER.find(x => x.dosya === dosya);
            if (!h) return '';
            return `<label class="rozet-secim-kart"><input type="checkbox" value="${dosya}" checked><img src="${h.resim}" alt="" loading="lazy"><strong>${esc(h.ad)}</strong><small>${esc(ek.aciklama || h.aciklama)}</small>${ek.kitapHedefi || ek.odevHedefi ? '<span class="etiket otomatik">Kendiliğinden</span>' : ''}</label>`;
        }).join('')}</div>`,
        kaydet: async () => {
            const secilen = [...document.querySelectorAll('#k-rozetler input:checked')].map(i => i.value);
            const mevcut = new Set((await db.getAll('rozetler_kalemleri')).map(r => r.resim));
            for (const dosya of secilen) {
                const h = HAZIR_ROZETLER.find(x => x.dosya === dosya);
                const ek = ROZET_PAKETI.find(([d]) => d === dosya)[1];
                if (!h || mevcut.has(h.resim)) continue;
                await db.add('rozetler_kalemleri', {
                    resim: h.resim, ad: h.ad.replace(/^./, c => c.toLocaleUpperCase('tr-TR')), kategori: h.kategori, icon: '⭐', shape: '50%',
                    style1: '#fbbf24', style2: '#d97706', altYazi: ek.altYazi || '', aciklama: ek.aciklama || h.aciklama,
                    kitapHedefi: ek.kitapHedefi || null, odevHedefi: ek.odevHedefi || null,
                });
            }
            return true;
        },
    },
    {
        id: 'kitaplik', baslik: 'Sınıf kitaplığı',
        aciklama: 'Sınıf kitaplığınızdaki kitapları her satıra bir kitap olacak şekilde yazın. Başlarına numara koyarsanız kitap verirken numarayla bulursunuz',
        ciz: () => `<div class="form-group"><label for="k-kitaplar">Kitaplar</label><textarea id="k-kitaplar" rows="7" placeholder="1- Küçük Prens&#10;2- Şeker Portakalı&#10;3- Pal Sokağı Çocukları"></textarea></div>`,
        kaydet: async () => {
            const satirlar = $('k-kitaplar').value.split('\n').map(s => s.trim()).filter(Boolean);
            for (const s of satirlar) {
                const m = s.match(/^(\d+)[\s\-.)]+(.+)$/);
                await db.add('kitaplar_kalemleri', m ? { no: parseInt(m[1]), ad: m[2].trim() } : { ad: s });
            }
            return true;
        },
    },
    {
        id: 'veliler', baslik: 'Veliler ne görsün?',
        aciklama: 'Veli linkini açan herkes seçtiğiniz bölümleri görür. TC, şifre ve notlar hiçbir zaman görünmez. Bunu sonra her bölümün "Velilere açık" anahtarıyla değiştirebilirsiniz',
        ciz: () => `<div class="secim-cipleri dikey" id="k-veli">${appConfig.modules.filter(m => !m.roller).map(m =>
            `<label class="secim-cip"><input type="checkbox" value="${m.id}"${m.id === 'ogrenciler' ? '' : ' checked'}><span><i class="fas ${m.ikon}" style="width:20px;color:var(--muted)"></i> ${esc(m.name)}</span></label>`).join('')}</div>`,
        kaydet: async () => {
            for (const k of document.querySelectorAll('#k-veli input')) await db.toggleModuleVisibility(k.value, k.checked);
            return true;
        },
    },
];

// ---------------------------------------------------------------- Öğrenci listesi
function satirlariOku() {
    const kullanilan = new Set(ogrenciler.map(o => String(o.username || '').toLowerCase()));
    return $('k-liste').value.split('\n').map(satirCoz).filter(Boolean).map(c => ({
        ad: c.ad, okulno: c.okulno, tcno: c.tcno,
        kullanici: c.kullanici || kullaniciAdiOner(c.ad, c.okulno, kullanilan),
        sifre: c.sifre || sifreOner(),
    }));
}

function ogrenciOnizle() {
    hataGoster('');
    const liste = satirlariOku();
    $('k-onizleme').innerHTML = liste.length ? `
        <div class="kurulum-tablo-kap"><table class="kurulum-ogrenci">
            <thead><tr><th>Ad soyad</th><th>Okul no</th><th>Kullanıcı adı</th><th>Şifre</th></tr></thead>
            <tbody>${liste.map((o, i) => `<tr data-satir="${i}" data-tc="${esc(o.tcno || '')}">
                <td><input type="text" data-alan="ad" value="${esc(o.ad)}" aria-label="Ad soyad"></td>
                <td><input type="text" data-alan="okulno" value="${esc(o.okulno)}" inputmode="numeric" aria-label="Okul no"></td>
                <td><input type="text" data-alan="kullanici" value="${esc(o.kullanici)}" autocapitalize="none" spellcheck="false" aria-label="Kullanıcı adı"></td>
                <td><input type="text" data-alan="sifre" value="${esc(o.sifre)}" aria-label="Şifre"></td>
            </tr>`).join('')}</tbody>
        </table></div>
        <p class="arac-not" style="margin-top:8px">${sayi(liste.length)} öğrenci eklenecek. Devam'a basınca hesapları açılır</p>` : '';
}

async function ogrencileriEkle(satirlar) {
    const dugme = $('k-devam');
    let eklenen = 0;
    const sorunlar = [];
    for (const tr of satirlar) {
        const al = (a) => tr.querySelector(`[data-alan="${a}"]`).value.trim();
        const v = { name: al('ad'), okulno: al('okulno'), username: al('kullanici'), password: al('sifre'), tcno: tr.dataset.tc || '' };
        if (!v.name || !v.username || !v.password) { sorunlar.push(`${v.name || 'İsimsiz satır'}: eksik bilgi`); continue; }
        dugme.textContent = `Hesaplar açılıyor ${eklenen + 1}/${satirlar.length}`;
        // Kullanıcı adı başka bir sınıfta alınmışsa sonuna sayı eklenerek tekrar denenir
        let denenen = v.username, basarili = false;
        for (let deneme = 0; deneme < 4 && !basarili; deneme++) {
            try {
                const yeni = await db.add('users', { ...v, username: denenen, ozellik: '', role: 'student' });
                ogrenciler.push(yeni);
                eklenenGirisler.push({ ad: v.name, kullanici: denenen, sifre: v.password });
                basarili = true; eklenen++;
                tr.remove();
            } catch (e) {
                if (/kullanıcı adı/i.test(e.message)) denenen = yedekKullaniciAdi(v.username, deneme + 1);
                else { sorunlar.push(`${v.name}: ${e.message}`); break; }
            }
        }
    }
    if (sorunlar.length) { hataGoster(`${sayi(eklenen)} öğrenci eklendi. Eklenemeyenler tabloda kaldı: ${sorunlar.join(', ')}`); const d = $('k-devam'); d.disabled = false; d.textContent = 'Tekrar dene'; return false; }
    $('k-liste').value = '';
    return true;
}

// ---------------------------------------------------------------- Çizim ve gezinme
function hataGoster(m) { const h = $('kurulum-hata'); if (h) h.textContent = m; }

function ciz() {
    const bitis = sira >= ADIMLAR.length;
    $('kurulum-ilerleme').innerHTML = [...ADIMLAR, { baslik: 'Bitti' }].map((a, i) =>
        `<span class="${i < sira ? 'gecti' : i === sira ? 'simdi' : ''}" title="${esc(a.baslik)}"></span>`).join('');
    if (bitis) return bitisCiz();
    const a = ADIMLAR[sira];
    $('kurulum-govde').innerHTML = `
        <small class="kurulum-adim">Adım ${sira + 1} / ${ADIMLAR.length}${a.zorunlu ? '' : ' · isteğe bağlı'}</small>
        <h1 class="kurulum-baslik">${a.baslik}</h1>
        <p class="kurulum-aciklama">${a.aciklama}</p>
        ${a.ciz()}
        <p class="error" id="kurulum-hata" role="alert"></p>`;
    $('kurulum-alt').innerHTML = `
        ${sira > 0 ? '<button type="button" class="btn btn-secondary" id="k-geri"><i class="fas fa-arrow-left"></i>Geri</button>' : '<span></span>'}
        <span class="kurulum-sag">
            ${a.zorunlu ? '' : '<button type="button" class="yazi-dugme" id="k-atla">Atla</button>'}
            ${sira >= 2 ? '<button type="button" class="yazi-dugme" id="k-sonra">Kalanları sonra yaparım</button>' : ''}
            <button type="button" class="btn btn-primary" id="k-devam">${sira === ADIMLAR.length - 1 ? 'Kaydet ve bitir' : a.zorunlu ? 'Devam' : 'Kaydet ve devam'}<i class="fas fa-arrow-right"></i></button>
        </span>`;
    a.bagla?.();
    $('k-geri')?.addEventListener('click', () => { sira--; ciz(); });
    $('k-atla')?.addEventListener('click', () => { sira++; ciz(); });
    $('k-sonra')?.addEventListener('click', () => { sira = ADIMLAR.length; ciz(); });
    $('k-devam').addEventListener('click', async () => {
        const d = $('k-devam'), yazi = d.innerHTML;
        d.disabled = true; d.textContent = 'Kaydediliyor';
        hataGoster('');
        try {
            if (await a.kaydet()) { yapildi.add(a.id); sira++; ciz(); return; }
        } catch (e) {
            console.error(e);
            hataGoster('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
        }
        if (document.body.contains(d)) { d.disabled = false; d.innerHTML = yazi; }
    });
    window.scrollTo({ top: 0 });
}

async function bitisCiz() {
    await updateDoc(doc(firestore, 'siniflar', aktifSinifId()), { kurulumBitti: true }).catch(e => console.warn(e));
    const link = veliLinki();
    $('kurulum-govde').innerHTML = `
        <div class="kurulum-bitti-ikon" aria-hidden="true"><span class="yildiz-cikartma"></span></div>
        <h1 class="kurulum-baslik" style="text-align:center">${esc(sinif.ad)} hazır</h1>
        <p class="kurulum-aciklama" style="text-align:center;margin-left:auto;margin-right:auto">Atladığınız adımları istediğiniz zaman ilgili bölümden yapabilirsiniz</p>
        <div class="kurulum-bilgi"><i class="fas fa-link"></i><div style="min-width:0;flex:1"><small>Velilere vereceğiniz link</small><strong style="overflow-wrap:anywhere">${esc(link)}</strong></div>
            <button type="button" class="btn btn-secondary btn-kucuk" id="k-kopyala"><i class="fas fa-copy"></i>Kopyala</button></div>
        <div class="kurulum-bilgi"><i class="fas fa-user-group"></i><div style="flex:1"><small>Öğrenciler</small><strong>${sayi(ogrenciler.length)} öğrenci${eklenenGirisler.length ? `, ${sayi(eklenenGirisler.length)} tanesinin giriş bilgisi yeni oluştu` : ''}</strong></div>
            ${eklenenGirisler.length ? '<button type="button" class="btn btn-secondary btn-kucuk" id="k-yazdir"><i class="fas fa-print"></i>Giriş kartları</button>' : ''}</div>`;
    $('kurulum-alt').innerHTML = `<span></span><a class="btn btn-primary btn-buyuk" href="teacher.html">Panele git<i class="fas fa-arrow-right"></i></a>`;
    $('k-kopyala').addEventListener('click', async (e) => {
        try { await navigator.clipboard.writeText(link); e.currentTarget.innerHTML = '<i class="fas fa-check"></i>Kopyalandı'; } catch { prompt('Linki kopyalayın', link); }
    });
    $('k-yazdir')?.addEventListener('click', () => girisKartlariniYazdir(eklenenGirisler.map(g => ({ name: g.ad, username: g.kullanici, password: g.sifre })), sinif.ad));
}

// ---------------------------------------------------------------- Başlangıç
export async function kurulumuBaslat() {
    const k = auth.currentUser;
    if (!k || k.role !== 'teacher') { location.replace('login.html'); return; }
    $('kurulum-ogretmen').textContent = k.name || '';
    $('kurulum-cikis').addEventListener('click', () => auth.logout());
    sinif = await sinifBilgisi(aktifSinifId(), { yenile: true });
    if (!sinif) { $('kurulum-govde').innerHTML = '<p class="bos-not">Sınıf kaydı bulunamadı. Çıkış yapıp tekrar girin</p>'; return; }
    if (sinif.ad) $('kurulum-rozet').textContent = sinif.ad;
    ogrenciler = (await db.getAll('users').catch(() => [])).filter(u => u.role === 'student');
    ciz();
}
