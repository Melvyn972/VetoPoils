import { Link, useNavigate } from 'react-router-dom'

import { Logo } from '../brand/Logo'
import { useAuth } from '../../context/AuthContext'
import { useVetSession } from '../../context/VetSessionContext'

export function AppHeader({ wide = false }: { wide?: boolean }) {
  const navigate = useNavigate()
  const { dossier } = useVetSession()
  const { isConnected, displayName, signOut } = useAuth()
  const animalName = dossier?.animal.nom

  return (
    <header className="border-b border-line-soft bg-white/90 backdrop-blur-md">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 ${
          wide ? 'max-w-6xl' : 'max-w-md'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Logo variant="mark" className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <span className="block font-title text-sm font-semibold text-fg-primary sm:text-base">
              Vet&apos;OPoil
            </span>
            {wide && animalName ? (
              <span className="hidden font-body text-xs text-fg-tertiary sm:block">
                Consultation sécurisée · {animalName}
              </span>
            ) : (
              <span className="hidden font-body text-xs text-fg-tertiary sm:block">
                Portail vétérinaire
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {animalName ? (
            <span className="rounded-12 bg-primary-15 px-3 py-1.5 font-body text-xs font-medium text-primary sm:text-sm">
              {animalName}
            </span>
          ) : (
            <span className="font-body text-xs text-fg-tertiary">Portail sécurisé</span>
          )}
          {isConnected ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/mes-patients')}
                className="font-body text-xs text-primary underline"
              >
                Mes patients
              </button>
              <Link to="/acces" className="font-body text-xs text-primary underline">
                Accès par code
              </Link>
              <Link to="/compte-veterinaire" className="font-body text-xs text-primary underline">
                Clinique
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="font-body text-xs text-fg-tertiary underline"
              >
                {displayName} · Déconnexion
              </button>
            </>
          ) : (
            <Link to="/connexion" className="font-body text-xs text-primary underline">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
