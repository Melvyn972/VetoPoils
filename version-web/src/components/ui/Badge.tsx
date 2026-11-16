import type { ReactNode } from 'react'

const tones = {
  pending: 'bg-amber-soft text-amber-ink',
  success: 'bg-green-soft text-green-ink',
  danger: 'bg-red-soft text-red-ink',
  info: 'bg-mint text-primary-pressed',
  planned: 'bg-blue-soft text-blue-ink',
  orange: 'bg-orange-15 text-orange-ink',
  neutral: 'bg-canvas text-ink',
}

export type BadgeTone = keyof typeof tones

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 font-body text-xs font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function EventStatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <Badge tone="pending">À valider</Badge>
  if (status === 'rejected') return <Badge tone="danger">Refusé</Badge>
  if (status === 'validated') return <Badge tone="success">Validé</Badge>
  return <Badge>{status}</Badge>
}
