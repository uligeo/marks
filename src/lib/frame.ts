import type { FrameSettings } from '../types'
import { drawStack, drawStrip, inkFor, stackLines } from './frameText'

export type FrameKind = 'polaroid' | 'strip' | 'blur' | 'overlay'

export interface FrameStyle {
  id: string
  name: string
  kind: FrameKind
  /** Native photo aspect ratio (width / height); null keeps the photo's own. */
  aspect: number | null
  /** Border sizes as a fraction of the photo width. */
  side: number
  top: number
  bottom: number
}

export const FRAME_STYLES: FrameStyle[] = [
  { id: 'classic', name: 'Clásico', kind: 'polaroid', aspect: 1, side: 0.057, top: 0.073, bottom: 0.27 },
  { id: 'wide', name: 'Panorámico', kind: 'polaroid', aspect: 99 / 62, side: 0.045, top: 0.06, bottom: 0.2 },
  { id: 'mini', name: 'Mini', kind: 'polaroid', aspect: 46 / 62, side: 0.087, top: 0.087, bottom: 0.33 },
  { id: 'strip', name: 'Franja', kind: 'strip', aspect: null, side: 0, top: 0, bottom: 0.13 },
  { id: 'gallery', name: 'Galería', kind: 'strip', aspect: null, side: 0.035, top: 0.035, bottom: 0.13 },
  { id: 'blur', name: 'Desenfoque', kind: 'blur', aspect: null, side: 0, top: 0, bottom: 0 },
  { id: 'overlay', name: 'Sobre la foto', kind: 'overlay', aspect: null, side: 0, top: 0, bottom: 0 },
  { id: 'none', name: 'Sin marco', kind: 'polaroid', aspect: null, side: 0, top: 0, bottom: 0 },
]

export const FRAME_COLORS = ['#fbfbf8', '#f3ead8', '#e9e4dc', '#1f1f22', '#9fb4c7', '#e5b9b0']

export const CANVAS_ASPECTS: { label: string; value: number | null }[] = [
  { label: 'Ajustado', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
]

export function getFrameStyle(id: string): FrameStyle {
  return FRAME_STYLES.find((s) => s.id === id) ?? FRAME_STYLES[0]
}

const hasText = (f: FrameSettings): boolean =>
  Boolean(f.caption.trim() || Object.values(f.info).some((v) => v.trim()))

interface Layout {
  w: number
  h: number
  /** Photo position. */
  px: number
  py: number
  /** Space reserved for text under the photo (blur style). */
  textH: number
  border: number
}

/** Output size and photo placement for a photo of `pw` x `ph` pixels. */
export function frameLayout(pw: number, ph: number, frame: FrameSettings): Layout {
  const style = getFrameStyle(frame.styleId)
  if (style.kind === 'blur') {
    const border = frame.innerBorder ? Math.round(pw * 0.022) : 0
    const textH = hasText(frame) ? pw * 0.24 : 0
    const groupW = pw + border * 2
    const groupH = ph + border * 2 + textH
    const a = frame.canvasAspect
    let w = groupW / 0.84
    let h = groupH + (w - groupW)
    if (a) {
      w = Math.max(groupW / 0.84, (a * groupH) / 0.84)
      h = w / a
    }
    return {
      w: Math.round(w),
      h: Math.round(h),
      px: Math.round((w - pw) / 2),
      py: Math.round((h - groupH) / 2 + border),
      textH,
      border,
    }
  }
  return {
    w: Math.round(pw * (1 + 2 * style.side)),
    h: Math.round(ph + pw * (style.top + style.bottom)),
    px: Math.round(pw * style.side),
    py: Math.round(pw * style.top),
    textH: 0,
    border: 0,
  }
}

/** Blurred, slightly darkened copy of the photo covering the whole canvas. */
export function drawBlurBackground(
  ctx: CanvasRenderingContext2D,
  photo: HTMLCanvasElement | ImageBitmap,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / photo.width, h / photo.height) * 1.1
  const steps = [48, 12]
  let src: CanvasImageSource = photo
  let sw = photo.width
  let sh = photo.height
  let first = true
  for (const div of steps) {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(w / div))
    c.height = Math.max(1, Math.round(h / div))
    const cx = c.getContext('2d')!
    cx.imageSmoothingQuality = 'high'
    if (first) {
      const dw = (sw * scale) / div
      const dh = (sh * scale) / div
      cx.drawImage(src, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh)
      first = false
    } else {
      cx.drawImage(src, 0, 0, c.width, c.height)
    }
    src = c
    sw = c.width
    sh = c.height
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.fillRect(0, 0, w, h)
}

function drawOverlayScrim(ctx: CanvasRenderingContext2D, w: number, h: number, height: number): void {
  const g = ctx.createLinearGradient(0, h - height, 0, h)
  g.addColorStop(0, 'rgba(0, 0, 0, 0)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0.62)')
  ctx.fillStyle = g
  ctx.fillRect(0, h - height, w, height)
}

/** Draws the frame, the processed photo and the texts into `out`. */
export function drawFrame(out: HTMLCanvasElement, photo: HTMLCanvasElement, frame: FrameSettings): void {
  const style = getFrameStyle(frame.styleId)
  const pw = photo.width
  const ph = photo.height
  const L = frameLayout(pw, ph, frame)
  out.width = L.w
  out.height = L.h
  const ctx = out.getContext('2d')!

  if (style.kind === 'blur') {
    drawBlurBackground(ctx, photo, L.w, L.h)
    ctx.save()
    if (frame.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = pw * 0.05
      ctx.shadowOffsetY = pw * 0.015
    }
    if (L.border) {
      ctx.fillStyle = frame.color
      ctx.fillRect(L.px - L.border, L.py - L.border, pw + L.border * 2, ph + L.border * 2)
      ctx.shadowColor = 'transparent'
    }
    ctx.drawImage(photo, L.px, L.py)
    ctx.restore()
    const lines = stackLines(frame, pw * 0.05, pw * 0.026)
    drawStack(ctx, lines, { x: L.px, y: L.py + ph + L.border, w: pw, h: L.textH }, '#ffffff')
    return
  }

  ctx.fillStyle = frame.color
  ctx.fillRect(0, 0, L.w, L.h)
  ctx.drawImage(photo, L.px, L.py)
  if (style.side > 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.lineWidth = Math.max(1, pw / 900)
    ctx.strokeRect(L.px, L.py, pw, ph)
  }

  const bottomH = pw * style.bottom
  const textBox = { x: L.px, y: L.py + ph, w: pw, h: bottomH }
  const ink = inkFor(frame.color)

  if (style.kind === 'strip') {
    drawStrip(ctx, frame, { x: 0, y: L.py + ph, w: L.w, h: bottomH }, ink)
  } else if (style.kind === 'overlay') {
    const lines = stackLines(frame, pw * 0.05, pw * 0.024)
    if (!lines.length) return
    const boxH = pw * 0.2
    drawOverlayScrim(ctx, L.w, L.h, Math.min(ph, boxH * 1.8))
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = pw * 0.006
    drawStack(ctx, lines, { x: 0, y: L.h - boxH - pw * 0.02, w: L.w, h: boxH }, '#ffffff')
    ctx.shadowColor = 'transparent'
  } else if (bottomH > 0) {
    const meta = stackLines(frame, Math.min(bottomH * 0.36, pw * 0.12), Math.min(bottomH * 0.13, pw * 0.03))
    drawStack(ctx, meta, textBox, ink)
  }
}
