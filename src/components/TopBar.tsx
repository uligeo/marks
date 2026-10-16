import type { ReactNode } from 'react'

interface TopBarProps {
  onHome?: () => void
  history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
  onExport?: () => void
  children?: ReactNode
}

export function TopBar({ onHome, history, onExport, children }: TopBarProps) {
  return (
    <header className="topbar">
      {onHome ? (
        <button type="button" className="brand brand-btn" onClick={onHome} title="Volver al inicio">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          <span>Inicio</span>
        </button>
      ) : (
        <span className="brand">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          Marcos
        </span>
      )}
      {history && (
        <div className="topbar-actions">
          <button type="button" className="icon-btn" onClick={history.undo} disabled={!history.canUndo} title="Deshacer (Ctrl+Z)">
            Deshacer
          </button>
          <button type="button" className="icon-btn" onClick={history.redo} disabled={!history.canRedo} title="Rehacer (Ctrl+Mayús+Z)">
            Rehacer
          </button>
          {children}
          <button type="button" className="btn btn-primary" onClick={onExport}>
            Exportar
          </button>
        </div>
      )}
    </header>
  )
}
