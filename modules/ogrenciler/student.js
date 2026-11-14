// Öğrenciler — öğrenci görünümü: kendi bilgileri ve şifre değiştirme
import { auth } from '../../js/auth.js';
import { db } from '../../js/db.js';
import { esc, modulBasligi } from '../../js/arayuz.js';

export async function render(container) {
    const kullanicilar = await db.getAll('users');
    const ben = kullanicilar.find(u => u.id === auth.currentUser?.id) || auth.currentUser || {};
    const gizle = (v) => v ? '•'.repeat(Math.min(String(v).length, 11)) : '';

    container.innerHTML = `
        <div id="profil-kok">
            ${modulBasligi({ baslik: 'Profilim', aciklama: 'Okuldaki bilgilerin ve giriş şifren' })}
            <section class="panel">
                <div class="panel-ust"><h2>Bilgilerim</h2></div>
                <div class="satir"><span class="satir-ad"><small>Ad soyad</small>${esc(ben.name)}</span></div>
                <div class="satir"><span class="satir-ad"><small>Okul numarası</small>${esc(ben.okulno) || '<span class="bos">Girilmedi</span>'}</span></div>
                <div class="satir"><span class="satir-ad"><small>Kullanıcı adı</small>${esc(ben.username)}</span></div>
                <div class="satir">
                    <span class="satir-ad"><small>TC kimlik no</small><span id="tc-deger" data-acik="${esc(ben.tcno || '')}">${ben.tcno ? gizle(ben.tcno) : '<span class="bos">Girilmedi</span>'}</span></span>
                    ${ben.tcno ? '<button type="button" class="yazi-dugme" id="tc-goster"><i class="fas fa-eye"></i>Göster</button>' : ''}
                </div>
            </section>
            <section class="panel">
                <div class="panel-ust"><h2>Şifremi değiştir</h2></div>
                <form id="form-sifre" class="panel-ic" autocomplete="off">
                    <div class="form-ikili">
                        <div class="form-group"><label for="yeni-sifre">Yeni şifre</label><input type="password" id="yeni-sifre" autocomplete="new-password" required></div>
                        <div class="form-group"><label for="yeni-sifre-tekrar">Yeni şifre tekrar</label><input type="password" id="yeni-sifre-tekrar" autocomplete="new-password" required></div>
                    </div>
                    <p class="error" id="sifre-mesaj" role="status"></p>
                    <button type="submit" class="btn btn-primary" id="sifre-kaydet">Şifremi değiştir</button>
                </form>
            </section>
        </div>`;

    const tc = container.querySelector('#tc-goster');
    tc?.addEventListener('click', () => {
        const alan = container.querySelector('#tc-deger');
        const acik = tc.dataset.acik === '1';
        alan.textContent = acik ? gizle(alan.dataset.acik) : alan.dataset.acik;
        tc.dataset.acik = acik ? '0' : '1';
        tc.innerHTML = acik ? '<i class="fas fa-eye"></i>Göster' : '<i class="fas fa-eye-slash"></i>Gizle';
    });

    container.querySelector('#form-sifre').addEventListener('submit', async (e) => {
        e.preventDefault();
        const yeni = container.querySelector('#yeni-sifre').value.trim();
        const tekrar = container.querySelector('#yeni-sifre-tekrar').value.trim();
        const mesaj = container.querySelector('#sifre-mesaj');
        const yaz = (metin, iyi = false) => { mesaj.textContent = metin; mesaj.style.color = iyi ? 'var(--primary)' : 'var(--danger)'; };
        if (yeni !== tekrar) return yaz('İki şifre aynı değil');
        if (yeni === ben.password) return yaz('Yeni şifre eskisiyle aynı');
        const dugme = container.querySelector('#sifre-kaydet');
        dugme.disabled = true;
        try {
            await db.update('users', ben.id, { password: yeni });
            ben.password = yeni;
            e.target.reset();
            yaz('Şifren değişti. Bir dahaki girişte yeni şifreni kullan', true);
        } catch (err) {
            yaz(err?.message?.match(/[ğüşıöçĞÜŞİÖÇ]/) ? err.message : 'Şifre değiştirilemedi, tekrar dene');
        }
        dugme.disabled = false;
    });
}
