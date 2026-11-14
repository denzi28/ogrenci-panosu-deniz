// Rozetler — öğretmen görünümü
// Öğrenciler: kimde hangi rozet var, öğrenciye rozet ver. Rozetler: stüdyoda tasarla, düzenle, sil, öğrencilere ver.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, sekmeler, baglaSekmeler, kaydedildiIsareti } from '../../js/arayuz.js';
import { verileriGetir, sahiplik, sahipMi, kategoriyeGore, kategoriAl, rozetGorseli, KATEGORILER, SEKILLER, IKONLAR, VERILDI } from './ortak.js';

let siralamaTuru = 'ad';
let veri, sahip, kok;
let duzenlenen = null; // stüdyoda düzenlenen rozet
const BOS_TASARIM = { ad: '', kategori: 'davranis', icon: '⭐', shape: '50%', style1: '#fbbf24', style2: '#d97706', altYazi: '', aciklama: '' };
let tasarim = { ...BOS_TASARIM };

export async function render(container) {
    const [anahtar] = await Promise.all([gorunurlukAnahtari('rozetler'), yenile()]);
    container.innerHTML = `<div id="rozet-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        <div id="ana-gorunum">
            ${modulBasligi({ baslik: 'Rozetler', aciklama: 'Öğrencilerin kazandığı rozetler ve sınıfın rozet kataloğu', eylemler: anahtar })}
            ${sekmeler([{ id: 'r-ogrenciler', ad: 'Öğrenciler' }, { id: 'r-katalog', ad: 'Rozetler' }], 'r-ogrenciler')}
            <div id="view-r-ogrenciler"></div>
            <div id="view-r-katalog" hidden></div>
        </div>
        <div id="view-r-detay" hidden></div>`;
    baglaGorunurlukAnahtari('rozetler');
    baglaSekmeler(kok.querySelector('#ana-gorunum'));
    ogrencileriCiz();
    katalogCiz();
    olaylariBagla();
}

async function yenile() {
    veri = await verileriGetir();
    sahip = sahiplik(veri.matris);
}

const kazanilanlar = (ogrId) => veri.rozetler.filter(r => sahipMi(sahip, ogrId, r.id));

// ------------------------------------------------------------------ ÖĞRENCİLER
function ogrencileriCiz() {
    const liste = veri.ogrenciler.map(o => ({ ...o, rozetleri: kazanilanlar(o.id) }));
    liste.sort(siralamaTuru === 'encok'
        ? (a, b) => b.rozetleri.length - a.rozetleri.length || (a.name || '').localeCompare(b.name || '', 'tr-TR')
        : (a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));

    document.getElementById('view-r-ogrenciler').innerHTML = `
        <section class="panel">
            <div class="panel-ust">
                <h2>Öğrenciler</h2>
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-2)">Sırala
                    <select id="rozet-siralama" style="width:auto;min-height:32px;padding:4px 8px">
                        <option value="ad" ${siralamaTuru === 'ad' ? 'selected' : ''}>Ada göre</option>
                        <option value="encok" ${siralamaTuru === 'encok' ? 'selected' : ''}>En çok rozet</option>
                    </select>
                </label>
            </div>
            ${!veri.rozetler.length ? '<p class="bos-not">Önce Rozetler sekmesinden rozet tasarlayın</p>' : ''}
            ${liste.map(o => `
                <div class="ogr-satir" data-ogr="${esc(o.id)}">
                    <div class="ogr-ad"><strong>${esc(o.name)}</strong>${o.okulno ? `<small>No ${esc(o.okulno)}</small>` : ''}</div>
                    <div class="sayi-hucre">${sayi(o.rozetleri.length)}<small>rozet</small></div>
                    <div class="madalya-serit">${o.rozetleri.slice(0, 10).map(r => `<span title="${esc(r.ad)}">${rozetGorseli(r, 28)}</span>`).join('')}
                        ${o.rozetleri.length > 10 ? `<small style="color:var(--muted)">+${o.rozetleri.length - 10}</small>` : ''}
                        ${!o.rozetleri.length ? '<span class="okuma-yok">Henüz rozet yok</span>' : ''}</div>
                    <div class="satir-eylem"><button class="btn btn-secondary btn-kucuk" data-islem="ogr-detay" data-ogr="${esc(o.id)}"><i class="fas fa-award"></i>Rozet ver</button></div>
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`;
}

// ------------------------------------------------------------------ KATALOG + STÜDYO
function katalogCiz() {
    const alan = document.getElementById('view-r-katalog');
    alan.innerHTML = `
        <section class="panel" id="studyo-panel">
            <div class="panel-ust"><h2>${duzenlenen ? 'Rozeti düzenle' : 'Yeni rozet'}</h2>${duzenlenen ? '<small>Kaydedince rozeti kazanmış öğrencilerde de güncellenir</small>' : ''}</div>
            <form class="studyo" id="form-rozet">
                <div class="alan-izgara">
                    <div class="form-group tam"><label for="r-ad">Rozetin adı</label><input type="text" id="r-ad" name="ad" maxlength="40" value="${esc(tasarim.ad)}" placeholder="Örneğin: Matematik yıldızı"></div>
                    <div class="form-group"><label for="r-kategori">Kategori</label>
                        <select id="r-kategori" name="kategori">${Object.entries(KATEGORILER).map(([id, k]) => `<option value="${id}" ${tasarim.kategori === id ? 'selected' : ''}>${k.ad}</option>`).join('')}</select></div>
                    <div class="form-group"><label for="r-sekil">Şekil</label>
                        <select id="r-sekil" name="shape">${Object.entries(SEKILLER).map(([id, ad]) => `<option value="${id}" ${tasarim.shape === id ? 'selected' : ''}>${ad}</option>`).join('')}</select></div>
                    <div class="form-group"><label for="r-renk1">Üst renk</label><input type="color" id="r-renk1" name="style1" value="${esc(tasarim.style1)}"></div>
                    <div class="form-group"><label for="r-renk2">Alt renk</label><input type="color" id="r-renk2" name="style2" value="${esc(tasarim.style2)}"></div>
                    <div class="form-group tam"><label>İkon</label>
                        <div class="ikon-secici">${IKONLAR.map(i => `<button type="button" data-ikon="${i}" aria-pressed="${tasarim.icon === i}" aria-label="${i}">${i}</button>`).join('')}
                            <input type="text" id="r-ikon" name="icon" value="${esc(tasarim.icon)}" maxlength="4" aria-label="Başka bir emoji" style="width:64px;min-height:36px;text-align:center" title="Listede olmayan bir emoji yazabilirsiniz"></div></div>
                    <div class="form-group"><label for="r-yazi">Rozetin üstündeki yazı</label><input type="text" id="r-yazi" name="altYazi" maxlength="10" value="${esc(tasarim.altYazi)}" placeholder="İsteğe bağlı"></div>
                    <div class="form-group"><label for="r-aciklama">Ne zaman verilir</label><input type="text" id="r-aciklama" name="aciklama" maxlength="80" value="${esc(tasarim.aciklama)}" placeholder="Örneğin: 50 soru çözdü"></div>
                </div>
                <div class="studyo-onizleme">
                    <span id="r-onizleme">${rozetGorseli(tasarim, 96)}</span>
                    <strong id="r-onizleme-ad">${esc(tasarim.ad) || 'Rozetin adı'}</strong>
                    <button class="btn btn-primary w-100" type="submit">${duzenlenen ? 'Kaydet' : 'Kataloğa ekle'}</button>
                    ${duzenlenen ? '<button class="btn btn-secondary w-100" type="button" data-islem="duzenle-vazgec">Vazgeç</button>' : ''}
                </div>
            </form>
        </section>
        ${kategoriyeGore(veri.rozetler).map(([kat, liste]) => `
            <section class="panel">
                <div class="panel-ust"><h2><span class="kategori-nokta" style="background:${KATEGORILER[kat].renk}"></span>${KATEGORILER[kat].ad}</h2><small>${sayi(liste.length)} rozet</small></div>
                ${liste.map(r => {
                    const alan = veri.ogrenciler.filter(o => sahipMi(sahip, o.id, r.id)).length;
                    return `
                    <div class="satir" style="flex-wrap:wrap">
                        ${rozetGorseli(r, 40)}
                        <span class="satir-ad" style="white-space:normal">${esc(r.ad)}<small>${esc(r.aciklama || '')}${r.aciklama ? ' · ' : ''}${alan ? `${sayi(alan)} öğrencide` : 'Henüz verilmedi'}</small></span>
                        <span style="display:flex;align-items:center;gap:4px">
                            <button class="btn btn-secondary btn-kucuk" data-islem="rozet-detay" data-rozet="${esc(r.id)}">Öğrencilere ver</button>
                            <button class="ikon-dugme" data-islem="rozet-duzenle" data-rozet="${esc(r.id)}" title="Düzenle" aria-label="Düzenle"><i class="fas fa-pen"></i></button>
                            <button class="ikon-dugme tehlike" data-islem="rozet-sil" data-rozet="${esc(r.id)}" title="Sil" aria-label="Sil"><i class="fas fa-trash-can"></i></button>
                        </span>
                    </div>`;
                }).join('')}
            </section>`).join('') || '<div class="panel"><p class="bos-not">Henüz rozet tasarlanmadı</p></div>'}`;
}

function onizlemeGuncelle() {
    const f = document.getElementById('form-rozet');
    if (!f) return;
    tasarim = { ...tasarim, ...Object.fromEntries(new FormData(f).entries()) };
    document.getElementById('r-onizleme').innerHTML = rozetGorseli(tasarim, 96);
    document.getElementById('r-onizleme-ad').textContent = tasarim.ad || 'Rozetin adı';
    f.querySelectorAll('[data-ikon]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ikon === tasarim.icon));
}

// ------------------------------------------------------------------ DETAY: öğrenciden rozete / rozetten öğrenciye
function detayGoster(html) {
    document.getElementById('ana-gorunum').hidden = true;
    const alan = document.getElementById('view-r-detay');
    alan.hidden = false;
    alan.innerHTML = `<button class="yazi-dugme" data-islem="detay-geri" style="margin:8px 0 8px -8px"><i class="fas fa-arrow-left"></i>Rozetler</button>${html}`;
    window.scrollTo({ top: 0 });
}

const verDugmesi = (ogrId, rozetId) => {
    const var_ = sahipMi(sahip, ogrId, rozetId);
    return `<button class="btn btn-secondary btn-kucuk ver-dugme" data-islem="ver" data-ogr="${esc(ogrId)}" data-rozet="${esc(rozetId)}" aria-pressed="${var_}">${var_ ? '<i class="fas fa-check"></i>Verildi' : 'Ver'}</button>`;
};

function ogrenciDetay(ogrId) {
    const o = veri.ogrenciler.find(x => x.id === ogrId);
    if (!o) return;
    detayGoster(`
        ${modulBasligi({ baslik: esc(o.name), aciklama: `${sayi(kazanilanlar(o.id).length)} rozeti var. Vermek ya da geri almak için düğmeye dokunun` })}
        ${kategoriyeGore(veri.rozetler).map(([kat, liste]) => `
            <section class="panel">
                <div class="panel-ust"><h2><span class="kategori-nokta" style="background:${KATEGORILER[kat].renk}"></span>${KATEGORILER[kat].ad}</h2></div>
                ${liste.map(r => `
                    <div class="satir">
                        ${rozetGorseli(r, 40)}
                        <span class="satir-ad" style="white-space:normal">${esc(r.ad)}<small>${esc(r.aciklama || '')}</small></span>
                        ${verDugmesi(o.id, r.id)}
                    </div>`).join('')}
            </section>`).join('') || '<div class="panel"><p class="bos-not">Henüz rozet tasarlanmadı</p></div>'}`);
}

function rozetDetay(rozetId) {
    const r = veri.rozetler.find(x => x.id === rozetId);
    if (!r) return;
    const ogrenciler = [...veri.ogrenciler].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
    detayGoster(`
        <header class="modul-ust" style="align-items:center;justify-content:flex-start">
            ${rozetGorseli(r, 72)}
            <div><h1>${esc(r.ad)}</h1><p>${esc(r.aciklama || KATEGORILER[kategoriAl(r)].ad)}</p></div>
        </header>
        <section class="panel">
            <div class="panel-ust"><h2>Öğrenciler</h2><small>Vermek ya da geri almak için düğmeye dokunun</small></div>
            ${ogrenciler.map(o => `
                <div class="satir">
                    <span class="satir-ad">${esc(o.name)}</span>
                    ${verDugmesi(o.id, r.id)}
                </div>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>'}
        </section>`);
}

// ------------------------------------------------------------------ OLAYLAR
async function rozetVer(d) {
    const { ogr, rozet } = d.dataset;
    const yeni = !sahipMi(sahip, ogr, rozet);
    const anahtar = `${ogr}_${rozet}`;
    yeni ? sahip.add(anahtar) : sahip.delete(anahtar);
    d.outerHTML = verDugmesi(ogr, rozet);
    try {
        await db.saveMatrixStatus('rozet_matrisi', String(ogr), String(rozet), yeni ? VERILDI : '');
        kaydedildiIsareti(kok.querySelector(`[data-ogr="${CSS.escape(ogr)}"][data-rozet="${CSS.escape(rozet)}"]`)?.closest('.satir'));
    } catch (e) {
        yeni ? sahip.delete(anahtar) : sahip.add(anahtar);
        const dugme = kok.querySelector(`[data-ogr="${CSS.escape(ogr)}"][data-rozet="${CSS.escape(rozet)}"]`);
        if (dugme) dugme.outerHTML = verDugmesi(ogr, rozet);
        alert('Kaydedilemedi. İnternet bağlantınızı kontrol edin');
    }
}

function olaylariBagla() {
    kok.addEventListener('input', (e) => { if (e.target.closest('#form-rozet')) onizlemeGuncelle(); });
    kok.addEventListener('change', (e) => {
        if (e.target.id === 'rozet-siralama') { siralamaTuru = e.target.value; ogrencileriCiz(); }
        else if (e.target.closest('#form-rozet')) onizlemeGuncelle();
    });

    kok.addEventListener('click', async (e) => {
        const d = e.target.closest('button');
        if (!d) return;
        if (d.dataset.ikon) { document.getElementById('r-ikon').value = d.dataset.ikon; return onizlemeGuncelle(); }
        const { islem, ogr, rozet } = d.dataset;
        if (islem === 'ver') return rozetVer(d);
        if (islem === 'ogr-detay') return ogrenciDetay(ogr);
        if (islem === 'rozet-detay') return rozetDetay(rozet);
        if (islem === 'detay-geri') {
            document.getElementById('view-r-detay').hidden = true;
            document.getElementById('ana-gorunum').hidden = false;
            ogrencileriCiz(); katalogCiz();
            return window.scrollTo({ top: 0 });
        }
        if (islem === 'rozet-duzenle') {
            duzenlenen = veri.rozetler.find(r => r.id === rozet);
            tasarim = { ...BOS_TASARIM, ...duzenlenen, kategori: kategoriAl(duzenlenen) };
            katalogCiz();
            return document.getElementById('studyo-panel').scrollIntoView({ block: 'start' });
        }
        if (islem === 'duzenle-vazgec') { duzenlenen = null; tasarim = { ...BOS_TASARIM }; return katalogCiz(); }
        if (islem === 'rozet-sil') {
            const r = veri.rozetler.find(x => x.id === rozet);
            if (!confirm(`“${r?.ad}” rozeti katalogdan silinsin mi? Bu rozeti kazanan öğrencilerin listesinden de kalkar`)) return;
            try { await db.delete('rozetler_kalemleri', rozet); await yenile(); ogrencileriCiz(); katalogCiz(); }
            catch (err) { alert('Silinemedi, tekrar deneyin'); }
        }
    });

    kok.addEventListener('submit', async (e) => {
        if (e.target.id !== 'form-rozet') return;
        e.preventDefault();
        onizlemeGuncelle();
        const kayit = {
            ad: tasarim.ad.trim(), kategori: tasarim.kategori, icon: (tasarim.icon || '⭐').trim(), shape: tasarim.shape,
            style1: tasarim.style1, style2: tasarim.style2, altYazi: tasarim.altYazi.trim(), aciklama: tasarim.aciklama.trim(),
        };
        if (!kayit.ad) return document.getElementById('r-ad').focus();
        const dugme = e.target.querySelector('button[type="submit"]');
        dugme.disabled = true;
        try {
            if (duzenlenen) await db.update('rozetler_kalemleri', duzenlenen.id, kayit);
            else await db.add('rozetler_kalemleri', kayit);
            duzenlenen = null; tasarim = { ...BOS_TASARIM };
            await yenile(); ogrencileriCiz(); katalogCiz();
        } catch (err) { alert('Kaydedilemedi, tekrar deneyin'); dugme.disabled = false; }
    });
}
