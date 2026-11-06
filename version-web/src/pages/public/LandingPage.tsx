import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { Logo } from '../../components/brand/Logo'

const faqs = [
  {
    question: 'Qui voit le dossier de mon animal ?',
    answer:
      'Vous, les personnes que vous invitez, et un vétérinaire uniquement pendant la durée du code (4 heures). Ensuite le code s’éteint.',
  },
  {
    question: 'Le Smart Scan remplace-t-il mon vétérinaire ?',
    answer:
      'Non. Il propose une lecture du document pour vous faire gagner du temps. Vous relisez et validez avant d’enregistrer.',
  },
  {
    question: 'Que se passe-t-il si je refuse une consultation ?',
    answer:
      'L’événement reste dans l’historique avec le badge « Refusé ». Il n’est pas présenté comme validé.',
  },
  {
    question: 'Mes données sont-elles exportables ?',
    answer:
      'Oui. Depuis les paramètres, vous pouvez télécharger une copie JSON et demander la suppression du compte.',
  },
]

export function LandingPage() {
  const [params] = useSearchParams()
  if (params.get('token')) {
    return <Navigate to={`/consultation?token=${params.get('token')}`} replace />
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" aria-label="Vet'OPoil, accueil">
            <Logo className="h-11 w-auto md:h-12" />
          </Link>
          <nav className="hidden items-center gap-6 font-body text-sm text-muted lg:flex">
            <a href="#concept">Concept</a>
            <a href="#fonctionnement">Fonctionnement</a>
            <a href="#valeurs">Valeurs</a>
            <a href="#confiance">Confiance</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/acces" className="hidden rounded-2xl px-3 py-2 font-body text-sm font-semibold text-primary sm:inline">
              Accès par code
            </Link>
            <Link to="/inscription" className="rounded-2xl bg-primary px-4 py-2 font-body text-sm font-semibold text-white">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section data-animate="hero" className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-body text-sm font-semibold uppercase tracking-[0.16em] text-primary">Carnet de santé animal</p>
            <h1 className="mt-3 max-w-xl font-title text-4xl font-semibold leading-tight md:text-5xl">
              Le carnet de santé de votre animal, enfin vivant.
            </h1>
            <p className="mt-4 max-w-lg font-body text-base leading-relaxed text-muted">
              Smart Scan, code vétérinaire de 4 heures et score de santé : le dossier suit votre animal,
              du salon à la clinique.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/inscription/proprietaire" className="rounded-2xl bg-primary px-5 py-3 text-center font-body text-sm font-semibold text-white">
                Je suis propriétaire
              </Link>
              <Link to="/inscription/veterinaire" className="rounded-2xl border border-line bg-white px-5 py-3 text-center font-body text-sm font-semibold text-ink">
                Je suis vétérinaire
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2">
              {['Smart Scan OCR', 'QR 4 h', 'Score 0–100'].map((chip) => (
                <li key={chip} className="rounded-full bg-primary-15 px-3 py-1 font-body text-xs font-semibold text-primary">
                  {chip}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs text-muted">Dossier</p>
                <p className="font-title text-xl font-semibold">Un animal, une fiche</p>
              </div>
              <span className="rounded-full bg-[#6ABF69]/15 px-3 py-1 font-body text-sm font-semibold text-[#3d8a3c]">
                Score 86
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ['Timeline', 'Consultations à valider'],
                ['Documents', 'Ordonnances et analyses'],
                ['Code 4 h', 'Le véto entre, puis le code s’éteint'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-canvas p-3">
                  <p className="font-body text-sm font-semibold">{title}</p>
                  <p className="mt-1 font-body text-xs text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="concept" data-animate="concept" className="bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-14 md:grid-cols-2 md:px-8">
            <article className="rounded-3xl bg-canvas p-6">
              <h2 className="font-title text-2xl font-semibold">Avant</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted">
                Papiers dans un tiroir, photos perdues, le vétérinaire qui redemande l’historique à chaque visite.
              </p>
            </article>
            <article className="rounded-3xl bg-primary p-6 text-white">
              <h2 className="font-title text-2xl font-semibold">Avec Vet'OPoil</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-white/85">
                Un dossier vivant : vous scannez, vous partagez un code, vous validez ce que le vétérinaire ajoute.
              </p>
            </article>
          </div>
        </section>

        <section id="fonctionnement" data-animate="steps" className="mx-auto max-w-[1440px] px-4 py-14 md:px-8">
          <h2 className="font-title text-3xl font-semibold">Comment ça marche</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Vous générez un code', 'Depuis la fiche, un QR et un code de 6 caractères valables 4 heures.'],
              ['2', 'Le vétérinaire le saisit', 'Il ouvre le dossier sans créer de compte, ou depuis son espace clinique.'],
              ['3', 'Vous validez', 'La consultation arrive en attente. Vous l’acceptez ou vous la refusez.'],
            ].map(([step, title, text]) => (
              <li key={step} className="rounded-3xl border border-line bg-white p-5">
                <span className="font-title text-sm font-semibold text-logo-orange">Étape {step}</span>
                <h3 className="mt-2 font-title text-lg font-semibold">{title}</h3>
                <p className="mt-2 font-body text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="valeurs" data-animate="pillars" className="bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-14 md:grid-cols-3 md:px-8">
            {[
              ['Smart Scan', 'Photographiez une ordonnance ou un PDF. Relisez la proposition, puis enregistrez-la dans le dossier.'],
              ['QR éphémère', 'Le véto entre. Puis le QR s’éteint. Quatre heures, pas un accès permanent.'],
              ['Score santé', 'Un score de 0 à 100, calculé à partir des rappels, du poids et des consultations.'],
            ].map(([title, text]) => (
              <article key={title} className="rounded-3xl bg-canvas p-6">
                <h2 className="font-title text-xl font-semibold">{title}</h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="confiance" data-animate="trust" className="mx-auto max-w-[1440px] px-4 py-14 md:px-8">
          <h2 className="font-title text-3xl font-semibold">Confiance et RGPD</h2>
          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted">
            Les documents restent rattachés au propriétaire. Le partage se fait par invitation e-mail.
            Vous exportez ou supprimez vos données depuis le compte. Aucune mesure d’audience n’est
            lancée avant votre consentement.
          </p>
        </section>

        <section id="faq" data-animate="faq" className="bg-white">
          <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-8">
            <h2 className="font-title text-3xl font-semibold">Questions fréquentes</h2>
            <div className="mt-6 grid gap-3">
              {faqs.map((item) => (
                <details key={item.question} className="rounded-2xl border border-line bg-canvas px-4 py-3">
                  <summary className="cursor-pointer font-body text-sm font-semibold">{item.question}</summary>
                  <p className="mt-2 font-body text-sm text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section data-animate="cta" className="mx-auto grid max-w-[1440px] gap-4 px-4 py-14 md:grid-cols-3 md:px-8">
          {[
            ['Propriétaire', 'Créer le carnet', '/inscription/proprietaire'],
            ['Vétérinaire', 'Ouvrir un compte clinique', '/inscription/veterinaire'],
            ['Code', 'Accéder à un dossier', '/acces'],
          ].map(([title, text, href]) => (
            <Link key={href} to={href} className="rounded-3xl bg-primary p-6 text-white">
              <p className="font-title text-xl font-semibold">{title}</p>
              <p className="mt-2 font-body text-sm text-white/85">{text}</p>
            </Link>
          ))}
        </section>
      </main>

      <footer className="border-t border-line px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Logo className="h-10 w-auto" />
          <div className="flex gap-4 font-body text-sm text-muted">
            <Link to="/cgu">CGU</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/connexion">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
