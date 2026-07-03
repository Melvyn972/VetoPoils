import { Link, useSearchParams } from 'react-router-dom'

import { MobileShell } from '../components/layout/MobileShell'
import { clearConsultationResult, getConsultationResult } from '../lib/consultation'

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function SuccessPage() {
  const [searchParams] = useSearchParams()
  const result = getConsultationResult()
  const animalName = result?.animalName ?? 'votre animal'

  const query = searchParams.toString()
  const homeLink = query ? `/?${query}` : '/'

  function handleNewConsultation() {
    clearConsultationResult()
  }

  return (
    <MobileShell>
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-15 text-primary">
          <CheckIcon />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-title text-2xl font-bold text-fg-primary">
            Consultation enregistrée
          </h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Les informations ont été transmises au carnet de santé de{' '}
            <span className="font-semibold text-fg-primary">{animalName}</span>. Le propriétaire en
            sera notifié.
          </p>
        </div>

        <Link
          to={homeLink}
          onClick={handleNewConsultation}
          className="font-body text-sm font-semibold text-primary"
        >
          Nouvelle consultation
        </Link>
      </div>
    </MobileShell>
  )
}
