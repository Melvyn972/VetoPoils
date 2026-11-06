import type { ReactNode } from 'react'

const tones = {
  pending: 'bg-amber-soft text-amber-ink',
  success: 'bg-green-soft text-green-ink',
  danger: 'bg-red-soft text-red-ink',
  info: 'bg-mint text-primary-pressed',
  planned: 'bg-blue-soft text-blue-ink',
  orange: 'bg-orange-15 text-orange-ink',
  neutral: 'bg-[#eef1f0] text-[#4b5552]',
}

export type BadgeTone = keyof typeof tones

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-xs font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {dot ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function EventStatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <Badge tone="pending" dot>À valider</Badge>
  if (status === 'rejected') return <Badge tone="danger" dot>Refusé</Badge>
  if (status === 'validated') return <Badge tone="success" dot>Validé</Badge>
  return <Badge>{status}</Badge>
}
