import piexif from 'piexifjs'
import type { Adjustments, ExifSummary, FrameSettings, Layer, LoadedPhoto, Look, Transform } from '../types'
import { orientedSize } from './crop'
import { mergeLook } from './filters'
import { drawLayers, drawSelection, type LayerBox } from './layers'
import { applyAdjustments, computeHistogram, type Histogram } from './pipeline'
import { drawFrame, frameLayout } from './frame'
import { dataUrlToBlob, readAsDataUrl } from './image'
import {
  JPEG_QUALITY,
  canvasToBlob,
  fitScale,
  resolutionScale,
  type ExportResult,
  type QualityId,
  type ResolutionId,
  type Size,
} from './quality'

interface CropRect {
  x: number
  y: number
  w: number
  h: number
  orientedW: number
  orientedH: number
}

function cropRect(src: ImageBitmap, t: Transform): CropRect {
  const { w: W, h: H } = orientedSize(src, t.rotation)
  const c = t.crop
  return { x: c.x * W, y: c.y * H, w: c.w * W, h: c.h * H, orientedW: W, orientedH: H }
}

/** Scale needed so a rotated image still covers the whole crop. */
function straightenScale(c: CropRect, angle: number): number {
  if (angle === 0) return 1
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const roomX = 2 * Math.min(c.x + c.w / 2, c.orientedW - c.x - c.w / 2)
  const roomY = 2 * Math.min(c.y + c.h / 2, c.orientedH - c.y - c.h / 2)
  return Math.max(1, (c.w * cos + c.h * sin) / roomX, (c.w * sin + c.h * cos) / roomY)
}

/**
 * Heavily blurred copy used by clarity. The blur radius is 1/32 of the whole photo's width,
 * given in canvas pixels, so a crop and the uncropped photo get the same look.
 */
export function blurredCopy(canvas: HTMLCanvasElement, photoWidth = canvas.width): ImageData {
  const k = Math.max(1, photoWidth / 32)
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(canvas.width / k))
  small.height = Math.max(1, Math.round(canvas.height / k))
  const sctx = small.getContext('2d')!
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(canvas, 0, 0, small.width, small.height)
  const big = document.createElement('canvas')
  big.width = canvas.width
  big.height = canvas.height
  const bctx = big.getContext('2d', { willReadFrequently: true })!
  bctx.imageSmoothingQuality = 'high'
  bctx.drawImage(small, 0, 0, big.width, big.height)
  return bctx.getImageData(0, 0, big.width, big.height)
}

/** Applies every adjustment except the vignette, which depends on the crop. */
function develop(canvas: HTMLCanvasElement, adj: Adjustments, photoWidth: number): ImageData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const tone = { ...adj, vignette: 0 }
  applyAdjustments(data, tone, tone.clarity !== 0 ? blurredCopy(canvas, photoWidth) : null)
  ctx.putImageData(data, 0, 0)
  return data
}

/** Same falloff as a per-pixel vignette, drawn as a radial gradient so it costs almost nothing. */
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  if (amount <= 0) return
  const strength = amount * 0.75
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2)
  for (let i = 0; i <= 20; i++) {
    const r = i / 20
    const t = r * r < 0.25 ? 0 : (r * r - 0.25) / 0.75
    g.addColorStop(r, `rgba(0, 0, 0, ${strength * t * t * (3 - 2 * t)})`)
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** The rotated and mirrored photo at `scale`, before any crop. */
function orientedCanvas(src: ImageBitmap, t: Transform, scale: number): HTMLCanvasElement {
  const { w, h } = orientedSize(src, t.rotation)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((t.rotation * Math.PI) / 180)
  if (t.flipH) ctx.scale(-1, 1)
  ctx.drawImage(src, (-src.width * scale) / 2, (-src.height * scale) / 2, src.width * scale, src.height * scale)
  return canvas
}

/** Draws the crop (with straightening) of an already oriented image into a new canvas. */
function composeCrop(oriented: HTMLCanvasElement, c: CropRect, t: Transform, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(c.w * scale))
  canvas.height = Math.max(1, Math.round(c.h * scale))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  const angle = (t.straighten * Math.PI) / 180
  const k = straightenScale(c, angle)
  const ccx = c.x + c.w / 2
  const ccy = c.y + c.h / 2
  ctx.scale(scale, scale)
  ctx.translate(-c.x, -c.y)
  ctx.translate(ccx, ccy)
  ctx.rotate(angle)
  ctx.scale(k, k)
  ctx.translate(-ccx, -ccy)
  ctx.drawImage(oriented, 0, 0, c.orientedW, c.orientedH)
  return canvas
}

interface Developed {
  key: string
  canvas: HTMLCanvasElement
  histogram: Histogram
}

/** One developed preview per photo: reused while only the crop, frame or layers change. */
const developedCache = new WeakMap<ImageBitmap, Developed>()
/** Half-resolution develop used while a control is being dragged. */
const draftCache = new WeakMap<ImageBitmap, Developed>()
const DRAFT_SCALE = 0.5

function developedPreview(src: ImageBitmap, t: Transform, adj: Adjustments, draft: boolean): Developed {
  const key = `${t.rotation}|${t.flipH}|${JSON.stringify({ ...adj, vignette: 0 })}`
  const full = developedCache.get(src)
  if (full?.key === key) return full
  const cache = draft ? draftCache : developedCache
  const hit = cache.get(src)
  if (hit?.key === key) return hit
  const canvas = orientedCanvas(src, t, draft ? DRAFT_SCALE : 1)
  const data = develop(canvas, adj, canvas.width)
  const result = { key, canvas, histogram: computeHistogram(data) }
  cache.set(src, result)
  return result
}

/** Full-quality render for export: crop first so only the kept pixels are processed. */
function renderPhoto(src: ImageBitmap, t: Transform, adj: Adjustments, scale: number): HTMLCanvasElement {
  const c = cropRect(src, t)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(c.w * scale))
  canvas.height = Math.max(1, Math.round(c.h * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  const angle = (t.straighten * Math.PI) / 180
  const k = straightenScale(c, angle)
  const ccx = c.x + c.w / 2
  const ccy = c.y + c.h / 2
  ctx.scale(scale, scale)
  ctx.translate(-c.x, -c.y)
  ctx.translate(ccx, ccy)
  ctx.rotate(angle)
  ctx.scale(k, k)
  ctx.translate(-ccx, -ccy)
  ctx.translate(c.orientedW / 2, c.orientedH / 2)
  ctx.rotate((t.rotation * Math.PI) / 180)
  if (t.flipH) ctx.scale(-1, 1)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  develop(canvas, adj, c.orientedW * scale)
  drawVignette(ctx, canvas.width, canvas.height, adj.vignette)
  return canvas
}

export interface RenderInput {
  photo: LoadedPhoto
  transform: Transform
  adjustments: Adjustments
  look: Look
  frame: FrameSettings
  layers: Layer[]
}

export interface PreviewResult {
  histogram: Histogram
  boxes: LayerBox[]
}

/** `draft` trades resolution for speed while the user is still dragging a control. */
export function renderPreview(out: HTMLCanvasElement, input: RenderInput, selectedLayer: string | null, draft = false): PreviewResult {
  const adj = mergeLook(input.adjustments, input.look)
  const src = input.photo.preview
  const developed = developedPreview(src, input.transform, adj, draft)
  const canvas = composeCrop(developed.canvas, cropRect(src, input.transform), input.transform, 1)
  drawVignette(canvas.getContext('2d')!, canvas.width, canvas.height, adj.vignette)
  drawFrame(out, canvas, input.frame)
  const ctx = out.getContext('2d')!
  const boxes = drawLayers(ctx, input.layers, out.width, out.height)
  const selected = boxes.find((b) => b.id === selectedLayer)
  if (selected) drawSelection(ctx, selected, out.width)
  return { histogram: developed.histogram, boxes }
}

/** Output size at the photo's full native resolution, frame included. */
export function naturalExportSize(input: RenderInput): Size {
  const c = cropRect(input.photo.full, input.transform)
  return frameLayout(c.w, c.h, input.frame)
}

function withExif(source: piexif.ExifDict, outDataUrl: string, keepGps: boolean): string {
  const data: piexif.ExifDict = { ...source }
  data['0th'] = { ...data['0th'], [piexif.ImageIFD.Orientation]: 1 }
  delete data.thumbnail
  data['1st'] = {}
  if (!keepGps) data.GPS = {}
  return piexif.insert(piexif.dump(data), outDataUrl)
}

export interface ExportOptions {
  format: 'image/jpeg' | 'image/png'
  resolution: ResolutionId
  quality: QualityId
  keepExif: boolean
  keepGps: boolean
}

export async function exportImage(input: RenderInput, opts: ExportOptions): Promise<ExportResult> {
  const natural = naturalExportSize(input)
  const wanted = resolutionScale(natural, opts.resolution)
  const fit = fitScale(natural.w * wanted, natural.h * wanted)
  const adj = mergeLook(input.adjustments, input.look)
  const canvas = renderPhoto(input.photo.full, input.transform, adj, wanted * fit)
  const out = document.createElement('canvas')
  drawFrame(out, canvas, input.frame)
  canvas.width = 0
  drawLayers(out.getContext('2d')!, input.layers, out.width, out.height)

  const result = { size: { w: out.width, h: out.height }, limited: fit < 1 }
  const blob = await canvasToBlob(out, opts.format, JPEG_QUALITY[opts.quality])
  out.width = 0
  const isJpegSource = /jpe?g/i.test(input.photo.file.type)
  if (opts.format !== 'image/jpeg' || !opts.keepExif || !(isJpegSource || input.photo.exifDict)) return { blob, ...result }
  try {
    const source = input.photo.exifDict ?? piexif.load(await readAsDataUrl(input.photo.file))
    return { blob: dataUrlToBlob(withExif(source, await readAsDataUrl(blob), opts.keepGps)), ...result }
  } catch {
    return { blob, ...result }
  }
}

export function hasGps(exif: ExifSummary | null): boolean {
  return exif?.latitude !== undefined && exif?.longitude !== undefined
}
