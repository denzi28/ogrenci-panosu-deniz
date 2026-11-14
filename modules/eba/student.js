// EBA — öğrenci: kendi EBA giriş bilgisi (kara tahtada, varsayılan gizli)
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, modulBasligi } from '../../js/arayuz.js';

const gizle = (v) => '•'.repeat(Math.min(String(v).length, 11));

export async function render(container) {
    const ben = (await db.getAll('users')).find(u => u.id === auth.currentUser?.id) || {};
    const sifre = ben.ebaPassword || '';
    const tc = ben.tcno || '';
    container.innerHTML = `
        <div id="eba-ogr-kok">
            ${modulBasligi({ baslik: 'EBA şifrem', aciklama: 'EBA\'ya TC kimlik numaran ve bu şifreyle girersin. Şifreni kimseyle paylaşma' })}
            ${sifre ? `
            <section class="tahta eba-tahta">
                <div class="tahta-ust"><h2>EBA giriş bilgilerin</h2></div>
                <dl class="eba-bilgi">
                    <div><dt>TC kimlik no</dt><dd data-acik="${esc(tc)}">${tc ? gizle(tc) : 'Öğretmenine sor'}</dd></div>
                    <div><dt>EBA şifresi</dt><dd data-acik="${esc(sifre)}">${gizle(sifre)}</dd></div>
                </dl>
                <div class="eba-eylem">
                    <button type="button" class="btn btn-hayalet" id="eba-goster"><i class="fas fa-eye"></i>Göster</button>
                    <button type="button" class="btn btn-hayalet" id="eba-kopyala"><i class="fas fa-copy"></i>Şifreyi kopyala</button>
                    <a class="btn btn-hayalet" href="https://www.eba.gov.tr" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i>EBA'ya git</a>
                </div>
            </section>` : '<div class="panel"><p class="bos-not">Öğretmenin henüz EBA şifreni girmedi</p></div>'}
        </div>`;

    const goster = container.querySelector('#eba-goster');
    goster?.addEventListener('click', () => {
        const acik = goster.dataset.acik === '1';
        container.querySelectorAll('.eba-bilgi dd[data-acik]').forEach(dd => { if (dd.dataset.acik) dd.textContent = acik ? gizle(dd.dataset.acik) : dd.dataset.acik; });
        goster.dataset.acik = acik ? '0' : '1';
        goster.innerHTML = acik ? '<i class="fas fa-eye"></i>Göster' : '<i class="fas fa-eye-slash"></i>Gizle';
    });
    const kopyala = container.querySelector('#eba-kopyala');
    kopyala?.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(sifre); kopyala.innerHTML = '<i class="fas fa-check"></i>Kopyalandı'; }
        catch { kopyala.innerHTML = 'Kopyalanamadı'; }
        setTimeout(() => { kopyala.innerHTML = '<i class="fas fa-copy"></i>Şifreyi kopyala'; }, 2000);
    });
}
