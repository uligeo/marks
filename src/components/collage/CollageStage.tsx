import { useEffect, useRef } from 'react'
import type { CollageState } from '../../types'
import { cellOverflow, renderCollagePreview, type CollageGeometry } from '../../lib/collageRender'

interface CollageStageProps {
  state: CollageState
  selected: number | null
  fontsReady: boolean
  onSelect: (index: number | null) => void
  /** Pan deltas in the cell's -1..1 pan space. */
  onPanCell: (index: number, dx: number, dy: number) => void
  /** A tap on the background, outside every photo. */
  onTapBackground: () => void
}

export function CollageStage({ state, selected, fontsReady, onSelect, onPanCell, onTapBackground }: CollageStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geometry = useRef<CollageGeometry | null>(null)
  const drag = useRef<{ index: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) geometry.current = renderCollagePreview(canvasRef.current, state, selected)
    })
    return () => cancelAnimationFrame(id)
  }, [state, selected, fontsReady])

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const k = e.currentTarget.width / rect.width
    return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e)
    const index = geometry.current?.rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) ?? -1
    if (index < 0) {
      onTapBackground()
      return
    }
    onSelect(index)
    drag.current = { index, ...p }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current
    const r = d && geometry.current?.rects[d.index]
    if (!d || !r) return
    const p = toCanvas(e)
    const { dw, dh } = cellOverflow(state.cells[d.index], r.w, r.h)
    onPanCell(d.index, dw > 1 ? (-2 * (p.x - d.x)) / dw : 0, dh > 1 ? (-2 * (p.y - d.y)) / dh : 0)
    drag.current = { ...d, ...p }
  }

  const endDrag = () => {
    drag.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      className="preview"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-label="Vista previa del collage. Toca una foto para seleccionarla y arrástrala para encuadrarla."
    />
  )
}
