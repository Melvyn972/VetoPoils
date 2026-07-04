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
          <h1 className="font-title text-2xl font-bold text-fg-primary">
            Portail vétérinaire Vet&apos;OPoil
          </h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Scannez le QR code fourni par le propriétaire ou saisissez le code d’accès temporaire
            pour consulter le dossier et enregistrer la consultation.
          </p>
        </div>

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
