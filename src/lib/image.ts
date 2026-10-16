import exifr from 'exifr'
import type { LoadedPhoto } from '../types'
import { readExif } from './exif'
import { readCr3 } from './raw/cr3'
import { cr3ExifDict, cr3Orientation, cr3Summary } from './raw/cr3Exif'

const PREVIEW_MAX = 1400

/** RAW formats the app cannot open yet; CR3 is handled through its embedded JPEG. */
export const UNSUPPORTED_RAW = /\.(cr2|crw|nef|nrw|arw|srf|sr2|raf|orf|rw2|pef|srw|dng|3fr|iiq|x3f|rwl)$/i

/** A minimal EXIF segment carrying only the orientation, so the browser rotates while decoding. */
function orientationSegment(orientation: number): Uint8Array<ArrayBuffer> {
  // APP1 "Exif\0\0" + little-endian TIFF with one IFD entry: 0x0112 SHORT = orientation.
  return new Uint8Array([
    0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientation, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ])
}

async function withOrientation(jpeg: Blob, orientation: number): Promise<Blob> {
  if (orientation === 1 || (await exifr.orientation(jpeg).catch(() => undefined))) return jpeg
  return new Blob([jpeg.slice(0, 2), orientationSegment(orientation), jpeg.slice(2)], { type: 'image/jpeg' })
}

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  const cr3 = /\.cr3$/i.test(file.name) || !file.type ? await readCr3(file) : null
  const source = cr3 ? await withOrientation(cr3.jpeg, cr3Orientation(cr3)) : file
  const full = await createImageBitmap(source, { imageOrientation: 'from-image' })
  const scale = Math.min(1, PREVIEW_MAX / Math.max(full.width, full.height))
  const preview =
    scale < 1
      ? await createImageBitmap(full, {
          resizeWidth: Math.round(full.width * scale),
          resizeHeight: Math.round(full.height * scale),
          resizeQuality: 'high',
        })
      : full
  if (cr3) return { file, full, preview, exif: cr3Summary(cr3), exifDict: cr3ExifDict(cr3) }
  return { file, full, preview, exif: await readExif(file) }
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
