// Duyurular — öğretmen: yaz, düzenle, velilere göster/gizle
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti } from '../../js/arayuz.js';
import { yeniOnce, duyuruHtml } from './ortak.js';

let kok, liste = [];

export async function render(container) {
    container.innerHTML = `<div id="duyuru-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Duyurular',
            aciklama: 'Öğrenciler tüm duyuruları görür. Velilere göstermek istediklerinizi ayrıca işaretleyin',
            eylemler: `${await gorunurlukAnahtari('duyurular')}<button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-plus"></i>Yeni duyuru</button>`,
        })}
        <section class="panel" id="duyuru-form-panel" hidden>
            <div class="panel-ust"><h2 id="duyuru-form-baslik">Yeni duyuru</h2></div>
            <form id="form-duyuru" class="panel-ic" autocomplete="off">
                <input type="hidden" id="duyuru-id">
                <div class="form-group"><label for="duyuru-baslik">Başlık</label><input type="text" id="duyuru-baslik" maxlength="120" required></div>
                <div class="form-group"><label for="duyuru-icerik">Duyuru</label><textarea id="duyuru-icerik" rows="4" required></textarea></div>
                <div class="form-group"><label for="duyuru-link">Bağlantı <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><input type="text" id="duyuru-link" inputmode="url" placeholder="ornek.com/sayfa"></div>
                <label class="anahtar" style="margin-bottom:16px">
                    <input type="checkbox" id="duyuru-misafir"><span class="anahtar-iz" aria-hidden="true"></span><span>Veliler de görsün</span>
                </label>
                <div class="form-eylem">
                    <button type="submit" class="btn btn-primary" id="duyuru-kaydet">Yayınla</button>
                    <button type="button" class="btn btn-secondary" data-islem="vazgec">Vazgeç</button>
                </div>
            </form>
        </section>
        <section class="panel">
            <div class="panel-ust"><h2>Yayındaki duyurular</h2><small id="duyuru-sayi"></small></div>
            <div id="duyuru-liste"></div>
        </section>`;
    baglaGorunurlukAnahtari('duyurular');
    kok.addEventListener('click', tikla);
    kok.querySelector('#form-duyuru').addEventListener('submit', kaydet);
    await yenile();
}

async function yenile(isaretle) {
    liste = yeniOnce(await db.getAll('duyurular'));
    kok.querySelector('#duyuru-sayi').textContent = liste.length ? `${sayi(liste.length)} duyuru` : '';
    kok.querySelector('#duyuru-liste').innerHTML = liste.length
        ? liste.map(d => duyuruHtml(d, { ogretmen: true })).join('')
        : '<p class="bos-not">Henüz duyuru yok. Sağ üstten ilk duyuruyu yazabilirsiniz</p>';
    if (isaretle) kaydedildiIsareti(kok.querySelector(`.ilan[data-id="${CSS.escape(isaretle)}"]`));
}

function formuAc(d = null) {
    const panel = kok.querySelector('#duyuru-form-panel');
    kok.querySelector('#duyuru-id').value = d?.id || '';
    kok.querySelector('#duyuru-baslik').value = d?.baslik || '';
    kok.querySelector('#duyuru-icerik').value = d?.icerik || '';
    kok.querySelector('#duyuru-link').value = d?.link || '';
    kok.querySelector('#duyuru-misafir').checked = !!d?.visibleToGuest;
    kok.querySelector('#duyuru-form-baslik').textContent = d ? 'Duyuruyu düzenle' : 'Yeni duyuru';
    kok.querySelector('#duyuru-kaydet').textContent = d ? 'Kaydet' : 'Yayınla';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    kok.querySelector('#duyuru-baslik').focus({ preventScroll: true });
}

const formuKapat = () => { kok.querySelector('#duyuru-form-panel').hidden = true; };

async function kaydet(e) {
    e.preventDefault();
    const id = kok.querySelector('#duyuru-id').value;
    const veri = {
        baslik: kok.querySelector('#duyuru-baslik').value.trim(),
        icerik: kok.querySelector('#duyuru-icerik').value.trim(),
        link: kok.querySelector('#duyuru-link').value.trim(),
        visibleToGuest: kok.querySelector('#duyuru-misafir').checked,
    };
    if (!veri.baslik || !veri.icerik) return;
    const dugme = kok.querySelector('#duyuru-kaydet');
    dugme.disabled = true;
    try {
        const sonuc = id ? await db.update('duyurular', id, veri) : await db.add('duyurular', veri);
        formuKapat();
        await yenile(sonuc.id);
    } catch (err) {
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
    dugme.disabled = false;
}

async function tikla(e) {
    const dugme = e.target.closest('[data-islem]');
    if (!dugme) return;
    const islem = dugme.dataset.islem;
    if (islem === 'yeni') return formuAc();
    if (islem === 'vazgec') return formuKapat();
    const id = dugme.closest('.ilan')?.dataset.id;
    const d = liste.find(x => x.id === id);
    if (!d) return;
    if (islem === 'duzenle') return formuAc(d);
    dugme.disabled = true;
    if (islem === 'veli') {
        await db.update('duyurular', id, { visibleToGuest: !d.visibleToGuest });
        await yenile(id);
    } else if (islem === 'sil') {
        if (!confirm(`"${d.baslik}" duyurusu silinsin mi?`)) { dugme.disabled = false; return; }
        await db.delete('duyurular', id);
        await yenile();
    }
}
