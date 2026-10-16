import { useEffect, useRef } from 'react'
import type { Histogram } from '../lib/pipeline'
import { hitLayer, type LayerBox } from '../lib/layers'
import { renderPreview, type RenderInput } from '../lib/render'
import { canvasPoint, useGestures } from '../hooks/useGestures'

export interface LayerGestures {
  selected: string | null
  onSelect: (id: string | null) => void
  /** Move by a fraction of the output size. */
  onMove: (id: string, dx: number, dy: number) => void
  onTransform: (id: string, ratio: number, angle: number) => void
}

interface StageProps {
  input: RenderInput
  fontsReady: boolean
  layers: LayerGestures
  onHistogram: (h: Histogram) => void
  /** Drag deltas as a fraction of the displayed size. */
  onPan: (dx: number, dy: number) => void
  onZoom: (ratio: number) => void
  /** A tap on the photo, outside every layer. */
  onTap: () => void
}

export function Stage({ input, fontsReady, layers, onHistogram, onPan, onZoom, onTap }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxes = useRef<LayerBox[]>([])
  const target = useRef<string | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!canvasRef.current) return
      const result = renderPreview(canvasRef.current, input, layers.selected)
      boxes.current = result.boxes
      onHistogram(result.histogram)
    })
    return () => cancelAnimationFrame(id)
  }, [input, fontsReady, onHistogram, layers.selected])

  const gestures = useGestures({
    onStart: (e) => {
      const p = canvasPoint(e)
      target.current = hitLayer(boxes.current, p.x, p.y, e.currentTarget.clientWidth * 0.03 * p.k)
      if (target.current) layers.onSelect(target.current)
    },
    onPan: (dx, dy, e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      if (target.current) layers.onMove(target.current, dx / rect.width, dy / rect.height)
      else onPan(dx / rect.width, dy / rect.height)
    },
    onPinch: (ratio, angle, fromWheel) => {
      const id = fromWheel ? layers.selected : target.current
      if (id) layers.onTransform(id, ratio, angle)
      else onZoom(ratio)
    },
    onTap: () => {
      if (target.current) return
      if (layers.selected) layers.onSelect(null)
      else onTap()
    },
  })

  return (
    <canvas
      ref={canvasRef}
      className="preview"
      {...gestures}
      aria-label="Vista previa. Arrastra para encuadrar, pellizca para acercar; toca un texto o sticker para moverlo, agrandarlo o girarlo."
    />
  )
}
