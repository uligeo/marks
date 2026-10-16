/** A rational value as [numerator, denominator], the form piexif also uses. */
export type Rational = [number, number]
export type TagValue = string | number | number[] | Rational | Rational[]

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

/**
 * Reads the first IFD of a standalone TIFF block (header included), as found in the
 * metadata boxes of Canon CR3 files. Returns tag number -> decoded value.
 */
export function readTiffIfd(bytes: Uint8Array): Map<number, TagValue> {
  const tags = new Map<number, TagValue>()
  if (bytes.length < 8) return tags
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const le = bytes[0] === 0x49 && bytes[1] === 0x49
  if (!le && !(bytes[0] === 0x4d && bytes[1] === 0x4d)) return tags
  const u16 = (o: number) => view.getUint16(o, le)
  const u32 = (o: number) => view.getUint32(o, le)
  const i32 = (o: number) => view.getInt32(o, le)

  const ifd = u32(4)
  if (ifd + 2 > bytes.length) return tags
  const count = u16(ifd)
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12
    if (entry + 12 > bytes.length) break
    const tag = u16(entry)
    const type = u16(entry + 2)
    const n = u32(entry + 4)
    const size = (TYPE_SIZE[type] ?? 0) * n
    if (!size) continue
    const at = size <= 4 ? entry + 8 : u32(entry + 8)
    if (at + size > bytes.length) continue

    if (type === 2) {
      const text = new TextDecoder('latin1').decode(bytes.subarray(at, at + n)).replace(/\0+$/, '').trim()
      if (text) tags.set(tag, text)
      continue
    }
    const values: (number | Rational)[] = []
    for (let k = 0; k < n; k++) {
      if (type === 3) values.push(u16(at + k * 2))
      else if (type === 4) values.push(u32(at + k * 4))
      else if (type === 9) values.push(i32(at + k * 4))
      else if (type === 5) values.push([u32(at + k * 8), u32(at + k * 8 + 4)])
      else if (type === 10) values.push([i32(at + k * 8), i32(at + k * 8 + 4)])
      else values.push(bytes[at + k])
    }
    tags.set(tag, (values.length === 1 ? values[0] : values) as TagValue)
  }
  return tags
}

export const ratio = (v: TagValue | undefined): number | undefined =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number' && v[1] !== 0
    ? v[0] / v[1]
    : typeof v === 'number'
      ? v
      : undefined
