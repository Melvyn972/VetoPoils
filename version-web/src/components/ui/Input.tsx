import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

import { IconEye, IconEyeOff } from '../icons/Icons'
import { FieldMessage } from './FieldMessage'
import { describedBy, fieldControl, fieldLabel } from './fieldStyles'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export function Input({ label, error, hint, required, id, className = '', leading, trailing, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={fieldLabel}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-ink">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8a9490]">
            {leading}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={fieldControl(Boolean(error), [
            'h-12 px-3.5',
            leading ? 'pl-10' : '',
            trailing ? 'pr-12' : '',
            className,
          ].join(' '))}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      <FieldMessage id={inputId} error={error} hint={hint} />
    </div>
  )
}

export function PasswordInput(props: Omit<InputProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? 'Masquer la saisie' : 'Afficher la saisie'}
          className="press flex h-9 w-9 items-center justify-center rounded-[10px] text-[#7b8682] hover:bg-canvas hover:text-ink"
        >
          {visible ? <IconEyeOff className="h-[18px] w-[18px]" /> : <IconEye className="h-[18px] w-[18px]" />}
        </button>
      }
    />
  )
}
