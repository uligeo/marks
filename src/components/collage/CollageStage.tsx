import { useEffect, useRef } from 'react'
import type { CollageState } from '../../types'
import { cellOverflow, renderCollagePreview, type CollageGeometry } from '../../lib/collageRender'
import { hitLayer } from '../../lib/layers'
import { canvasPoint, useGestures } from '../../hooks/useGestures'
import type { LayerGestures } from '../Stage'

interface CollageStageProps {
  state: CollageState
  selected: number | null
  fontsReady: boolean
  layers: LayerGestures
  onSelect: (index: number | null) => void
  /** Pan deltas in the cell's -1..1 pan space. */
  onPanCell: (index: number, dx: number, dy: number) => void
  onZoomCell: (index: number, ratio: number) => void
  /** Long press on a photo and release over another one. */
  onSwapCells: (from: number, to: number) => void
  /** A tap on the background, outside every photo and layer. */
  onTapBackground: () => void
}

type Target = { kind: 'layer'; id: string } | { kind: 'cell'; index: number; swapping: boolean; over: number } | null

export function CollageStage(props: CollageStageProps) {
  const { state, selected, fontsReady, layers, onSelect, onPanCell, onZoomCell, onSwapCells, onTapBackground } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geometry = useRef<CollageGeometry | null>(null)
  const target = useRef<Target>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) geometry.current = renderCollagePreview(canvasRef.current, state, selected, layers.selected)
    })
    return () => cancelAnimationFrame(id)
  }, [state, selected, fontsReady, layers.selected])

  const cellAt = (x: number, y: number) =>
    geometry.current?.rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? -1

  const gestures = useGestures({
    onStart: (e) => {
      const p = canvasPoint(e)
      const layerId = hitLayer(geometry.current?.boxes ?? [], p.x, p.y, e.currentTarget.clientWidth * 0.03 * p.k)
      if (layerId) {
        target.current = { kind: 'layer', id: layerId }
        layers.onSelect(layerId)
        return
      }
      const index = cellAt(p.x, p.y)
      if (index < 0) {
        target.current = null
        if (layers.selected) layers.onSelect(null)
        else onTapBackground()
        return false
      }
      target.current = { kind: 'cell', index, swapping: false, over: index }
      if (layers.selected) layers.onSelect(null)
      onSelect(index)
    },
    onLongPress: () => {
      const t = target.current
      if (t?.kind !== 'cell') return
      t.swapping = true
      navigator.vibrate?.(15)
    },
    onPan: (dx, dy, e) => {
      const t = target.current
      const rect = e.currentTarget.getBoundingClientRect()
      if (t?.kind === 'layer') {
        layers.onMove(t.id, dx / rect.width, dy / rect.height)
        return
      }
      if (t?.kind !== 'cell') return
      if (t.swapping) {
        const p = canvasPoint(e)
        const over = cellAt(p.x, p.y)
        if (over >= 0 && over !== t.over) {
          t.over = over
          onSelect(over)
        }
        return
      }
      const r = geometry.current?.rects[t.index]
      if (!r) return
      const k = e.currentTarget instanceof HTMLCanvasElement ? e.currentTarget.width / rect.width : 1
      const { dw, dh } = cellOverflow(state.cells[t.index], r.w, r.h)
      onPanCell(t.index, dw > 1 ? (-2 * dx * k) / dw : 0, dh > 1 ? (-2 * dy * k) / dh : 0)
    },
    onPinch: (ratio, angle, fromWheel) => {
      const t = target.current
      if (fromWheel && layers.selected) layers.onTransform(layers.selected, ratio, angle)
      else if (!fromWheel && t?.kind === 'layer') layers.onTransform(t.id, ratio, angle)
      else {
        const index = t?.kind === 'cell' && !fromWheel ? t.index : selected
        if (index !== null) onZoomCell(index, ratio)
      }
    },
    onEnd: () => {
      const t = target.current
      if (t?.kind === 'cell' && t.swapping && t.over !== t.index) onSwapCells(t.index, t.over)
    },
  })

  return (
    <canvas
      ref={canvasRef}
      className="preview"
      {...gestures}
      aria-label="Collage. Toca una foto para editarla, arrástrala para encuadrarla, pellizca para acercar; mantenla pulsada y suéltala sobre otra para intercambiarlas."
    />
  )
}
