import { useEffect, useRef, useState, type ReactNode } from 'react'

import { IconLock } from '../../../components/icons/Icons'

export function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${light ? 'text-[#9fe7d6]' : 'text-primary'}`}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
      {children}
    </p>
  )
}

export function SectionIntro({
  kicker,
  title,
  children,
  light = false,
  className = '',
}: {
  kicker: string
  title: ReactNode
  children?: ReactNode
  light?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <Kicker light={light}>{kicker}</Kicker>
      <h2
        data-split
        className={`mt-5 font-title text-[clamp(36px,4.8vw,68px)] font-semibold leading-[1.02] tracking-[-0.038em] ${
          light ? 'text-white' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      {children ? (
        <div
          data-reveal
          className={`mt-6 max-w-[580px] font-body text-[17px] leading-relaxed md:text-[18px] ${
            light ? 'text-white/75' : 'text-[#4d5652]'
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[46px] bg-[#111816] p-[8px] shadow-[0_70px_120px_-50px_rgb(13_38_34/0.6),0_24px_48px_-26px_rgb(0_0_0/0.4)] ring-1 ring-black/10 ${className}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-canvas">
        <span aria-hidden="true" className="absolute left-1/2 top-[9px] z-30 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#111816]" />
        <div className="flex h-10 shrink-0 items-end justify-between px-6 pb-0.5 font-body text-[11px] font-semibold text-ink">
          <span>9:41</span>
          <span aria-hidden="true" className="flex items-center gap-1">
            <span className="flex items-end gap-[2px]">
              <span className="h-1.5 w-[3px] rounded-[1px] bg-ink" />
              <span className="h-2 w-[3px] rounded-[1px] bg-ink" />
              <span className="h-2.5 w-[3px] rounded-[1px] bg-ink" />
            </span>
            <span className="relative ml-1 h-[10px] w-[20px] rounded-[3px] border border-ink/70 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
            </span>
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

export function BrowserFrame({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_50px_100px_-45px_rgb(13_38_34/0.5),0_14px_30px_-18px_rgb(0_0_0/0.2)] ${className}`}
    >
      <div className="flex h-9 items-center gap-3 border-b border-line-soft bg-[#f4f6f5] px-3.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f1a094]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5cf7f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#9fd49b]" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-body text-[10.5px] font-medium text-muted shadow-[0_1px_0_rgb(16_24_40/0.04)]">
          <IconLock className="h-3 w-3" />
          {label}
        </span>
        <span className="w-[42px]" />
      </div>
      {children}
    </div>
  )
}

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function LiveCountdown({ seconds = 4 * 3600, className = '' }: { seconds?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      const left = Math.max(0, seconds - Math.floor((performance.now() - startedAt) / 1000))
      const node = ref.current?.firstChild
      if (node) node.nodeValue = formatClock(left)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {formatClock(seconds)}
    </span>
  )
}

export function DemoQr({ className = '' }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(`${window.location.origin}/acces`, {
          margin: 0,
          width: 280,
          color: { dark: '#14211e', light: '#ffffff' },
        }),
      )
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  if (!src) return <span aria-hidden="true" className={`block rounded-[6px] bg-[#eef1f0] ${className}`} />
  return <img src={src} alt="" className={`block ${className}`} />
}

export function WhenVisible({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {visible ? children : null}
    </div>
  )
}

export function AppChip({ children, tone = 'mint' }: { children: ReactNode; tone?: 'mint' | 'orange' | 'teal' | 'ink' }) {
  const tones = {
    mint: 'bg-mint text-primary-pressed',
    orange: 'bg-orange-15 text-orange-ink',
    teal: 'bg-teal-15 text-[#1d6f76]',
    ink: 'bg-[#eef1f0] text-[#4b5552]',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-body text-[10.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
