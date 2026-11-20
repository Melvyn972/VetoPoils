import { useRef, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '../../../components/brand/Logo'
import { IconPlus } from '../../../components/icons/Icons'
import { ButtonLink } from '../../../components/ui/Button'
import { gsap, MOTION_OK, prefersReducedMotion, useGSAP } from '../../../lib/motion'
import { SectionIntro } from './Kit'

const FAQ = [
  {
    question: 'Vet’OPoil remplace-t-il le carnet de santé officiel ?',
    answer:
      'Non, il le complète. Le carnet officiel et le passeport européen restent les documents de référence ; Vet’OPoil réunit autour d’eux tout le reste du suivi : ordonnances, analyses, rappels, poids et dépenses.',
  },
  {
    question: 'Mon vétérinaire doit-il créer un compte ?',
    answer:
      'Non. Il ouvre le dossier avec le code ou le QR code que vous lui présentez, pendant 4 heures. S’il le souhaite, un compte clinique lui permet de retrouver ses patients dans « Mes patients ».',
  },
  {
    question: 'Que se passe-t-il au bout des 4 heures ?',
    answer:
      'L’accès se ferme automatiquement. Vous pouvez aussi le révoquer avant la fin, et générer un nouveau code pour le prochain rendez-vous.',
  },
  {
    question: 'Comment fonctionne Smart Scan ?',
    answer:
      'Vous photographiez ou importez un document. Smart Scan propose la catégorie, le titre, la date et le montant ; rien n’est enregistré tant que vous n’avez pas vérifié et validé.',
  },
  {
    question: 'Puis-je partager le dossier avec ma famille ou un pet-sitter ?',
    answer:
      'Oui. Vous invitez une personne par e-mail, en lecture seule ou avec le droit d’écrire dans le journal, et vous retirez l’accès quand vous le souhaitez.',
  },
  {
    question: 'Où sont stockées mes données, et puis-je les récupérer ?',
    answer:
      'Dans l’Union européenne (région Paris). Depuis votre compte, vous exportez l’ensemble de vos données au format JSON, et vous pouvez supprimer votre compte à tout moment.',
  },
  {
    question: 'Y a-t-il une application mobile ?',
    answer:
      'Vet’OPoil fonctionne dans le navigateur et s’installe sur l’écran d’accueil de votre téléphone, comme une application.',
  },
]

export function Faq() {
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const details = event.currentTarget
    if (!details.open || prefersReducedMotion()) return
    const answer = details.querySelector('[data-faq-answer]')
    if (answer) gsap.fromTo(answer, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' })
  }

  return (
    <section id="faq" className="relative bg-white py-28 md:py-36">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-12 px-5 sm:px-8">
        <SectionIntro kicker="Questions fréquentes" title="Ce que l’on nous demande souvent.">
          Une autre question ? Écrivez-nous depuis votre compte, nous répondons rapidement.
        </SectionIntro>
        <div>
          {FAQ.map((item) => (
            <details key={item.question} onToggle={onToggle} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-title text-[19px] font-semibold tracking-[-0.015em] text-ink md:text-[21px] [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-primary transition-[transform,background-color] duration-300 ease-out-quint group-open:rotate-45 group-open:bg-mint"
                >
                  <IconPlus className="h-[18px] w-[18px]" />
                </span>
              </summary>
              <p data-faq-answer className="max-w-[680px] pb-7 pr-14 font-body text-[16px] leading-relaxed text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(scope)
        gsap.to(q('[data-breathe]'), { scale: 1.06, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className="on-dark grain relative overflow-hidden bg-forest-deep py-28 text-white md:py-40">
      <div
        data-halo
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(87_201_210/0.22),rgb(251_168_75/0.06)_45%,transparent_68%)]"
      />
      <div className="relative mx-auto flex max-w-[980px] flex-col items-center px-5 text-center sm:px-8">
        <div data-breathe className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-white shadow-pop">
          <Logo variant="mark" className="h-16 w-16" />
        </div>
        <h2 className="mt-10 font-title text-[clamp(44px,7vw,96px)] font-semibold leading-[0.98] tracking-[-0.045em]">
          Son dossier commence aujourd’hui.
        </h2>
        <p className="mt-7 max-w-[560px] font-body text-[18px] leading-relaxed text-white/75">
          Quelques minutes suffisent pour créer la première fiche. Votre vétérinaire, lui, n’aura besoin que d’un code.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/inscription/proprietaire" size="lg" variant="light">
            Créer le carnet de mon animal
          </ButtonLink>
          <ButtonLink to="/inscription/veterinaire" size="lg" variant="outline-light">
            Ouvrir un espace clinique
          </ButtonLink>
        </div>
        <p className="mt-6 font-body text-[14px] text-white/60">
          Vous êtes vétérinaire et avez reçu un code ?{' '}
          <Link to="/acces" className="font-semibold text-white underline underline-offset-4">
            Ouvrir le dossier
          </Link>
        </p>
      </div>
    </section>
  )
}

export function LandingFooter() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { href: '#concept', label: 'Le concept' },
        { href: '#fonctionnement', label: 'Fonctionnement' },
        { href: '#faq', label: 'Questions fréquentes' },
      ],
    },
    {
      title: 'Accès',
      links: [
        { to: '/connexion', label: 'Se connecter' },
        { to: '/inscription', label: 'Créer un compte' },
        { to: '/acces', label: 'Accès vétérinaire' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { to: '/cgu', label: 'Conditions d’utilisation' },
        { to: '/confidentialite', label: 'Politique de confidentialité' },
      ],
    },
  ]

  return (
    <footer className="bg-white">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo className="h-16 w-auto" />
          <p className="mt-5 max-w-[340px] font-body text-[15px] leading-relaxed text-muted">
            Le carnet de santé numérique des chiens, chats et NAC, partagé avec les vétérinaires au bon moment.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title} className="md:col-span-2">
            <p className="eyebrow text-muted">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {'href' in link ? (
                    <a href={link.href} className="font-body text-[15px] text-ink transition-colors hover:text-primary">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.to} className="font-body text-[15px] text-ink transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-5 py-6 font-body text-[13px] text-muted sm:px-8">
          <p>© 2026 Vet’OPoil</p>
          <p>Conçu en France pour les animaux et ceux qui les soignent.</p>
        </div>
      </div>
    </footer>
  )
}
