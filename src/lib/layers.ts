import type { Layer, StickerLayer, TextLayer } from '../types'
import { getFont } from './fonts'
import { inkFor } from './frameText'

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const LINE_HEIGHT = 1.2

export interface LayerBox {
  id: string
  cx: number
  cy: number
  w: number
  h: number
  rotation: number
}

let nextId = 0
const newId = (): string => `layer-${Date.now().toString(36)}-${(nextId += 1)}`

export function newTextLayer(font = 'sans'): TextLayer {
  return { kind: 'text', id: newId(), x: 0.5, y: 0.5, size: 0.08, rotation: 0, text: 'Tu texto', font, color: '#ffffff', background: 'shadow' }
}

export function newSticker(content: { emoji: string } | { image: ImageBitmap }): StickerLayer {
  const size = 'emoji' in content ? 0.18 : 0.35
  return { kind: 'sticker', id: newId(), x: 0.5, y: 0.5, size, rotation: 0, ...content }
}

export function duplicateLayer(layer: Layer): Layer {
  return { ...layer, id: newId(), x: Math.min(0.95, layer.x + 0.04), y: Math.min(0.95, layer.y + 0.04) }
}

function textMetrics(ctx: CanvasRenderingContext2D, layer: TextLayer, W: number) {
  const font = getFont(layer.font)
  const px = layer.size * W
  ctx.font = `${font.bold} ${px}px ${font.family}`
  const lines = layer.text.split('\n')
  const width = Math.max(1, ...lines.map((l) => ctx.measureText(l).width))
  const pad = layer.background === 'solid' ? px * 0.35 : px * 0.1
  return { px, lines, w: width + pad * 2, h: lines.length * px * LINE_HEIGHT + pad * 2 }
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer, W: number): { w: number; h: number } {
  const m = textMetrics(ctx, layer, W)
  if (layer.background === 'solid') {
    ctx.fillStyle = inkFor(layer.color) === '#1d2127' ? 'rgba(20, 22, 26, 0.82)' : 'rgba(255, 255, 255, 0.92)'
    ctx.beginPath()
    ctx.roundRect(-m.w / 2, -m.h / 2, m.w, m.h, m.px * 0.3)
    ctx.fill()
  }
  if (layer.background === 'shadow') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = m.px * 0.18
    ctx.shadowOffsetY = m.px * 0.04
  }
  ctx.fillStyle = layer.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const top = -((m.lines.length - 1) * m.px * LINE_HEIGHT) / 2
  m.lines.forEach((line, i) => ctx.fillText(line, 0, top + i * m.px * LINE_HEIGHT))
  return m
}

function drawSticker(ctx: CanvasRenderingContext2D, layer: StickerLayer, W: number): { w: number; h: number } {
  const px = layer.size * W
  if (layer.image) {
    const h = (px * layer.image.height) / layer.image.width
    ctx.drawImage(layer.image, -px / 2, -h / 2, px, h)
    return { w: px, h }
  }
  ctx.font = `${px}px ${EMOJI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(layer.emoji ?? '', 0, px * 0.05)
  return { w: px * 1.15, h: px * 1.15 }
}

/** Draws every layer over a `W` x `H` canvas and returns their boxes for hit testing. */
export function drawLayers(ctx: CanvasRenderingContext2D, layers: Layer[], W: number, H: number): LayerBox[] {
  return layers.map((layer) => {
    const cx = layer.x * W
    const cy = layer.y * H
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(layer.rotation)
    const { w, h } = layer.kind === 'text' ? drawText(ctx, layer, W) : drawSticker(ctx, layer, W)
    ctx.restore()
    return { id: layer.id, cx, cy, w, h, rotation: layer.rotation }
  })
}

export function drawSelection(ctx: CanvasRenderingContext2D, box: LayerBox, W: number): void {
  const pad = W * 0.01
  ctx.save()
  ctx.translate(box.cx, box.cy)
  ctx.rotate(box.rotation)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, W * 0.004)
  ctx.setLineDash([W * 0.012, W * 0.008])
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 4
  ctx.strokeRect(-box.w / 2 - pad, -box.h / 2 - pad, box.w + pad * 2, box.h + pad * 2)
  ctx.restore()
}

/** Topmost layer under the point, in canvas pixels. */
export function hitLayer(boxes: LayerBox[], x: number, y: number, tolerance: number): string | null {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i]
    const dx = x - b.cx
    const dy = y - b.cy
    const cos = Math.cos(-b.rotation)
    const sin = Math.sin(-b.rotation)
    const lx = dx * cos - dy * sin
    const ly = dx * sin + dy * cos
    if (Math.abs(lx) <= b.w / 2 + tolerance && Math.abs(ly) <= b.h / 2 + tolerance) return b.id
  }
  return null
}
