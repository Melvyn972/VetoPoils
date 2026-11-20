export type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'vetopoil-theme'

export function readThemeChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function resolveTheme(choice: ThemeChoice = readThemeChoice()): 'light' | 'dark' {
  if (choice === 'light' || choice === 'dark') return choice
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(choice: ThemeChoice) {
  document.documentElement.dataset.theme = resolveTheme(choice)
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
