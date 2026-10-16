import exifr from 'exifr'
import type { ExifSummary, FrameInfo } from '../types'

type RawExif = Record<string, unknown>

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined

export async function readExif(file: File): Promise<ExifSummary | null> {
  let raw: RawExif | undefined
  try {
    raw = await exifr.parse(file, { tiff: true, exif: true, gps: true, xmp: false, icc: false })
  } catch {
    return null
  }
  if (!raw) return null

  const make = str(raw.Make)
  let model = str(raw.Model)
  if (make && model?.toLowerCase().startsWith(make.toLowerCase())) {
    model = model.slice(make.length).trim()
  }
  const date = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.ModifyDate

  return {
    make,
    model,
    lens: str(raw.LensModel) ?? str(raw.Lens),
    focalLength: num(raw.FocalLength),
    fNumber: num(raw.FNumber),
    exposureTime: num(raw.ExposureTime),
    iso: num(raw.ISO),
    date: date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined,
    width: num(raw.ExifImageWidth) ?? num(raw.ImageWidth),
    height: num(raw.ExifImageHeight) ?? num(raw.ImageHeight),
    latitude: num(raw.latitude),
    longitude: num(raw.longitude),
    altitude: num(raw.GPSAltitude),
    software: str(raw.Software),
    raw,
  }
}

export function formatShutter(seconds: number): string {
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`
  return `1/${Math.round(1 / seconds)}s`
}

export function cameraName(exif: ExifSummary): string {
  return [exif.make, exif.model].filter(Boolean).join(' ')
}

export function exposureLine(exif: ExifSummary): string {
  const parts: string[] = []
  if (exif.focalLength) parts.push(`${Math.round(exif.focalLength)}mm`)
  if (exif.fNumber) parts.push(`f/${Number(exif.fNumber.toFixed(1))}`)
  if (exif.exposureTime) parts.push(formatShutter(exif.exposureTime))
  if (exif.iso) parts.push(`ISO ${exif.iso}`)
  return parts.join(' ')
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatCoord(value: number, isLat: boolean): string {
  const hemi = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'O'
  return `${Math.abs(value).toFixed(5)}° ${hemi}`
}

export function infoFromExif(exif: ExifSummary | null): FrameInfo {
  if (!exif) return { camera: '', lens: '', exposure: '', date: '' }
  return {
    camera: cameraName(exif),
    lens: exif.lens ?? '',
    exposure: exposureLine(exif),
    date: exif.date ? formatDate(exif.date) : '',
  }
}
