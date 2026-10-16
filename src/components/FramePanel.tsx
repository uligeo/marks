import type { ExifSummary, FrameInfo, FrameSettings } from '../types'
import { infoFromExif } from '../lib/exif'
import { CANVAS_ASPECTS, FRAME_COLORS, FRAME_STYLES, getFrameStyle } from '../lib/frame'
import { DATA_FONTS, FONTS } from '../lib/fonts'
import { FontPicker } from './FontPicker'

interface FramePanelProps {
  value: FrameSettings
  exif: ExifSummary | null
  onChange: (value: FrameSettings) => void
  onStyleChange: (styleId: string) => void
}

const INFO_FIELDS: { key: keyof FrameInfo; label: string; placeholder: string }[] = [
  { key: 'camera', label: 'Cámara', placeholder: 'Ej. Fujifilm X-T5' },
  { key: 'lens', label: 'Objetivo', placeholder: 'Ej. XF 23mm F1.4' },
  { key: 'exposure', label: 'Exposición', placeholder: 'Ej. 23mm f/2.8 1/250s ISO 160' },
  { key: 'date', label: 'Fecha', placeholder: 'Ej. 14 jul 2026' },
]

export function FramePanel({ value, exif, onChange, onStyleChange }: FramePanelProps) {
  const set = (patch: Partial<FrameSettings>) => onChange({ ...value, ...patch })
  const setInfo = (key: keyof FrameInfo, text: string) => set({ info: { ...value.info, [key]: text } })
  const kind = getFrameStyle(value.styleId).kind
  const showColor = kind !== 'overlay' && (kind !== 'blur' || value.innerBorder)

  return (
    <div className="panel-body">
      <p className="hint">El marco respeta tu recorte. Para la forma clásica de instantánea, recorta en 1:1 desde Recortar.</p>
      <div className="frame-styles" role="group" aria-label="Tipo de marco">
        {FRAME_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="frame-style"
            aria-pressed={value.styleId === s.id}
            onClick={() => onStyleChange(s.id)}
          >
            <span className={`frame-thumb frame-thumb-${s.id}`} aria-hidden="true" />
            {s.name}
          </button>
        ))}
      </div>

      {kind === 'blur' && (
        <>
          <div className="chips" role="group" aria-label="Proporción del lienzo">
            {CANVAS_ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                className="chip"
                aria-pressed={value.canvasAspect === a.value}
                onClick={() => set({ canvasAspect: a.value })}
              >
                {a.label}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={value.innerBorder} onChange={(e) => set({ innerBorder: e.target.checked })} />
            <span>Borde alrededor de la foto</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={value.shadow} onChange={(e) => set({ shadow: e.target.checked })} />
            <span>Sombra</span>
          </label>
        </>
      )}

      {showColor && (
        <fieldset className="field">
          <legend>{kind === 'blur' ? 'Color del borde' : 'Color del marco'}</legend>
          <div className="swatches">
            {FRAME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c }}
                aria-label={`Color ${c}`}
                aria-pressed={value.color === c}
                onClick={() => set({ color: c })}
              />
            ))}
            <label className="swatch swatch-custom" title="Otro color">
              <input type="color" value={value.color} onChange={(e) => set({ color: e.target.value })} />
            </label>
          </div>
        </fieldset>
      )}

      <label className="field">
        <span>Tu texto</span>
        <input
          type="text"
          className="text-input"
          maxLength={60}
          placeholder="Tu nombre, un lugar, un recuerdo"
          value={value.caption}
          onChange={(e) => set({ caption: e.target.value })}
        />
      </label>

      <FontPicker label="Letra de tu texto" fonts={FONTS} value={value.font} onChange={(font) => set({ font })} />

      <fieldset className="field info-fields">
        <legend>Datos impresos</legend>
        {INFO_FIELDS.map((f) => (
          <label key={f.key} className="info-row">
            <span>{f.label}</span>
            <input
              type="text"
              className="text-input"
              maxLength={80}
              placeholder={f.placeholder}
              value={value.info[f.key]}
              onChange={(e) => setInfo(f.key, e.target.value)}
            />
          </label>
        ))}
        <p className="hint">Deja un campo vacío para no imprimirlo.</p>
        <FontPicker label="Letra de los datos" fonts={DATA_FONTS} value={value.metaFont} onChange={(metaFont) => set({ metaFont })} />
        <button type="button" className="btn btn-ghost" disabled={!exif} onClick={() => set({ info: infoFromExif(exif) })}>
          Restaurar datos de la foto
        </button>
      </fieldset>
    </div>
  )
}
