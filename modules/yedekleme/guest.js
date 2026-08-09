export async function render(container) {
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 4em; margin-bottom: 20px;">🔒</div>
            <h2 style="color: var(--danger);">Güvenli Alan</h2>
            <p style="color: #666;">Veritabanı yedekleme işlemleri sadece sistem yöneticisi (öğretmen) tarafından yapılabilir.</p>
        </div>
    `;
}