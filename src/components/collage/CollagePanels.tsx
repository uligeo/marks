import type { BackgroundKind, CaptionFont, CollageSettings } from '../../types'
import { MAX_PHOTOS, layoutRects, layoutsFor } from '../../lib/collageLayouts'
import { COLLAGE_ASPECTS, GRADIENTS } from '../../lib/collageRender'
import { FRAME_COLORS } from '../../lib/frame'
import { Slider } from '../Slider'

interface PanelProps {
  value: CollageSettings
  onChange: (patch: Partial<CollageSettings>) => void
}

const THUMB = 44

function LayoutThumb({ groups, vertical, aspect }: { groups: number[]; vertical: boolean; aspect: number }) {
  const w = aspect >= 1 ? THUMB : THUMB * aspect
  const h = aspect >= 1 ? THUMB / aspect : THUMB
  const rects = layoutRects({ id: '', groups, vertical }, { x: 2, y: 2, w: w - 4, h: h - 4 }, 2)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect width={w} height={h} rx={3} className="layout-bg" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={1.5} className="layout-cell" />
      ))}
    </svg>
  )
}

export function LayoutPanel({ value, onChange, count, onAdd }: PanelProps & { count: number; onAdd: () => void }) {
  const layouts = layoutsFor(count)
  const current = layouts.find((l) => l.id === value.layoutId) ?? layouts[0]
  return (
    <div className="panel-body">
      <div className="chips" role="group" aria-label="Proporción">
        {COLLAGE_ASPECTS.map((a) => (
          <button key={a.label} type="button" className="chip" aria-pressed={value.aspect === a.value} onClick={() => onChange({ aspect: a.value })}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="layout-grid" role="group" aria-label="Distribución">
        {layouts.map((l) => (
          <button
            key={l.id}
            type="button"
            className="layout-option"
            aria-pressed={current.id === l.id}
            aria-label={`Distribución ${l.vertical ? 'en columnas' : 'en filas'} ${l.groups.join(', ')}`}
            onClick={() => onChange({ layoutId: l.id })}
          >
            <LayoutThumb groups={l.groups} vertical={l.vertical} aspect={value.aspect} />
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={onAdd} disabled={count >= MAX_PHOTOS}>
        Agregar fotos ({count} de {MAX_PHOTOS})
      </button>
    </div>
  )
}

const KINDS: { id: BackgroundKind; label: string }[] = [
  { id: 'color', label: 'Color' },
  { id: 'gradient', label: 'Degradado' },
  { id: 'blur', label: 'Foto' },
]

const BG_COLORS = [...FRAME_COLORS, '#ffffff', '#000000']

export function BackgroundPanel({ value, onChange, count }: PanelProps & { count: number }) {
  return (
    <div className="panel-body">
      <div className="segmented" role="group" aria-label="Tipo de fondo">
        {KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={value.background === k.id} onClick={() => onChange({ background: k.id })}>
            {k.label}
          </button>
        ))}
      </div>

      {value.background === 'color' && (
        <div className="swatches">
          {BG_COLORS.map((c) => (
            <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={`Color ${c}`}
              aria-pressed={value.color === c} onClick={() => onChange({ color: c })} />
          ))}
          <label className="swatch swatch-custom" title="Otro color">
            <input type="color" value={value.color} onChange={(e) => onChange({ color: e.target.value })} />
          </label>
        </div>
      )}

      {value.background === 'gradient' && (
        <div className="swatches">
          {GRADIENTS.map(([from, to], i) => (
            <button key={from + to} type="button" className="swatch" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              aria-label={`Degradado ${i + 1}`} aria-pressed={value.gradient === i} onClick={() => onChange({ gradient: i })} />
          ))}
        </div>
      )}

      {value.background === 'blur' && (
        <>
          <p className="hint">Elige qué foto se usa desenfocada como fondo.</p>
          <div className="chips" role="group" aria-label="Foto del fondo">
            {Array.from({ length: count }, (_, i) => (
              <button key={i} type="button" className="chip" aria-pressed={value.blurSource === i} onClick={() => onChange({ blurSource: i })}>
                Foto {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const FONTS: { id: CaptionFont; label: string }[] = [
  { id: 'hand', label: 'A mano' },
  { id: 'typewriter', label: 'Máquina' },
  { id: 'sans', label: 'Limpia' },
]

const relative = (max: number) => (v: number) => `${Math.round((v / max) * 100)}`

export function StylePanel({ value, onChange }: PanelProps) {
  return (
    <div className="panel-body">
      <Slider label="Espaciado" min={0} max={0.06} step={0.001} value={value.gap} format={relative(0.06)}
        onChange={(gap) => onChange({ gap })} />
      <Slider label="Margen" min={0} max={0.12} step={0.001} value={value.margin} format={relative(0.12)}
        onChange={(margin) => onChange({ margin })} />
      <Slider label="Esquinas" min={0} max={0.08} step={0.001} value={value.radius} format={relative(0.08)}
        onChange={(radius) => onChange({ radius })} />
      <label className="field">
        <span>Texto</span>
        <input type="text" className="text-input" maxLength={60} placeholder="Un título para el collage"
          value={value.caption} onChange={(e) => onChange({ caption: e.target.value })} />
      </label>
      <div className="segmented" role="group" aria-label="Letra">
        {FONTS.map((f) => (
          <button key={f.id} type="button" className={`font-${f.id}`} aria-pressed={value.font === f.id} onClick={() => onChange({ font: f.id })}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
