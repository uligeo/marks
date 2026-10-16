import type { Filter, Recipe } from './index'

const cam = (id: string, name: string, recipe: Recipe): Filter => ({ id: `cam-${id}`, name, category: 'camera', recipe })

/** Looks inspired by camera types and film stocks; names are descriptive, not brands. */
export const CAMERA_FILTERS: Filter[] = [
  // Instant cameras
  cam('instant600', 'Instantánea 600', { c: -0.1, hi: -0.3, sh: 0.2, s: -0.15, t: 0.2, fd: 0.35, vg: 0.3, gr: 0.15, sH: 200, sA: 0.3, hH: 45, hA: 0.25 }),
  cam('instantsx', 'Instantánea plegable', { c: -0.2, s: -0.25, t: 0.35, fd: 0.45, vg: 0.35, sH: 160, sA: 0.25, gr: 0.15 }),
  cam('instantmini', 'Instantánea mini', { e: 0.1, c: 0.1, s: 0.1, t: -0.05, sh: 0.15, hH: 190, hA: 0.15 }),
  cam('instantwide', 'Instantánea ancha', { e: 0.05, c: 0.05, v: 0.2, t: -0.1, sh: 0.1 }),
  cam('instantexpired', 'Instantánea vencida', { fd: 0.5, s: -0.35, t: 0.3, ti: 0.15, sH: 300, sA: 0.35, vg: 0.4, gr: 0.25 }),
  cam('instantbw', 'Instantánea B/N', { s: -1, c: 0.1, fd: 0.3, vg: 0.3, gr: 0.2, sH: 40, sA: 0.15 }),
  // Compact, disposable and toy cameras
  cam('compact90', 'Compacta de los 90', { c: 0.25, s: 0.15, t: 0.1, vg: 0.2, gr: 0.2, w: 0.15 }),
  cam('compactzoom', 'Compacta zoom', { c: 0.15, v: 0.2, t: 0.05, sp: 0.2 }),
  cam('disposable', 'Desechable', { c: 0.3, s: 0.2, t: 0.15, ti: -0.05, gr: 0.35, vg: 0.35, sH: 140, sA: 0.2 }),
  cam('disposableflash', 'Desechable con flash', { e: 0.15, c: 0.35, w: 0.25, s: 0.15, vg: 0.45, gr: 0.3 }),
  cam('toyholga', 'Juguete de plástico', { vg: 0.7, c: 0.35, s: 0.2, gr: 0.3, fd: 0.1, sH: 220, sA: 0.2 }),
  cam('toydiana', 'Juguete soñador', { vg: 0.6, fd: 0.3, t: 0.2, s: -0.1, cl: -0.3 }),
  cam('lomo', 'Lomo clásica', { c: 0.45, s: 0.35, vg: 0.55, t: 0.05, hH: 60, hA: 0.2, sH: 230, sA: 0.25 }),
  cam('lomoteal', 'Lomo turquesa', { c: 0.2, vg: 0.4, hH: 170, hA: 0.5, sH: 200, sA: 0.4 }),
  cam('lomopurple', 'Lomo púrpura', { c: 0.2, vg: 0.4, sH: 280, sA: 0.5, hH: 330, hA: 0.3 }),
  cam('pinhole', 'Estenopeica', { vg: 0.8, fd: 0.2, cl: -0.3, s: -0.2, gr: 0.2 }),
  cam('boxcamera', 'Cámara de cajón', { s: -0.6, sH: 35, sA: 0.5, hH: 40, hA: 0.3, fd: 0.3, vg: 0.5 }),
  cam('underwater', 'Submarina', { t: -0.5, ti: -0.2, s: -0.1, c: 0.1, sH: 190, sA: 0.3 }),
  cam('panoramic', 'Panorámica 35', { c: 0.1, v: 0.25, t: 0.05, vg: 0.25 }),
  // Rangefinders, reflex and larger formats
  cam('rangefinder', 'Telemétrica 35', { c: 0.2, cl: 0.2, s: -0.1, b: -0.1, gr: 0.1, vg: 0.15 }),
  cam('rangefindersilver', 'Telemétrica plata', { c: 0.3, s: -0.3, cl: 0.3, t: -0.05 }),
  cam('slr70', 'Réflex de los 70', { fd: 0.25, t: 0.25, s: -0.1, c: 0.05, sH: 30, sA: 0.2, gr: 0.2 }),
  cam('slr80', 'Réflex de los 80', { c: 0.2, s: 0.15, t: 0.1, hi: -0.2 }),
  cam('mediumformat', 'Medio formato', { c: 0.1, hi: -0.3, sh: 0.2, cl: 0.15, s: -0.05, sp: 0.2, t: 0.05 }),
  cam('mediumformat67', 'Medio formato 6×7', { c: 0.05, fd: 0.1, t: 0.1, s: -0.1, sh: 0.15 }),
  cam('largeformat', 'Gran formato', { cl: 0.3, sp: 0.3, c: 0.15, hi: -0.3, s: -0.1 }),
  // Motion picture and video
  cam('cinema35', 'Cámara de cine', { sH: 190, sA: 0.45, hH: 35, hA: 0.4, c: 0.15, s: -0.05 }),
  cam('super8', 'Súper 8', { fd: 0.3, t: 0.35, gr: 0.45, vg: 0.45, s: -0.1, c: 0.1 }),
  cam('camcorder', 'Videocámara de los 90', { s: 0.2, cl: -0.3, fd: 0.2, t: -0.1, ti: 0.1, gr: 0.3 }),
  // Early digital and phones
  cam('ccd2000', 'Digital 2000', { c: 0.15, w: 0.2, s: 0.2, t: -0.15, sp: 0.3, hi: 0.1 }),
  cam('ccdcool', 'Digital fría', { t: -0.3, s: 0.1, w: 0.15, sp: 0.2 }),
  cam('retrophone', 'Teléfono retro', { s: -0.1, cl: -0.2, fd: 0.15, gr: 0.25, t: 0.1 }),
  // Colour negative film
  cam('portrait160', 'Retrato 160', { c: -0.1, s: -0.1, t: 0.1, sh: 0.15, hi: -0.2, hH: 35, hA: 0.1 }),
  cam('portrait400', 'Retrato 400', { c: -0.05, s: -0.05, t: 0.15, fd: 0.1, sh: 0.2, hH: 30, hA: 0.15, gr: 0.1 }),
  cam('portrait800', 'Retrato 800', { t: 0.2, gr: 0.25, fd: 0.15, sh: 0.2, sH: 200, sA: 0.1 }),
  cam('gold200', 'Color dorado 200', { t: 0.3, s: 0.15, c: 0.1, hH: 45, hA: 0.2 }),
  cam('ultra400', 'Color intenso 400', { t: 0.2, s: 0.25, c: 0.15, gr: 0.15 }),
  cam('vivid100', 'Negativo vivo 100', { s: 0.35, c: 0.2, v: 0.2, sp: 0.15 }),
  cam('superia', 'Negativo verde 400', { t: -0.1, ti: -0.1, s: 0.15, sH: 150, sA: 0.2, gr: 0.15 }),
  cam('green200', 'Negativo verde 200', { ti: -0.15, s: 0.05, sH: 150, sA: 0.25, fd: 0.1 }),
  cam('pro400', 'Pastel profesional 400', { e: 0.1, s: -0.1, t: -0.05, sh: 0.2, sH: 180, sA: 0.2, hH: 160, hA: 0.1, fd: 0.1 }),
  cam('vista200', 'Negativo rojo 200', { t: 0.15, s: 0.3, c: 0.15, hsl: { red: { sat: 0.2 } } }),
  cam('natura', 'Natural 1600', { e: 0.1, s: 0.05, t: 0.05, sh: 0.2, fd: 0.1, gr: 0.2 }),
  cam('expired', 'Negativo vencido', { fd: 0.35, t: 0.25, ti: 0.2, s: -0.2, sH: 300, sA: 0.3, gr: 0.3 }),
  // Slide film
  cam('slide50', 'Diapositiva 50', { s: 0.5, c: 0.35, b: -0.15, v: 0.2 }),
  cam('slide100', 'Diapositiva 100', { s: 0.2, c: 0.2, t: -0.05 }),
  cam('slidewarm', 'Diapositiva cálida', { t: 0.1, s: 0.25, c: 0.2, hi: -0.1 }),
  cam('chrome', 'Cromo clásico', { c: 0.3, s: 0.25, t: 0.1, ti: -0.05, b: -0.1, hH: 40, hA: 0.1 }),
  cam('crossprocess', 'Proceso cruzado', { c: 0.3, s: 0.3, hH: 60, hA: 0.4, sH: 240, sA: 0.3, ti: -0.15 }),
  // Cinema film and special stocks
  cam('tungsten500', 'Cine 500 tungsteno', { t: -0.35, c: 0.1, gr: 0.2, sH: 200, sA: 0.3, hH: 20, hA: 0.2 }),
  cam('daylight250', 'Cine 250 luz de día', { t: 0.05, c: 0.05, s: -0.05, fd: 0.1, sH: 190, sA: 0.15 }),
  cam('night800', 'Cine 800 nocturno', { t: -0.4, ti: 0.1, gr: 0.3, hH: 0, hA: 0.35, sH: 210, sA: 0.35 }),
  cam('redscale', 'Escala roja', { t: 0.8, ti: 0.2, s: 0.1, c: 0.2, hH: 25, hA: 0.5 }),
  cam('infrared', 'Infrarrojo color', { s: 0.2, ti: 0.4, sH: 320, sA: 0.4, hH: 50, hA: 0.3, hsl: { green: { hue: -1, sat: 0.3 } } }),
]
