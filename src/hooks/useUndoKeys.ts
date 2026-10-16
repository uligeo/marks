import { useEffect } from 'react'

/** Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, ignored while typing in a text field. */
export function useUndoKeys(undo: () => void, redo: () => void, extra?: (e: KeyboardEvent) => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input[type="text"]')) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else {
        extra?.(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, extra])
}
