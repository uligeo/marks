import { useState } from 'react'
import type { Layer, TextLayer } from '../types'
import { FONTS } from '../lib/fonts'
import { duplicateLayer, newSticker, newTextLayer } from '../lib/layers'
import { FontPicker } from './FontPicker'
import { Slider } from './Slider'
import { StickerPicker } from './StickerPicker'

interface LayersPanelProps {
  layers: Layer[]
  selected: string | null
  onChange: (layers: Layer[], select?: string | null) => void
  onSelect: (id: string | null) => void
}

const TEXT_COLORS = ['#ffffff', '#1d2127', '#fbf3e4', '#f2c230', '#e0463c', '#ec8a2f', '#4cae4f', '#3c66d9', '#d64fb0']

const BACKGROUNDS: { id: TextLayer['background']; label: string }[] = [
  { id: 'shadow', label: 'Sombra' },
  { id: 'solid', label: 'Fondo' },
  { id: 'none', label: 'Sin efecto' },
]

const label = (l: Layer): string => (l.kind === 'text' ? l.text.split('\n')[0].slice(0, 14) || 'Texto' : l.emoji ?? 'Imagen')
const toDegrees = (r: number): number => Math.round((r * 180) / Math.PI)

export function LayersPanel({ layers, selected, onChange, onSelect }: LayersPanelProps) {
  const [picking, setPicking] = useState(false)
  const layer = layers.find((l) => l.id === selected) ?? null

  const add = (l: Layer) => {
    onChange([...layers, l], l.id)
    setPicking(false)
  }
  const update = (patch: Partial<TextLayer>) => {
    if (layer) onChange(layers.map((l) => (l.id === layer.id ? ({ ...l, ...patch } as Layer) : l)))
  }
  const remove = () => layer && onChange(layers.filter((l) => l.id !== layer.id), null)
  const toFront = () => layer && onChange([...layers.filter((l) => l.id !== layer.id), layer])

  return (
    <div className="panel-body">
      <div className="button-row">
        <button type="button" className="tool" onClick={() => add(newTextLayer())}>Agregar texto</button>
        <button type="button" className="tool" aria-pressed={picking} onClick={() => setPicking((p) => !p)}>Agregar sticker</button>
      </div>

      {picking && <StickerPicker onPick={(content) => add(newSticker(content))} />}

      {layers.length > 0 && (
        <div className="chips" role="group" aria-label="Capas">
          {layers.map((l) => (
            <button key={l.id} type="button" className="chip" aria-pressed={l.id === selected} onClick={() => onSelect(l.id)}>
              {label(l)}
            </button>
          ))}
        </div>
      )}

      {!layer && !picking && (
        <p className="hint">
          Agrega textos o stickers. En la foto, arrástralos con un dedo y usa dos dedos para agrandarlos o girarlos.
        </p>
      )}

      {layer?.kind === 'text' && (
        <>
          <label className="field">
            <span>Texto</span>
            <textarea className="text-input text-area" rows={2} maxLength={200} value={layer.text}
              onChange={(e) => update({ text: e.target.value })} />
          </label>
          <FontPicker label="Letra" fonts={FONTS} value={layer.font} onChange={(font) => update({ font })} />
          <fieldset className="field">
            <legend>Color</legend>
            <div className="swatches">
              {TEXT_COLORS.map((c) => (
                <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={`Color ${c}`}
                  aria-pressed={layer.color === c} onClick={() => update({ color: c })} />
              ))}
              <label className="swatch swatch-custom" title="Otro color">
                <input type="color" value={layer.color} onChange={(e) => update({ color: e.target.value })} />
              </label>
            </div>
          </fieldset>
          <div className="segmented" role="group" aria-label="Efecto del texto">
            {BACKGROUNDS.map((b) => (
              <button key={b.id} type="button" aria-pressed={layer.background === b.id} onClick={() => update({ background: b.id })}>
                {b.label}
              </button>
            ))}
          </div>
        </>
      )}

      {layer && (
        <>
          <Slider label="Tamaño" min={0.02} max={layer.kind === 'text' ? 0.3 : 1} step={0.005} neutral={layer.size}
            value={layer.size} format={(v) => `${Math.round(v * 100)}`} onChange={(size) => update({ size })} />
          <Slider label="Giro" min={-Math.PI} max={Math.PI} step={0.01} value={layer.rotation}
            format={(v) => `${toDegrees(v)}°`} onChange={(rotation) => update({ rotation })} />
          <div className="button-row">
            <button type="button" className="tool" onClick={() => add(duplicateLayer(layer))}>Duplicar</button>
            <button type="button" className="tool" onClick={toFront}>Traer al frente</button>
            <button type="button" className="tool tool-danger" onClick={remove}>Eliminar</button>
          </div>
        </>
      )}
    </div>
  )
}
