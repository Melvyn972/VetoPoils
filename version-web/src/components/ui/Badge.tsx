const tones = {
  pending: 'bg-warning-15 text-ink',
  success: 'bg-success-15 text-success',
  danger: 'bg-error-15 text-error',
  info: 'bg-primary-15 text-primary',
  neutral: 'bg-canvas text-muted',
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: keyof typeof tones
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 font-body text-xs font-semibold ${tones[tone]}`}>
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
