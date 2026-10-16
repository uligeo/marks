import type { Adjustments, HslBand, HslShift, Look } from '../../types'
import type { StrengthKey } from '../adjust'
import { CAMERA_FILTERS } from './cameras'
import { CREATIVE_FILTERS } from './creative'

export type FilterCategory = 'camera' | 'creative' | 'bw'

/**
 * Compact filter recipe. Keys: e exposure, c contrast, hi highlights, sh shadows, w whites, b blacks,
 * t temperature, ti tint, v vibrance, s saturation, cl clarity, sp sharpness, fd fade, vg vignette,
 * gr grain, sH/sA shadow tint hue/amount, hH/hA highlight tint hue/amount.
 */
export interface Recipe {
  e?: number
  c?: number
  hi?: number
  sh?: number
  w?: number
  b?: number
  t?: number
  ti?: number
  v?: number
  s?: number
  cl?: number
  sp?: number
  fd?: number
  vg?: number
  gr?: number
  sH?: number
  sA?: number
  hH?: number
  hA?: number
  hsl?: Partial<Record<HslBand, Partial<HslShift>>>
}

export interface Filter {
  id: string
  name: string
  category: FilterCategory
  recipe: Recipe
}

const KEYS: Record<string, StrengthKey> = {
  e: 'exposure', c: 'contrast', hi: 'highlights', sh: 'shadows', w: 'whites', b: 'blacks', t: 'temperature',
  ti: 'tint', v: 'vibrance', s: 'saturation', cl: 'clarity', sp: 'sharpness', fd: 'fade', vg: 'vignette',
  gr: 'grain', sA: 'shadowAmount', hA: 'highlightAmount',
}

const NON_NEGATIVE = new Set<StrengthKey>(['sharpness', 'fade', 'vignette', 'grain', 'shadowAmount', 'highlightAmount'])

export const FILTER_CATEGORIES: { id: FilterCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'camera', label: 'Cámaras y película' },
  { id: 'creative', label: 'Creativos' },
  { id: 'bw', label: 'Blanco y negro' },
]

export const FILTERS: Filter[] = [...CAMERA_FILTERS, ...CREATIVE_FILTERS]

export function getFilter(id: string | null): Filter | undefined {
  return id ? FILTERS.find((f) => f.id === id) : undefined
}

const clamp = (v: number, min: number): number => Math.max(min, Math.min(1, v))

/** Manual adjustments plus the filter scaled by its strength. */
export function mergeLook(adj: Adjustments, look: Look): Adjustments {
  const filter = getFilter(look.id)
  if (!filter || look.amount <= 0) return adj
  const k = look.amount
  const r = filter.recipe
  const out: Adjustments = { ...adj, hsl: { ...adj.hsl } }
  for (const [short, key] of Object.entries(KEYS)) {
    const v = r[short as keyof Recipe]
    if (typeof v === 'number') out[key] = clamp(adj[key] + v * k, NON_NEGATIVE.has(key) ? 0 : -1)
  }
  if (r.sH !== undefined && adj.shadowAmount === 0) out.shadowHue = r.sH
  if (r.hH !== undefined && adj.highlightAmount === 0) out.highlightHue = r.hH
  for (const [band, shift] of Object.entries(r.hsl ?? {}) as [HslBand, Partial<HslShift>][]) {
    const base = adj.hsl[band]
    out.hsl[band] = {
      hue: clamp(base.hue + (shift.hue ?? 0) * k, -1),
      sat: clamp(base.sat + (shift.sat ?? 0) * k, -1),
      lum: clamp(base.lum + (shift.lum ?? 0) * k, -1),
    }
  }
  return out
}

export const NO_LOOK: Look = { id: null, amount: 1 }
