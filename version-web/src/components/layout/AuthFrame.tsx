import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { gsap, MOTION_OK, useGSAP } from '../../lib/motion'
import { Logo } from '../brand/Logo'
import { IconClock, IconQr, IconShield } from '../icons/Icons'

const POINTS = [
  { Icon: IconShield, title: 'Rien n’entre sans vous', text: 'Chaque ajout du vétérinaire attend votre validation.' },
  { Icon: IconQr, title: 'Un accès de 4 heures', text: 'Le code ouvre le dossier, puis se ferme tout seul.' },
  { Icon: IconClock, title: 'Le suivi entre deux visites', text: 'Rappels, poids, dépenses et journal au même endroit.' },
]

export function AuthFrame({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(scope)
        gsap.from(q('[data-auth-card]'), { autoAlpha: 0, y: 24, duration: 0.7, ease: 'power3.out' })
        gsap.from(q('[data-auth-point]'), { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.08, delay: 0.2, ease: 'power3.out' })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className="relative min-h-dvh bg-canvas">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(87_201_210/0.2),transparent_65%)]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgb(251_168_75/0.14),transparent_65%)]" />
      </div>
      <div className="relative mx-auto grid min-h-dvh max-w-[1200px] items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <div>
          <Link to="/" className="inline-flex rounded-[12px]" aria-label="Vet'OPoil, retour à l’accueil">
            <Logo className="h-14 w-auto" />
          </Link>
          <div data-auth-card className="mt-8 rounded-[28px] bg-white p-6 shadow-pop ring-1 ring-line-soft sm:p-8">
            {children}
          </div>
        </div>
        <aside className="hidden lg:block">
          <p className="eyebrow text-primary">Carnet de santé numérique</p>
          <p className="mt-4 font-title text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
            Le dossier de votre animal, ouvert au bon moment.
          </p>
          <ul className="mt-10 flex flex-col gap-5">
            {POINTS.map((point) => (
              <li key={point.title} data-auth-point className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-primary shadow-card ring-1 ring-line-soft">
                  <point.Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-body text-[15px] font-semibold text-ink">{point.title}</p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-muted">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
