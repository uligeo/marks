import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'marcos-theme'
const THEME_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#111316' }

function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Light by default; the choice is remembered on this device. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this session.
    }
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}
