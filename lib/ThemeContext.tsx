'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const getSystemTheme = () => {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'dark'
    }

    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    // Apply to document
    if (resolved === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.style.setProperty('--bg-primary', '#ffffff')
      document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5')
      document.documentElement.style.setProperty('--bg-card', '#ffffff')
      document.documentElement.style.setProperty('--text-primary', '#000000')
      document.documentElement.style.setProperty('--text-secondary', '#666666')
      document.documentElement.style.setProperty('--border-color', '#e5e5e5')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      document.documentElement.style.setProperty('--bg-primary', '#0a0a0a')
      document.documentElement.style.setProperty('--bg-secondary', '#1a1a1a')
      document.documentElement.style.setProperty('--bg-card', '#1a1a1a')
      document.documentElement.style.setProperty('--text-primary', '#ffffff')
      document.documentElement.style.setProperty('--text-secondary', '#9ca3af')
      document.documentElement.style.setProperty('--border-color', 'rgba(255,255,255,0.1)')
    }

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
