import type { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { IconBack, IconExport, IconLight, IconMoon, IconRedo, IconUndo } from './icons'

interface TopBarProps {
  onHome?: () => void
  history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
  onExport?: () => void
  children?: ReactNode
}

function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const label = theme === 'light' ? 'Cambiar a tono oscuro' : 'Cambiar a tono claro'
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === 'light' ? <IconMoon /> : <IconLight />}
    </button>
  )
}

export function TopBar({ onHome, history, onExport, children }: TopBarProps) {
  return (
    <header className="topbar">
      {onHome ? (
        <button type="button" className="icon-btn" onClick={onHome} aria-label="Volver al inicio" title="Volver al inicio">
          <IconBack />
        </button>
      ) : (
        <span className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={24} height={24} />
          Marks
        </span>
      )}
      {!history && <ThemeToggle />}
      {history && (
        <div className="topbar-actions">
          <ThemeToggle />
          <button type="button" className="icon-btn" onClick={history.undo} disabled={!history.canUndo}
            aria-label="Deshacer" title="Deshacer (Ctrl+Z)">
            <IconUndo />
          </button>
          <button type="button" className="icon-btn" onClick={history.redo} disabled={!history.canRedo}
            aria-label="Rehacer" title="Rehacer (Ctrl+Mayús+Z)">
            <IconRedo />
          </button>
          {children}
          <button type="button" className="btn btn-primary btn-icon" onClick={onExport}>
            <IconExport />
            <span>Exportar</span>
          </button>
        </div>
      )}
    </header>
  )
}
