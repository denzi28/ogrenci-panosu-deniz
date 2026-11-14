// Etkinlikler — öğretmen: ekle, düzenle, velilere göster/gizle
import { db } from '../../js/db.js';
import { modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti } from '../../js/arayuz.js';
import { listeHtml } from './ortak.js';

let kok, liste = [];

export async function render(container) {
    container.innerHTML = `<div id="etkinlik-kok"></div>`;
    kok = container.firstElementChild;
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Etkinlikler',
            aciklama: 'Öğrenciler tüm etkinlikleri görür. Velilere göstermek istediklerinizi ayrıca işaretleyin',
            eylemler: `${await gorunurlukAnahtari('etkinlikler')}<button type="button" class="btn btn-primary" data-islem="yeni"><i class="fas fa-plus"></i>Yeni etkinlik</button>`,
        })}
        <section class="panel" id="etkinlik-form-panel" hidden>
            <div class="panel-ust"><h2 id="etkinlik-form-baslik">Yeni etkinlik</h2></div>
            <form id="form-etkinlik" class="panel-ic" autocomplete="off">
                <input type="hidden" id="etkinlik-id">
                <div class="form-group"><label for="etkinlik-baslik">Etkinlik adı</label><input type="text" id="etkinlik-baslik" maxlength="120" placeholder="Müze gezisi, veli toplantısı" required></div>
                <div class="form-ikili">
                    <div class="form-group"><label for="etkinlik-gun">Tarih</label><input type="date" id="etkinlik-gun" required></div>
                    <div class="form-group"><label for="etkinlik-saat">Saat <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><input type="time" id="etkinlik-saat"></div>
                </div>
                <div class="form-group"><label for="etkinlik-detay">Ayrıntılar <small style="font-weight:400;color:var(--muted)">isteğe bağlı</small></label><textarea id="etkinlik-detay" rows="3" placeholder="Nerede yapılacak, ne getirilecek"></textarea></div>
                <label class="anahtar" style="margin-bottom:16px">
                    <input type="checkbox" id="etkinlik-misafir"><span class="anahtar-iz" aria-hidden="true"></span><span>Veliler de görsün</span>
                </label>
                <div class="form-eylem">
                    <button type="submit" class="btn btn-primary" id="etkinlik-kaydet">Ekle</button>
                    <button type="button" class="btn btn-secondary" data-islem="vazgec">Vazgeç</button>
                </div>
            </form>
        </section>
        <div id="etkinlik-liste"></div>`;
    baglaGorunurlukAnahtari('etkinlikler');
    kok.addEventListener('click', tikla);
    kok.querySelector('#form-etkinlik').addEventListener('submit', kaydet);
    await yenile();
}

async function yenile(isaretle) {
    liste = await db.getAll('etkinlikler');
    const acikMi = kok.querySelector('#etkinlik-liste details')?.open;
    kok.querySelector('#etkinlik-liste').innerHTML = listeHtml(liste, { ogretmen: true, bosYazi: 'Planlanmış etkinlik yok. Sağ üstten ekleyebilirsiniz' });
    if (acikMi) kok.querySelector('#etkinlik-liste details')?.setAttribute('open', '');
    if (isaretle) kaydedildiIsareti(kok.querySelector(`.ilan[data-id="${CSS.escape(isaretle)}"]`));
}

function formuAc(e = null) {
    const panel = kok.querySelector('#etkinlik-form-panel');
    const [gun, saat] = String(e?.tarih || '').split('T');
    kok.querySelector('#etkinlik-id').value = e?.id || '';
    kok.querySelector('#etkinlik-baslik').value = e?.baslik || '';
    kok.querySelector('#etkinlik-gun').value = gun || '';
    kok.querySelector('#etkinlik-saat').value = (saat || '').slice(0, 5);
    kok.querySelector('#etkinlik-detay').value = e?.detay || '';
    kok.querySelector('#etkinlik-misafir').checked = !!e?.visibleToGuest;
    kok.querySelector('#etkinlik-form-baslik').textContent = e ? 'Etkinliği düzenle' : 'Yeni etkinlik';
    kok.querySelector('#etkinlik-kaydet').textContent = e ? 'Kaydet' : 'Ekle';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    kok.querySelector('#etkinlik-baslik').focus({ preventScroll: true });
}

const formuKapat = () => { kok.querySelector('#etkinlik-form-panel').hidden = true; };

async function kaydet(ev) {
    ev.preventDefault();
    const id = kok.querySelector('#etkinlik-id').value;
    const gun = kok.querySelector('#etkinlik-gun').value;
    const saat = kok.querySelector('#etkinlik-saat').value;
    const veri = {
        baslik: kok.querySelector('#etkinlik-baslik').value.trim(),
        // Eski kayıtlarla aynı biçim: "2026-11-25T09:30" (saat yoksa sadece gün)
        tarih: saat ? `${gun}T${saat}` : gun,
        detay: kok.querySelector('#etkinlik-detay').value.trim(),
        visibleToGuest: kok.querySelector('#etkinlik-misafir').checked,
    };
    if (!veri.baslik || !gun) return;
    const dugme = kok.querySelector('#etkinlik-kaydet');
    dugme.disabled = true;
    try {
        const sonuc = id ? await db.update('etkinlikler', id, veri) : await db.add('etkinlikler', veri);
        formuKapat();
        await yenile(sonuc.id);
    } catch (err) {
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
    dugme.disabled = false;
}

async function tikla(ev) {
    const dugme = ev.target.closest('[data-islem]');
    if (!dugme) return;
    const islem = dugme.dataset.islem;
    if (islem === 'yeni') return formuAc();
    if (islem === 'vazgec') return formuKapat();
    const id = dugme.closest('.ilan')?.dataset.id;
    const e = liste.find(x => x.id === id);
    if (!e) return;
    if (islem === 'duzenle') return formuAc(e);
    dugme.disabled = true;
    if (islem === 'veli') {
        await db.update('etkinlikler', id, { visibleToGuest: !e.visibleToGuest });
        await yenile(id);
    } else if (islem === 'sil') {
        if (!confirm(`"${e.baslik}" etkinliği silinsin mi?`)) { dugme.disabled = false; return; }
        await db.delete('etkinlikler', id);
        await yenile();
    }
}
