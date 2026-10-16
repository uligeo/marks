import type { Transform } from '../types'
import { fitAspect, mirrorCrop, orientedSize } from '../lib/crop'
import { Slider } from './Slider'

interface CropPanelProps {
  source: { width: number; height: number }
  value: Transform
  onChange: (value: Transform) => void
}

const RATIOS: { label: string; value: number }[] = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
]

const same = (a: number | null, b: number | null): boolean => (a === null || b === null ? a === b : Math.abs(a - b) < 1e-3)

export function CropPanel({ source, value, onChange }: CropPanelProps) {
  const size = orientedSize(source, value.rotation)
  const original = size.w / size.h

  const setAspect = (aspect: number | null) =>
    onChange({ ...value, aspect, crop: aspect === null ? value.crop : fitAspect(size, aspect) })

  const rotate = (delta: 90 | -90) => {
    const rotation = ((((value.rotation + delta) % 360) + 360) % 360) as Transform['rotation']
    onChange({ ...value, rotation, crop: fitAspect(orientedSize(source, rotation), value.aspect) })
  }

  return (
    <div className="panel-body">
      <p className="hint">Arrastra las esquinas o los bordes del recuadro; muévelo con un dedo y pellizca para cambiar su tamaño.</p>
      <div className="chips" role="group" aria-label="Proporción">
        <button type="button" className="chip" aria-pressed={value.aspect === null} onClick={() => setAspect(null)}>Libre</button>
        <button type="button" className="chip" aria-pressed={same(value.aspect, original)} onClick={() => setAspect(original)}>
          Original
        </button>
        {RATIOS.map((r) => (
          <button key={r.label} type="button" className="chip" aria-pressed={same(value.aspect, r.value)} onClick={() => setAspect(r.value)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="button-row">
        <button type="button" className="tool" onClick={() => rotate(-90)}>Girar a la izquierda</button>
        <button type="button" className="tool" onClick={() => rotate(90)}>Girar a la derecha</button>
        <button type="button" className="tool" aria-pressed={value.flipH}
          onClick={() => onChange({ ...value, flipH: !value.flipH, crop: mirrorCrop(value.crop) })}>
          Espejo
        </button>
      </div>
      <Slider label="Enderezar" min={-15} max={15} step={0.1} value={value.straighten}
        format={(v) => `${v.toFixed(1)}°`} onChange={(straighten) => onChange({ ...value, straighten })} />
      <button type="button" className="btn btn-ghost"
        onClick={() => onChange({ ...value, straighten: 0, crop: fitAspect(size, value.aspect) })}>
        Restablecer recorte
      </button>
    </div>
  )
}
