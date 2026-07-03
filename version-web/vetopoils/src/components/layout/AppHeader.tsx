import { useVetSession } from '../../context/VetSessionContext'
import logoVp from '../../assets/logo-vp.svg'

export function AppHeader() {
  const { dossier } = useVetSession()
  const animalName = dossier?.animal.nom

  return (
    <header className="border-b border-fg-tertiary/20 bg-surface">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={logoVp}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="truncate font-title text-sm font-semibold text-fg-primary">
            Vetopoils — Accès Vétérinaire
          </span>
        </div>
        {animalName ? (
          <span className="shrink-0 rounded-12 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
            {animalName}
          </span>
        ) : (
          <span className="shrink-0 font-body text-xs text-fg-tertiary">Portail sécurisé</span>
        )}
      </div>
    </header>
  )
}
