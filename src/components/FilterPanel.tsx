import { useEffect, useMemo, useRef, useState } from 'react'
import type { Look } from '../types'
import { neutralAdjustments } from '../lib/adjust'
import { FILTERS, FILTER_CATEGORIES, getFilter, mergeLook, type Filter, type FilterCategory } from '../lib/filters'
import { applyAdjustments } from '../lib/pipeline'
import { Slider } from './Slider'

interface FilterPanelProps {
  source: ImageBitmap
  value: Look
  onChange: (look: Look) => void
}

const THUMB = 84

/** Square, center-cropped pixels of the photo used for every thumbnail. */
function thumbBase(src: ImageBitmap): ImageData {
  const c = document.createElement('canvas')
  c.width = THUMB
  c.height = THUMB
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const side = Math.min(src.width, src.height)
  ctx.drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, THUMB, THUMB)
  return ctx.getImageData(0, 0, THUMB, THUMB)
}

function FilterThumb({ base, filter, order }: { base: ImageData; filter: Filter | null; order: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    // Stagger the work so a long grid never blocks the interface.
    const id = window.setTimeout(() => {
      const data = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height)
      if (filter) applyAdjustments(data, mergeLook(neutralAdjustments(), { id: filter.id, amount: 1 }), null)
      ref.current?.getContext('2d')?.putImageData(data, 0, 0)
    }, order * 3)
    return () => clearTimeout(id)
  }, [base, filter, order])
  return <canvas ref={ref} width={THUMB} height={THUMB} className="filter-thumb" aria-hidden="true" />
}

export function FilterPanel({ source, value, onChange }: FilterPanelProps) {
  const [category, setCategory] = useState<FilterCategory | 'all'>('all')
  const base = useMemo(() => thumbBase(source), [source])
  const list = category === 'all' ? FILTERS : FILTERS.filter((f) => f.category === category)
  const active = getFilter(value.id)

  return (
    <div className="panel-body">
      <div className="chips" role="group" aria-label="Categoría de filtros">
        {FILTER_CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div
        className="filter-reel"
        role="group"
        aria-label="Filtros"
        onWheel={(e) => {
          // A mouse wheel scrolls the reel sideways on desktop.
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY
        }}
      >
        <button type="button" className="filter-option" aria-pressed={!active} onClick={() => onChange({ id: null, amount: 1 })}>
          <FilterThumb base={base} filter={null} order={0} />
          <span>Original</span>
        </button>
        {list.map((f, i) => (
          <button key={f.id} type="button" className="filter-option" aria-pressed={value.id === f.id}
            onClick={() => onChange({ id: f.id, amount: value.id === f.id ? value.amount : 1 })}>
            <FilterThumb base={base} filter={f} order={i + 1} />
            <span>{f.name}</span>
          </button>
        ))}
      </div>
      {active && (
        <Slider label={`Intensidad de ${active.name}`} min={0} max={1} neutral={1} value={value.amount}
          format={(v) => `${Math.round(v * 100)} %`} onChange={(amount) => onChange({ ...value, amount })} />
      )}
    </div>
  )
}
