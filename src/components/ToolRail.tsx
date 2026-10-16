import type { ReactNode } from 'react'

export interface Tool<T extends string> {
  id: T
  label: string
  icon: ReactNode
}

interface ToolRailProps<T extends string> {
  tools: Tool<T>[]
  active: T | null
  /** Called with the tool id; selecting the active tool again closes its panel. */
  onSelect: (id: T | null) => void
  label: string
}

export function ToolRail<T extends string>({ tools, active, onSelect, label }: ToolRailProps<T>) {
  return (
    <nav className="rail" aria-label={label}>
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          className="rail-btn"
          aria-pressed={active === t.id}
          onClick={() => onSelect(active === t.id ? null : t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
