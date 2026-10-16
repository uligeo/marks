import { useEffect, useRef } from 'react'
import type { CollageState } from '../../types'
import { cellOverflow, renderCollagePreview, type CollageGeometry } from '../../lib/collageRender'
import { useGestures } from '../../hooks/useGestures'

interface CollageStageProps {
  state: CollageState
  selected: number | null
  fontsReady: boolean
  onSelect: (index: number | null) => void
  /** Pan deltas in the cell's -1..1 pan space. */
  onPanCell: (index: number, dx: number, dy: number) => void
  onZoomCell: (index: number, ratio: number) => void
  /** A tap on the background, outside every photo. */
  onTapBackground: () => void
}

export function CollageStage({ state, selected, fontsReady, onSelect, onPanCell, onZoomCell, onTapBackground }: CollageStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geometry = useRef<CollageGeometry | null>(null)
  const active = useRef<number | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) geometry.current = renderCollagePreview(canvasRef.current, state, selected)
    })
    return () => cancelAnimationFrame(id)
  }, [state, selected, fontsReady])

  const scaleOf = (el: HTMLElement) => (el as HTMLCanvasElement).width / el.getBoundingClientRect().width

  const gestures = useGestures({
    onStart: (e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const k = scaleOf(e.currentTarget)
      const x = (e.clientX - rect.left) * k
      const y = (e.clientY - rect.top) * k
      const index = geometry.current?.rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? -1
      if (index < 0) {
        onTapBackground()
        return false
      }
      active.current = index
      onSelect(index)
    },
    onPan: (dx, dy, e) => {
      const index = active.current
      const r = index !== null ? geometry.current?.rects[index] : undefined
      if (index === null || !r) return
      const k = scaleOf(e.currentTarget)
      const { dw, dh } = cellOverflow(state.cells[index], r.w, r.h)
      onPanCell(index, dw > 1 ? (-2 * dx * k) / dw : 0, dh > 1 ? (-2 * dy * k) / dh : 0)
    },
    onPinch: (ratio) => {
      const index = active.current ?? selected
      if (index !== null) onZoomCell(index, ratio)
    },
  })

  return (
    <canvas
      ref={canvasRef}
      className="preview"
      {...gestures}
      aria-label="Vista previa del collage. Toca una foto para seleccionarla, arrástrala para encuadrarla y pellizca para acercar."
    />
  )
}
