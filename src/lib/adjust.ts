import type { Adjustments, HslBand, HslShift } from '../types'

export const HSL_BANDS: { id: HslBand; label: string; hue: number; swatch: string }[] = [
  { id: 'red', label: 'Rojo', hue: 0, swatch: '#e0463c' },
  { id: 'orange', label: 'Naranja', hue: 30, swatch: '#ec8a2f' },
  { id: 'yellow', label: 'Amarillo', hue: 60, swatch: '#e8cf35' },
  { id: 'green', label: 'Verde', hue: 120, swatch: '#4cae4f' },
  { id: 'aqua', label: 'Aguamarina', hue: 180, swatch: '#3fbfc0' },
  { id: 'blue', label: 'Azul', hue: 225, swatch: '#3c66d9' },
  { id: 'purple', label: 'Púrpura', hue: 270, swatch: '#8a4fd6' },
  { id: 'magenta', label: 'Magenta', hue: 315, swatch: '#d64fb0' },
]

const zeroShift = (): HslShift => ({ hue: 0, sat: 0, lum: 0 })

export function neutralAdjustments(): Adjustments {
  return {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    clarity: 0,
    sharpness: 0,
    fade: 0,
    vignette: 0,
    grain: 0,
    hsl: Object.fromEntries(HSL_BANDS.map((b) => [b.id, zeroShift()])) as Record<HslBand, HslShift>,
  }
}

type ScalarKey = Exclude<keyof Adjustments, 'hsl'>

export const PRESETS: { name: string; values: Partial<Record<ScalarKey, number>> }[] = [
  { name: 'Original', values: {} },
  { name: 'Instantánea', values: { contrast: -0.1, highlights: -0.3, shadows: 0.2, saturation: -0.15, temperature: 0.25, fade: 0.35, vignette: 0.35, grain: 0.15 } },
  { name: 'Verano', values: { exposure: 0.15, shadows: 0.25, vibrance: 0.35, temperature: 0.4, fade: 0.1 } },
  { name: 'Fría', values: { contrast: 0.15, saturation: -0.1, temperature: -0.4, tint: -0.1, fade: 0.2 } },
  { name: 'Blanco y negro', values: { contrast: 0.3, clarity: 0.25, saturation: -1, grain: 0.25, vignette: 0.25 } },
  { name: 'Desvaída', values: { contrast: -0.3, saturation: -0.35, fade: 0.6, temperature: 0.1 } },
  { name: 'Nítida', values: { clarity: 0.4, sharpness: 0.4, vibrance: 0.2, blacks: -0.15 } },
]

export function applyPreset(values: Partial<Record<ScalarKey, number>>): Adjustments {
  return { ...neutralAdjustments(), ...values }
}

export function isNeutral(a: Adjustments): boolean {
  const scalars = Object.entries(a).every(([k, v]) => k === 'hsl' || v === 0)
  return scalars && !hslActive(a)
}

export function hslActive(a: Adjustments): boolean {
  return Object.values(a.hsl).some((s) => s.hue !== 0 || s.sat !== 0 || s.lum !== 0)
}
