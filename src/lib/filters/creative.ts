import type { Filter, Recipe } from './index'

const bw = (id: string, name: string, recipe: Recipe): Filter => ({ id: `bw-${id}`, name, category: 'bw', recipe: { s: -1, ...recipe } })
const fx = (id: string, name: string, recipe: Recipe): Filter => ({ id: `fx-${id}`, name, category: 'creative', recipe })

export const CREATIVE_FILTERS: Filter[] = [
  // Black and white
  bw('silver', 'Plata', { c: 0.2 }),
  bw('silverhard', 'Plata contrastada', { c: 0.55, cl: 0.3, b: -0.2 }),
  bw('grain400', 'Grano 400', { c: 0.35, gr: 0.4 }),
  bw('grain3200', 'Grano 3200', { c: 0.3, gr: 0.8, fd: 0.1 }),
  bw('soft', 'B/N suave', { c: -0.2, fd: 0.3 }),
  bw('sepia', 'Sepia', { sH: 35, sA: 0.6, hH: 40, hA: 0.4 }),
  bw('selenium', 'Selenio', { c: 0.2, sH: 270, sA: 0.3 }),
  bw('cyanotype', 'Cianotipia', { fd: 0.1, sH: 210, sA: 0.8, hH: 200, hA: 0.5 }),
  bw('platinum', 'Platino', { c: -0.05, fd: 0.15, sH: 30, sA: 0.25, hH: 45, hA: 0.15 }),
  bw('noir', 'Cine negro', { c: 0.6, vg: 0.6, b: -0.3 }),
  bw('matte', 'B/N mate', { fd: 0.45, c: -0.1 }),
  bw('bright', 'B/N luminoso', { e: 0.2, w: 0.3, c: 0.2 }),
  // Light and seasons
  fx('sunrise', 'Amanecer', { e: 0.1, t: 0.4, ti: 0.1, hH: 30, hA: 0.3 }),
  fx('goldenhour', 'Hora dorada', { t: 0.55, s: 0.2, hH: 35, hA: 0.4, sH: 280, sA: 0.1 }),
  fx('bluehour', 'Hora azul', { e: -0.05, t: -0.5, sH: 230, sA: 0.3 }),
  fx('summer', 'Verano', { e: 0.15, sh: 0.25, v: 0.35, t: 0.4, fd: 0.1 }),
  fx('winter', 'Invierno', { e: 0.15, t: -0.4, s: -0.2, fd: 0.15 }),
  fx('autumn', 'Otoño', { t: 0.35, s: 0.1, hsl: { orange: { sat: 0.3 }, green: { hue: 0.5, sat: -0.2 } } }),
  fx('spring', 'Primavera', { e: 0.1, v: 0.3, t: 0.05, ti: 0.05, hsl: { green: { sat: 0.2 } } }),
  fx('noon', 'Sol de mediodía', { c: 0.3, w: 0.2, s: 0.2, hi: -0.2 }),
  fx('night', 'Nocturno', { e: 0.2, sh: 0.4, t: -0.2, gr: 0.2, cl: 0.2 }),
  // Places and weather
  fx('tropical', 'Tropical', { v: 0.45, s: 0.2, c: 0.15, hsl: { aqua: { sat: 0.3 }, blue: { sat: 0.2 } } }),
  fx('desert', 'Desierto', { t: 0.5, s: -0.15, fd: 0.2, c: 0.1 }),
  fx('forest', 'Bosque', { ti: -0.15, s: -0.1, c: 0.15, vg: 0.2, sH: 150, sA: 0.3 }),
  fx('ocean', 'Océano', { t: -0.3, c: 0.1, hsl: { blue: { sat: 0.3 }, aqua: { sat: 0.3 } } }),
  fx('fog', 'Niebla', { fd: 0.5, c: -0.3, e: 0.1, s: -0.2, cl: -0.3 }),
  fx('rain', 'Lluvia', { t: -0.2, s: -0.25, c: -0.1, fd: 0.2, sH: 210, sA: 0.2 }),
  fx('landscape', 'Paisaje', { v: 0.4, cl: 0.3, hi: -0.3, hsl: { blue: { sat: 0.2, lum: -0.2 }, green: { sat: 0.2 } } }),
  // Colour moods
  fx('neon', 'Noche neón', { c: 0.3, s: 0.4, sH: 280, sA: 0.4, hH: 320, hA: 0.3 }),
  fx('cyber', 'Ciberpunk', { c: 0.3, s: 0.2, sH: 190, sA: 0.5, hH: 320, hA: 0.5 }),
  fx('pastel', 'Pastel', { e: 0.15, c: -0.25, s: -0.2, fd: 0.4, hH: 330, hA: 0.15 }),
  fx('candy', 'Algodón de azúcar', { e: 0.1, fd: 0.25, hH: 320, hA: 0.3, sH: 200, sA: 0.3 }),
  fx('mint', 'Menta', { t: -0.1, fd: 0.2, sH: 160, sA: 0.35, hH: 150, hA: 0.15 }),
  fx('peach', 'Durazno', { e: 0.05, t: 0.25, ti: 0.15, fd: 0.2, hH: 20, hA: 0.3 }),
  fx('lavender', 'Lavanda', { ti: 0.25, s: -0.1, fd: 0.2, sH: 270, sA: 0.3 }),
  fx('coral', 'Coral', { t: 0.2, v: 0.2, hH: 10, hA: 0.35 }),
  fx('bronze', 'Bronce', { t: 0.4, s: -0.3, c: 0.2, sH: 30, sA: 0.3 }),
  // Cinematic and editorial
  fx('tealorange', 'Cine moderno', { c: 0.2, v: 0.1, sH: 190, sA: 0.5, hH: 30, hA: 0.45 }),
  fx('bleach', 'Blanqueo', { s: -0.5, c: 0.45, cl: 0.3, sp: 0.2 }),
  fx('matte', 'Mate', { fd: 0.45, c: -0.1, b: 0.2 }),
  fx('dramatic', 'Dramático', { c: 0.4, cl: 0.4, hi: -0.4, sh: 0.3, vg: 0.4, s: -0.1 }),
  fx('hdr', 'Alto rango', { hi: -0.6, sh: 0.6, cl: 0.6, v: 0.3, sp: 0.3 }),
  fx('moody', 'Sombrío', { e: -0.15, c: 0.2, s: -0.3, t: -0.1, vg: 0.4, fd: 0.1 }),
  fx('magazine', 'Revista', { c: 0.15, cl: 0.2, v: 0.15, sp: 0.2, b: -0.1 }),
  fx('grunge', 'Grunge', { c: 0.3, cl: 0.5, s: -0.4, gr: 0.4, vg: 0.4 }),
  fx('glow', 'Resplandor', { e: 0.1, hi: 0.1, cl: -0.5, fd: 0.1 }),
  fx('bright', 'Luminoso', { e: 0.3, sh: 0.3, fd: 0.1, c: -0.1 }),
  // Retro
  fx('seventies', 'Años 70', { t: 0.3, fd: 0.35, s: -0.2, sH: 40, sA: 0.2, gr: 0.2 }),
  fx('eighties', 'Años 80', { s: 0.3, c: 0.2, ti: 0.1, hH: 330, hA: 0.2, gr: 0.15 }),
  fx('dusty', 'Polvoriento', { fd: 0.4, t: 0.15, s: -0.3, gr: 0.3 }),
  // Subjects
  fx('food', 'Comida', { e: 0.05, t: 0.15, v: 0.35, cl: 0.15, sp: 0.2 }),
  fx('warmportrait', 'Retrato cálido', { t: 0.2, sh: 0.15, cl: -0.1, hsl: { orange: { sat: -0.1, lum: 0.1 } } }),
  fx('skin', 'Piel natural', { cl: -0.15, hsl: { orange: { sat: -0.15, lum: 0.15 }, red: { sat: -0.1 } } }),
  fx('softportrait', 'Retrato suave', { cl: -0.25, sh: 0.2, hi: -0.2, t: 0.1, s: -0.05 }),
]
