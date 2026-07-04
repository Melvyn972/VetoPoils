import type { ReactNode } from 'react'

interface FormAlertProps {
  children: ReactNode
  variant?: 'error' | 'info'
}

export function FormAlert({ children, variant = 'error' }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={[
        'rounded-12 border px-4 py-3 font-body text-sm leading-relaxed',
        variant === 'error'
          ? 'border-error/30 bg-error-15 text-fg-primary'
          : 'border-primary/20 bg-primary-15 text-fg-primary',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
