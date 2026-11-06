import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed disabled:bg-primary-disabled',
  secondary: 'bg-primary-15 text-primary hover:bg-primary/15',
  ghost: 'border border-line bg-white text-ink hover:bg-canvas',
  danger: 'bg-error-15 text-error hover:bg-error/15',
}

export function Button({
  children,
  className = '',
  disabled,
  type = 'button',
  variant = 'primary',
  fullWidth = true,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        fullWidth ? 'w-full' : '',
        'rounded-2xl px-4 py-3 font-body text-sm font-semibold transition-colors',
        'disabled:cursor-not-allowed',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
