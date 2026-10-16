import type { CollageCell, CollageSettings, CollageState } from '../types'
import { isNeutral } from './adjust'
import { layoutRects, resolveLayout, type Rect } from './collageLayouts'
import { drawBlurBackground } from './frame'
import { FONT_FAMILY, drawStack, inkFor } from './frameText'
import { applyAdjustments } from './pipeline'
import { blurredCopy } from './render'

export const GRADIENTS: [string, string][] = [
  ['#f6d365', '#fda085'],
  ['#a1c4fd', '#c2e9fb'],
  ['#d4fc79', '#96e6a1'],
  ['#fbc2eb', '#a6c1ee'],
  ['#f5efe6', '#d9cbb5'],
  ['#1e2a36', '#3a4a5c'],
  ['#0f2027', '#2c5364'],
  ['#ffecd2', '#fcb69f'],
]

export const COLLAGE_ASPECTS: { label: string; value: number }[] = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
]

const PREVIEW_LONG_SIDE = 1400
const EXPORT_LONG_SIDE = 3600

export interface CollageGeometry {
  w: number
  h: number
  rects: Rect[]
  radius: number
  textBox: Rect | null
}

export function collageGeometry(state: CollageState, longSide: number): CollageGeometry {
  const s = state.settings
  const w = Math.round(s.aspect >= 1 ? longSide : longSide * s.aspect)
  const h = Math.round(s.aspect >= 1 ? longSide / s.aspect : longSide)
  const short = Math.min(w, h)
  const margin = s.margin * short
  const gap = s.gap * short
  const band = s.caption.trim() ? short * 0.1 : 0
  const area = { x: margin, y: margin, w: w - margin * 2, h: h - margin * 2 - band }
  const layout = resolveLayout(state.cells.length, s.layoutId)
  return {
    w,
    h,
    rects: layoutRects(layout, area, gap),
    radius: s.radius * short,
    textBox: band ? { x: margin, y: h - margin - band, w: w - margin * 2, h: band } : null,
  }
}

/** Source-pixel overflow of a cell's photo once it covers a `w` x `h` cell. */
export function cellOverflow(cell: CollageCell, w: number, h: number, src = cell.photo.preview): { dw: number; dh: number } {
  const scale = Math.max(w / src.width, h / src.height) * cell.zoom
  return { dw: src.width * scale - w, dh: src.height * scale - h }
}

function renderCell(cell: CollageCell, w: number, h: number, full: boolean): HTMLCanvasElement {
  const src = full ? cell.photo.full : cell.photo.preview
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  const { dw, dh } = cellOverflow(cell, c.width, c.height, src)
  const x = -dw / 2 - (cell.panX * dw) / 2
  const y = -dh / 2 - (cell.panY * dh) / 2
  ctx.drawImage(src, x, y, c.width + dw, c.height + dh)
  if (!isNeutral(cell.adjustments)) {
    const blurred = cell.adjustments.clarity !== 0 ? blurredCopy(c) : null
    const data = ctx.getImageData(0, 0, c.width, c.height)
    applyAdjustments(data, cell.adjustments, blurred)
    ctx.putImageData(data, 0, 0)
  }
  return c
}

const cellCache = new Map<string, { key: string; canvas: HTMLCanvasElement }>()

function cachedCell(cell: CollageCell, r: Rect): HTMLCanvasElement {
  const key = `${cell.photo.file.name}|${Math.round(r.w)}x${Math.round(r.h)}|${cell.zoom}|${cell.panX}|${cell.panY}|${JSON.stringify(cell.adjustments)}`
  const hit = cellCache.get(cell.id)
  if (hit?.key === key) return hit.canvas
  const canvas = renderCell(cell, r.w, r.h, false)
  cellCache.set(cell.id, { key, canvas })
  return canvas
}

function textColor(s: CollageSettings): string {
  if (s.background === 'color') return inkFor(s.color)
  if (s.background === 'gradient') return inkFor(GRADIENTS[s.gradient][0])
  return '#ffffff'
}

function drawBackground(ctx: CanvasRenderingContext2D, state: CollageState, w: number, h: number): void {
  const s = state.settings
  if (s.background === 'blur' && state.cells.length) {
    const cell = state.cells[Math.min(s.blurSource, state.cells.length - 1)]
    drawBlurBackground(ctx, cell.photo.preview, w, h)
    return
  }
  if (s.background === 'gradient') {
    const [from, to] = GRADIENTS[s.gradient]
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, from)
    g.addColorStop(1, to)
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = s.color
  }
  ctx.fillRect(0, 0, w, h)
}

function drawCollage(out: HTMLCanvasElement, state: CollageState, longSide: number, full: boolean): CollageGeometry {
  const geo = collageGeometry(state, longSide)
  out.width = geo.w
  out.height = geo.h
  const ctx = out.getContext('2d')!
  drawBackground(ctx, state, geo.w, geo.h)
  state.cells.forEach((cell, i) => {
    const r = geo.rects[i]
    if (!r) return
    const img = full ? renderCell(cell, r.w, r.h, true) : cachedCell(cell, r)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(r.x, r.y, r.w, r.h, geo.radius)
    ctx.clip()
    ctx.drawImage(img, r.x, r.y, r.w, r.h)
    ctx.restore()
  })
  const s = state.settings
  if (geo.textBox) {
    const size = geo.textBox.h * 0.5
    const weight = s.font === 'sans' ? 600 : 700
    drawStack(ctx, [{ text: s.caption.trim(), size, weight, family: FONT_FAMILY[s.font], alpha: 1 }], geo.textBox, textColor(s))
  }
  return geo
}

export function renderCollagePreview(out: HTMLCanvasElement, state: CollageState, selected: number | null): CollageGeometry {
  const geo = drawCollage(out, state, PREVIEW_LONG_SIDE, false)
  const r = selected !== null ? geo.rects[selected] : undefined
  if (r) {
    const ctx = out.getContext('2d')!
    const lw = Math.max(3, Math.min(geo.w, geo.h) * 0.006)
    ctx.strokeStyle = '#2f5bd3'
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.roundRect(r.x + lw / 2, r.y + lw / 2, r.w - lw, r.h - lw, Math.max(0, geo.radius - lw / 2))
    ctx.stroke()
  }
  return geo
}

export async function exportCollage(state: CollageState, format: 'image/jpeg' | 'image/png'): Promise<Blob> {
  const out = document.createElement('canvas')
  drawCollage(out, state, EXPORT_LONG_SIDE, true)
  return new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), format, 0.93),
  )
}
