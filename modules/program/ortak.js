// Ders programı: ortak veri ve çizim (öğrenci ve veli aynı görünümü kullanır)
import { db } from '../../js/db.js';
import { esc } from '../../js/arayuz.js';

export const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
export const KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
export const DERS_SAYISI = 6;
export const TABLO = 'ders_programi';
const SAAT_SATIRI = 'SAATLER';

// Kayıtlar: her gün için bir satır { gun, ders1..ders6 }, saatler için gun: 'SAATLER'
export async function verileriGetir() {
    const kayitlar = await db.getAll(TABLO);
    const bul = (gun) => kayitlar.find(k => k.gun === gun) || { gun };
    return { saatler: bul(SAAT_SATIRI), gunler: Object.fromEntries(GUNLER.map(g => [g, bul(g)])) };
}

// Hafta içiyse bugünün sırası (0-4), hafta sonuysa -1
export const bugunSirasi = () => { const g = new Date().getDay(); return g >= 1 && g <= 5 ? g - 1 : -1; };

// "09:00 - 09:40" -> [540, 580] (dakika)
function aralik(metin) {
    const m = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/.exec(String(metin || ''));
    return m ? [m[1] * 60 + +m[2], m[3] * 60 + +m[4]] : null;
}

// Şu an hangi ders saatindeyiz? (1-6 ya da null)
export function simdikiDers(saatler) {
    const t = new Date(); const dk = t.getHours() * 60 + t.getMinutes();
    for (let i = 1; i <= DERS_SAYISI; i++) {
        const a = aralik(saatler[`ders${i}`]);
        if (a && dk >= a[0] && dk < a[1]) return i;
    }
    return null;
}

const saatYazi = (s) => esc(String(s || '').replace(/\s*[-–—]\s*/, ' – '));

export function programHtml({ saatler, gunler }) {
    const bugun = bugunSirasi();
    const simdi = bugun >= 0 ? simdikiDers(saatler) : null;
    const secili = bugun >= 0 ? bugun : 0;
    const dersler = (g) => Array.from({ length: DERS_SAYISI }, (_, i) => gunler[g][`ders${i + 1}`] || '');

    // Geniş ekran: haftalık tablo, bugünün satırı vurgulu
    const tablo = `
        <div class="panel program-tablo-kap">
            <table class="program-tablo">
                <thead><tr><th scope="col"><span class="gizli-yazi">Gün</span></th>${Array.from({ length: DERS_SAYISI }, (_, i) =>
                    `<th scope="col">${i + 1}. ders${saatler[`ders${i + 1}`] ? `<small>${saatYazi(saatler[`ders${i + 1}`])}</small>` : ''}</th>`).join('')}</tr></thead>
                <tbody>${GUNLER.map((g, gi) => `
                    <tr${gi === bugun ? ' class="bugun"' : ''}>
                        <th scope="row">${g}${gi === bugun ? '<small>Bugün</small>' : ''}</th>
                        ${dersler(g).map((d, i) => `<td${gi === bugun && simdi === i + 1 ? ' class="simdi"' : ''}>${d ? esc(d) : '<span class="bos">—</span>'}</td>`).join('')}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    // Telefon: gün seçici ve seçilen günün dersleri
    const gunListesi = (g, gi) => `
        <div class="program-gun-liste" data-gun-liste="${gi}"${gi === secili ? '' : ' hidden'}>
            ${dersler(g).map((d, i) => `
                <div class="satir${gi === bugun && simdi === i + 1 ? ' simdi' : ''}">
                    <span class="ders-no">${i + 1}</span>
                    <span class="satir-ad">${d ? esc(d) : '<span class="bos">Ders yok</span>'}${saatler[`ders${i + 1}`] ? `<small>${saatYazi(saatler[`ders${i + 1}`])}</small>` : ''}</span>
                    ${gi === bugun && simdi === i + 1 ? '<span class="etiket okuyor">Şu an</span>' : ''}
                </div>`).join('')}
        </div>`;
    const telefon = `
        <section class="panel program-gun-kap">
            <div class="gun-secici" role="tablist">${GUNLER.map((g, gi) =>
                `<button type="button" role="tab" class="gun-dugme" data-gun="${gi}" aria-selected="${gi === secili}" aria-label="${g}">${KISA[gi]}${gi === bugun ? '<i aria-hidden="true"></i>' : ''}</button>`).join('')}
            </div>
            ${GUNLER.map(gunListesi).join('')}
        </section>`;
    return tablo + telefon;
}

export function baglaGunSecici(kok) {
    kok.querySelectorAll('.gun-dugme').forEach(d => d.addEventListener('click', () => {
        kok.querySelectorAll('.gun-dugme').forEach(x => x.setAttribute('aria-selected', x === d));
        kok.querySelectorAll('[data-gun-liste]').forEach(l => { l.hidden = l.dataset.gunListe !== d.dataset.gun; });
    }));
}
