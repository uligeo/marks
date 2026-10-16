export type ResolutionId = 'original' | '8k' | '6k' | '4k' | 'hd'

export const RESOLUTIONS: { id: ResolutionId; label: string; longSide: number | null }[] = [
  { id: 'original', label: 'Original', longSide: null },
  { id: '8k', label: '8K', longSide: 7680 },
  { id: '6k', label: '6K', longSide: 6144 },
  { id: '4k', label: '4K', longSide: 3840 },
  { id: 'hd', label: 'Full HD', longSide: 1920 },
]

export const JPEG_QUALITY = { max: 1, high: 0.92 } as const
export type QualityId = keyof typeof JPEG_QUALITY

export interface Size {
  w: number
  h: number
}

/** Scale from the natural (full-resolution) size to the chosen resolution. */
export function resolutionScale(natural: Size, id: ResolutionId): number {
  const long = RESOLUTIONS.find((r) => r.id === id)?.longSide
  return long ? long / Math.max(natural.w, natural.h) : 1
}

const fitCache = new Map<string, boolean>()

/** True when this browser can allocate and read back a canvas of that size. */
export function canvasFits(w: number, h: number): boolean {
  const W = Math.round(w)
  const H = Math.round(h)
  const key = `${W}x${H}`
  const cached = fitCache.get(key)
  if (cached !== undefined) return cached
  let ok = false
  const c = document.createElement('canvas')
  try {
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.fillRect(W - 1, H - 1, 1, 1)
      ok = ctx.getImageData(W - 1, H - 1, 1, 1).data[3] === 255
    }
  } catch {
    ok = false
  } finally {
    c.width = 0
    c.height = 0
  }
  fitCache.set(key, ok)
  return ok
}

/** Fallback areas tried when the requested size is too large: 8K, ~16.7 MP (iOS), 8 MP. */
const FALLBACK_AREAS = [33_177_600, 16_777_216, 8_388_608]

/** Extra scale (at most 1) needed for a `w` x `h` canvas to fit this browser. */
export function fitScale(w: number, h: number): number {
  if (canvasFits(w, h)) return 1
  for (const area of FALLBACK_AREAS) {
    const s = Math.min(1, Math.sqrt(area / (w * h)) * 0.999)
    if (canvasFits(w * s, h * s)) return s
  }
  return Math.sqrt(4_000_000 / (w * h))
}

export function formatSize({ w, h }: Size): string {
  const mp = (w * h) / 1e6
  return `${Math.round(w)} × ${Math.round(h)} px · ${mp >= 10 ? Math.round(mp) : mp.toFixed(1)} MP`
}

export interface ExportResult {
  blob: Blob
  size: Size
  /** True when the browser's canvas limit forced a smaller size than requested. */
  limited: boolean
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), format, quality),
  )
}
