import type { Adjustments } from '../types'
import { computeHistogram, type Histogram } from './pipeline'

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

function percentile(lum: Float64Array, total: number, p: number): number {
  let acc = 0
  for (let i = 0; i < 256; i++) {
    acc += lum[i]
    if (acc >= total * p) return i
  }
  return 255
}

/** Exposure, contrast and tonal range corrections estimated from the original histogram. */
export function autoAdjust(base: Adjustments, h: Histogram): Adjustments {
  const lum = new Float64Array(256)
  let total = 0
  for (let i = 0; i < 256; i++) {
    lum[i] = 0.299 * h.r[i] + 0.587 * h.g[i] + 0.114 * h.b[i]
    total += lum[i]
  }
  if (total === 0) return base
  const low = percentile(lum, total, 0.01)
  const mid = percentile(lum, total, 0.5)
  const high = percentile(lum, total, 0.99)
  const spread = high - low

  return {
    ...base,
    exposure: clamp(Math.log2(118 / Math.max(mid, 8)) * 0.7, -0.8, 0.8),
    contrast: clamp((170 - spread) / 300, -0.2, 0.35),
    whites: clamp((245 - high) / 120, -0.3, 0.5),
    blacks: clamp((10 - low) / 80, -0.4, 0.3),
    highlights: high > 250 ? -0.25 : 0,
    shadows: low < 6 ? 0.2 : 0,
    vibrance: 0.15,
  }
}

/** Histogram of the untouched photo, downsampled for speed. */
export function histogramOf(src: ImageBitmap): Histogram {
  const scale = Math.min(1, 400 / Math.max(src.width, src.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(src.width * scale))
  c.height = Math.max(1, Math.round(src.height * scale))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(src, 0, 0, c.width, c.height)
  return computeHistogram(ctx.getImageData(0, 0, c.width, c.height))
}
