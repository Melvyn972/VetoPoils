export type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'vetopoil-theme'

export function readThemeChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function applyTheme(choice: ThemeChoice) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = choice === 'dark' || (choice === 'system' && systemDark)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem(STORAGE_KEY, choice)
}

export function watchSystemTheme(getChoice: () => ThemeChoice) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getChoice() === 'system') applyTheme('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
