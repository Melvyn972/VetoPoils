import { useEffect, useState } from 'react'

import { applyTheme, readThemeChoice, watchSystemTheme, type ThemeChoice } from '../../lib/theme'

const options: Array<{ value: ThemeChoice; label: string }> = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

export function ThemeChoiceControl() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice())

  useEffect(() => watchSystemTheme(() => choice), [choice])

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Thème de l’espace">
      {options.map((option) => {
        const selected = choice === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              applyTheme(option.value)
              setChoice(option.value)
            }}
            className={`inline-flex min-h-11 items-center rounded-[14px] px-4 font-body text-sm font-semibold ${
              selected ? 'bg-primary-fill text-white' : 'bg-canvas text-ink ring-1 ring-line'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
