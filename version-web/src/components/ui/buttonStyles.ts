export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'light' | 'outline-light'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'press inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-body font-semibold tracking-[-0.006em] disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_10px_22px_-12px_rgb(44_110_99/0.9)] hover:bg-primary-pressed disabled:bg-primary-disabled disabled:shadow-none',
  secondary: 'bg-mint text-primary-pressed hover:bg-[#cde5de] disabled:opacity-60',
  ghost: 'border border-line bg-white text-ink hover:border-[#cdd7d3] hover:bg-mint-soft disabled:opacity-60',
  danger: 'bg-red-soft text-red-ink hover:bg-[#fad6d0] disabled:opacity-60',
  dark: 'bg-ink text-white hover:bg-black disabled:opacity-60',
  light: 'bg-white text-forest shadow-[0_10px_24px_-14px_rgb(0_0_0/0.5)] hover:bg-mint-soft disabled:opacity-60',
  'outline-light': 'border border-white/35 text-white hover:border-white/70 hover:bg-white/10 disabled:opacity-60',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-[15px]',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} = {}) {
  return [base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ')
}
