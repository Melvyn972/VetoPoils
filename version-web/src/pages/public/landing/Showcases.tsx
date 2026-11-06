import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import {
  IconActivity,
  IconCheck,
  IconClock,
  IconFile,
  IconScan,
  IconStethoscope,
  IconSyringe,
} from '../../../components/icons/Icons'
import { Badge, EventStatusBadge } from '../../../components/ui/Badge'
import { scoreColor, scoreVerdict } from '../../../components/ui/chartUtils'
import { computeHealthScore } from '../../../lib/healthScore'
import { gsap, MOTION_OK, prefersReducedMotion, ScrollTrigger, useGSAP } from '../../../lib/motion'
import { BrowserFrame, DemoQr, LiveCountdown, PhoneFrame, SectionIntro } from './Kit'
import { DESKTOP_PIN } from './landingMotion'

type ScanRow = { left: string; right?: string; hit?: boolean; strong?: boolean }

type ScanDoc = {
  id: string
  tab: string
  docTitle: string
  date: string
  patient: string
  rows: ScanRow[]
  fields: Array<{ label: string; value: string }>
  toast: string
  summary: string
}

const SCAN_DOCS: ScanDoc[] = [
  {
    id: 'ordonnance',
    tab: 'Ordonnance',
    docTitle: 'Ordonnance',
    date: '12/03/2026',
    patient: 'Milo · chien · 12,4 kg',
    rows: [
      { left: 'Diagnostic : otite externe droite', hit: true },
      { left: 'Gouttes auriculaires', right: '1 flacon', hit: true, strong: true },
      { left: '5 gouttes matin et soir pendant 7 jours' },
      { left: 'Nettoyant auriculaire', right: '1 flacon', strong: true },
      { left: 'Deux fois par semaine pendant un mois' },
      { left: 'Contrôle conseillé dans 10 jours' },
    ],
    fields: [
      { label: 'Catégorie', value: 'Ordonnance' },
      { label: 'Titre', value: 'Traitement de l’otite' },
      { label: 'Diagnostic', value: 'Otite externe droite' },
      { label: 'Traitement', value: 'Gouttes auriculaires, 7 jours' },
      { label: 'Date', value: '12/03/2026' },
    ],
    toast: 'Classé dans le dossier de Milo',
    summary:
      'Exemple : une ordonnance pour une otite. Smart Scan propose la catégorie, le titre, le diagnostic, le traitement et la date ; vous vérifiez avant d’enregistrer.',
  },
  {
    id: 'facture',
    tab: 'Facture',
    docTitle: 'Facture n° 2026-0412',
    date: '02/02/2026',
    patient: 'Milo · chien',
    rows: [
      { left: 'Consultation', right: '45,00 €' },
      { left: 'Vaccin CHPPiL', right: '38,50 €', hit: true },
      { left: 'Vaccin antirabique', right: '19,00 €', hit: true },
      { left: 'TVA incluse', right: '17,08 €' },
      { left: 'Total TTC', right: '102,50 €', hit: true, strong: true },
    ],
    fields: [
      { label: 'Catégorie', value: 'Vaccination' },
      { label: 'Titre', value: 'Consultation et vaccins' },
      { label: 'Montant', value: '102,50 €' },
      { label: 'Date', value: '02/02/2026' },
    ],
    toast: '102,50 € ajoutés au budget de Milo',
    summary:
      'Exemple : une facture de consultation avec deux vaccins. Smart Scan propose la catégorie, le titre, le montant et la date, et la dépense rejoint le budget.',
  },
  {
    id: 'analyse',
    tab: 'Analyse sanguine',
    docTitle: 'Bilan biochimique',
    date: '18/01/2026',
    patient: 'Milo · chien · 12,3 kg',
    rows: [
      { left: 'Urée', right: '6,1 mmol/L' },
      { left: 'Créatinine', right: '98 µmol/L' },
      { left: 'ALAT', right: '42 UI/L' },
      { left: 'Glucose', right: '5,2 mmol/L' },
      { left: 'Poids le jour du prélèvement', right: '12,3 kg', hit: true },
      { left: 'Valeurs dans les intervalles du laboratoire', hit: true, strong: true },
    ],
    fields: [
      { label: 'Catégorie', value: 'Analyse' },
      { label: 'Titre', value: 'Bilan sanguin annuel' },
      { label: 'Poids', value: '12,3 kg' },
      { label: 'Date', value: '18/01/2026' },
    ],
    toast: 'PDF joint au dossier de Milo',
    summary:
      'Exemple : un bilan sanguin. Smart Scan propose la catégorie, le titre, le poids et la date ; le document est joint au dossier.',
  },
]

function ScanPaper({ doc }: { doc: ScanDoc }) {
  return (
    <div
      data-scan-paper
      className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[6px] bg-[#fffdf8] px-6 pb-8 pt-6 text-[#2b2b2b] shadow-[0_50px_90px_-40px_rgb(0_0_0/0.7)] sm:px-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-title text-[15px] font-semibold">Clinique vétérinaire du Parc</p>
          <p className="mt-0.5 font-body text-[11px] text-[#7a776f]">Dr Claire Martin · docteur vétérinaire</p>
        </div>
        <p className="relative shrink-0 font-mono text-[11.5px]">
          <span data-hit className="absolute -inset-x-1.5 -inset-y-1 rounded-[5px] bg-teal/20 ring-1 ring-teal/70" />
          <span className="relative">{doc.date}</span>
        </p>
      </div>
      <p className="mt-7 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a968c]">{doc.docTitle}</p>
      <p className="mt-1 font-body text-[12.5px] italic text-[#55524b]">{doc.patient}</p>
      <ul className="mt-5 flex flex-col gap-3">
        {doc.rows.map((row) => (
          <li key={row.left} className="relative flex items-baseline justify-between gap-4 font-body text-[13px]">
            {row.hit ? <span data-hit className="absolute -inset-x-2 -inset-y-1 rounded-[6px] bg-teal/20 ring-1 ring-teal/70" /> : null}
            <span className={`relative ${row.strong ? 'font-semibold' : 'text-[#4a4741]'}`}>{row.left}</span>
            {row.right ? <span className={`relative font-mono text-[12px] ${row.strong ? 'font-semibold' : ''}`}>{row.right}</span> : null}
          </li>
        ))}
      </ul>
      <svg viewBox="0 0 140 40" className="ml-auto mt-8 h-9 w-28 text-[#3a5a8c]" fill="none" aria-hidden="true">
        <path
          d="M4 28 C 18 6, 26 34, 38 18 S 58 8, 62 24 S 80 30, 92 14 S 118 20, 136 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span
        data-scan-beam
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-teal opacity-0 shadow-[0_0_24px_6px_rgb(87_201_210/0.6)]"
      />
    </div>
  )
}

export function ScanShowcase() {
  const scope = useRef<HTMLElement>(null)
  const played = useRef(false)
  const [active, setActive] = useState(0)
  const doc = SCAN_DOCS[active]

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const paper = q('[data-scan-paper]')[0]
        const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
        timeline
          .from(paper, { y: 40, rotation: -2.5, autoAlpha: 0, duration: 0.8 })
          .from(q('[data-scan-panel]'), { x: 30, autoAlpha: 0, duration: 0.8 }, 0.1)
          .set(q('[data-scan-beam]'), { autoAlpha: 1 }, 0.55)
          .fromTo(
            q('[data-scan-beam]'),
            { y: 0 },
            { y: () => (paper?.offsetHeight ?? 400) - 3, duration: 1.5, ease: 'sine.inOut' },
            0.55,
          )
          .to(q('[data-scan-beam]'), { autoAlpha: 0, duration: 0.25 }, '>-0.1')
          .from(q('[data-hit]'), { autoAlpha: 0, scale: 0.94, duration: 0.45, stagger: 0.16 }, 0.75)
          .from(q('[data-scan-field-row]'), { autoAlpha: 0, y: 10, duration: 0.4, stagger: 0.12 }, 1.2)
        q('[data-scan-field]').forEach((field, index) => {
          const value = field.textContent ?? ''
          timeline.fromTo(field, { text: '' }, { text: value, duration: Math.max(0.35, value.length * 0.03), ease: 'none' }, 1.3 + index * 0.18)
        })
        timeline
          .to(q('[data-scan-save]'), { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '+=0.1')
          .from(q('[data-scan-toast]'), { y: 12, autoAlpha: 0, duration: 0.5 }, '>')

        if (played.current) {
          timeline.play()
          return
        }
        ScrollTrigger.create({
          trigger: paper,
          start: 'top 72%',
          once: true,
          onEnter: () => {
            played.current = true
            timeline.play()
          },
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [active], revertOnUpdate: true },
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -active, End: SCAN_DOCS.length - 1 - active }
    const delta = keys[event.key]
    if (delta === undefined) return
    event.preventDefault()
    const next = (active + delta + SCAN_DOCS.length) % SCAN_DOCS.length
    setActive(next)
    document.getElementById(`scan-tab-${SCAN_DOCS[next].id}`)?.focus()
  }

  return (
    <section ref={scope} id="smart-scan" className="on-dark grain relative overflow-hidden bg-forest-deep py-28 text-white md:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgb(87_201_210/0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-12 lg:items-end">
          <SectionIntro kicker="Smart Scan" title="Une photo. Le dossier fait le tri." light className="lg:col-span-7">
            Photographiez une ordonnance, une facture ou un résultat d’analyse. Smart Scan lit le document et propose
            la catégorie, le titre, la date et le montant. Vous vérifiez, vous corrigez si besoin, puis vous
            enregistrez.
          </SectionIntro>
          <div data-reveal className="lg:col-span-5 lg:pb-2">
            <div
              role="tablist"
              aria-label="Type de document"
              onKeyDown={onKeyDown}
              className="relative grid grid-cols-3 rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white transition-transform duration-500 ease-out-quint"
                style={{ transform: `translateX(${active * 100}%)` }}
              />
              {SCAN_DOCS.map((item, index) => (
                <button
                  key={item.id}
                  id={`scan-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-controls="scan-panel"
                  tabIndex={index === active ? 0 : -1}
                  onClick={() => setActive(index)}
                  className={`relative z-10 rounded-full px-2 py-2.5 font-body text-[13px] font-semibold transition-colors duration-300 sm:text-[14px] ${
                    index === active ? 'text-forest-deep' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {item.tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="scan-panel" role="tabpanel" aria-labelledby={`scan-tab-${doc.id}`} className="mt-14 md:mt-16">
          <p className="sr-only">{doc.summary}</p>
          <div key={doc.id} aria-hidden="true" className="grid items-center gap-10 grid-cols-1 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <ScanPaper doc={doc} />
            </div>
            <div data-scan-panel className="lg:col-span-6">
              <div className="rounded-[26px] bg-white/[0.06] p-5 ring-1 ring-white/10 sm:p-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-teal/15 text-teal">
                    <IconScan className="h-[18px] w-[18px]" />
                  </span>
                  <p className="font-body text-[15px] font-semibold">Vérifiez avant d’enregistrer</p>
                  <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 font-body text-[11px] font-semibold text-white/80">
                    {doc.tab}
                  </span>
                </div>
                <dl className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {doc.fields.map((field, index) => (
                    <div
                      key={field.label}
                      data-scan-field-row
                      className={`rounded-[14px] bg-white/[0.05] px-4 py-3 ring-1 ring-white/[0.06] ${
                        doc.fields.length % 2 === 1 && index === doc.fields.length - 1 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <dt className="font-body text-[11.5px] text-white/55">{field.label}</dt>
                      <dd data-scan-field className="mt-1 min-h-[21px] font-body text-[15px] font-semibold text-white">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span data-scan-save className="inline-flex rounded-[13px] bg-teal px-4 py-3 font-body text-[14px] font-semibold text-forest-deep">
                    Enregistrer dans le dossier
                  </span>
                  <span className="font-body text-[13px] text-white/55">Chaque champ reste modifiable</span>
                </div>
                <p
                  data-scan-toast
                  className="mt-5 flex items-center gap-2 rounded-[13px] bg-[#9fe7d6]/12 px-3.5 py-2.5 font-body text-[13.5px] font-medium text-[#9fe7d6]"
                >
                  <IconCheck className="h-4 w-4" />
                  {doc.toast}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const QR_STEPS = [
  { title: 'Vous générez un code', text: 'Un QR code et un code à 6 caractères, valables 4 heures, révocables à tout moment.' },
  { title: 'Le vétérinaire l’ouvre', text: 'Il scanne ou saisit le code : le dossier complet s’affiche, sans création de compte.' },
  { title: 'Il complète le dossier', text: 'Consultation, vaccin, ordonnance, poids ou rappel : la saisie prend quelques secondes.' },
  { title: 'Vous validez', text: 'Chaque ajout arrive en attente. Vous l’acceptez ou le refusez, et l’historique reste fiable.' },
]

function BadgeSwap() {
  return (
    <span className="grid justify-items-end [&>*]:col-start-1 [&>*]:row-start-1">
      <span data-pending className="opacity-0">
        <EventStatusBadge status="pending" />
      </span>
      <span data-validated>
        <EventStatusBadge status="validated" />
      </span>
    </span>
  )
}

export function QrShowcase() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const build = () => {
        const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
        q('[data-qr-step]').forEach((step, index) => {
          timeline.fromTo(step, { autoAlpha: index === 0 ? 1 : 0.4 }, { autoAlpha: 1, duration: 0.2 }, index)
        })
        timeline
          .fromTo(q('[data-qr-line]'), { scaleY: 0 }, { scaleY: 1, duration: 4, ease: 'none' }, 0)
          .fromTo(q('[data-qr-image]'), { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }, 0)
          .to(q('[data-qr-code]'), { scrambleText: { text: 'K7P2QX', chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', speed: 0.5 }, duration: 0.8 }, 0.1)
          .fromTo(
            q('[data-qr-pulse]'),
            { scale: 1, autoAlpha: 0.9 },
            { scale: 1.5, autoAlpha: 0, duration: 0.5, ease: 'power2.out', stagger: 0.18 },
            0.95,
          )
          .fromTo(q('[data-vet-skeleton]'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 1.35)
          .fromTo(q('[data-vet-block]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.12 }, 1.4)
        q('[data-vet-type]').forEach((field, index) => {
          const value = field.textContent ?? ''
          timeline.fromTo(field, { text: '' }, { text: value, duration: 0.45, ease: 'none' }, 2.1 + index * 0.35)
        })
        timeline
          .to(q('[data-vet-submit]'), { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1 }, 2.85)
          .fromTo(q('[data-vet-new]'), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 2.95)
          .fromTo(q('[data-qr-notif]'), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }, 3.05)
          .fromTo(q('[data-pending]'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 3.55)
          .fromTo(q('[data-validated]'), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 3.6)
          .to({}, { duration: 0.3 })
        return timeline
      }

      const mm = gsap.matchMedia()
      mm.add(DESKTOP_PIN, () => {
        const timeline = build()
        ScrollTrigger.create({
          animation: timeline,
          trigger: q('[data-qr-stage]')[0],
          start: 'top top',
          end: '+=220%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        })
      })
      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        const timeline = build().pause().timeScale(0.8)
        ScrollTrigger.create({
          trigger: q('[data-qr-devices]')[0],
          start: 'top 70%',
          once: true,
          onEnter: () => {
            timeline.play()
          },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} id="acces-veterinaire" className="relative overflow-hidden bg-[#eaf5f2]">
      <div
        data-qr-stage
        className="relative mx-auto grid max-w-[1320px] gap-14 px-5 py-24 sm:px-8 md:py-32 lg:min-h-[100svh] grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-12"
      >
        <p
          aria-hidden="true"
          data-speed="60"
          className="pointer-events-none absolute -right-6 top-6 select-none font-title text-[clamp(90px,15vw,230px)] font-semibold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_rgb(44_110_99/0.13)]"
        >
          <LiveCountdown />
        </p>
        <div className="relative lg:col-span-5">
          <SectionIntro kicker="Accès vétérinaire" title="Quatre heures. Pas une de plus.">
            Le jour du rendez-vous, vous ouvrez le dossier à votre vétérinaire. Il n’a besoin ni d’application ni
            de compte, et l’accès se ferme tout seul.
          </SectionIntro>
          <ol className="relative mt-10 flex flex-col gap-6 pl-11">
            <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-[2px] rounded-full bg-primary/15">
              <span data-qr-line className="absolute inset-0 origin-top rounded-full bg-primary" />
            </span>
            {QR_STEPS.map((step, index) => (
              <li key={step.title} data-qr-step className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-11 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white font-body text-[12px] font-semibold text-primary shadow-card ring-1 ring-primary/25"
                >
                  {index + 1}
                </span>
                <h3 className="font-title text-[20px] font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
                <p className="mt-1 max-w-[430px] font-body text-[15px] leading-relaxed text-[#4d5652]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div data-qr-devices aria-hidden="true" className="relative lg:col-span-7">
          <BrowserFrame label="Portail vétérinaire · accès par code" className="ml-auto w-full sm:w-[88%]">
            <div className="relative min-h-[430px]">
              <div className="no-scrollbar flex gap-1 overflow-hidden border-b border-line-soft px-4 py-2 sm:pl-[150px]">
                {[
                  { label: 'Dossier', Icon: IconFile, on: true },
                  { label: 'Consultation', Icon: IconStethoscope },
                  { label: 'Vaccins', Icon: IconSyringe },
                  { label: 'Poids', Icon: IconActivity },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`flex shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 font-body text-[11.5px] font-medium ${
                      item.on ? 'bg-mint text-primary-pressed' : 'text-[#5b6461]'
                    }`}
                  >
                    <item.Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="relative p-4 sm:pl-[150px]">
                <div data-vet-skeleton className="absolute inset-4 flex flex-col gap-3 opacity-0">
                  <span className="h-12 w-2/3 animate-shimmer rounded-[12px] bg-[#edf1f0]" />
                  <span className="h-40 animate-shimmer rounded-[14px] bg-[#edf1f0]" />
                  <span className="h-32 animate-shimmer rounded-[14px] bg-[#edf1f0]" />
                </div>
                <div data-vet-block className="flex flex-wrap items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-mint font-title text-lg font-semibold text-primary-pressed">
                    M
                  </span>
                  <div className="min-w-0">
                    <p className="font-title text-[16px] font-semibold text-ink">Milo</p>
                    <p className="font-body text-[11.5px] text-muted">Chien · Border collie · 4 ans · 12,4 kg</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mint-soft px-2.5 py-1 font-body text-[11px] font-semibold text-primary-pressed">
                    <IconClock className="h-3.5 w-3.5" />
                    <LiveCountdown seconds={14_340} />
                  </span>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  <div data-vet-block className="rounded-[14px] border border-line-soft p-3.5">
                    <p className="font-body text-[12.5px] font-semibold text-ink">Nouvelle consultation</p>
                    <div className="mt-3 flex flex-col gap-2">
                      {[
                        { label: 'Motif', value: 'Contrôle annuel, RAS' },
                        { label: 'Poids', value: '12,6 kg' },
                      ].map((field) => (
                        <div key={field.label} className="rounded-[10px] border border-[#e3e8e6] px-3 py-2">
                          <p className="font-body text-[10px] text-muted">{field.label}</p>
                          <p data-vet-type className="min-h-[18px] font-body text-[12.5px] font-semibold text-ink">
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <span
                      data-vet-submit
                      className="mt-3 block rounded-[10px] bg-primary py-2.5 text-center font-body text-[12px] font-semibold text-white"
                    >
                      Soumettre au propriétaire
                    </span>
                  </div>
                  <div data-vet-block className="rounded-[14px] border border-line-soft p-3.5">
                    <p className="font-body text-[12.5px] font-semibold text-ink">Historique</p>
                    <ul className="mt-3 flex flex-col gap-2">
                      <li data-vet-new className="flex items-center justify-between gap-2 rounded-[10px] bg-amber-soft/60 px-2.5 py-2">
                        <span className="font-body text-[11.5px] font-semibold text-ink">Contrôle annuel</span>
                        <BadgeSwap />
                      </li>
                      {['Vaccin CHPPiL + rage', 'Bilan sanguin annuel', 'Traitement de l’otite'].map((row) => (
                        <li key={row} className="flex items-center justify-between gap-2 rounded-[10px] bg-canvas px-2.5 py-2">
                          <span className="font-body text-[11.5px] text-[#3f4744]">{row}</span>
                          <EventStatusBadge status="validated" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>

          <div className="relative z-10 -mt-24 ml-2 w-[226px] sm:absolute sm:-bottom-8 sm:-left-3 sm:mt-0 lg:-left-6">
            <PhoneFrame className="h-[468px] w-[226px]">
              <div className="flex h-full flex-col px-3.5 pb-4">
                <p className="pt-1 text-center font-body text-[12px] font-semibold text-ink">Partager avec un vétérinaire</p>
                <div className="mt-3 rounded-[18px] bg-white p-3.5 text-center shadow-card">
                  <div data-qr-image className="relative mx-auto w-fit rounded-[10px] bg-white p-1.5 ring-1 ring-line-soft">
                    <DemoQr className="h-[112px] w-[112px]" />
                    <span data-qr-pulse className="absolute -inset-1 rounded-[13px] ring-2 ring-teal opacity-0" />
                    <span data-qr-pulse className="absolute -inset-1 rounded-[13px] ring-2 ring-teal opacity-0" />
                  </div>
                  <p className="mt-3 font-mono text-[21px] font-semibold tracking-[0.2em] text-ink">
                    <span data-qr-code>K7P2QX</span>
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1 font-body text-[10.5px] font-medium text-primary">
                    <IconClock className="h-3 w-3" />
                    Expire dans <LiveCountdown />
                  </p>
                </div>
                <span className="mt-2.5 rounded-[11px] border border-red-ink/25 py-2 text-center font-body text-[11px] font-semibold text-red-ink">
                  Révoquer l’accès
                </span>
                <div data-qr-notif className="mt-auto rounded-[16px] bg-white p-3 shadow-pop">
                  <p className="font-body text-[10.5px] text-muted">Dr Martin · à l’instant</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-body text-[12px] font-semibold text-ink">Contrôle annuel</p>
                    <BadgeSwap />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <span className="flex-1 rounded-[9px] bg-primary py-1.5 text-center font-body text-[10.5px] font-semibold text-white">Valider</span>
                    <span className="flex-1 rounded-[9px] bg-red-soft py-1.5 text-center font-body text-[10.5px] font-semibold text-red-ink">Refuser</span>
                  </div>
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  )
}

type ToggleKey = 'vaccins' | 'consultation' | 'poids' | 'attente' | 'puce'

const TOGGLES: Array<{ key: ToggleKey; label: string; hint: string }> = [
  { key: 'vaccins', label: 'Vaccins à jour', hint: 'Aucun rappel de vaccination dépassé' },
  { key: 'consultation', label: 'Suivi dans l’année', hint: 'Au moins deux consultations sur 12 mois' },
  { key: 'poids', label: 'Poids stable', hint: 'Moins de 10 % de variation' },
  { key: 'attente', label: 'Aucun ajout en attente', hint: 'Les saisies du vétérinaire sont validées' },
  { key: 'puce', label: 'Identification renseignée', hint: 'Numéro de puce enregistré' },
]

function demoScore(toggles: Record<ToggleKey, boolean>, now: number) {
  const day = 86_400_000
  const at = (days: number) => new Date(now + days * day).toISOString()
  const consultDays = toggles.consultation ? [-40, -210] : [-420, -560]
  const weights = toggles.poids ? [12.2, 12.4] : [13.8, 11.9]
  return computeHealthScore({
    animal: { date_naissance: '2022-03-14', puce: toggles.puce ? '250268500000000' : null },
    events: [
      ...(toggles.attente ? [] : [{ type: 'compte_rendu', status: 'pending', date_event: at(-2) }]),
      { type: 'consultation', status: 'validated', date_event: at(consultDays[0]), poids_kg: weights[1] },
      { type: 'consultation', status: 'validated', date_event: at(consultDays[1]), poids_kg: weights[0] },
    ],
    reminders: [
      { type: 'vaccination', statut: 'actif', date_echeance: at(toggles.vaccins ? 60 : -9) },
      { type: 'antiparasitaire', statut: 'actif', date_echeance: at(12) },
    ],
  })
}

const RADIUS = 118
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC = CIRCUMFERENCE * 0.75
const TICKS = Array.from({ length: 41 }, (_, index) => {
  const angle = ((135 + index * 6.75) * Math.PI) / 180
  const inner = index % 5 === 0 ? 128 : 133
  return {
    x1: 150 + Math.cos(angle) * inner,
    y1: 150 + Math.sin(angle) * inner,
    x2: 150 + Math.cos(angle) * 140,
    y2: 150 + Math.sin(angle) * 140,
    major: index % 5 === 0,
  }
})

export function ScoreShowcase() {
  const scope = useRef<HTMLElement>(null)
  const arcRef = useRef<SVGCircleElement>(null)
  const valueRef = useRef<HTMLSpanElement>(null)
  const display = useRef({ value: 0 })
  const played = useRef(false)
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    vaccins: false,
    consultation: true,
    poids: true,
    attente: true,
    puce: true,
  })
  const [result, setResult] = useState<ReturnType<typeof computeHealthScore>>(null)

  useEffect(() => {
    setResult(demoScore(toggles, Date.now()))
  }, [toggles])

  const score = result?.score ?? null
  const factors = result?.details.factors ?? []
  const factorKey = factors.map((factor) => factor.code).join('|')

  useGSAP(
    () => {
      const arc = arcRef.current
      const value = valueRef.current
      if (!arc || !value || score === null) return
      const apply = () => {
        const current = display.current.value
        arc.style.strokeDashoffset = String(ARC * (1 - current / 100))
        arc.style.stroke = scoreColor(Math.round(current))
        if (value.firstChild) value.firstChild.nodeValue = String(Math.round(current))
      }
      if (prefersReducedMotion()) {
        display.current.value = score
        apply()
        return
      }
      const tween = gsap.to(display.current, {
        value: score,
        duration: played.current ? 1 : 1.8,
        ease: played.current ? 'power3.out' : 'expo.out',
        overwrite: true,
        onUpdate: apply,
        paused: !played.current,
      })
      if (!played.current) {
        ScrollTrigger.create({
          trigger: arc,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            played.current = true
            tween.play()
          },
        })
      }
    },
    { scope, dependencies: [score] },
  )

  useGSAP(
    () => {
      if (!played.current || prefersReducedMotion()) return
      gsap.from(gsap.utils.toArray('[data-factor]', scope.current), { autoAlpha: 0, x: -14, duration: 0.45, stagger: 0.06 })
    },
    { scope, dependencies: [factorKey] },
  )

  const verdict = scoreVerdict(score)

  return (
    <section ref={scope} id="health-score" className="relative overflow-hidden bg-white py-28 md:py-36">
      <div className="mx-auto grid max-w-[1320px] gap-14 px-5 sm:px-8 grid-cols-1 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <SectionIntro kicker="Health Score" title="Un score qui se mérite.">
            Il se calcule à partir de ce que contient vraiment le dossier : rappels dépassés, consultations de
            l’année, courbe de poids, ajouts en attente, identification. Touchez un critère pour voir le score
            réagir.
          </SectionIntro>
          <div data-reveal className="mt-9 flex flex-col gap-2.5">
            {TOGGLES.map((toggle) => {
              const on = toggles[toggle.key]
              return (
                <button
                  key={toggle.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setToggles((current) => ({ ...current, [toggle.key]: !current[toggle.key] }))}
                  className={`press flex w-full items-center gap-4 rounded-[16px] border px-4 py-3.5 text-left transition-colors duration-300 ${
                    on ? 'border-primary/25 bg-mint-soft' : 'border-line bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-[15px] font-semibold text-ink">{toggle.label}</span>
                    <span className="block font-body text-[13px] text-muted">{toggle.hint}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-primary' : 'bg-[#cdd6d3]'}`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-300 ease-out-quint ${
                        on ? 'translate-x-5' : ''
                      }`}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div data-reveal className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[34px] bg-canvas p-6 sm:p-10">
            <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_70%)]" />
            <div className="relative mx-auto aspect-square w-full max-w-[380px]" aria-hidden="true">
              <svg viewBox="0 0 300 300" className="h-full w-full">
                {TICKS.map((tick, index) => (
                  <line
                    key={index}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke={tick.major ? '#9fb3ad' : '#cfdad6'}
                    strokeWidth={tick.major ? 1.6 : 1}
                    strokeLinecap="round"
                  />
                ))}
                <circle
                  cx="150"
                  cy="150"
                  r={RADIUS}
                  fill="none"
                  stroke="#e1e9e6"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
                  transform="rotate(135 150 150)"
                />
                <circle
                  ref={arcRef}
                  cx="150"
                  cy="150"
                  r={RADIUS}
                  fill="none"
                  stroke="#c9d3cf"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
                  strokeDashoffset={ARC}
                  transform="rotate(135 150 150)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="eyebrow text-muted">Health Score</span>
                <span
                  ref={valueRef}
                  className="tabular mt-1 font-title text-[clamp(72px,9vw,104px)] font-semibold leading-none tracking-[-0.05em] text-ink"
                >
                  0
                </span>
                <span className="mt-1 font-body text-[14px] text-muted">sur 100</span>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              {score === null ? '' : `Score de démonstration : ${score} sur 100, ${verdict}.`}
            </p>
            <div className="relative mt-2 flex justify-center">
              <Badge tone={score !== null && score >= 80 ? 'success' : score !== null && score >= 60 ? 'orange' : 'danger'} dot>
                {verdict}
              </Badge>
            </div>
            <div className="relative mx-auto mt-7 max-w-[460px]">
              <p className="eyebrow text-muted">Ce qui retire des points</p>
              {factors.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {factors.map((factor) => (
                    <li
                      key={factor.code}
                      data-factor
                      className="flex items-center justify-between gap-3 rounded-[13px] bg-white px-4 py-3 shadow-card"
                    >
                      <span className="font-body text-[14px] text-ink">{factor.label}</span>
                      <span className="tabular font-body text-[14px] font-semibold text-red-ink">{factor.delta}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p data-factor className="mt-3 flex items-center gap-2 rounded-[13px] bg-white px-4 py-3 font-body text-[14px] text-green-ink shadow-card">
                  <IconCheck className="h-4 w-4" />
                  Aucun point retiré : le dossier est complet et à jour.
                </p>
              )}
              <p className="mt-5 font-body text-[13px] leading-relaxed text-muted">
                Indicateur de suivi, pas un diagnostic : seul votre vétérinaire évalue l’état de santé de votre
                animal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}