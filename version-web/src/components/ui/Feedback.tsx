import type { ReactNode } from 'react'

import { IconAlert, IconRefresh } from '../icons/Icons'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative block overflow-hidden rounded-[10px] bg-[#e8edeb] ${className}`}>
      <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  )
}

export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function ListSkeleton({ rows = 3, label = 'Chargement…' }: { rows?: number; label?: string }) {
  return (
    <LoadingRegion label={label}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="surface flex items-center gap-4 p-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-[14px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  tone = 'mint',
  compact = false,
}: {
  icon: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
  secondary?: ReactNode
  tone?: 'mint' | 'orange' | 'teal'
  compact?: boolean
}) {
  const tones = {
    mint: 'bg-mint text-primary',
    orange: 'bg-orange-15 text-orange-ink',
    teal: 'bg-teal-15 text-[#1d7a82]',
  }
  return (
    <div
      className={`relative flex flex-col items-center overflow-hidden rounded-[20px] border border-dashed border-[#d5dedb] bg-white/70 text-center ${
        compact ? 'gap-3 px-5 py-7' : 'gap-4 px-6 py-12'
      }`}
    >
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
      <span className={`relative flex items-center justify-center rounded-[18px] ${tones[tone]} ${compact ? 'h-12 w-12' : 'h-14 w-14'}`}>
        {icon}
      </span>
      <div className="relative max-w-sm">
        <p className={`font-title font-semibold text-ink ${compact ? 'text-base' : 'text-lg'}`}>{title}</p>
        <div className="mt-1.5 font-body text-sm leading-relaxed text-muted">{description}</div>
      </div>
      {action || secondary ? (
        <div className="relative mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[18px] border border-red-ink/15 bg-red-soft px-5 py-4 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-ink">
        <IconAlert className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-semibold text-[#7d231c]">Chargement impossible</p>
        <p className="font-body text-sm text-[#7d231c]/85">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="press inline-flex items-center gap-1.5 rounded-[12px] bg-white px-3 py-2 font-body text-sm font-semibold text-red-ink hover:bg-white/80"
        >
          <IconRefresh className="h-4 w-4" />
          Réessayer
        </button>
      ) : null}
    </div>
  )
}
