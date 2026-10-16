import type { CropBox } from '../types'

/** Smallest crop side, as a fraction of the photo. */
const MIN_SIDE = 0.06

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface Size {
  w: number
  h: number
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

export function orientedSize(src: { width: number; height: number }, rotation: number): Size {
  const swap = rotation === 90 || rotation === 270
  return swap ? { w: src.height, h: src.width } : { w: src.width, h: src.height }
}

/** Largest centered crop with the given pixel aspect ratio; the whole photo when `aspect` is null. */
export function fitAspect(size: Size, aspect: number | null): CropBox {
  if (!aspect) return { x: 0, y: 0, w: 1, h: 1 }
  const photoAspect = size.w / size.h
  const w = aspect >= photoAspect ? 1 : aspect / photoAspect
  const h = aspect >= photoAspect ? photoAspect / aspect : 1
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}

function keepInside(c: CropBox): CropBox {
  const w = clamp(c.w, MIN_SIDE, 1)
  const h = clamp(c.h, MIN_SIDE, 1)
  return { x: clamp(c.x, 0, 1 - w), y: clamp(c.y, 0, 1 - h), w, h }
}

/** Moves the crop by a fraction of the photo. */
export function panCrop(c: CropBox, dx: number, dy: number): CropBox {
  return keepInside({ ...c, x: c.x + dx, y: c.y + dy })
}

/** Scales the crop around its center; ratio > 1 zooms in (smaller crop). */
export function zoomCrop(c: CropBox, ratio: number): CropBox {
  const k = Math.max(1 / ratio, Math.max(MIN_SIDE / c.w, MIN_SIDE / c.h))
  const s = Math.min(k, 1 / c.w, 1 / c.h)
  const w = c.w * s
  const h = c.h * s
  return keepInside({ x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, w, h })
}

/** Drags one handle by a fraction of the photo, keeping the pixel aspect ratio when locked. */
export function resizeCrop(c: CropBox, handle: Handle, dx: number, dy: number, size: Size, aspect: number | null): CropBox {
  let left = c.x
  let top = c.y
  let right = c.x + c.w
  let bottom = c.y + c.h
  if (handle.includes('w')) left = clamp(left + dx, 0, right - MIN_SIDE)
  if (handle.includes('e')) right = clamp(right + dx, left + MIN_SIDE, 1)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - MIN_SIDE)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + MIN_SIDE, 1)
  if (!aspect) return { x: left, y: top, w: right - left, h: bottom - top }

  // Locked ratio: follow the dominant axis, then fit inside the photo from the fixed corner.
  const ratio = aspect * (size.h / size.w)
  let w = right - left
  let h = bottom - top
  const horizontal = handle === 'e' || handle === 'w' || (handle.length === 2 && Math.abs(dx) >= Math.abs(dy))
  if (horizontal) h = w / ratio
  else w = h * ratio
  const anchorX = handle.includes('w') ? c.x + c.w : handle.includes('e') ? c.x : c.x + c.w / 2
  const anchorY = handle.includes('n') ? c.y + c.h : handle.includes('s') ? c.y : c.y + c.h / 2
  const maxW = handle.includes('w') ? anchorX : handle.includes('e') ? 1 - anchorX : 2 * Math.min(anchorX, 1 - anchorX)
  const maxH = handle.includes('n') ? anchorY : handle.includes('s') ? 1 - anchorY : 2 * Math.min(anchorY, 1 - anchorY)
  const fit = Math.min(1, maxW / w, maxH / h)
  w *= fit
  h *= fit
  const x = handle.includes('w') ? anchorX - w : handle.includes('e') ? anchorX : anchorX - w / 2
  const y = handle.includes('n') ? anchorY - h : handle.includes('s') ? anchorY : anchorY - h / 2
  return keepInside({ x, y, w, h })
}

/** Mirrors the crop horizontally to follow a flipped photo. */
export function mirrorCrop(c: CropBox): CropBox {
  return { ...c, x: 1 - c.x - c.w }
}
