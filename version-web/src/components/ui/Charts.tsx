import { useId, useRef } from 'react'

import { gsap, MOTION_OK, useGSAP } from '../../lib/motion'
import { scoreColor } from './chartUtils'

export function ScoreRing({
  score,
  size = 132,
  stroke = 10,
  caption = '/100',
  dark = false,
}: {
  score: number | null | undefined
  size?: number
  stroke?: number
  caption?: string
  dark?: boolean
}) {
  const scope = useRef<HTMLDivElement>(null)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const value = Math.max(0, Math.min(100, score ?? 0))

  useGSAP(
    () => {
      if (score == null) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('[data-arc]', { strokeDashoffset: circumference, duration: 1.4, ease: 'power3.out' })
        gsap.from('[data-score]', { textContent: 0, duration: 1.2, ease: 'power2.out', snap: { textContent: 1 } })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [score], revertOnUpdate: true },
  )

  return (
    <div
      ref={scope}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={score == null ? 'Score santé non calculé' : `Score santé ${score} sur 100`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? 'rgb(255 255 255 / 0.14)' : '#e8eeec'}
          strokeWidth={stroke}
        />
        <circle
          data-arc
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? '#7fe0c8' : scoreColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          data-score
          className={`font-title font-semibold leading-none tracking-[-0.03em] tabular ${dark ? 'text-white' : 'text-ink'}`}
          style={{ fontSize: Math.round(size * 0.27) }}
        >
          {score ?? '—'}
        </span>
        <span className={`mt-1 font-body text-[11px] font-medium ${dark ? 'text-white/65' : 'text-muted'}`}>{caption}</span>
      </div>
    </div>
  )
}

export type DonutSegment = { key: string; label: string; value: number; color: string }

export function Donut({
  segments,
  size = 176,
  stroke = 22,
  centerTop,
  centerBottom,
}: {
  segments: DonutSegment[]
  size?: number
  stroke?: number
  centerTop: string
  centerBottom: string
}) {
  const scope = useRef<HTMLDivElement>(null)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const gap = segments.length > 1 ? 3 : 0
  const arcs = segments.reduce<Array<DonutSegment & { length: number; offset: number }>>((list, segment) => {
    const previous = list.at(-1)
    const offset = previous ? previous.offset + previous.length + gap : 0
    const length = total > 0 ? Math.max(0, (segment.value / total) * circumference - gap) : 0
    return [...list, { ...segment, length, offset }]
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('[data-donut]', { rotate: -70, autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%', duration: 1.1, ease: 'power3.out' })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [total], revertOnUpdate: true },
  )

  return (
    <div ref={scope} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden="true">
        <g data-donut>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f0" strokeWidth={stroke} />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={`${arc.length} ${circumference}`}
                strokeDashoffset={-arc.offset}
              />
            ))}
          </g>
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-title text-xl font-semibold tracking-[-0.02em] text-ink tabular">{centerTop}</span>
        <span className="mt-0.5 font-body text-xs text-muted">{centerBottom}</span>
      </div>
    </div>
  )
}

export function MonthlyBars({
  data,
  formatValue,
  height = 168,
}: {
  data: Array<{ key: string; label: string; value: number }>
  formatValue: (value: number) => string
  height?: number
}) {
  const scope = useRef<HTMLDivElement>(null)
  const max = Math.max(1, ...data.map((item) => item.value))
  const lastIndex = data.length - 1

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('[data-bar]', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'power3.out', stagger: 0.06 })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [data.map((item) => item.value).join('|')], revertOnUpdate: true },
  )

  return (
    <div ref={scope}>
      <ul className="flex items-end gap-2 sm:gap-3" style={{ height }} aria-label="Dépenses des six derniers mois">
        {data.map((item, index) => {
          const ratio = item.value / max
          return (
            <li key={item.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-body text-[11px] font-semibold text-ink/80 tabular opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:hidden">
                {item.value > 0 ? formatValue(item.value) : ''}
              </span>
              <span
                data-bar
                className={`block w-full max-w-[44px] rounded-t-[10px] rounded-b-[4px] ${
                  index === lastIndex ? 'bg-primary' : 'bg-[#cfe6df] group-hover:bg-[#a9d3c7]'
                }`}
                style={{ height: `${Math.max(item.value > 0 ? 6 : 2, ratio * 100)}%` }}
                title={`${item.label} : ${formatValue(item.value)}`}
              />
              <span className="font-body text-[11px] font-medium capitalize text-muted">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function WeightChart({ points }: { points: Array<{ date: string; label: string; kg: number }> }) {
  const scope = useRef<HTMLDivElement>(null)
  const gradientId = useId()
  const width = 320
  const height = 120
  const pad = 10
  const values = points.map((point) => point.kg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index / (points.length - 1)) * (width - pad * 2)
    const y = height - pad - ((point.kg - min) / range) * (height - pad * 2 - 14)
    return { x, y, ...point }
  })
  const line = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ')
  const area = coords.length > 1 ? `${line} L${coords.at(-1)!.x},${height} L${coords[0].x},${height} Z` : ''

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('[data-line]', { strokeDashoffset: 1, duration: 1.3, ease: 'power2.inOut' })
        gsap.from('[data-area]', { autoAlpha: 0, duration: 0.8, delay: 0.5 })
        gsap.from('[data-point]', { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.08, delay: 0.4, ease: 'back.out(2)' })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [values.join('|')], revertOnUpdate: true },
  )

  return (
    <div ref={scope} className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full overflow-visible" role="img" aria-label={`Courbe de poids, dernier relevé ${values.at(-1)} kg`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#57c9d2" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#57c9d2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {area ? <path data-area d={area} fill={`url(#${gradientId})`} /> : null}
        {coords.length > 1 ? (
          <path data-line d={line} fill="none" stroke="#2c6e63" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} />
        ) : null}
        {coords.map((coord) => (
          <g key={`${coord.date}-${coord.kg}`} data-point>
            <circle cx={coord.x} cy={coord.y} r={5} fill="#fff" stroke="#2c6e63" strokeWidth={2.5} />
          </g>
        ))}
      </svg>
    </div>
  )
}
