import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'

export function WelcomePage() {
  const navigate = useNavigate()
  const { isLoading, isConnected, isGuest, continueAsGuest } = useAuth()

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="font-body text-sm text-fg-secondary">Chargement...</p>
        </div>
      </MobileShell>
    )
  }

  if (isConnected || isGuest) {
    return <Navigate to="/consultation" replace />
  }

  function handleGuestAccess() {
    continueAsGuest()
    navigate('/consultation')
  }

  return (
    <MobileShell>
      <div className="flex flex-col gap-8 py-6">
        <div className="flex flex-col gap-3">
          <h1 className="font-title text-2xl font-bold text-fg-primary">
            Bienvenue sur Vetopoils
          </h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Vous accédez au portail vétérinaire pour renseigner un compte rendu de consultation.
            Connectez-vous ou continuez en invité.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => navigate('/login')}>
            Se connecter / Créer un compte
          </Button>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full rounded-14 border border-fg-tertiary/30 bg-surface px-4 py-3 font-body text-sm font-semibold text-fg-primary transition-colors hover:bg-surface-secondary active:bg-primary-15"
          >
            Continuer en invité
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
