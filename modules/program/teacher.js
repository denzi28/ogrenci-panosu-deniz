// Ders programı — öğretmen: tabloya yazınca kendiliğinden kaydedilir
import { db } from '../../js/db.js';
import { esc, modulBasligi, gorunurlukAnahtari, baglaGorunurlukAnahtari, kaydedildiIsareti, yazdir } from '../../js/arayuz.js';
import { GUNLER, DERS_SAYISI, TABLO, verileriGetir } from './ortak.js';

const SIK_DERSLER = ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi ve Oyun', 'Din Kültürü', 'Serbest Etkinlikler', 'Trafik Güvenliği'];

let kok, veri;
const kayit = (gun) => gun === 'SAATLER' ? veri.saatler : veri.gunler[gun];

export async function render(container) {
    container.innerHTML = `<div id="program-kok"></div>`;
    kok = container.firstElementChild;
    veri = await verileriGetir();
    const adlar = [...new Set([...SIK_DERSLER, ...GUNLER.flatMap(g => Array.from({ length: DERS_SAYISI }, (_, i) => veri.gunler[g][`ders${i + 1}`]).filter(Boolean))])];
    const hucre = (gun, i, yer) => {
        const deger = kayit(gun)[`ders${i}`] || '';
        return `<input type="text" class="program-girdi${gun === 'SAATLER' ? ' saat' : ''}" data-gun="${gun}" data-ders="${i}" value="${esc(deger)}" placeholder="${yer}" ${gun === 'SAATLER' ? '' : 'list="ders-adlari"'} aria-label="${gun === 'SAATLER' ? `${i}. ders saati` : `${gun} ${i}. ders`}">`;
    };

    kok.innerHTML = `
        ${modulBasligi({
            baslik: 'Ders programı',
            aciklama: 'Hücreye yazıp başka yere geçince kendiliğinden kaydedilir. Ders saatlerini en üst satıra yazın',
            eylemler: `${await gorunurlukAnahtari('program')}<button type="button" class="btn btn-secondary" id="program-yazdir"><i class="fas fa-print"></i>Yazdır</button>`,
        })}
        <datalist id="ders-adlari">${adlar.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
        <div class="panel program-tablo-kap duzenlenir">
            <table class="program-tablo">
                <thead>
                    <tr><th scope="col"><span class="gizli-yazi">Gün</span></th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<th scope="col">${i + 1}. ders</th>`).join('')}</tr>
                    <tr class="saat-satiri"><th scope="row">Saat</th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<td>${hucre('SAATLER', i + 1, '09:00 - 09:40')}</td>`).join('')}</tr>
                </thead>
                <tbody>${GUNLER.map(g => `
                    <tr><th scope="row">${g}</th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<td>${hucre(g, i + 1, '')}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    baglaGorunurlukAnahtari('program');
    kok.querySelectorAll('.program-girdi').forEach(g => g.addEventListener('change', () => kaydet(g)));
    kok.querySelector('#program-yazdir').addEventListener('click', yazdirProgram);
}

async function kaydet(girdi) {
    const { gun, ders } = girdi.dataset;
    const alan = `ders${ders}`;
    const deger = girdi.value.trim();
    const k = kayit(gun);
    const td = girdi.closest('td');
    td.classList.add('kaydediliyor');
    try {
        if (k.id) await db.update(TABLO, k.id, { [alan]: deger });
        else Object.assign(k, { id: (await db.add(TABLO, { gun, [alan]: deger })).id });
        k[alan] = deger;
        kaydedildiIsareti(td);
    } catch (e) {
        girdi.value = k[alan] || '';
        alert('Kaydedilemedi, internet bağlantısını kontrol edip tekrar deneyin');
    }
    td.classList.remove('kaydediliyor');
}

function yazdirProgram() {
    const s = veri.saatler;
    yazdir('Haftalık ders programı', `
        <table>
            <thead><tr><th></th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<th>${i + 1}. ders<br><span style="font-weight:400">${esc(s[`ders${i + 1}`] || '')}</span></th>`).join('')}</tr></thead>
            <tbody>${GUNLER.map(g => `<tr><th>${g}</th>${Array.from({ length: DERS_SAYISI }, (_, i) => `<td>${esc(veri.gunler[g][`ders${i + 1}`] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`);
}
