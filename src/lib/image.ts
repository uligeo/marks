import type { LoadedPhoto } from '../types'
import { readExif } from './exif'

const PREVIEW_MAX = 1400

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  const full = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, PREVIEW_MAX / Math.max(full.width, full.height))
  const preview =
    scale < 1
      ? await createImageBitmap(full, {
          resizeWidth: Math.round(full.width * scale),
          resizeHeight: Math.round(full.height * scale),
          resizeQuality: 'high',
        })
      : full
  const exif = await readExif(file)
  return { file, full, preview, exif }
}

export function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
