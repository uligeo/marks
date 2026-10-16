import { useCallback, useRef, useState } from 'react'

const COALESCE_MS = 600
const LIMIT = 100

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

/** Undo/redo state; rapid consecutive changes (slider drags) collapse into one step. */
export function useHistory<T>(initial: T) {
  const [h, setH] = useState<HistoryState<T>>({ past: [], present: initial, future: [] })
  const lastCommit = useRef(0)

  const set = useCallback((next: T) => {
    const now = Date.now()
    const coalesce = now - lastCommit.current < COALESCE_MS
    lastCommit.current = now
    setH((s) => ({
      past: coalesce ? s.past : [...s.past, s.present].slice(-LIMIT),
      present: next,
      future: [],
    }))
  }, [])

  const undo = useCallback(() => {
    lastCommit.current = 0
    setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s))
  }, [])

  const redo = useCallback(() => {
    lastCommit.current = 0
    setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s))
  }, [])

  const reset = useCallback((value: T) => {
    lastCommit.current = 0
    setH({ past: [], present: value, future: [] })
  }, [])

  return { state: h.present, set, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 }
}
