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
    shadowHue: 0,
    shadowAmount: 0,
    highlightHue: 0,
    highlightAmount: 0,
    hsl: Object.fromEntries(HSL_BANDS.map((b) => [b.id, zeroShift()])) as Record<HslBand, HslShift>,
  }
}

/** Adjustment keys that are plain strengths (hues are angles and are not summed). */
export type StrengthKey = Exclude<keyof Adjustments, 'hsl' | 'shadowHue' | 'highlightHue'>

const HUE_KEYS = new Set(['shadowHue', 'highlightHue'])

export function isNeutral(a: Adjustments): boolean {
  const scalars = Object.entries(a).every(([k, v]) => k === 'hsl' || HUE_KEYS.has(k) || v === 0)
  return scalars && !hslActive(a)
}

export function hslActive(a: Adjustments): boolean {
  return Object.values(a.hsl).some((s) => s.hue !== 0 || s.sat !== 0 || s.lum !== 0)
}
