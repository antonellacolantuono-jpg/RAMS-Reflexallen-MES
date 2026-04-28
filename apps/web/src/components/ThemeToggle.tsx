'use client'
import { useTheme } from 'next-themes'
import { Button } from '@mes/ui'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀ Light' : '⬤ Dark'}
    </Button>
  )
}
