import { useRef } from 'react'

const TAP_SLOP = 6

export interface GestureHandlers {
  /** First finger down; return false to ignore the gesture. */
  onStart?: (e: React.PointerEvent<HTMLElement>) => boolean | void
  /** One-finger drag, in client pixels. */
  onPan?: (dx: number, dy: number, e: React.PointerEvent<HTMLElement>) => void
  /** Two-finger pinch or trackpad pinch; ratio > 1 means zoom in. */
  onPinch?: (ratio: number) => void
  /** A single-finger tap without movement. */
  onTap?: (e: React.PointerEvent<HTMLElement>) => void
}

/** Pointer handlers for pan, pinch and tap that work the same with mouse, pen and touch. */
export function useGestures({ onStart, onPan, onPinch, onTap }: GestureHandlers) {
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const state = useRef({ moved: 0, multi: false, active: false, dist: 0 })

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (pointers.current.size === 0) {
      if (onStart?.(e) === false) return
      state.current = { moved: 0, multi: false, active: true, dist: 0 }
    }
    if (!state.current.active) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
    if (pointers.current.size === 2) {
      state.current.multi = true
      state.current.dist = distance()
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      const d = distance()
      if (state.current.dist > 0 && d > 0) onPinch?.(d / state.current.dist)
      state.current.dist = d
      return
    }
    if (state.current.multi) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    state.current.moved += Math.abs(dx) + Math.abs(dy)
    if (state.current.moved > TAP_SLOP) onPan?.(dx, dy, e)
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    const s = state.current
    if (e.type === 'pointerup' && pointers.current.size === 0 && !s.multi && s.moved <= TAP_SLOP) onTap?.(e)
    if (pointers.current.size < 2) s.dist = 0
    if (pointers.current.size === 0) s.active = false
  }

  const onWheel = (e: React.WheelEvent<HTMLElement>) => {
    // Trackpad pinch arrives as a ctrl+wheel event.
    if (!e.ctrlKey) return
    onPinch?.(Math.exp(-e.deltaY / 100))
  }

  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onWheel }
}
