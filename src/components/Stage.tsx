import { useEffect, useRef } from 'react'
import type { Histogram } from '../lib/pipeline'
import { renderPreview, type RenderInput } from '../lib/render'
import { useGestures } from '../hooks/useGestures'

interface StageProps {
  input: RenderInput
  fontsReady: boolean
  onHistogram: (h: Histogram) => void
  /** Drag deltas as a fraction of the displayed size. */
  onPan: (dx: number, dy: number) => void
  onZoom: (ratio: number) => void
  /** A tap without dragging. */
  onTap: () => void
}

export function Stage({ input, fontsReady, onHistogram, onPan, onZoom, onTap }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) onHistogram(renderPreview(canvasRef.current, input))
    })
    return () => cancelAnimationFrame(id)
  }, [input, fontsReady, onHistogram])

  const gestures = useGestures({
    onPan: (dx, dy, e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      onPan(dx / rect.width, dy / rect.height)
    },
    onPinch: onZoom,
    onTap,
  })

  return (
    <canvas
      ref={canvasRef}
      className="preview"
      {...gestures}
      aria-label="Vista previa de la foto con marco. Arrastra para encuadrar y pellizca para acercar."
    />
  )
}
