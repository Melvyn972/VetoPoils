import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '../../../components/brand/Logo'
import {
  IconArrowRight,
  IconBell,
  IconHome,
  IconMenu,
  IconPaw,
  IconQr,
  IconScan,
  IconUser,
  IconX,
} from '../../../components/icons/Icons'
import { EventStatusBadge } from '../../../components/ui/Badge'
import { ButtonLink } from '../../../components/ui/Button'
import { ScoreRing } from '../../../components/ui/Charts'
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../../../lib/motion'
import { AppChip, BrowserFrame, DemoQr, LiveCountdown, PhoneFrame } from './Kit'
import { FINE_POINTER, SplitText } from './landingMotion'

const SECTIONS = [
  { href: '#concept', label: 'Le concept' },
  { href: '#fonctionnement', label: 'Fonctionnement' },
  { href: '#smart-scan', label: 'Smart Scan' },
  { href: '#veterinaires', label: 'Vétérinaires' },
  { href: '#confiance', label: 'Confiance' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingHeader() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useGSAP(
    () => {
      const header = ref.current
      if (!header) return
      ScrollTrigger.create({ start: 'top -24', end: 'max', toggleClass: { targets: header, className: 'is-scrolled' } })
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(header, { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: 'expo.out', delay: 0.15 })
        let hidden = false
        ScrollTrigger.create({
          start: 'top -220',
          end: 'max',
          onUpdate: (self) => {
            const shouldHide = self.direction === 1 && !openRef.current
            if (shouldHide === hidden) return
            hidden = shouldHide
            gsap.to(header, { yPercent: shouldHide ? -110 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
          },
          onLeaveBack: () => {
            hidden = false
            gsap.to(header, { yPercent: 0, duration: 0.4, overwrite: 'auto' })
          },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  useGSAP(
    () => {
      if (!open) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(gsap.utils.toArray('[data-menu-item]', ref.current), {
          y: 26,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.045,
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [open] },
  )

  const close = () => setOpen(false)

  return (
    <header
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 [&.is-scrolled]:bg-white/95 [&.is-scrolled]:shadow-[0_1px_0_rgb(16_24_40/0.06),0_12px_32px_-24px_rgb(16_24_40/0.3)]"
    >
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center gap-3 px-5 sm:px-8">
        <Link to="/" aria-label="Vet'OPoil, accueil" className="shrink-0 rounded-[12px]" onClick={close}>
          <Logo className="h-12 w-auto" />
        </Link>
        <nav aria-label="Sections de la page" className="ml-6 hidden items-center xl:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="group relative rounded-full px-3.5 py-2 font-body text-[14px] font-medium text-[#3c4542] transition-colors hover:text-ink"
            >
              {section.label}
              <span className="absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/acces"
            className="hidden rounded-full px-3.5 py-2 font-body text-[14px] font-medium text-[#3c4542] transition-colors hover:text-ink md:inline-flex"
          >
            Accès vétérinaire
          </Link>
          <Link
            to="/connexion"
            className="hidden rounded-full px-3.5 py-2 font-body text-[14px] font-medium text-[#3c4542] transition-colors hover:text-ink sm:inline-flex"
          >
            Se connecter
          </Link>
          <ButtonLink to="/inscription" size="sm" className="h-10 px-4" data-magnetic>
            Créer un compte
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="menu-landing"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink xl:hidden"
          >
            {open ? <IconX className="h-[18px] w-[18px]" /> : <IconMenu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="menu-landing" className="fixed inset-x-0 bottom-0 top-[76px] overflow-y-auto bg-white px-5 pb-12 pt-4 sm:px-8 xl:hidden">
          <nav aria-label="Sections de la page" className="flex flex-col">
            {SECTIONS.map((section, index) => (
              <a
                key={section.href}
                data-menu-item
                href={section.href}
                onClick={close}
                className="flex items-baseline gap-4 border-b border-line-soft py-4 font-title text-[30px] font-semibold tracking-[-0.03em] text-ink"
              >
                <span className="font-body text-xs font-semibold text-primary tabular">0{index + 1}</span>
                {section.label}
              </a>
            ))}
          </nav>
          <div data-menu-item className="mt-8 grid gap-3 sm:grid-cols-2">
            <ButtonLink to="/inscription/proprietaire" size="lg" fullWidth onClick={close}>
              Créer le carnet de mon animal
            </ButtonLink>
            <ButtonLink to="/inscription/veterinaire" size="lg" variant="ghost" fullWidth onClick={close}>
              Ouvrir un espace clinique
            </ButtonLink>
          </div>
          <div data-menu-item className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-body text-[15px] font-medium text-[#3c4542]">
            <Link to="/connexion" onClick={close}>
              Se connecter
            </Link>
            <Link to="/acces" onClick={close}>
              J’ai un code d’accès vétérinaire
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function OwnerPhoneScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-1.5">
        <span className="font-body text-[12px] font-semibold text-primary">‹ Mes animaux</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint font-body text-[10px] font-semibold text-primary-pressed">
          CD
        </span>
      </div>
      <div className="mx-3 mt-3 rounded-[20px] bg-white p-3.5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-mint font-title text-lg font-semibold text-primary-pressed">
            M
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-title text-[17px] font-semibold leading-tight text-ink">Milo</p>
            <p className="font-body text-[11px] text-muted">Chien · Border collie · 4 ans</p>
          </div>
          <ScoreRing score={86} size={50} stroke={5} caption="" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AppChip>12,4 kg</AppChip>
          <AppChip tone="teal">Puce renseignée</AppChip>
          <AppChip tone="orange">1 rappel</AppChip>
        </div>
      </div>
      <div className="mt-3 flex gap-4 border-b border-line-soft px-4 font-body text-[11.5px] font-medium text-muted">
        <span className="border-b-2 border-primary pb-2 font-semibold text-primary-pressed">Historique</span>
        <span>Documents</span>
        <span>Code</span>
        <span>Budget</span>
      </div>
      <ul className="flex flex-col gap-2 px-3 pt-3">
        <li className="rounded-[15px] bg-white p-3 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-body text-[12.5px] font-semibold text-ink">Compte rendu · otite</p>
              <p className="font-body text-[10.5px] text-muted">Dr Martin · aujourd’hui</p>
            </div>
            <EventStatusBadge status="pending" />
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-[9px] bg-primary px-2.5 py-1.5 font-body text-[10.5px] font-semibold text-white">Valider</span>
            <span className="rounded-[9px] bg-red-soft px-2.5 py-1.5 font-body text-[10.5px] font-semibold text-red-ink">Refuser</span>
          </div>
        </li>
        <li className="flex items-center justify-between gap-2 rounded-[15px] bg-white p-3 shadow-card">
          <div>
            <p className="font-body text-[12.5px] font-semibold text-ink">Consultation de contrôle</p>
            <p className="font-body text-[10.5px] text-muted">12 mars · 12,4 kg</p>
          </div>
          <EventStatusBadge status="validated" />
        </li>
        <li className="flex items-center justify-between gap-2 rounded-[15px] bg-white p-3 shadow-card">
          <div>
            <p className="font-body text-[12.5px] font-semibold text-ink">Vaccin CHPPiL + rage</p>
            <p className="font-body text-[10.5px] text-muted">02 févr.</p>
          </div>
          <EventStatusBadge status="validated" />
        </li>
      </ul>
      <div className="absolute inset-x-0 bottom-0 flex h-[62px] items-center justify-around border-t border-line-soft bg-white px-3 pb-2 text-[#7b8480]">
        <IconHome className="h-5 w-5 text-primary" />
        <IconPaw className="h-5 w-5" />
        <span className="-mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_20px_-8px_rgb(44_110_99/0.9)] ring-4 ring-white">
          <IconQr className="h-5 w-5" />
        </span>
        <IconBell className="h-5 w-5" />
        <IconUser className="h-5 w-5" />
      </div>
    </div>
  )
}

export function Hero() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, (context) => {
        let alive = true
        const title = q('[data-hero-title]')
        const fades = q('[data-hero-fade]')
        const device = q('[data-hero-device]')
        const cards = q('[data-hero-card]')
        const ecg = q('[data-hero-ecg]')
        gsap.set(title, { autoAlpha: 0 })
        gsap.set(fades, { autoAlpha: 0, y: 28 })
        gsap.set(device, { autoAlpha: 0, y: 150, rotation: 6 })
        gsap.set(cards, { autoAlpha: 0, scale: 0.55, y: 34 })
        gsap.set(ecg, { drawSVG: 0 })

        const fontsReady = Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise((resolve) => window.setTimeout(resolve, 900)),
        ])
        void fontsReady.then(() => {
          if (!alive) return
          context.add(() => {
            const split = SplitText.create(title, { type: 'lines', mask: 'lines' })
            gsap.set(split.lines, { yPercent: 120 })
            gsap
              .timeline({ defaults: { ease: 'expo.out' } })
              .set(title, { autoAlpha: 1 })
              .to(split.lines, { yPercent: 0, duration: 1.35, stagger: 0.12 }, 0)
              .to(device, { autoAlpha: 1, y: 0, rotation: 0, duration: 1.7 }, 0.2)
              .to(fades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.45)
              .to(ecg, { drawSVG: '100%', duration: 1.9, ease: 'power2.inOut' }, 0.75)
              .to(cards, { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.14 }, 1)
              .call(() => split.revert())
            q('[data-float]').forEach((element, index) => {
              gsap.to(element, {
                y: index % 2 ? 10 : -10,
                duration: 2.8 + index * 0.35,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                delay: 2.2,
              })
            })
            gsap.fromTo(
              q('[data-scan-progress]'),
              { scaleX: 0 },
              { scaleX: 1, duration: 2.2, ease: 'power1.inOut', repeat: -1, repeatDelay: 1.4, delay: 1.8 },
            )
          })
        })

        gsap.to(q('[data-hero-visual]'), {
          yPercent: -9,
          ease: 'none',
          scrollTrigger: { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: true },
        })

        return () => {
          alive = false
        }
      })

      mm.add(FINE_POINTER, () => {
        const root = scope.current
        if (!root) return
        const layers = (q('[data-depth]') as HTMLElement[]).map((element) => ({
          depth: Number(element.dataset.depth) || 0.5,
          x: gsap.quickTo(element, 'x', { duration: 1.1, ease: 'power3' }),
          y: gsap.quickTo(element, 'y', { duration: 1.1, ease: 'power3' }),
        }))
        const onMove = (event: PointerEvent) => {
          const nx = event.clientX / window.innerWidth - 0.5
          const ny = event.clientY / window.innerHeight - 0.5
          layers.forEach((layer) => {
            layer.x(nx * layer.depth * 44)
            layer.y(ny * layer.depth * 32)
          })
        }
        root.addEventListener('pointermove', onMove)
        return () => root.removeEventListener('pointermove', onMove)
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className="relative overflow-hidden bg-canvas pb-20 pt-[112px] md:pb-28 lg:min-h-[100svh] lg:pt-[116px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[12%] -top-[18%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgb(87_201_210/0.22),transparent_65%)]" />
        <div className="absolute -left-[10%] bottom-[-30%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgb(251_168_75/0.14),transparent_65%)]" />
        <div className="dot-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 sm:px-8 grid-cols-1 lg:grid-cols-12 lg:gap-8">
        <div className="relative z-10 lg:col-span-7">
          <p
            data-hero-fade
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-1.5 font-body text-[13px] font-medium text-primary-pressed shadow-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-logo-orange" />
            Carnet de santé numérique · chiens, chats et NAC
          </p>
          <h1
            data-hero-title
            className="mt-6 font-title text-[clamp(46px,6.2vw,98px)] font-semibold leading-[0.96] tracking-[-0.047em] text-ink"
          >
            Le carnet de santé de votre animal, <span className="text-primary">enfin vivant.</span>
          </h1>
          <div data-hero-fade aria-hidden="true" className="relative mt-7 w-full max-w-[520px]">
            <svg viewBox="0 0 520 28" className="h-auto w-full overflow-visible" fill="none">
              <defs>
                <linearGradient id="hero-ecg-gradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#2c6e63" />
                  <stop offset="0.6" stopColor="#57c9d2" />
                  <stop offset="1" stopColor="#fba84b" />
                </linearGradient>
              </defs>
              <path
                data-hero-ecg
                d="M0 14 H196 L206 14 L214 4 L224 25 L236 1 L246 21 L254 14 H352 L360 14 L366 9 L372 19 L378 14 H508"
                stroke="url(#hero-ecg-gradient)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-logo-orange">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-logo-orange" />
            </span>
          </div>
          <p data-hero-fade className="mt-7 max-w-[570px] font-body text-[18px] leading-relaxed text-[#4a5350] md:text-[19px]">
            Vaccins, ordonnances, analyses, rappels et dépenses réunis dans un dossier qui s’enrichit à chaque
            consultation. Le jour du rendez-vous, un QR code l’ouvre à votre vétérinaire pendant 4 heures.
          </p>
          <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink
              to="/inscription/proprietaire"
              size="lg"
              data-magnetic
              trailingIcon={<IconArrowRight className="h-[18px] w-[18px]" />}
            >
              Je suis propriétaire
            </ButtonLink>
            <ButtonLink to="/inscription/veterinaire" size="lg" variant="ghost" data-magnetic>
              Je suis vétérinaire
            </ButtonLink>
          </div>
          <p data-hero-fade className="mt-5 font-body text-[14px] text-muted">
            Vous avez reçu un code ?{' '}
            <Link to="/acces" className="font-semibold text-primary underline-offset-4 hover:underline">
              Ouvrir le dossier d’un patient
            </Link>
          </p>
          <dl data-hero-fade className="mt-12 grid max-w-[580px] grid-cols-3 gap-4 border-t border-line pt-6 sm:gap-8">
            {[
              { value: 4, suffix: ' h', label: 'd’accès pour le vétérinaire' },
              { value: 11, suffix: '', label: 'rubriques dans chaque fiche' },
              { value: 100, suffix: '', label: 'points de Health Score' },
            ].map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse gap-1">
                <dt className="font-body text-[13px] leading-snug text-muted">{fact.label}</dt>
                <dd className="font-title text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">
                  <span data-count>{fact.value}</span>
                  {fact.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-5">
          <div data-hero-visual aria-hidden="true" className="relative mx-auto h-[600px] w-full max-w-[520px] sm:h-[640px]">
            <div data-depth="0.35" className="absolute -right-14 top-0 hidden w-[300px] xl:block">
              <div data-hero-card>
                <div data-float>
                  <BrowserFrame label="Portail vétérinaire" className="rotate-[3deg]">
                    <div className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-mint font-title text-sm font-semibold text-primary-pressed">
                          M
                        </span>
                        <div>
                          <p className="font-body text-[12.5px] font-semibold text-ink">Milo</p>
                          <p className="font-body text-[10.5px] text-muted">Accès par code</p>
                        </div>
                        <span className="ml-auto rounded-full bg-mint-soft px-2 py-1 font-body text-[10px] font-semibold text-primary-pressed">
                          Dossier ouvert
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        {['Consultation · 12 mars', 'Vaccin · 02 févr.', 'Bilan sanguin · 18 janv.'].map((row) => (
                          <div key={row} className="flex items-center gap-2 rounded-[10px] bg-canvas px-2.5 py-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="font-body text-[11px] text-[#3f4744]">{row}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </BrowserFrame>
                </div>
              </div>
            </div>

            <div data-depth="0.7" className="absolute left-1/2 top-0 -translate-x-1/2 sm:left-[4%] sm:translate-x-0">
              <div data-hero-device>
                <PhoneFrame className="h-[560px] w-[272px]">
                  <OwnerPhoneScreen />
                </PhoneFrame>
              </div>
            </div>

            <div data-depth="1.15" className="absolute left-0 top-[350px] sm:-left-8">
              <div data-hero-card>
                <div data-float className="w-[206px] rounded-[20px] border border-line-soft bg-white p-3.5 shadow-pop">
                  <div className="flex items-center gap-3">
                    <DemoQr className="h-14 w-14 rounded-[6px]" />
                    <div>
                      <p className="eyebrow text-muted">Code véto</p>
                      <p className="mt-1 font-mono text-[19px] font-semibold tracking-[0.16em] text-ink">K7P2QX</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-[12px] bg-mint-soft px-2.5 py-1.5 font-body text-[11px] font-semibold text-primary-pressed">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
                        <span className="relative h-2 w-2 rounded-full bg-primary" />
                      </span>
                      Accès actif
                    </span>
                    <LiveCountdown seconds={14_381} />
                  </div>
                </div>
              </div>
            </div>

            <div data-depth="0.95" className="absolute right-0 top-[318px] sm:right-2">
              <div data-hero-card>
                <div data-float className="w-[214px] rounded-[18px] border border-line-soft bg-white p-3 shadow-pop">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-orange-15 text-orange-ink">
                      <IconBell className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="font-body text-[12.5px] font-semibold text-ink">Vermifuge de Luna</p>
                      <p className="font-body text-[11px] text-muted">Rappel dans 5 jours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-depth="1.35" className="absolute bottom-2 left-[22%] sm:left-[30%]">
              <div data-hero-card>
                <div data-float className="w-[236px] rounded-[18px] bg-forest p-3.5 text-white shadow-pop">
                  <div className="flex items-center gap-2">
                    <IconScan className="h-4 w-4 text-teal" />
                    <p className="font-body text-[12px] font-semibold">Smart Scan</p>
                    <span className="ml-auto font-body text-[10.5px] text-white/60">Ordonnance</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/12">
                    <span data-scan-progress className="block h-full w-full origin-left rounded-full bg-gradient-to-r from-teal to-[#a8eadf]" />
                  </div>
                  <p className="mt-2 font-body text-[11px] text-white/70">Titre, traitement et date proposés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const WORDS = [
  'Ordonnances',
  'Vaccins',
  'Analyses sanguines',
  'Factures',
  'Courbe de poids',
  'Rappels',
  'Comptes rendus',
  'Journal du pet-sitter',
  'Budget',
  'Dossier PDF',
]

export function Marquee() {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const track = scope.current?.querySelector('[data-marquee-track]')
        if (!track) return
        const loop = gsap.to(track, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 })
        ScrollTrigger.create({
          trigger: scope.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 240)
            gsap.to(loop, {
              timeScale: boost,
              duration: 0.25,
              overwrite: true,
              onComplete: () => {
                gsap.to(loop, { timeScale: 1, duration: 1.4, ease: 'power2.out' })
              },
            })
          },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} aria-hidden="true" className="relative overflow-hidden border-y border-line-soft bg-white py-7 md:py-9">
      <div data-marquee-track className="flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {WORDS.map((word, index) => (
              <span
                key={word}
                className="flex items-center gap-8 pr-8 font-title text-[clamp(30px,4.2vw,60px)] font-semibold tracking-[-0.035em] text-ink"
              >
                {index % 2 ? <span className="text-transparent [-webkit-text-stroke:1.2px_#1a1a1a]">{word}</span> : word}
                <span className={`h-3 w-3 shrink-0 rounded-full ${index % 2 ? 'bg-teal' : 'bg-logo-orange'}`} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
