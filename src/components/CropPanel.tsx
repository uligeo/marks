import type { Transform } from '../types'
import { Slider } from './Slider'

interface CropPanelProps {
  value: Transform
  onChange: (value: Transform) => void
}

const ASPECTS: { label: string; value: number | null }[] = [
  { label: 'Original', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
]

const pct = (v: number): string => `${Math.round(v * 100)}%`

export function CropPanel({ value, onChange }: CropPanelProps) {
  const rotate = (delta: 90 | -90) =>
    onChange({ ...value, rotation: (((value.rotation + delta) % 360) + 360) % 360 as Transform['rotation'] })

  return (
    <div className="panel-body">
      <div className="chips" role="group" aria-label="Proporción">
        {ASPECTS.map((a) => (
          <button
            key={a.label}
            type="button"
            className="chip"
            aria-pressed={value.aspect === a.value}
            onClick={() => onChange({ ...value, aspect: a.value, panX: 0, panY: 0 })}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="button-row">
        <button type="button" className="tool" onClick={() => rotate(-90)}>Girar a la izquierda</button>
        <button type="button" className="tool" onClick={() => rotate(90)}>Girar a la derecha</button>
        <button type="button" className="tool" aria-pressed={value.flipH} onClick={() => onChange({ ...value, flipH: !value.flipH })}>
          Espejo
        </button>
      </div>
      <Slider label="Enderezar" min={-15} max={15} step={0.1} value={value.straighten}
        format={(v) => `${v.toFixed(1)}°`} onChange={(straighten) => onChange({ ...value, straighten })} />
      <Slider label="Acercar" min={1} max={3} neutral={1} value={value.zoom} format={(v) => `${v.toFixed(2)}x`}
        onChange={(zoom) => onChange({ ...value, zoom })} />
      <Slider label="Mover horizontal" min={-1} max={1} value={value.panX} format={pct}
        onChange={(panX) => onChange({ ...value, panX })} />
      <Slider label="Mover vertical" min={-1} max={1} value={value.panY} format={pct}
        onChange={(panY) => onChange({ ...value, panY })} />
      <p className="hint">También puedes arrastrar la foto para encuadrarla.</p>
    </div>
  )
}
