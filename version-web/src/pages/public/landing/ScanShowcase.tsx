import { useRef, useState, type KeyboardEvent } from 'react'
import { TextPlugin } from 'gsap/TextPlugin'

import { IconCheck, IconScan } from '../../../components/icons/Icons'
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../../../lib/motion'
import { SectionIntro } from './Kit'
import { SCAN_DOCS, type ScanDoc } from './scanDocs'

gsap.registerPlugin(TextPlugin)

function ScanPaper({ doc }: { doc: ScanDoc }) {
  return (
    <div
      data-scan-paper
      className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[6px] bg-[#fffdf8] px-6 pb-8 pt-6 text-[#2b2b2b] sm:px-8"
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-teal opacity-0"
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
          timeline.fromTo(
            field,
            { text: '' },
            { text: value, duration: Math.max(0.35, value.length * 0.03), ease: 'none' },
            1.3 + index * 0.18,
          )
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

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: -active,
      End: SCAN_DOCS.length - 1 - active,
    }
    const delta = keys[event.key]
    if (delta === undefined) return
    event.preventDefault()
    const next = (active + delta + SCAN_DOCS.length) % SCAN_DOCS.length
    setActive(next)
    document.getElementById(`scan-tab-${SCAN_DOCS[next].id}`)?.focus()
  }

  return (
    <section
      ref={scope}
      id="smart-scan"
      aria-labelledby="smart-scan-title"
      className="on-dark grain relative overflow-hidden bg-forest-deep py-28 text-white md:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgb(87_201_210/0.18),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-12 lg:items-end">
          <SectionIntro
            kicker="Smart Scan"
            titleId="smart-scan-title"
            title="Une photo. Le dossier fait le tri."
            light
            className="lg:col-span-7"
          >
            Photographiez une ordonnance, une facture ou un résultat d’analyse. Smart Scan lit le document et propose
            la catégorie, le titre, la date et le montant. Vous vérifiez, vous corrigez si besoin, puis vous
            enregistrez.
          </SectionIntro>
          <div className="lg:col-span-5 lg:pb-2">
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
                  <span
                    data-scan-save
                    className="inline-flex rounded-[13px] bg-teal px-4 py-3 font-body text-[14px] font-semibold text-forest-deep"
                  >
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
