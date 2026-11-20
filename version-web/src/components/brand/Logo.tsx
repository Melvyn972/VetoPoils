import logoFull from '../../assets/logo-full.svg'
import logoMark from '../../assets/logo-mark.svg'

export function Logo({
  variant = 'full',
  className = 'h-10 w-auto',
  decorative = false,
}: {
  variant?: 'full' | 'mark'
  className?: string
  /** true si le parent fournit déjà le nom accessible (ex. lien avec aria-label) */
  decorative?: boolean
}) {
  return (
    <img
      src={variant === 'full' ? logoFull : logoMark}
      alt={decorative ? '' : "Vet'OPoil"}
      className={className}
      aria-hidden={decorative || undefined}
    />
  )
}
