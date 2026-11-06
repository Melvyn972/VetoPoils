import { useRef } from 'react'

import {
  IconBell,
  IconFile,
  IconPill,
  IconScale,
  IconScan,
  IconSyringe,
  IconWallet,
} from '../../../components/icons/Icons'
import { Badge, type BadgeTone } from '../../../components/ui/Badge'
import { ScoreRing } from '../../../components/ui/Charts'
import { gsap, MOTION_OK, useGSAP } from '../../../lib/motion'
import { AppChip, DemoQr, Kicker, SectionIntro } from './Kit'
import { DESKTOP_PIN } from './landingMotion'

type PaperKind = 'sticker' | 'paper' | 'receipt' | 'postit' | 'note'

const STORY: Array<{
  paper: { kind: PaperKind; title: string; lines: string[] }
  Icon: typeof IconBell
  title: string
  meta: string
  badge: { tone: BadgeTone; label: string }
  scatter: { x: number; y: number; r: number }
}> = [
  {
    paper: { kind: 'sticker', title: 'Vignette vaccin', lines: ['CHPPiL · lot 4B21', 'À refaire dans un an'] },
    Icon: IconSyringe,
    title: 'Vaccin CHPPiL + rage',
    meta: 'Vaccination · 02 févr.',
    badge: { tone: 'success', label: 'Validé' },
    scatter: { x: -250, y: 30, r: -11 },
  },
  {
    paper: { kind: 'paper', title: 'Ordonnance', lines: ['Otite externe droite', 'Gouttes auriculaires, 7 jours'] },
    Icon: IconPill,
    title: 'Ordonnance · otite',
    meta: 'Traitement sur 7 jours',
    badge: { tone: 'success', label: 'Validé' },
    scatter: { x: 235, y: -40, r: 8 },
  },
  {
    paper: { kind: 'receipt', title: 'Facture', lines: ['Clinique du Parc', 'Total 102,50 €'] },
    Icon: IconWallet,
    title: 'Consultation et vaccins',
    meta: '102,50 € ajoutés au budget',
    badge: { tone: 'info', label: 'Budget' },
    scatter: { x: -200, y: 74, r: 6 },
  },
  {
    paper: { kind: 'postit', title: 'Vermifuge ??', lines: ['avant les vacances'] },
    Icon: IconBell,
    title: 'Rappel vermifuge',
    meta: 'Dans 12 jours',
    badge: { tone: 'planned', label: 'Planifié' },
    scatter: { x: 255, y: 18, r: -8 },
  },
  {
    paper: { kind: 'paper', title: 'Bilan sanguin', lines: ['PDF reçu par e-mail', 'Résultats dans les normes'] },
    Icon: IconFile,
    title: 'Bilan sanguin annuel',
    meta: 'Analyse · document joint',
    badge: { tone: 'neutral', label: 'Document' },
    scatter: { x: -235, y: -64, r: 9 },
  },
  {
    paper: { kind: 'note', title: '12,4 kg', lines: ['pesé à la pharmacie'] },
    Icon: IconScale,
    title: 'Pesée · 12,4 kg',
    meta: 'Courbe de poids stable',
    badge: { tone: 'success', label: 'Stable' },
    scatter: { x: 205, y: -132, r: -5 },
  },
]

function PaperFace({ kind, title, lines }: { kind: PaperKind; title: string; lines: string[] }) {
  const shadow = 'shadow-[0_18px_30px_-16px_rgb(0_0_0/0.4)]'
  if (kind === 'postit') {
    return (
      <div className={`w-[150px] rounded-[3px] bg-[#ffe39a] px-3.5 pb-5 pt-3.5 ${shadow}`}>
        <p className="font-title text-[19px] font-semibold tracking-[-0.02em] text-[#5b4300]">{title}</p>
        {lines.map((line) => (
          <p key={line} className="font-body text-[12px] text-[#7a5d10]">
            {line}
          </p>
        ))}
      </div>
    )
  }
  if (kind === 'sticker') {
    return (
      <div className={`w-[196px] rounded-[6px] border border-[#e6e2d8] bg-white p-3 ${shadow}`}>
        <p className="eyebrow text-[#8b8b8b]">{title}</p>
        <div className="mt-2 h-7 bg-[repeating-linear-gradient(90deg,#1a1a1a_0_2px,transparent_2px_4px,#1a1a1a_4px_5px,transparent_5px_8px)]" />
        {lines.map((line) => (
          <p key={line} className="mt-1 font-mono text-[10.5px] text-[#555]">
            {line}
          </p>
        ))}
      </div>
    )
  }
  if (kind === 'receipt') {
    return (
      <div className={`w-[176px] bg-white px-3.5 py-3 font-mono text-[10.5px] text-[#3a3a3a] ${shadow}`}>
        <p className="text-center font-semibold uppercase tracking-[0.2em]">{title}</p>
        <p className="mt-2 border-y border-dashed border-[#c9c9c9] py-1.5">{lines[0]}</p>
        <p className="mt-1.5 text-right font-semibold">{lines[1]}</p>
      </div>
    )
  }
  if (kind === 'note') {
    return (
      <div
        className={`w-[160px] bg-[#f4f9fd] bg-[repeating-linear-gradient(transparent_0_19px,#d5e5f1_19px_20px)] px-3.5 pb-3 pt-2.5 ${shadow}`}
      >
        <p className="font-title text-[22px] font-semibold tracking-[-0.03em] text-[#1f3a52]">{title}</p>
        {lines.map((line) => (
          <p key={line} className="font-body text-[12px] italic text-[#4b6378]">
            {line}
          </p>
        ))}
      </div>
    )
  }
  return (
    <div className={`w-[210px] bg-[#fffdf7] px-4 pb-4 pt-3 ${shadow}`}>
      <p className="font-body text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#9a968c]">Dr Martin · vétérinaire</p>
      <p className="mt-2 font-title text-[15px] font-semibold text-[#2b2b2b]">{title}</p>
      {lines.map((line) => (
        <p key={line} className="mt-1 font-body text-[11.5px] italic text-[#5b5b5b]">
          {line}
        </p>
      ))}
    </div>
  )
}

export function Story() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const mm = gsap.matchMedia()
      mm.add(DESKTOP_PIN, () => {
        const spread = () => Math.min(1, window.innerWidth / 1440)
        const timeline = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: q('[data-story-stage]')[0],
            start: 'top top',
            end: '+=150%',
            scrub: 0.9,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        timeline
          .fromTo(
            q('[data-story-item]'),
            {
              x: (index: number) => STORY[index].scatter.x * spread(),
              y: (index: number) => STORY[index].scatter.y,
              rotation: (index: number) => STORY[index].scatter.r,
            },
            { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.07 },
            0.12,
          )
          .fromTo(q('[data-paper]'), { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.72, duration: 0.3, stagger: 0.07 }, 0.62)
          .fromTo(q('[data-app]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.07 }, 0.68)
          .fromTo(q('[data-story-bg]'), { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, 0.86)
          .fromTo(q('[data-story-chrome]'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.05)
          .fromTo(q('[data-story-before]'), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -18, duration: 0.35 }, 0.72)
          .fromTo(q('[data-story-after]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.95)
          .fromTo(q('[data-story-fill]'), { scaleX: 0 }, { scaleX: 1, duration: 1.45, ease: 'none' }, 0)
      })
      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        gsap.from(q('[data-story-item]'), {
          x: (index: number) => (index % 2 ? 70 : -70),
          rotation: (index: number) => (index % 2 ? 5 : -5),
          autoAlpha: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: q('[data-story-item]')[0], start: 'top 85%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} id="concept" className="relative overflow-hidden bg-white">
      <div
        data-story-stage
        className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 py-24 sm:px-8 md:py-32 lg:min-h-[100svh] grid-cols-1 lg:grid-cols-12 lg:gap-10 lg:py-16"
      >
        <div className="relative z-10 lg:col-span-5">
          <Kicker>Le constat</Kicker>
          <h2
            data-split
            className="mt-5 font-title text-[clamp(36px,4.6vw,64px)] font-semibold leading-[1.02] tracking-[-0.038em] text-ink"
          >
            Aujourd’hui, son dossier est partout. Donc nulle part.
          </h2>
          <div className="relative mt-8 font-body text-[17px] leading-relaxed text-[#4d5652] md:text-[18px]">
            <div data-story-before>
              <AppChip tone="ink">Avant</AppChip>
              <p className="mt-3 max-w-[500px]">
                Le carnet de vaccination dans un tiroir, l’ordonnance dans la boîte à gants, la facture dans vos
                e-mails, la date du vermifuge… quelque part dans votre tête. Le jour du rendez-vous, votre
                vétérinaire découvre le dossier.
              </p>
            </div>
            <div data-story-after className="mt-8 lg:motion-safe:absolute lg:motion-safe:inset-x-0 lg:motion-safe:top-0 lg:motion-safe:mt-0">
              <AppChip>Avec Vet’OPoil</AppChip>
              <p className="mt-3 max-w-[500px] text-ink">
                Chaque document trouve sa place, chaque date devient un rappel, chaque consultation enrichit
                l’historique. Un seul dossier, à jour, que vous ouvrez au bon moment.
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="mt-10 hidden items-center gap-3 font-body text-xs font-semibold text-muted lg:motion-safe:flex">
            <span>Papier</span>
            <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line">
              <span data-story-fill className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-primary to-teal" />
            </span>
            <span className="text-primary">Dossier vivant</span>
          </div>
        </div>

        <div className="relative flex justify-center lg:col-span-7">
          <div aria-hidden="true" className="relative w-full max-w-[440px]">
            <div data-story-bg className="absolute -inset-x-4 -inset-y-4 rounded-[32px] border border-line-soft bg-[#f8fbfa] shadow-pop sm:-inset-x-6" />
            <div data-story-chrome className="relative mb-4 flex items-center gap-3 px-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-mint font-title text-lg font-semibold text-primary-pressed">
                M
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-title text-[17px] font-semibold text-ink">Dossier de Milo</p>
                <p className="font-body text-xs text-muted">Mis à jour à l’instant</p>
              </div>
              <ScoreRing score={92} size={50} stroke={5} caption="" />
            </div>
            <ul className="relative flex flex-col gap-2.5">
              {STORY.map((item) => (
                <li key={item.title} data-story-item className="relative h-[64px]">
                  <div data-paper className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 opacity-0">
                    <PaperFace {...item.paper} />
                  </div>
                  <div data-app className="flex h-full items-center gap-3 rounded-[16px] border border-line-soft bg-white px-3.5 shadow-card">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-mint text-primary">
                      <item.Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-[14px] font-semibold text-ink">{item.title}</p>
                      <p className="truncate font-body text-xs text-muted">{item.meta}</p>
                    </div>
                    <Badge tone={item.badge.tone} dot>
                      {item.badge.label}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            <p data-story-chrome className="relative mt-4 px-1 font-body text-xs font-medium text-muted">
              6 éléments classés · 1 rappel programmé · budget mis à jour
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    number: '01',
    title: 'Créez sa fiche',
    text: 'Nom, espèce, race, date de naissance, poids : en quelques champs, le dossier de votre animal existe.',
  },
  {
    number: '02',
    title: 'Nourrissez le dossier',
    text: 'Photographiez une ordonnance ou une facture. Smart Scan propose la catégorie, la date et le montant ; vous validez.',
  },
  {
    number: '03',
    title: 'Partagez au bon moment',
    text: 'Un QR code ouvre le dossier au vétérinaire pendant 4 heures. La famille et le pet-sitter sont invités par e-mail.',
  },
]

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="rounded-[22px] border border-line-soft bg-white p-4 shadow-card">
        <p className="font-body text-[12px] font-semibold text-muted">Nouvel animal</p>
        <div className="mt-3 flex flex-col gap-2">
          {[
            ['Nom', 'Milo'],
            ['Espèce', 'Chien'],
            ['Naissance', '14/03/2022'],
            ['Poids', '12,4 kg'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-[11px] border border-[#e3e8e6] px-3 py-2 font-body text-[12.5px]">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-ink">{value}</span>
            </div>
          ))}
        </div>
        <span className="mt-3 block rounded-[11px] bg-primary py-2.5 text-center font-body text-[12.5px] font-semibold text-white">
          Enregistrer
        </span>
      </div>
    )
  }
  if (index === 1) {
    return (
      <div className="rounded-[22px] border border-line-soft bg-white p-4 shadow-card">
        <div className="relative overflow-hidden rounded-[14px] bg-[#fffdf7] p-3.5 ring-1 ring-black/5">
          <p className="font-body text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#9a968c]">Ordonnance</p>
          {[78, 92, 64, 84].map((width) => (
            <span key={width} className="mt-2 block h-1.5 rounded-full bg-[#e7e3d9]" style={{ width: `${width}%` }} />
          ))}
          <span data-step-beam className="absolute inset-x-0 top-0 h-[2px] bg-teal shadow-[0_0_18px_4px_rgb(87_201_210/0.55)]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AppChip>Ordonnance</AppChip>
          <AppChip tone="teal">12 mars</AppChip>
          <AppChip tone="orange">42,50 €</AppChip>
        </div>
        <p className="mt-3 flex items-center gap-1.5 font-body text-[12px] font-medium text-primary">
          <IconScan className="h-4 w-4" />3 champs proposés
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-[22px] border border-line-soft bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <DemoQr className="h-16 w-16 rounded-[6px]" />
        <div>
          <p className="font-mono text-[18px] font-semibold tracking-[0.16em] text-ink">K7P2QX</p>
          <p className="font-body text-[11.5px] text-muted">Valable 4 heures</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {[
          ['DM', 'Dr Martin', 'Code · 4 h', 'bg-mint text-primary-pressed'],
          ['HD', 'Hugo', 'Famille · lecture', 'bg-teal-15 text-[#1d6f76]'],
          ['IL', 'Inès', 'Pet-sitter · journal', 'bg-orange-15 text-orange-ink'],
        ].map(([initials, name, role, tone]) => (
          <li key={name} className="flex items-center gap-2.5 rounded-[11px] bg-canvas px-2.5 py-1.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full font-body text-[10px] font-semibold ${tone}`}>
              {initials}
            </span>
            <span className="font-body text-[12.5px] font-semibold text-ink">{name}</span>
            <span className="ml-auto font-body text-[11px] text-muted">{role}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HowItWorks() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          q('[data-thread]'),
          { drawSVG: 0 },
          {
            drawSVG: '100%',
            ease: 'none',
            scrollTrigger: { trigger: q('[data-steps]')[0], start: 'top 75%', end: 'bottom 70%', scrub: 1 },
          },
        )
        gsap.fromTo(
          q('[data-step-beam]'),
          { y: 0 },
          { y: 92, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true },
        )
        q('[data-step-number]').forEach((number) => {
          gsap.from(number, {
            xPercent: -30,
            autoAlpha: 0,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: number, start: 'top 85%', once: true },
          })
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} id="fonctionnement" className="relative overflow-hidden bg-canvas py-28 md:py-36">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionIntro kicker="Comment ça marche" title="Trois gestes. Ensuite, le dossier vit tout seul." />
        <div data-steps className="relative mt-16 grid gap-16 lg:mt-20 lg:grid-cols-3 lg:gap-10">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 300"
            fill="none"
            className="pointer-events-none absolute inset-x-0 top-[38px] hidden h-auto w-full lg:block"
          >
            <path
              data-thread
              d="M0 40 H52 l10 -20 l12 42 l10 -32 l8 10 H230 C 320 40, 360 140, 450 140 H462 l10 -20 l12 42 l10 -32 l8 10 H640 C 730 140, 770 250, 860 250 H872 l10 -20 l12 42 l10 -32 l8 10 H1200"
              stroke="#2c6e63"
              strokeOpacity="0.35"
              strokeWidth="1.6"
            />
          </svg>
          {STEPS.map((step, index) => (
            <article key={step.number} className={`relative ${index === 1 ? 'lg:pt-24' : index === 2 ? 'lg:pt-48' : ''}`}>
              <p
                data-step-number
                aria-hidden="true"
                className="font-title text-[92px] font-semibold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_rgb(44_110_99/0.55)]"
              >
                {step.number}
              </p>
              <h3 data-reveal className="mt-5 font-title text-[26px] font-semibold tracking-[-0.025em] text-ink">
                {step.title}
              </h3>
              <p data-reveal className="mt-3 max-w-[360px] font-body text-[16px] leading-relaxed text-[#4d5652]">
                {step.text}
              </p>
              <div data-reveal className="mt-7 max-w-[340px]">
                <div data-tilt aria-hidden="true">
                  <StepVisual index={index} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
