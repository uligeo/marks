export const MAX_PHOTOS = 9

export interface CollageLayout {
  id: string
  /** Number of photos in each row (or column when `vertical`). */
  groups: number[]
  vertical: boolean
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const MAX_PER_GROUP = 4
const MAX_GROUPS = 4
const MAX_LAYOUTS = 12

function compositions(n: number): number[][] {
  if (n === 0) return [[]]
  const out: number[][] = []
  for (let first = 1; first <= Math.min(n, MAX_PER_GROUP); first++) {
    for (const rest of compositions(n - first)) {
      if (rest.length < MAX_GROUPS) out.push([first, ...rest])
    }
  }
  return out
}

function imbalance(groups: number[]): number {
  const mean = groups.reduce((a, b) => a + b, 0) / groups.length
  const variance = groups.reduce((a, g) => a + (g - mean) ** 2, 0) / groups.length
  return variance + Math.abs(groups.length - Math.sqrt(groups.reduce((a, b) => a + b, 0))) * 0.5
}

/** Row and column arrangements for `n` photos, most balanced first. */
export function layoutsFor(n: number): CollageLayout[] {
  if (n <= 1) return [{ id: 'single', groups: [1], vertical: false }]
  const seen = new Set<string>()
  const layouts: CollageLayout[] = []
  const sorted = compositions(n).sort((a, b) => imbalance(a) - imbalance(b))
  for (const groups of sorted) {
    for (const vertical of [false, true]) {
      // Uniform grids look the same in rows or columns, so they share one id.
      const uniform = groups.every((g) => g === groups[0])
      const rows = vertical ? groups[0] : groups.length
      const cols = vertical ? groups.length : groups[0]
      const key = uniform ? `g${rows}x${cols}` : `${vertical ? 'v' : 'h'}${groups.join('-')}`
      if (seen.has(key)) continue
      seen.add(key)
      layouts.push({ id: key, groups, vertical })
    }
    if (layouts.length >= MAX_LAYOUTS) break
  }
  return layouts.slice(0, MAX_LAYOUTS)
}

export function resolveLayout(n: number, id: string): CollageLayout {
  const all = layoutsFor(n)
  return all.find((l) => l.id === id) ?? all[0]
}

/** Cell rectangles inside `area`, in reading order. */
export function layoutRects(layout: CollageLayout, area: Rect, gap: number): Rect[] {
  const { groups, vertical } = layout
  const main = vertical ? area.w : area.h
  const cross = vertical ? area.h : area.w
  const groupSize = (main - gap * (groups.length - 1)) / groups.length
  const rects: Rect[] = []
  groups.forEach((count, gi) => {
    const cellSize = (cross - gap * (count - 1)) / count
    const mainPos = gi * (groupSize + gap)
    for (let ci = 0; ci < count; ci++) {
      const crossPos = ci * (cellSize + gap)
      rects.push(
        vertical
          ? { x: area.x + mainPos, y: area.y + crossPos, w: groupSize, h: cellSize }
          : { x: area.x + crossPos, y: area.y + mainPos, w: cellSize, h: groupSize },
      )
    }
  })
  return rects
}
