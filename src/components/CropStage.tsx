import { useEffect, useRef } from 'react'
import type { CropBox, Transform } from '../types'
import { orientedSize, panCrop, resizeCrop, zoomCrop, type Handle } from '../lib/crop'
import { canvasPoint, useGestures } from '../hooks/useGestures'

interface CropStageProps {
  photo: ImageBitmap
  transform: Transform
  onChange: (transform: Transform) => void
}

/** Touch target radius around handles, in CSS pixels. */
const GRAB = 28
const SHADE = 'rgba(0, 0, 0, 0.55)'

function drawPhoto(ctx: CanvasRenderingContext2D, photo: ImageBitmap, t: Transform, W: number, H: number): void {
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.rotate((t.rotation * Math.PI) / 180)
  if (t.flipH) ctx.scale(-1, 1)
  ctx.drawImage(photo, -photo.width / 2, -photo.height / 2)
  ctx.restore()
}

function drawOverlay(ctx: CanvasRenderingContext2D, c: CropBox, W: number, H: number, px: number): void {
  const x = c.x * W
  const y = c.y * H
  const w = c.w * W
  const h = c.h * H
  ctx.fillStyle = SHADE
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.rect(x, y, w, h)
  ctx.fill('evenodd')

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = px
  ctx.beginPath()
  for (const f of [1 / 3, 2 / 3]) {
    ctx.moveTo(x + w * f, y)
    ctx.lineTo(x + w * f, y + h)
    ctx.moveTo(x, y + h * f)
    ctx.lineTo(x + w, y + h * f)
  }
  ctx.stroke()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = px * 1.5
  ctx.strokeRect(x, y, w, h)

  // Corner brackets and edge bars.
  const len = Math.min(px * 22, w / 3, h / 3)
  ctx.lineWidth = px * 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(cx, cy + sy * len)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + sx * len, cy)
  }
  const bar = len * 0.6
  ctx.moveTo(x + w / 2 - bar / 2, y)
  ctx.lineTo(x + w / 2 + bar / 2, y)
  ctx.moveTo(x + w / 2 - bar / 2, y + h)
  ctx.lineTo(x + w / 2 + bar / 2, y + h)
  ctx.moveTo(x, y + h / 2 - bar / 2)
  ctx.lineTo(x, y + h / 2 + bar / 2)
  ctx.moveTo(x + w, y + h / 2 - bar / 2)
  ctx.lineTo(x + w, y + h / 2 + bar / 2)
  ctx.stroke()
}

/** Which handle (if any) is under a point, given in photo fractions; `tx`/`ty` are the grab radii. */
function handleAt(c: CropBox, fx: number, fy: number, tx: number, ty: number): Handle | null {
  const nearL = Math.abs(fx - c.x) < tx
  const nearR = Math.abs(fx - (c.x + c.w)) < tx
  const nearT = Math.abs(fy - c.y) < ty
  const nearB = Math.abs(fy - (c.y + c.h)) < ty
  const inX = fx > c.x - tx && fx < c.x + c.w + tx
  const inY = fy > c.y - ty && fy < c.y + c.h + ty
  if (nearT && nearL) return 'nw'
  if (nearT && nearR) return 'ne'
  if (nearB && nearL) return 'sw'
  if (nearB && nearR) return 'se'
  if (nearT && inX) return 'n'
  if (nearB && inX) return 's'
  if (nearL && inY) return 'w'
  if (nearR && inY) return 'e'
  return null
}

export function CropStage({ photo, transform, onChange }: CropStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mode = useRef<Handle | 'move'>('move')
  const size = orientedSize(photo, transform.rotation)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = size.w
    canvas.height = size.h
    const ctx = canvas.getContext('2d')!
    const px = size.w / Math.max(1, canvas.getBoundingClientRect().width)
    drawPhoto(ctx, photo, transform, size.w, size.h)
    drawOverlay(ctx, transform.crop, size.w, size.h, px)
  }, [photo, transform, size.w, size.h])

  const gestures = useGestures({
    onStart: (e) => {
      const p = canvasPoint(e)
      const fx = p.x / size.w
      const fy = p.y / size.h
      mode.current = handleAt(transform.crop, fx, fy, GRAB / p.rect.width, GRAB / p.rect.height) ?? 'move'
    },
    onPan: (dx, dy, e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const fx = dx / rect.width
      const fy = dy / rect.height
      const crop =
        mode.current === 'move'
          ? panCrop(transform.crop, fx, fy)
          : resizeCrop(transform.crop, mode.current, fx, fy, size, transform.aspect)
      onChange({ ...transform, crop })
    },
    onPinch: (ratio) => onChange({ ...transform, crop: zoomCrop(transform.crop, ratio) }),
  })

  return (
    <canvas
      ref={canvasRef}
      className="preview crop-canvas"
      {...gestures}
      aria-label="Recorte. Arrastra las esquinas o los bordes del recuadro, muévelo con un dedo o pellízcalo para cambiar su tamaño."
    />
  )
}
