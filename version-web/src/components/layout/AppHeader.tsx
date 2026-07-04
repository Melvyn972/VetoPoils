import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useVetSession } from '../../context/VetSessionContext'
import logoVp from '../../assets/logo-vp.svg'

export function AppHeader({ wide = false }: { wide?: boolean }) {
  const navigate = useNavigate()
  const { dossier } = useVetSession()
  const { isConnected, displayName, signOut } = useAuth()
  const animalName = dossier?.animal.nom

  return (
    <header className="border-b border-fg-tertiary/20 bg-surface">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 ${
          wide ? 'max-w-6xl' : 'max-w-md'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoVp}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <span className="block truncate font-title text-sm font-semibold text-fg-primary sm:text-base">
              Vetopoils — Accès Vétérinaire
            </span>
            {wide && animalName ? (
              <span className="hidden font-body text-xs text-fg-tertiary sm:block">
                Consultation sécurisée · {animalName}
              </span>
            ) : null}
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
                className="hidden font-body text-xs text-primary underline sm:block"
              >
                Mes patients
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="hidden font-body text-xs text-fg-tertiary underline sm:block"
              >
                {displayName} · Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden font-body text-xs text-primary underline sm:block">
              Connexion véto
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
