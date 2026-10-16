import { useEffect, useRef } from 'react'
import type { Histogram } from '../lib/pipeline'
import { renderPreview, type RenderInput } from '../lib/render'

interface StageProps {
  input: RenderInput
  fontsReady: boolean
  onHistogram: (h: Histogram) => void
  onPan: (dx: number, dy: number) => void
  /** A tap without dragging. */
  onTap: () => void
}

const TAP_SLOP = 6

export function Stage({ input, fontsReady, onHistogram, onPan, onTap }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) onHistogram(renderPreview(canvasRef.current, input))
    })
    return () => cancelAnimationFrame(id)
  }, [input, fontsReady, onHistogram])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    const moved = drag.current.moved + Math.abs(dx) + Math.abs(dy)
    drag.current = { x: e.clientX, y: e.clientY, moved }
    if (moved > TAP_SLOP) onPan(dx / rect.width, dy / rect.height)
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.type === 'pointerup' && drag.current && drag.current.moved <= TAP_SLOP) onTap()
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
      aria-label="Vista previa de la foto con marco"
    />
  )
}
