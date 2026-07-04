import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { MobileShell } from '../components/layout/MobileShell'
import { useVetSession } from '../context/VetSessionContext'
import { clearConsultationResult, getConsultationResult } from '../lib/consultation'
import { clearVetToken } from '../lib/vet'

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
  const result = getConsultationResult()
  const { clearSession } = useVetSession()
  const { isConnected } = useAuth()
  const animalName = result?.animalName ?? 'votre animal'

  function handleNewConsultation() {
    clearConsultationResult()
    clearVetToken()
    clearSession()
  }

  return (
    <MobileShell>
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-15 text-primary">
          <CheckIcon />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-title text-2xl font-bold text-fg-primary">
            Événement enregistré
          </h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Les informations ont été transmises au carnet de santé de{' '}
            <span className="font-semibold text-fg-primary">{animalName}</span>. Le propriétaire en
            sera notifié.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {isConnected ? (
            <Link to="/mes-patients" className="font-body text-sm font-semibold text-primary">
              Retour à mes patients
            </Link>
          ) : null}
          <Link
            to="/acces"
            onClick={handleNewConsultation}
            className="font-body text-sm font-semibold text-primary"
          >
            Nouveau QR code
          </Link>
        </div>
      </div>
    </MobileShell>
  )
}
