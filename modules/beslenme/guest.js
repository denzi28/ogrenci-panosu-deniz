// Beslenme programı — veli görünümü (öğrenciyle aynı)
import { render as ogrenciGorunumu } from './student.js';

export const render = (container) => ogrenciGorunumu(container, { veli: true });
