import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'w-full rounded-14 px-4 py-3 font-body text-sm font-semibold text-white transition-colors',
        'bg-primary hover:bg-primary-hover active:bg-primary-pressed',
        'disabled:cursor-not-allowed disabled:bg-primary-disabled',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
