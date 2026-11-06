import { useId } from 'react'

import { IconChevronDown } from '../icons/Icons'
import { FieldMessage } from './FieldMessage'
import { describedBy, fieldControl, fieldLabel } from './fieldStyles'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  required?: boolean
  error?: string
  hint?: string
  id?: string
}

export function SelectField({ label, value, onChange, options, required, error, hint, id }: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={fieldLabel}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-ink">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, error, hint)}
          className={fieldControl(Boolean(error), 'h-12 appearance-none pl-3.5 pr-10')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8682]" />
      </div>
      <FieldMessage id={selectId} error={error} hint={hint} />
    </div>
  )
}
