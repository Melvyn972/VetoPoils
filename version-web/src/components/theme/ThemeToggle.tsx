import { useEffect, useState } from 'react'

import { applyTheme, resolveTheme } from '../../lib/theme'
import { IconMoon, IconSun } from '../icons/Icons'

/** Bouton icône pour basculer clair / sombre. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => resolveTheme())

  // Resynchroniser l’icône si le thème système change
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function sync() {
      setMode(resolveTheme())
    }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setMode(next)
  }

  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-pressed={isDark}
      className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${className}`}
    >
      {isDark ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
    </button>
  )
}
