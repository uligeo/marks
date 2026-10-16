import type { CaptionFont, FrameSettings } from '../types'

export const FONT_FAMILY: Record<CaptionFont, string> = {
  hand: '"Caveat", cursive',
  typewriter: '"Courier Prime", monospace',
  sans: '"Instrument Sans", sans-serif',
}

const CAPTION_WEIGHT: Record<CaptionFont, number> = { hand: 700, typewriter: 700, sans: 600 }

export interface TextLine {
  text: string
  size: number
  weight: number
  family: string
  alpha: number
}

const font = (l: TextLine, size = l.size): string => `${l.weight} ${size}px ${l.family}`

function metaFamily(frame: FrameSettings): string {
  return frame.font === 'typewriter' ? FONT_FAMILY.typewriter : FONT_FAMILY.sans
}

/** Caption plus the non-empty info fields, top to bottom. */
export function stackLines(frame: FrameSettings, captionSize: number, metaSize: number, metaFont?: string): TextLine[] {
  const lines: TextLine[] = []
  const caption = frame.caption.trim()
  if (caption) {
    lines.push({ text: caption, size: captionSize, weight: CAPTION_WEIGHT[frame.font], family: FONT_FAMILY[frame.font], alpha: 1 })
  }
  const family = metaFont ?? metaFamily(frame)
  const { camera, lens, exposure, date } = frame.info
  if (camera.trim()) lines.push({ text: camera.trim(), size: metaSize * 1.08, weight: 600, family, alpha: 0.9 })
  for (const t of [lens, exposure, date]) {
    if (t.trim()) lines.push({ text: t.trim(), size: metaSize, weight: 400, family, alpha: 0.72 })
  }
  return lines
}

function drawFitted(ctx: CanvasRenderingContext2D, l: TextLine, x: number, y: number, maxW: number): void {
  let size = l.size
  ctx.font = font(l, size)
  while (size > 6 && ctx.measureText(l.text).width > maxW) {
    size *= 0.92
    ctx.font = font(l, size)
  }
  ctx.globalAlpha = l.alpha
  ctx.fillText(l.text, x, y)
  ctx.globalAlpha = 1
}

/** Draws lines centered horizontally and vertically inside a box, shrinking them if they overflow. */
export function drawStack(
  ctx: CanvasRenderingContext2D,
  lines: TextLine[],
  box: { x: number; y: number; w: number; h: number },
  color: string,
): void {
  if (!lines.length || box.h <= 0) return
  const gap = (l: TextLine, i: number) => l.size * (i === 0 && lines.length > 1 && l.alpha === 1 ? 1.3 : 1.4)
  const total = lines.reduce((sum, l, i) => sum + gap(l, i), 0)
  const k = Math.min(1, (box.h * 0.9) / total)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let y = box.y + (box.h - total * k) / 2
  lines.forEach((l, i) => {
    const step = gap(l, i) * k
    drawFitted(ctx, { ...l, size: l.size * k }, box.x + box.w / 2, y + step / 2, box.w * 0.94)
    y += step
  })
}

/** Two-column info bar: camera and lens on the left, exposure and date on the right, caption beside them. */
export function drawStrip(
  ctx: CanvasRenderingContext2D,
  frame: FrameSettings,
  box: { x: number; y: number; w: number; h: number },
  color: string,
): void {
  const s = box.h
  const pad = Math.max(box.w * 0.035, s * 0.22)
  const family = metaFamily(frame)
  const { camera, lens, exposure, date } = frame.info
  const caption = frame.caption.trim()
  const mk = (text: string, size: number, weight: number, alpha: number, fam = family): TextLine => ({
    text: text.trim(), size, weight, family: fam, alpha,
  })
  const left = [mk(camera, s * 0.2, 600, 1), mk(lens, s * 0.135, 400, 0.6)].filter((l) => l.text)
  const right = [mk(exposure, s * 0.17, 500, 1), mk(date, s * 0.135, 400, 0.6)].filter((l) => l.text)
  const cap = caption ? mk(caption, s * 0.26, CAPTION_WEIGHT[frame.font], 1, FONT_FAMILY[frame.font]) : null

  const width = (ls: TextLine[], k: number) =>
    ls.reduce((m, l) => {
      ctx.font = font(l, l.size * k)
      return Math.max(m, ctx.measureText(l.text).width)
    }, 0)
  const gap = s * 0.3
  const parts = (k: number) => {
    const lw = width(left, k)
    const rw = width(right, k)
    const cw = cap ? width([cap], k) : 0
    return { lw, rw, cw, total: lw + rw + cw + (cap ? gap * 2 * k : 0) + (left.length && (right.length || cap) ? gap * k : 0) }
  }
  const avail = box.w - pad * 2
  const k = Math.min(1, avail / Math.max(1, parts(1).total))
  const { rw, cw } = parts(k)
  const cy = box.y + s / 2

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.textBaseline = 'middle'
  const column = (ls: TextLine[], x: number, align: CanvasTextAlign) => {
    ctx.textAlign = align
    const offsets = ls.length === 2 ? [-0.13, 0.13] : [0]
    ls.forEach((l, i) => {
      ctx.font = font(l, l.size * k)
      ctx.globalAlpha = l.alpha
      ctx.fillText(l.text, x, cy + offsets[i] * s)
    })
    ctx.globalAlpha = 1
  }

  column(left, box.x + pad, 'left')
  const rightX = box.x + box.w - pad
  column(right, rightX, 'right')
  if (cap) {
    let capRight = rightX
    if (right.length) {
      const sepX = rightX - rw - gap * k
      ctx.globalAlpha = 0.35
      ctx.lineWidth = Math.max(1, s * 0.012)
      ctx.beginPath()
      ctx.moveTo(sepX, cy - s * 0.2)
      ctx.lineTo(sepX, cy + s * 0.2)
      ctx.stroke()
      ctx.globalAlpha = 1
      capRight = sepX - gap * k
    }
    column([cap], left.length || right.length ? capRight : box.x + box.w / 2 + cw / 2, 'right')
  }
}

export function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.55 ? '#1d2127' : '#f3f2ee'
}
