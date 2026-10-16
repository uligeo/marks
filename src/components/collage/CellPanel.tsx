import type { CollageCell } from '../../types'
import { AdjustPanel } from '../AdjustPanel'
import { Slider } from '../Slider'

interface CellPanelProps {
  cell: CollageCell | null
  index: number
  count: number
  onChange: (cell: CollageCell) => void
  onMove: (delta: -1 | 1) => void
  onReplace: () => void
  onRemove: () => void
  onApplyToAll: () => void
}

export function CellPanel({ cell, index, count, onChange, onMove, onReplace, onRemove, onApplyToAll }: CellPanelProps) {
  if (!cell) {
    return (
      <div className="panel-body">
        <p className="hint">Toca una foto del collage para editarla. Arrástrala para encuadrarla dentro de su espacio.</p>
      </div>
    )
  }

  return (
    <>
      <div className="panel-body">
        <p className="cell-title">Foto {index + 1} de {count}</p>
        <div className="button-row">
          <button type="button" className="tool" onClick={() => onMove(-1)} disabled={index === 0}>Mover antes</button>
          <button type="button" className="tool" onClick={() => onMove(1)} disabled={index === count - 1}>Mover después</button>
          <button type="button" className="tool" onClick={onReplace}>Reemplazar</button>
          <button type="button" className="tool tool-danger" onClick={onRemove} disabled={count <= 1}>Quitar</button>
        </div>
        <Slider label="Acercar" min={1} max={3} neutral={1} value={cell.zoom} format={(v) => `${v.toFixed(2)}x`}
          onChange={(zoom) => onChange({ ...cell, zoom })} />
        <button type="button" className="btn btn-ghost" onClick={onApplyToAll} disabled={count <= 1}>
          Aplicar estos ajustes a todas las fotos
        </button>
      </div>
      <AdjustPanel value={cell.adjustments} histogram={null} onChange={(adjustments) => onChange({ ...cell, adjustments })} />
    </>
  )
}
