// Öğrenciler: ortak sıralama
export const noSirasi = (a, b) => (parseInt(a.okulno) || 1e6) - (parseInt(b.okulno) || 1e6) || (a.name || '').localeCompare(b.name || '', 'tr-TR');
export const adSirasi = (a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR');
export const ogrencileriAyir = (kullanicilar) => kullanicilar.filter(u => u.role === 'student');
