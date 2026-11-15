// Bu bölüm sadece öğretmene açık
import { modulBasligi } from '../../js/arayuz.js';

export async function render(container) {
    container.innerHTML = `${modulBasligi({ baslik: 'Öğretmen bölümü' })}<div class="panel"><p class="bos-not">Bu bölüm sadece öğretmene açık</p></div>`;
}
