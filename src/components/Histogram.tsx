import { useEffect, useRef } from 'react'
import type { Histogram as HistogramData } from '../lib/pipeline'

interface HistogramProps {
  data: HistogramData | null
}

const CHANNELS: { key: keyof HistogramData; color: string }[] = [
  { key: 'r', color: 'rgba(224, 70, 60, 0.55)' },
  { key: 'g', color: 'rgba(76, 174, 79, 0.55)' },
  { key: 'b', color: 'rgba(60, 102, 217, 0.55)' },
]

export function Histogram({ data }: HistogramProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')!
    const { width: w, height: h } = canvas
    ctx.clearRect(0, 0, w, h)
    let peak = 1
    for (const { key } of CHANNELS) {
      for (let i = 2; i < 254; i++) peak = Math.max(peak, data[key][i])
    }
    ctx.globalCompositeOperation = 'screen'
    for (const { key, color } of CHANNELS) {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let i = 0; i < 256; i++) {
        ctx.lineTo((i / 255) * w, h - Math.min(1, data[key][i] / peak) * h)
      }
      ctx.lineTo(w, h)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [data])

  if (!data) return null
  return <canvas ref={ref} className="histogram" width={512} height={120} aria-label="Histograma" />
}
