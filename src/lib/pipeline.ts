import type { Adjustments } from '../types'
import { HSL_BANDS, hslActive, isNeutral } from './adjust'

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Per-channel tone curve: white balance, exposure, whites/blacks and contrast. */
function buildLut(a: Adjustments, gain: number): Float32Array {
  const lut = new Float32Array(256)
  const k = a.contrast >= 0 ? 1 + a.contrast * 1.2 : 1 + a.contrast * 0.7
  for (let i = 0; i < 256; i++) {
    let v = (i / 255) * gain * 2 ** a.exposure
    v += a.whites * 0.25 * v * v * v
    v += a.blacks * 0.2 * (1 - v) ** 4
    v = (v - 0.5) * k + 0.5
    lut[i] = v
  }
  return lut
}

/** Hue (degrees) -> [hueShift, satShift, lumShift] blended from the eight bands. */
function buildHslTable(a: Adjustments): Float32Array {
  const table = new Float32Array(360 * 3)
  for (let d = 0; d < 360; d++) {
    for (const band of HSL_BANDS) {
      const dist = Math.min(Math.abs(d - band.hue), 360 - Math.abs(d - band.hue))
      const w = Math.max(0, 1 - dist / 45)
      if (w === 0) continue
      const s = a.hsl[band.id]
      table[d * 3] += s.hue * w
      table[d * 3 + 1] += s.sat * w
      table[d * 3 + 2] += s.lum * w
    }
  }
  return table
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

/** Fully saturated color for a hue, centered on gray so it can be added as a tint. */
function tintOf(hue: number): [number, number, number] {
  const h = (((hue % 360) + 360) % 360) / 360
  return [hue2rgb(0, 1, h + 1 / 3) - 0.5, hue2rgb(0, 1, h) - 0.5, hue2rgb(0, 1, h - 1 / 3) - 0.5]
}

function luminanceOf(px: Uint8ClampedArray): Float32Array {
  const lum = new Float32Array(px.length / 4)
  for (let i = 0, j = 0; j < lum.length; i += 4, j++) {
    lum[j] = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
  }
  return lum
}

/**
 * Applies every adjustment to the pixel buffer in place.
 * `blurred` is a heavily blurred copy of the same buffer, used for clarity.
 */
export function applyAdjustments(data: ImageData, a: Adjustments, blurred: ImageData | null): void {
  if (isNeutral(a)) return
  const { width, height } = data
  const px = data.data
  const lutR = buildLut(a, 1 + a.temperature * 0.14 + a.tint * 0.04)
  const lutG = buildLut(a, 1 - a.tint * 0.08)
  const lutB = buildLut(a, 1 - a.temperature * 0.16 + a.tint * 0.04)
  const hsl = hslActive(a) ? buildHslTable(a) : null
  const lum0 = a.sharpness > 0 || (a.clarity !== 0 && blurred) ? luminanceOf(px) : null
  const blurLum = a.clarity !== 0 && blurred ? luminanceOf(blurred.data) : null
  const sat = 1 + a.saturation
  const split = a.shadowAmount > 0 || a.highlightAmount > 0
  const shTint = tintOf(a.shadowHue)
  const hiTint = tintOf(a.highlightHue)
  const grainAmp = a.grain * 0.18
  const vig = a.vignette * 0.75
  const cx = width / 2
  const cy = height / 2
  const maxD2 = cx * cx + cy * cy
  let seed = 0x9e3779b9

  for (let y = 0; y < height; y++) {
    const dy2 = (y - cy) * (y - cy)
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const o = idx * 4
      let r = lutR[px[o]]
      let g = lutG[px[o + 1]]
      let b = lutB[px[o + 2]]
      let l = 0.299 * r + 0.587 * g + 0.114 * b

      if (a.shadows !== 0 || a.highlights !== 0) {
        const lc = clamp01(l)
        const shift = a.shadows * 0.3 * (1 - lc) ** 2 * (1 - lc) + a.highlights * 0.3 * lc * lc
        r += shift
        g += shift
        b += shift
        l += shift
      }
      if (lum0) {
        let detail = 0
        if (blurLum) detail += (lum0[idx] - blurLum[idx]) * a.clarity * 1.6 * (1 - (2 * clamp01(l) - 1) ** 2)
        if (a.sharpness > 0 && x > 0 && y > 0 && x < width - 1 && y < height - 1) {
          const avg = (lum0[idx - 1] + lum0[idx + 1] + lum0[idx - width] + lum0[idx + width]) / 4
          detail += (lum0[idx] - avg) * a.sharpness * 2.5
        }
        r += detail
        g += detail
        b += detail
        l += detail
      }
      if (sat !== 1 || a.vibrance !== 0) {
        const chroma = Math.max(r, g, b) - Math.min(r, g, b)
        const f = sat * (1 + a.vibrance * (1 - clamp01(chroma)) * 1.1)
        r = l + (r - l) * f
        g = l + (g - l) * f
        b = l + (b - l) * f
      }
      if (hsl) {
        r = clamp01(r)
        g = clamp01(g)
        b = clamp01(b)
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        if (d > 0.01) {
          let hl = (max + min) / 2
          let s = d / (1 - Math.abs(2 * hl - 1))
          let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
          h = (h * 60 + 360) % 360
          const t = (h | 0) * 3
          h = (h + hsl[t] * 30 + 360) % 360
          s = clamp01(s * (1 + hsl[t + 1]))
          hl = clamp01(hl + hsl[t + 2] * 0.2 * s)
          const q = hl < 0.5 ? hl * (1 + s) : hl + s - hl * s
          const p = 2 * hl - q
          const hn = h / 360
          r = hue2rgb(p, q, hn + 1 / 3)
          g = hue2rgb(p, q, hn)
          b = hue2rgb(p, q, hn - 1 / 3)
        }
      }
      if (split) {
        const lc = clamp01(0.299 * r + 0.587 * g + 0.114 * b)
        const ws = (1 - lc) * (1 - lc) * a.shadowAmount * 0.4
        const wh = lc * lc * a.highlightAmount * 0.4
        r += shTint[0] * ws + hiTint[0] * wh
        g += shTint[1] * ws + hiTint[1] * wh
        b += shTint[2] * ws + hiTint[2] * wh
      }
      if (a.fade > 0) {
        r = a.fade * 0.16 + r * (1 - a.fade * 0.22)
        g = a.fade * 0.16 + g * (1 - a.fade * 0.22)
        b = a.fade * 0.16 + b * (1 - a.fade * 0.22)
      }
      if (vig > 0) {
        const dd = ((x - cx) * (x - cx) + dy2) / maxD2
        const t = dd < 0.25 ? 0 : (dd - 0.25) / 0.75
        const f = 1 - vig * t * t * (3 - 2 * t)
        r *= f
        g *= f
        b *= f
      }
      if (grainAmp > 0) {
        seed ^= seed << 13
        seed ^= seed >>> 17
        seed ^= seed << 5
        const n = ((seed >>> 0) / 4294967296 - 0.5) * grainAmp
        r += n
        g += n
        b += n
      }
      px[o] = r * 255
      px[o + 1] = g * 255
      px[o + 2] = b * 255
    }
  }
}

export interface Histogram {
  r: Uint32Array
  g: Uint32Array
  b: Uint32Array
}

export function computeHistogram(data: ImageData): Histogram {
  const h: Histogram = { r: new Uint32Array(256), g: new Uint32Array(256), b: new Uint32Array(256) }
  const px = data.data
  for (let i = 0; i < px.length; i += 16) {
    h.r[px[i]]++
    h.g[px[i + 1]]++
    h.b[px[i + 2]]++
  }
  return h
}
