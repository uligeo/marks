import { useState } from 'react'
import type { Layer } from '../types'
import type { LayerGestures } from '../components/Stage'

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

/** Selection plus gesture handlers for text and sticker layers stored in editor history. */
export function useLayers(layers: Layer[], commit: (layers: Layer[]) => void, onSelected?: () => void) {
  const [selected, setSelected] = useState<string | null>(null)

  const patch = (id: string, fn: (l: Layer) => Layer) => commit(layers.map((l) => (l.id === id ? fn(l) : l)))

  const select = (id: string | null) => {
    setSelected(id)
    if (id) onSelected?.()
  }

  const gestures: LayerGestures = {
    selected,
    onSelect: select,
    onMove: (id, dx, dy) => patch(id, (l) => ({ ...l, x: clamp(l.x + dx, 0, 1), y: clamp(l.y + dy, 0, 1) })),
    onTransform: (id, ratio, angle) =>
      patch(id, (l) => ({ ...l, size: clamp(l.size * ratio, 0.02, 1.2), rotation: l.rotation + angle })),
  }

  const change = (next: Layer[], select?: string | null) => {
    commit(next)
    if (select !== undefined) setSelected(select)
  }

  return { selected, select, gestures, change }
}
