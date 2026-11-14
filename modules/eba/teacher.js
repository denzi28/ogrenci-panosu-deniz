// EBA şifreleri — öğretmen: kutuya yazınca kendiliğinden kaydedilir. Tahtaya yansıtırken görünmesin diye şifreler gizli başlar.
import { db } from '../../js/db.js';
import { esc, sayi, modulBasligi, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { adSirasi } from '../ogrenciler/ortak.js';

let kok, ogrenciler = [], acik = false;

export async function render(container) {
    container.innerHTML = `<div id="eba-kok"></div>`;
    kok = container.firstElementChild;
    acik = false;
    ogrenciler = (await db.getAll('users')).filter(u => u.role === 'student').sort(adSirasi);
    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'EBA şifreleri',
            aciklama: 'Kutuya yazıp başka yere geçince kaydedilir. Her öğrenci sadece kendi şifresini görür, veliler hiç görmez',
            eylemler: '<button type="button" class="btn btn-secondary" id="eba-yazdir"><i class="fas fa-print"></i>Yazdır</button>',
        })}
        <section class="panel">
            <div class="panel-ust">
                <h2>Öğrenciler <small id="eba-ozet" style="font-weight:400"></small></h2>
                <label class="anahtar"><input type="checkbox" id="eba-goster"><span class="anahtar-iz" aria-hidden="true"></span><span>Şifreleri göster</span></label>
            </div>
            <div id="eba-liste"></div>
        </section>`;
    kok.querySelector('#eba-goster').addEventListener('change', (e) => { acik = e.target.checked; ciz(); });
    kok.querySelector('#eba-yazdir').addEventListener('click', yazdirListe);
    kok.addEventListener('change', (e) => { if (e.target.classList.contains('eba-girdi')) kaydet(e.target); });
    ciz();
}

function ozet() {
    const girilen = ogrenciler.filter(o => o.ebaPassword).length;
    kok.querySelector('#eba-ozet').textContent = `· ${sayi(girilen)}/${sayi(ogrenciler.length)} girildi`;
}

function ciz() {
    ozet();
    kok.querySelector('#eba-liste').innerHTML = ogrenciler.map(o => `
        <label class="satir" data-id="${esc(o.id)}">
            <span class="satir-ad">${esc(o.name)}</span>
            <input type="${acik ? 'text' : 'password'}" class="eba-girdi" value="${esc(o.ebaPassword || '')}" placeholder="Şifre yok" autocomplete="off" spellcheck="false" aria-label="${esc(o.name)} EBA şifresi">
        </label>`).join('') || '<p class="bos-not">Henüz öğrenci yok</p>';
}

async function kaydet(girdi) {
    const satir = girdi.closest('[data-id]');
    const o = ogrenciler.find(x => x.id === satir.dataset.id);
    const yeni = girdi.value.trim();
    try {
        await db.update('users', o.id, { ebaPassword: yeni });
        o.ebaPassword = yeni;
        ozet();
        kaydedildiIsareti(satir);
    } catch (e) {
        girdi.value = o.ebaPassword || '';
        alert('Kaydedilemedi, tekrar deneyin');
    }
}

function yazdirListe() {
    yazdir('EBA şifre listesi', `
        <table><thead><tr><th style="width:40px">Sıra</th><th>Öğrenci</th><th>EBA şifresi</th></tr></thead>
        <tbody>${ogrenciler.map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.name)}</td><td style="font-family:monospace;font-size:15px;letter-spacing:1px">${esc(o.ebaPassword || '')}</td></tr>`).join('')}</tbody></table>`);
}
