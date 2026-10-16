import type piexif from 'piexifjs'
import type { ExifSummary } from '../../types'
import { summarizeExif, type RawExif } from '../exif'
import type { Cr3Contents } from './cr3'
import { ratio, type Rational, type TagValue } from './tiff'

/** TIFF tag numbers used here, with the names exifr gives them. */
const IFD0_TAGS: Record<number, string> = { 0x010f: 'Make', 0x0110: 'Model', 0x0131: 'Software', 0x0132: 'ModifyDate', 0x0112: 'Orientation' }
const EXIF_TAGS: Record<number, string> = {
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8827: 'ISO',
  0x9003: 'DateTimeOriginal',
  0x920a: 'FocalLength',
  0xa002: 'ExifImageWidth',
  0xa003: 'ExifImageHeight',
  0xa434: 'LensModel',
}
const RATIONAL_NAMES = new Set(['ExposureTime', 'FNumber', 'FocalLength'])

function exifDate(v: TagValue | undefined): Date | undefined {
  if (typeof v !== 'string') return undefined
  const m = v.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!m) return undefined
  const [, y, mo, d, h, mi, se] = m.map(Number)
  return new Date(y, mo - 1, d, h, mi, se)
}

function degrees(v: TagValue | undefined, ref: TagValue | undefined, negative: string): number | undefined {
  if (!Array.isArray(v) || v.length !== 3) return undefined
  const [d, m, s] = (v as Rational[]).map((r) => ratio(r) ?? 0)
  const value = d + m / 60 + s / 3600
  return ref === negative ? -value : value
}

export function cr3Summary(c: Cr3Contents): ExifSummary | null {
  const raw: RawExif = {}
  const copy = (tags: Map<number, TagValue>, names: Record<number, string>) => {
    for (const [tag, name] of Object.entries(names)) {
      const v = tags.get(Number(tag))
      if (v === undefined) continue
      raw[name] = RATIONAL_NAMES.has(name) ? ratio(v) : name.endsWith('Date') || name === 'DateTimeOriginal' ? exifDate(v) : v
    }
  }
  copy(c.ifd0, IFD0_TAGS)
  copy(c.exif, EXIF_TAGS)
  const lat = degrees(c.gps.get(2), c.gps.get(1), 'S')
  const lon = degrees(c.gps.get(4), c.gps.get(3), 'W')
  if (lat !== undefined && lon !== undefined) {
    raw.latitude = lat
    raw.longitude = lon
    raw.GPSAltitude = ratio(c.gps.get(6))
  }
  return Object.keys(raw).length ? summarizeExif(raw) : null
}

/** Camera orientation (EXIF 1, 3, 6 or 8) of the CR3, which its embedded JPEG does not carry. */
export function cr3Orientation(c: Cr3Contents): number {
  const v = c.ifd0.get(0x0112)
  return typeof v === 'number' ? v : 1
}

const pick = (tags: Map<number, TagValue>, ids: number[]): Record<number, TagValue> =>
  Object.fromEntries(ids.filter((id) => tags.has(id)).map((id) => [id, tags.get(id)!]))

/** EXIF to write into exported JPEGs; limited to standard tags piexif knows how to encode. */
export function cr3ExifDict(c: Cr3Contents): piexif.ExifDict {
  return {
    '0th': { ...pick(c.ifd0, [0x010f, 0x0110, 0x0131, 0x0132]), 0x0112: 1 },
    Exif: pick(c.exif, [0x829a, 0x829d, 0x8827, 0x9003, 0x9004, 0x920a, 0xa434, 0xa433, 0x9201, 0x9202, 0x9204, 0x9207, 0x9209]),
    GPS: pick(c.gps, [0, 1, 2, 3, 4, 5, 6]),
  }
}
