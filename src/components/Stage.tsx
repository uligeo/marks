import { useEffect, useRef } from 'react'
import type { Histogram } from '../lib/pipeline'
import { renderPreview, type RenderInput } from '../lib/render'

interface StageProps {
  input: RenderInput
  fontsReady: boolean
  onHistogram: (h: Histogram) => void
  onPan: (dx: number, dy: number) => void
}

export function Stage({ input, fontsReady, onHistogram, onPan }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) onHistogram(renderPreview(canvasRef.current, input))
    })
    return () => cancelAnimationFrame(id)
  }, [input, fontsReady, onHistogram])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    onPan((e.clientX - drag.current.x) / rect.width, (e.clientY - drag.current.y) / rect.height)
    drag.current = { x: e.clientX, y: e.clientY }
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
      aria-label="Vista previa de la foto con marco"
    />
  )
}
