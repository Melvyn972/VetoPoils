import logoFull from '../../assets/logo-full.svg'
import logoMark from '../../assets/logo-mark.svg'

export function Logo({
  variant = 'full',
  className = 'h-10 w-auto',
}: {
  variant?: 'full' | 'mark'
  className?: string
}) {
  return (
    <img
      src={variant === 'full' ? logoFull : logoMark}
      alt="Vet'OPoil"
      className={className}
    />
  )
}
