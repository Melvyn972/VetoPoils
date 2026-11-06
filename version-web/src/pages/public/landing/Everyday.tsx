import { useRef, useState, type KeyboardEvent } from 'react'

import {
  IconArrowRight,
  IconBell,
  IconBook,
  IconCalendar,
  IconCheck,
  IconClock,
  IconDownload,
  IconFile,
  IconHandshake,
  IconPaw,
  IconQr,
  IconRefresh,
  IconShield,
  IconStethoscope,
  IconUsers,
  IconWallet,
} from '../../../components/icons/Icons'
import { Logo } from '../../../components/brand/Logo'
import { ButtonLink } from '../../../components/ui/Button'
import { Donut, MonthlyBars, ScoreRing } from '../../../components/ui/Charts'
import { gsap, MOTION_OK, prefersReducedMotion, ScrollTrigger, useGSAP } from '../../../lib/motion'
import { AppChip, BrowserFrame, SectionIntro, WhenVisible } from './Kit'
import { Flip } from './landingMotion'

type DemoReminder = { id: string; title: string; animal: string; days: number; kind: 'vaccin' | 'soin' | 'rdv' }

const INITIAL_REMINDERS: DemoReminder[] = [
  { id: 'vermifuge', title: 'Vermifuge', animal: 'Luna', days: 5, kind: 'soin' },
  { id: 'rage', title: 'Rappel vaccin rage', animal: 'Milo', days: 12, kind: 'vaccin' },
  { id: 'antipuces', title: 'Pipette antipuces', animal: 'Luna', days: 19, kind: 'soin' },
  { id: 'dents', title: 'Contrôle dentaire', animal: 'Milo', days: 34, kind: 'rdv' },
]

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

const BUDGET = [
  { key: 'veterinaire', label: 'Vétérinaire', value: 238.5, color: '#2c6e63' },
  { key: 'alimentation', label: 'Alimentation', value: 96.4, color: '#57c9d2' },
  { key: 'pharmacie', label: 'Pharmacie', value: 49.9, color: '#fba84b' },
  { key: 'accessoires', label: 'Accessoires', value: 28, color: '#c9d3cf' },
]

const MONTHS = [
  { key: '10', label: 'oct.', value: 31.2 },
  { key: '11', label: 'nov.', value: 58.9 },
  { key: '12', label: 'déc.', value: 24.6 },
  { key: '01', label: 'janv.', value: 96.4 },
  { key: '02', label: 'févr.', value: 102.5 },
  { key: '03', label: 'mars', value: 99.2 },
]

function RemindersCard() {
  const listRef = useRef<HTMLUListElement>(null)
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const [items, setItems] = useState(INITIAL_REMINDERS)
  const [done, setDone] = useState(0)

  useGSAP(
    () => {
      const state = flipState.current
      flipState.current = null
      if (!state || !listRef.current) return
      Flip.from(state, {
        targets: listRef.current.querySelectorAll('[data-reminder]'),
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => ScrollTrigger.refresh(),
      })
    },
    { scope: listRef, dependencies: [items] },
  )

  const capture = () => {
    if (prefersReducedMotion() || !listRef.current) return
    flipState.current = Flip.getState(listRef.current.querySelectorAll('[data-reminder]'))
  }

  const complete = (id: string, row: HTMLElement | null) => {
    const remove = () => {
      capture()
      setItems((current) => current.filter((item) => item.id !== id))
      setDone((count) => count + 1)
    }
    if (!row || prefersReducedMotion()) {
      remove()
      return
    }
    gsap.to(row, { autoAlpha: 0, x: 48, duration: 0.35, ease: 'power2.in', onComplete: remove })
  }

  const postpone = (id: string) => {
    capture()
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, days: item.days + 7 } : item)).sort((a, b) => a.days - b.days),
    )
  }

  const reset = () => {
    setItems(INITIAL_REMINDERS)
    setDone(0)
  }

  return (
    <article data-reveal className="flex flex-col rounded-[28px] bg-white p-5 shadow-card ring-1 ring-line-soft sm:p-7 lg:col-span-5 lg:row-span-2">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange-15 text-orange-ink">
          <IconBell className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-title text-[22px] font-semibold tracking-[-0.02em] text-ink">Des rappels qui tombent juste</h3>
          <p className="mt-1 font-body text-[15px] leading-relaxed text-[#4d5652]">
            Par e-mail ou notification, avant l’échéance. Essayez : marquez-en un comme fait, reportez-en un autre.
          </p>
        </div>
      </div>
      <ul ref={listRef} className="mt-6 flex flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            data-reminder
            data-flip-id={item.id}
            className="flex items-center gap-3 rounded-[16px] border border-line-soft bg-canvas px-3.5 py-3"
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[12px] font-body leading-none ${
                item.days <= 7 ? 'bg-orange-15 text-orange-ink' : 'bg-white text-primary-pressed ring-1 ring-line-soft'
              }`}
            >
              <span className="text-[15px] font-semibold tabular">{item.days}</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">j</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[14.5px] font-semibold text-ink">
                {item.title} · {item.animal}
              </p>
              <p className="font-body text-[12.5px] text-muted">Dans {item.days} jours</p>
            </div>
            <button
              type="button"
              onClick={() => postpone(item.id)}
              aria-label={`Reporter « ${item.title} » de 7 jours`}
              className="press hidden h-9 rounded-[11px] px-2.5 font-body text-[12.5px] font-semibold text-[#4b5552] hover:bg-white sm:inline-flex sm:items-center"
            >
              +7 j
            </button>
            <button
              type="button"
              onClick={(event) => complete(item.id, event.currentTarget.closest('li'))}
              aria-label={`Marquer « ${item.title} » comme fait`}
              className="press flex h-9 w-9 items-center justify-center rounded-[11px] bg-white text-primary ring-1 ring-line hover:bg-mint"
            >
              <IconCheck className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-[18px] bg-mint-soft px-5 py-8 text-center">
          <IconCheck className="h-7 w-7 text-primary" />
          <p className="mt-3 font-body text-[15px] font-semibold text-ink">Tout est à jour.</p>
          <p className="mt-1 font-body text-[13.5px] text-[#4d5652]">Les prochains rappels se programment au fil des consultations.</p>
        </div>
      ) : (
        <div aria-hidden="true" className="mt-6 rounded-[20px] bg-forest p-4 text-white sm:p-5">
          <div className="flex items-center gap-2 font-body text-[11.5px] text-white/60">
            <Logo variant="mark" className="h-5 w-5 rounded-[6px] bg-white p-0.5" />
            Vet’OPoil · notification · 08:00
          </div>
          <p className="mt-2.5 font-body text-[15px] font-semibold">
            {items[0].title} de {items[0].animal}, dans {items[0].days} jours
          </p>
          <p className="mt-1 font-body text-[13px] leading-relaxed text-white/70">
            Un geste suffit pour le marquer comme fait ou le reporter d’une semaine.
          </p>
          <div className="mt-3.5 flex gap-2">
            <span className="rounded-[10px] bg-white px-3 py-1.5 font-body text-[12px] font-semibold text-forest">Fait</span>
            <span className="rounded-[10px] bg-white/10 px-3 py-1.5 font-body text-[12px] font-semibold text-white">Reporter de 7 jours</span>
          </div>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <p className="font-body text-[13px] text-muted" aria-live="polite">
          {done ? `${done} rappel${done > 1 ? 's' : ''} terminé${done > 1 ? 's' : ''}` : `${items.length} rappels à venir`}
        </p>
        {done ? (
          <button
            type="button"
            onClick={reset}
            className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[13px] font-semibold text-primary hover:bg-mint-soft"
          >
            <IconRefresh className="h-4 w-4" />
            Recommencer
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function DailyLife() {
  return (
    <section id="quotidien" className="relative bg-canvas py-28 md:py-36">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionIntro kicker="Au quotidien" title="Tout ce qui entoure les visites, enfin rangé.">
          Rappels, dépenses, proches qui gardent l’animal, export du dossier : Vet’OPoil s’occupe du reste de
          l’année, pas seulement du jour de la consultation.
        </SectionIntro>
        <div className="mt-14 grid gap-4 md:mt-16 grid-cols-1 lg:grid-cols-12 lg:gap-5">
          <RemindersCard />

          <article data-reveal className="overflow-hidden rounded-[28px] bg-white p-5 shadow-card ring-1 ring-line-soft sm:p-7 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-mint text-primary">
                  <IconWallet className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-title text-[22px] font-semibold tracking-[-0.02em] text-ink">Le budget, sans tableur</h3>
                  <p className="mt-1 max-w-[360px] font-body text-[15px] leading-relaxed text-[#4d5652]">
                    Chaque facture scannée alimente les dépenses par catégorie et par mois.
                  </p>
                </div>
              </div>
              <p className="font-title text-[30px] font-semibold tracking-[-0.03em] text-ink tabular">{euro.format(412.8)}</p>
            </div>
            <WhenVisible className="mt-6 grid min-h-[200px] items-end gap-6 sm:grid-cols-[auto_1fr]">
              <div aria-hidden="true" className="flex items-center gap-5">
                <Donut segments={BUDGET} size={148} stroke={18} centerTop="58 %" centerBottom="vétérinaire" />
                <ul className="flex flex-col gap-2 sm:hidden xl:flex">
                  {BUDGET.map((item) => (
                    <li key={item.key} className="flex items-center gap-2 font-body text-[12.5px] text-[#4d5652]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div aria-hidden="true">
                <MonthlyBars data={MONTHS} formatValue={(value) => `${Math.round(value)} €`} height={170} />
              </div>
            </WhenVisible>
          </article>

          <article data-reveal className="rounded-[28px] bg-white p-5 shadow-card ring-1 ring-line-soft sm:p-7 lg:col-span-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-teal-15 text-[#1d6f76]">
              <IconUsers className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-title text-[22px] font-semibold tracking-[-0.02em] text-ink">Toute la tribu dans la boucle</h3>
            <p className="mt-1 font-body text-[15px] leading-relaxed text-[#4d5652]">
              Invitez un proche ou le pet-sitter par e-mail, avec des droits adaptés.
            </p>
            <ul aria-hidden="true" className="mt-5 flex flex-col gap-2">
              {[
                { initials: 'CD', name: 'Camille', role: 'Propriétaire', tone: 'bg-mint text-primary-pressed' },
                { initials: 'HD', name: 'Hugo', role: 'Lecture seule', tone: 'bg-teal-15 text-[#1d6f76]' },
                { initials: 'IL', name: 'Inès', role: 'Pet-sitter · journal', tone: 'bg-orange-15 text-orange-ink' },
              ].map((person) => (
                <li key={person.name} className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full font-body text-[11px] font-semibold ${person.tone}`}>
                    {person.initials}
                  </span>
                  <span className="font-body text-[14px] font-semibold text-ink">{person.name}</span>
                  <span className="ml-auto font-body text-[12.5px] text-muted">{person.role}</span>
                </li>
              ))}
            </ul>
          </article>

          <article data-reveal className="rounded-[28px] bg-forest p-5 text-white shadow-card sm:p-7 lg:col-span-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-teal">
              <IconBook className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-title text-[22px] font-semibold tracking-[-0.02em]">Le journal de garde</h3>
            <p className="mt-1 font-body text-[15px] leading-relaxed text-white/70">Repas, sorties, humeur : vous suivez la journée à distance.</p>
            <ol aria-hidden="true" className="relative mt-5 flex flex-col gap-3 border-l border-white/15 pl-4">
              {[
                ['08:10', 'Repas · 120 g'],
                ['12:30', 'Balade · 45 min'],
                ['19:05', 'Joueur, bon appétit'],
              ].map(([time, text]) => (
                <li key={time} className="relative font-body text-[13px]">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal ring-4 ring-forest" />
                  <span className="font-semibold text-white tabular">{time}</span>
                  <span className="ml-2 text-white/75">{text}</span>
                </li>
              ))}
            </ol>
          </article>

          <article
            data-reveal
            className="group relative overflow-hidden rounded-[28px] bg-white p-5 shadow-card ring-1 ring-line-soft sm:p-7 lg:col-span-12"
          >
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-mint text-primary">
                  <IconDownload className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-title text-[22px] font-semibold tracking-[-0.02em] text-ink">Le dossier complet, en un PDF</h3>
                  <p className="mt-1 max-w-[560px] font-body text-[15px] leading-relaxed text-[#4d5652]">
                    Mis en page et prêt à imprimer : pour une nouvelle clinique, une pension ou un départ en vacances.
                  </p>
                  <ul aria-label="Contenu du PDF" className="mt-5 flex max-w-[560px] flex-wrap gap-2">
                    {['Identité et puce', 'Historique médical', 'Vaccins', 'Traitements', 'Analyses', 'Courbe de poids', 'Rappels à venir'].map(
                      (item) => (
                        <li
                          key={item}
                          className="rounded-full border border-line bg-canvas px-3 py-1.5 font-body text-[13px] font-medium text-[#3c4542]"
                        >
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
              <div aria-hidden="true" className="relative mx-auto h-[190px] w-[300px]">
                {[0, 1, 2].map((page) => (
                  <div
                    key={page}
                    className={`absolute top-3 h-[160px] w-[122px] rounded-[8px] bg-white p-3 shadow-[0_18px_32px_-16px_rgb(0_0_0/0.35)] ring-1 ring-line-soft transition-transform duration-500 ease-out-quint ${
                      page === 0
                        ? 'left-[22px] -rotate-[9deg] group-hover:-translate-x-4 group-hover:-rotate-[14deg]'
                        : page === 2
                          ? 'left-[156px] rotate-[9deg] group-hover:translate-x-4 group-hover:rotate-[14deg]'
                          : 'left-[89px] z-10 group-hover:-translate-y-3'
                    }`}
                  >
                    <span className="block h-2 w-10 rounded-full bg-primary/70" />
                    {[86, 64, 92, 70, 80, 58].map((width) => (
                      <span key={width} className="mt-2 block h-1.5 rounded-full bg-[#e5ebe9]" style={{ width: `${width}%` }} />
                    ))}
                    {page === 1 ? (
                      <svg viewBox="0 0 80 26" className="mt-2.5 w-full" fill="none">
                        <path d="M2 20 L16 16 L30 18 L44 10 L58 12 L78 5" stroke="#57c9d2" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

const AUDIENCES = [
  {
    id: 'proprietaires',
    tab: 'Propriétaires',
    title: 'Le suivi de votre animal, sans rien oublier.',
    benefits: [
      { Icon: IconPaw, title: 'Un dossier par animal', text: 'Vaccins, traitements, analyses, poids et dépenses dans un historique clair.' },
      { Icon: IconCalendar, title: 'Des rappels à temps', text: 'Vaccins, antiparasitaires et rendez-vous, avant l’échéance.' },
      { Icon: IconShield, title: 'Rien n’entre sans vous', text: 'Ce que le vétérinaire ajoute attend votre validation.' },
      { Icon: IconHandshake, title: 'Des proches impliqués', text: 'Famille et pet-sitter invités avec des droits limités.' },
    ],
    cta: { to: '/inscription/proprietaire', label: 'Créer le carnet de mon animal' },
  },
  {
    id: 'veterinaires-tab',
    tab: 'Vétérinaires',
    title: 'Le dossier complet, dès la salle de consultation.',
    benefits: [
      { Icon: IconQr, title: 'Sans compte obligatoire', text: 'Un code ou un QR code ouvre le dossier pendant 4 heures.' },
      { Icon: IconFile, title: 'Tout en un écran', text: 'Antécédents, vaccins, traitements, poids et documents, sans ressaisie.' },
      { Icon: IconStethoscope, title: 'Une saisie rapide', text: 'Consultation, vaccin, ordonnance ou rappel, validés par le propriétaire.' },
      { Icon: IconClock, title: '« Mes patients »', text: 'Avec un compte clinique, retrouvez les animaux que vous suivez.' },
    ],
    cta: { to: '/inscription/veterinaire', label: 'Ouvrir un espace clinique' },
  },
]

function OwnerMock() {
  return (
    <BrowserFrame label="Espace propriétaire">
      <div className="grid gap-3 bg-canvas p-4 sm:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <p className="font-body text-[12px] font-semibold text-muted">Mes animaux</p>
          {[
            { name: 'Milo', meta: 'Chien · 4 ans', score: 86 },
            { name: 'Luna', meta: 'Chat · 7 ans', score: 72 },
          ].map((animal) => (
            <div key={animal.name} className="flex items-center gap-3 rounded-[16px] bg-white p-3 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-mint font-title text-[15px] font-semibold text-primary-pressed">
                {animal.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[13.5px] font-semibold text-ink">{animal.name}</p>
                <p className="font-body text-[11.5px] text-muted">{animal.meta}</p>
              </div>
              <ScoreRing score={animal.score} size={44} stroke={4} caption="" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="font-body text-[12px] font-semibold text-muted">À venir</p>
          <div className="rounded-[16px] bg-white p-3 shadow-card">
            {['Vermifuge · Luna', 'Vaccin rage · Milo'].map((row, index) => (
              <div key={row} className={`flex items-center justify-between py-1.5 ${index ? 'border-t border-line-soft' : ''}`}>
                <span className="font-body text-[12px] font-medium text-ink">{row}</span>
                <AppChip tone={index ? 'mint' : 'orange'}>{index ? '12 j' : '5 j'}</AppChip>
              </div>
            ))}
          </div>
          <div className="rounded-[16px] bg-forest p-3 text-white">
            <p className="font-body text-[11px] text-white/65">Dépenses sur 6 mois</p>
            <p className="font-title text-[20px] font-semibold tabular">{euro.format(412.8)}</p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function VetMock() {
  return (
    <BrowserFrame label="Portail vétérinaire">
      <div className="bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-title text-[15px] font-semibold text-ink">Mes patients</p>
          <span className="rounded-full bg-mint px-2.5 py-1 font-body text-[11px] font-semibold text-primary-pressed">Clinique du Parc</span>
        </div>
        <table className="mt-3 w-full font-body text-[12px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="pb-2 font-medium">Patient</th>
              <th className="pb-2 font-medium">Dernière visite</th>
              <th className="pb-2 text-right font-medium">Accès</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Milo', meta: 'Chien', date: '12 mars', active: true },
              { name: 'Luna', meta: 'Chat', date: '02 févr.', active: false },
              { name: 'Pepper', meta: 'Lapin', date: '18 janv.', active: false },
              { name: 'Nala', meta: 'Chienne', date: '09 janv.', active: false },
            ].map((row) => (
              <tr key={row.name} className="border-t border-line-soft">
                <td className="py-2.5">
                  <span className="font-semibold text-ink">{row.name}</span>
                  <span className="ml-1.5 text-muted">{row.meta}</span>
                </td>
                <td className="py-2.5 text-[#4d5652]">{row.date}</td>
                <td className="py-2.5 text-right">
                  {row.active ? <AppChip>Actif · 3 h 52</AppChip> : <AppChip tone="ink">Expiré</AppChip>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BrowserFrame>
  )
}

export function Audiences() {
  const scope = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const audience = AUDIENCES[active]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(scope)
        gsap.from(q('[data-audience-item]'), { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.06, ease: 'power3.out' })
        gsap.from(q('[data-audience-mock]'), { autoAlpha: 0, x: 40, rotation: 1.5, duration: 0.8, ease: 'expo.out' })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [active], revertOnUpdate: true },
  )

  const select = (index: number) => {
    if (index !== active) setActive(index)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = active === 0 ? 1 : 0
    select(next)
    document.getElementById(`audience-tab-${AUDIENCES[next].id}`)?.focus()
  }

  return (
    <section ref={scope} id="veterinaires" className="relative overflow-hidden bg-white py-28 md:py-36">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro kicker="Propriétaires et vétérinaires" title="Deux portes d’entrée, un seul dossier." />
          <div
            data-reveal
            role="tablist"
            aria-label="Profil"
            onKeyDown={onKeyDown}
            className="relative grid w-full max-w-[400px] shrink-0 grid-cols-2 rounded-full bg-canvas p-1 ring-1 ring-line"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-[0_8px_18px_-8px_rgb(44_110_99/0.8)] transition-transform duration-500 ease-out-quint"
              style={{ transform: `translateX(${active * 100}%)` }}
            />
            {AUDIENCES.map((item, index) => (
              <button
                key={item.id}
                id={`audience-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-controls="audience-panel"
                tabIndex={index === active ? 0 : -1}
                onClick={() => select(index)}
                className={`relative z-10 rounded-full px-4 py-3 font-body text-[15px] font-semibold transition-colors duration-300 ${
                  index === active ? 'text-white' : 'text-[#4b5552] hover:text-ink'
                }`}
              >
                {item.tab}
              </button>
            ))}
          </div>
        </div>

        <div
          key={audience.id}
          id="audience-panel"
          role="tabpanel"
          aria-labelledby={`audience-tab-${audience.id}`}
          className="mt-14 grid items-center gap-12 grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-5">
            <h3 data-audience-item className="font-title text-[clamp(26px,2.6vw,34px)] font-semibold leading-tight tracking-[-0.03em] text-ink">
              {audience.title}
            </h3>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {audience.benefits.map((benefit) => (
                <li key={benefit.title} data-audience-item className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-mint text-primary">
                    <benefit.Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="font-body text-[15.5px] font-semibold text-ink">{benefit.title}</p>
                    <p className="mt-1 font-body text-[14.5px] leading-relaxed text-[#4d5652]">{benefit.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div data-audience-item className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ButtonLink to={audience.cta.to} size="lg" trailingIcon={<IconArrowRight className="h-[18px] w-[18px]" />}>
                {audience.cta.label}
              </ButtonLink>
              {active === 1 ? (
                <ButtonLink to="/acces" size="lg" variant="ghost">
                  J’ai un code d’accès
                </ButtonLink>
              ) : null}
            </div>
          </div>
          <div data-audience-mock aria-hidden="true" className="lg:col-span-7">
            {active === 0 ? <OwnerMock /> : <VetMock />}
          </div>
        </div>
      </div>
    </section>
  )
}
