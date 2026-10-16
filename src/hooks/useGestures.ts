import { useEffect, useRef } from 'react'

const TAP_SLOP = 6
const LONG_PRESS_MS = 450

export interface GestureHandlers {
  /** First finger down; return false to ignore the gesture. */
  onStart?: (e: React.PointerEvent<HTMLElement>) => boolean | void
  /** One-finger drag, in client pixels. */
  onPan?: (dx: number, dy: number, e: React.PointerEvent<HTMLElement>) => void
  /**
   * Two-finger pinch and twist, or a trackpad pinch (`fromWheel`).
   * `ratio` > 1 zooms in; `angle` is the twist in radians since the last call.
   */
  onPinch?: (ratio: number, angle: number, fromWheel: boolean) => void
  /** A single-finger tap without movement. */
  onTap?: (e: React.PointerEvent<HTMLElement>) => void
  /** The finger stayed still for a moment; later drags continue to call onPan. */
  onLongPress?: () => void
  /** Last finger lifted. */
  onEnd?: (e: React.PointerEvent<HTMLElement>) => void
}

interface GestureState {
  moved: number
  multi: boolean
  active: boolean
  longPressed: boolean
  dist: number
  angle: number
  timer: number
}

/** Converts a pointer position to canvas pixels. */
export function canvasPoint(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLCanvasElement
  const rect = el.getBoundingClientRect()
  const k = el.width / rect.width
  return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k, rect, k }
}

const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))

/** Pointer handlers for pan, pinch, twist, tap and long press that work with mouse, pen and touch. */
export function useGestures(handlers: GestureHandlers) {
  const h = useRef(handlers)
  useEffect(() => {
    h.current = handlers
  })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const s = useRef<GestureState>({ moved: 0, multi: false, active: false, longPressed: false, dist: 0, angle: 0, timer: 0 })

  const pair = () => {
    const [a, b] = [...pointers.current.values()]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), angle: Math.atan2(b.y - a.y, b.x - a.x) }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (pointers.current.size === 0) {
      if (h.current.onStart?.(e) === false) return
      clearTimeout(s.current.timer)
      s.current = { moved: 0, multi: false, active: true, longPressed: false, dist: 0, angle: 0, timer: 0 }
      if (h.current.onLongPress) {
        s.current.timer = window.setTimeout(() => {
          const st = s.current
          if (st.active && !st.multi && st.moved <= TAP_SLOP) {
            st.longPressed = true
            h.current.onLongPress?.()
          }
        }, LONG_PRESS_MS)
      }
    }
    if (!s.current.active) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
    if (pointers.current.size === 2) {
      s.current.multi = true
      clearTimeout(s.current.timer)
      Object.assign(s.current, pair())
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const st = s.current
    if (pointers.current.size >= 2) {
      const now = pair()
      if (st.dist > 0 && now.dist > 0) h.current.onPinch?.(now.dist / st.dist, wrapAngle(now.angle - st.angle), false)
      st.dist = now.dist
      st.angle = now.angle
      return
    }
    if (st.multi) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    st.moved += Math.abs(dx) + Math.abs(dy)
    if (st.moved > TAP_SLOP || st.longPressed) h.current.onPan?.(dx, dy, e)
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    const st = s.current
    if (pointers.current.size < 2) st.dist = 0
    if (pointers.current.size > 0) return
    clearTimeout(st.timer)
    if (e.type === 'pointerup' && !st.multi && !st.longPressed && st.moved <= TAP_SLOP) h.current.onTap?.(e)
    h.current.onEnd?.(e)
    st.active = false
  }

  const onWheel = (e: React.WheelEvent<HTMLElement>) => {
    // Trackpad pinch arrives as a ctrl+wheel event.
    if (e.ctrlKey) h.current.onPinch?.(Math.exp(-e.deltaY / 100), 0, true)
  }

  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onWheel }
}
