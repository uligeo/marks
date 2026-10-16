import { useState, type ReactNode } from 'react'
import type { Adjustments, HslBand, HslShift } from '../types'
import { HSL_BANDS, PRESETS, applyPreset } from '../lib/adjust'
import type { Histogram as HistogramData } from '../lib/pipeline'
import { Histogram } from './Histogram'
import { Slider } from './Slider'
import { IconColor, IconDetail, IconEffects, IconLight, IconMix, IconPresets } from './icons'

interface AdjustPanelProps {
  value: Adjustments
  histogram: HistogramData | null
  onChange: (value: Adjustments) => void
}

type ScalarKey = Exclude<keyof Adjustments, 'hsl'>
type SectionId = 'presets' | 'light' | 'color' | 'mix' | 'effects' | 'detail'

const SECTIONS: { id: SectionId; label: string; icon: ReactNode }[] = [
  { id: 'presets', label: 'Estilos', icon: <IconPresets /> },
  { id: 'light', label: 'Luz', icon: <IconLight /> },
  { id: 'color', label: 'Color', icon: <IconColor /> },
  { id: 'mix', label: 'Mezcla', icon: <IconMix /> },
  { id: 'effects', label: 'Efectos', icon: <IconEffects /> },
  { id: 'detail', label: 'Detalle', icon: <IconDetail /> },
]

const SLIDERS: Partial<Record<SectionId, { key: ScalarKey; label: string; min: number }[]>> = {
  light: [
    { key: 'exposure', label: 'Exposición', min: -1 },
    { key: 'contrast', label: 'Contraste', min: -1 },
    { key: 'highlights', label: 'Altas luces', min: -1 },
    { key: 'shadows', label: 'Sombras', min: -1 },
    { key: 'whites', label: 'Blancos', min: -1 },
    { key: 'blacks', label: 'Negros', min: -1 },
  ],
  color: [
    { key: 'temperature', label: 'Temperatura', min: -1 },
    { key: 'tint', label: 'Matiz', min: -1 },
    { key: 'vibrance', label: 'Intensidad', min: -1 },
    { key: 'saturation', label: 'Saturación', min: -1 },
  ],
  effects: [
    { key: 'clarity', label: 'Claridad', min: -1 },
    { key: 'fade', label: 'Desvanecido', min: 0 },
    { key: 'vignette', label: 'Viñeta', min: 0 },
    { key: 'grain', label: 'Grano', min: 0 },
  ],
  detail: [{ key: 'sharpness', label: 'Nitidez', min: 0 }],
}

function HslMixer({ value, onChange }: Omit<AdjustPanelProps, 'histogram'>) {
  const [band, setBand] = useState<HslBand>('red')
  const current = value.hsl[band]
  const set = (patch: Partial<HslShift>) =>
    onChange({ ...value, hsl: { ...value.hsl, [band]: { ...current, ...patch } } })

  return (
    <>
      <div className="hsl-bands" role="group" aria-label="Color a ajustar">
        {HSL_BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="hsl-dot"
            style={{ background: b.swatch }}
            aria-label={b.label}
            title={b.label}
            aria-pressed={band === b.id}
            onClick={() => setBand(b.id)}
          />
        ))}
      </div>
      <Slider label="Tono" min={-1} max={1} value={current.hue} onChange={(hue) => set({ hue })} />
      <Slider label="Saturación" min={-1} max={1} value={current.sat} onChange={(sat) => set({ sat })} />
      <Slider label="Luminancia" min={-1} max={1} value={current.lum} onChange={(lum) => set({ lum })} />
    </>
  )
}

export function AdjustPanel({ value, histogram, onChange }: AdjustPanelProps) {
  const [section, setSection] = useState<SectionId>('light')
  const sliders = SLIDERS[section]

  return (
    <div className="adjust">
      <div className="subtools" role="tablist" aria-label="Categorías de ajuste">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" role="tab" className="subtool" aria-selected={section === s.id} onClick={() => setSection(s.id)}>
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <div className="panel-body">
        <div className="hide-mobile">
          <Histogram data={histogram} />
        </div>
        {section === 'presets' && (
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" className="chip" onClick={() => onChange(applyPreset(p.values))}>
                {p.name}
              </button>
            ))}
          </div>
        )}
        {section === 'mix' && <HslMixer value={value} onChange={onChange} />}
        {sliders?.map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            min={s.min}
            max={1}
            value={value[s.key]}
            onChange={(v) => onChange({ ...value, [s.key]: v })}
          />
        ))}
      </div>
    </div>
  )
}
