import piexif from 'piexifjs'
import type { Adjustments, ExifSummary, FrameSettings, Layer, LoadedPhoto, Look, Transform } from '../types'
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
  const swap = t.rotation === 90 || t.rotation === 270
  const W = swap ? src.height : src.width
  const H = swap ? src.width : src.height
  const aspect = t.aspect ?? W / H
  let w = W
  let h = W / aspect
  if (h > H) {
    h = H
    w = H * aspect
  }
  w /= t.zoom
  h /= t.zoom
  const x = (W - w) / 2 + (t.panX * (W - w)) / 2
  const y = (H - h) / 2 + (t.panY * (H - h)) / 2
  return { x, y, w, h, orientedW: W, orientedH: H }
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

export function blurredCopy(canvas: HTMLCanvasElement): ImageData {
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(canvas.width / 32))
  small.height = Math.max(1, Math.round(canvas.height / 32))
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

interface PhotoResult {
  canvas: HTMLCanvasElement
  data: ImageData
}

function renderPhoto(src: ImageBitmap, t: Transform, adj: Adjustments, scale: number): PhotoResult {
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

  const blurred = adj.clarity !== 0 ? blurredCopy(canvas) : null
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  applyAdjustments(data, adj, blurred)
  ctx.putImageData(data, 0, 0)
  return { canvas, data }
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

export function renderPreview(out: HTMLCanvasElement, input: RenderInput, selectedLayer: string | null): PreviewResult {
  const adj = mergeLook(input.adjustments, input.look)
  const { canvas, data } = renderPhoto(input.photo.preview, input.transform, adj, 1)
  drawFrame(out, canvas, input.frame)
  const ctx = out.getContext('2d')!
  const boxes = drawLayers(ctx, input.layers, out.width, out.height)
  const selected = boxes.find((b) => b.id === selectedLayer)
  if (selected) drawSelection(ctx, selected, out.width)
  return { histogram: computeHistogram(data), boxes }
}

/** Output size at the photo's full native resolution, frame included. */
export function naturalExportSize(input: RenderInput): Size {
  const c = cropRect(input.photo.full, input.transform)
  return frameLayout(c.w, c.h, input.frame)
}

function withOriginalExif(originalDataUrl: string, outDataUrl: string, keepGps: boolean): string {
  const data = piexif.load(originalDataUrl)
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
  const { canvas } = renderPhoto(input.photo.full, input.transform, adj, wanted * fit)
  const out = document.createElement('canvas')
  drawFrame(out, canvas, input.frame)
  canvas.width = 0
  drawLayers(out.getContext('2d')!, input.layers, out.width, out.height)

  const result = { size: { w: out.width, h: out.height }, limited: fit < 1 }
  const blob = await canvasToBlob(out, opts.format, JPEG_QUALITY[opts.quality])
  out.width = 0
  const isJpegSource = /jpe?g/i.test(input.photo.file.type)
  if (opts.format !== 'image/jpeg' || !opts.keepExif || !isJpegSource) return { blob, ...result }
  try {
    const [orig, rendered] = await Promise.all([readAsDataUrl(input.photo.file), readAsDataUrl(blob)])
    return { blob: dataUrlToBlob(withOriginalExif(orig, rendered, opts.keepGps)), ...result }
  } catch {
    return { blob, ...result }
  }
}

export function hasGps(exif: ExifSummary | null): boolean {
  return exif?.latitude !== undefined && exif?.longitude !== undefined
}
