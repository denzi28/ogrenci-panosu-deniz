// EBA şifreleri velilere hiç gösterilmez (menüde de yoktur)
import { modulBasligi } from '../../js/arayuz.js';

export async function render(container) {
    container.innerHTML = `${modulBasligi({ baslik: 'EBA şifreleri' })}<div class="panel"><p class="bos-not">EBA şifreleri kişisel bilgi olduğu için sadece öğrenci kendi hesabından görebilir</p></div>`;
}
