import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

export function Input({ label, error, required, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-body text-sm text-fg-secondary">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <input
        id={inputId}
        className={[
          'w-full rounded-12 border border-fg-tertiary/30 bg-surface px-3 py-2.5 font-body text-sm text-fg-primary',
          'placeholder:text-fg-gray focus:border-primary focus:outline-none',
          error ? 'border-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="font-body text-sm text-error">{error}</p>}
    </div>
  )
}
