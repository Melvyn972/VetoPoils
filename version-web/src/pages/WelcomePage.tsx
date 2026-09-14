import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { useVetSession } from '../context/VetSessionContext'

export function WelcomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isConnected } = useAuth()
  const { dossier, isLoading } = useVetSession()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      navigate(`/consultation?token=${encodeURIComponent(token)}`, { replace: true })
      return
    }

    if (isConnected) {
      navigate('/mes-patients', { replace: true })
      return
    }

    if (!isLoading && dossier) {
      navigate('/consultation', { replace: true })
    }
  }, [dossier, isConnected, isLoading, navigate, searchParams])

  return (
    <MobileShell>
      <div className="flex flex-col gap-8 py-6">
        <div className="flex flex-col gap-3">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Portail vétérinaire
          </p>
          <h1 className="font-title text-2xl font-bold text-fg-primary">Vet&apos;OPoil</h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Accédez au carnet de l’animal avec le QR ou le code 6 caractères fourni par le
            propriétaire, puis enregistrez la consultation. L’entrée reste en attente jusqu’à
            validation dans l’app.
          </p>
        </div>

        <ul className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
          <li className="font-body text-sm text-fg-secondary">
            Code temporaire, usage unique - expiré, révoqué ou déjà servi : message clair.
          </li>
          <li className="font-body text-sm text-fg-secondary">
            Compte véto optionnel pour retrouver vos patients et préremplir votre identité.
          </li>
          <li className="font-body text-sm text-fg-secondary">
            Dossier imprimable en PDF depuis la consultation.
          </li>
        </ul>

        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => navigate('/acces')}>
            Saisir un code d&apos;accès
          </Button>
          <Button type="button" onClick={() => navigate('/login')}>
            Connexion vétérinaire
          </Button>
        </div>
      </div>
    </MobileShell>
  )
}
