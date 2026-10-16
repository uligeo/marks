import { readTiffIfd, type TagValue } from './tiff'

/**
 * Canon CR3 is an ISO base media (MP4-like) container. Track 1 holds a full-resolution
 * JPEG rendered by the camera; the Canon uuid box in `moov` holds EXIF as TIFF blocks
 * (CMT1 = IFD0, CMT2 = Exif, CMT4 = GPS). Only those parts are read, never the sensor data.
 */

const CANON_UUID = '85c0b687820f11e08111f4ce462b6a48'
const PREVIEW_UUID = 'eaf42b5e1c984b88b9fbb7dc406e4d16'

export interface Cr3Contents {
  jpeg: Blob
  ifd0: Map<number, TagValue>
  exif: Map<number, TagValue>
  gps: Map<number, TagValue>
}

interface Box {
  type: string
  uuid?: string
  /** Absolute offsets within the buffer. */
  start: number
  payload: number
  end: number
}

const hex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

function* boxes(buf: Uint8Array, start: number, end: number): Generator<Box> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let at = start
  while (at + 8 <= end) {
    let size = view.getUint32(at)
    const type = String.fromCharCode(buf[at + 4], buf[at + 5], buf[at + 6], buf[at + 7])
    let header = 8
    if (size === 1) {
      size = Number(view.getBigUint64(at + 8))
      header = 16
    } else if (size === 0) {
      size = end - at
    }
    if (size < header || at + size > end) return
    const box: Box = { type, start: at, payload: at + header, end: at + size }
    if (type === 'uuid') {
      box.uuid = hex(buf.subarray(box.payload, box.payload + 16))
      box.payload += 16
    }
    yield box
    at += size
  }
}

const find = (buf: Uint8Array, parent: Box, type: string): Box | undefined => {
  for (const b of boxes(buf, parent.payload, parent.end)) if (b.type === type) return b
  return undefined
}

async function readRange(file: Blob, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer())
}

export async function isCr3(file: Blob): Promise<boolean> {
  const head = await readRange(file, 0, 12)
  const text = String.fromCharCode(...head.subarray(4, 12))
  return text === 'ftypcrx '
}

/** Location of the first sample of track 1 (the full-size JPEG). */
function trackOneSample(moov: Uint8Array, moovBox: Box): { offset: number; size: number } | null {
  const trak = find(moov, moovBox, 'trak')
  const mdia = trak && find(moov, trak, 'mdia')
  const minf = mdia && find(moov, mdia, 'minf')
  const stbl = minf && find(moov, minf, 'stbl')
  if (!stbl) return null
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength)
  const stsz = find(moov, stbl, 'stsz')
  const co64 = find(moov, stbl, 'co64')
  const stco = find(moov, stbl, 'stco')
  if (!stsz || (!co64 && !stco)) return null
  // Full boxes: 4 bytes of version and flags before the fields.
  let size = view.getUint32(stsz.payload + 4)
  if (size === 0) size = view.getUint32(stsz.payload + 12)
  const offset = co64 ? Number(view.getBigUint64(co64.payload + 8)) : view.getUint32(stco!.payload + 8)
  return { offset, size }
}

async function startsAsJpeg(file: Blob, offset: number): Promise<boolean> {
  const b = await readRange(file, offset, offset + 3)
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
}

export async function readCr3(file: Blob): Promise<Cr3Contents | null> {
  if (!(await isCr3(file))) return null
  // Walk top-level boxes by their headers only; the sensor data (mdat) is never read.
  let moov: Uint8Array | null = null
  let moovBox: Box | null = null
  let preview: { start: number; end: number } | null = null
  let at = 0
  while (at + 8 <= file.size) {
    const head = await readRange(file, at, Math.min(file.size, at + 24))
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength)
    const small = view.getUint32(0)
    const size = small === 1 ? Number(view.getBigUint64(8)) : small === 0 ? file.size - at : small
    const type = String.fromCharCode(head[4], head[5], head[6], head[7])
    if (size < 8) break
    if (type === 'moov') {
      moov = await readRange(file, at, at + size)
      moovBox = boxes(moov, 0, moov.length).next().value ?? null
    } else if (type === 'uuid' && head.length >= 24 && hex(head.subarray(8, 24)) === PREVIEW_UUID) {
      preview = { start: at + 24, end: at + size }
    }
    at += size
  }
  if (!moov || !moovBox) return null

  const meta = { ifd0: new Map<number, TagValue>(), exif: new Map<number, TagValue>(), gps: new Map<number, TagValue>() }
  for (const b of boxes(moov, moovBox.payload, moovBox.end)) {
    if (b.type !== 'uuid' || b.uuid !== CANON_UUID) continue
    for (const c of boxes(moov, b.payload, b.end)) {
      const tiff = moov.subarray(c.payload, c.end)
      if (c.type === 'CMT1') meta.ifd0 = readTiffIfd(tiff)
      if (c.type === 'CMT2') meta.exif = readTiffIfd(tiff)
      if (c.type === 'CMT4') meta.gps = readTiffIfd(tiff)
    }
  }

  const sample = trackOneSample(moov, moovBox)
  if (sample && sample.size > 0 && (await startsAsJpeg(file, sample.offset))) {
    return { jpeg: file.slice(sample.offset, sample.offset + sample.size, 'image/jpeg'), ...meta }
  }
  // Fallback: the smaller preview JPEG stored in its own uuid box.
  if (preview) {
    const bytes = await readRange(file, preview.start, preview.end)
    for (let i = 0; i + 2 < bytes.length; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
        return { jpeg: file.slice(preview.start + i, preview.end, 'image/jpeg'), ...meta }
      }
    }
  }
  return null
}
