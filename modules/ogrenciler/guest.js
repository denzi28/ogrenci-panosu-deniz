import { db } from '../../js/db.js';

export async function render(container) {
    container.innerHTML = '<div class="card"><p>⏳ Sınıf listesi yükleniyor...</p></div>';
    
    const users = await db.getAll('users');
    const ogrenciler = users.filter(u => u.role === 'student');

    // --- YENİ: OKUL NUMARASINA GÖRE SIRALAMA ---
    ogrenciler.sort((a, b) => {
        const noA = parseInt(a.okulno) || 999999;
        const noB = parseInt(b.okulno) || 999999;
        if (noA === noB) return (a.name || '').localeCompare(b.name || '');
        return noA - noB;
    });
    // -------------------------------------------

    let html = `<div class="card" style="border-left: 4px solid var(--primary);">
            <h2>👥 Sınıf Listesi</h2>
            <p style="margin-bottom: 20px; color: #555;">Sınıfımızda kayıtlı olan öğrencilerin listesi aşağıdadır.</p>`;

    if (ogrenciler.length === 0) {
        html += `<p style="color: var(--secondary);">Şu an sınıfa kayıtlı öğrenci bulunmuyor.</p>`;
    } else {
        html += `<ul style="list-style-type: none; padding: 0;">`;
        ogrenciler.forEach((ogr, index) => {
            html += `
                <li style="background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #eee; display: flex; align-items: center; gap: 15px;">
                    <span style="color: var(--primary); font-weight: bold; width: 25px;">${index + 1}.</span>
                    <strong style="font-size: 1.1em; color: #333;">${ogr.name}</strong>
                    ${ogr.okulno ? `<span class="badge" style="background:#e8f4fd; color:var(--primary); margin-left:auto; font-weight:bold;">Okul No: ${ogr.okulno}</span>` : ''}
                </li>
            `;
        });
        html += `</ul>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}