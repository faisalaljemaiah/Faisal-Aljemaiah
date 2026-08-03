import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'op-interns-theme'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    return stored ?? 'system'
  })

  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    theme === 'system' ? getSystemTheme() : theme
  )

  React.useEffect(() => {
    const root = document.documentElement
    const applied = theme === 'system' ? getSystemTheme() : theme
    root.classList.toggle('dark', applied === 'dark')
    setResolvedTheme(applied)

    if (theme !== 'system') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const next = getSystemTheme()
      root.classList.toggle('dark', next === 'dark')
      setResolvedTheme(next)
    }
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
