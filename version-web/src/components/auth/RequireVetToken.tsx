import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useVetSession } from '../../context/VetSessionContext'

interface RequireVetTokenProps {
  children: ReactNode
}

export function RequireVetToken({ children }: RequireVetTokenProps) {
  const { isLoading, token, dossier, error } = useVetSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-body text-sm text-fg-secondary">Chargement du dossier...</p>
      </div>
    )
  }

  if (!token || !dossier) {
    return (
      <Navigate
        to="/acces"
        replace
        state={{ from: location.pathname, error: error ?? 'Code d’accès requis.' }}
      />
    )
  }

  return children
}
