import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export function RequireOwner({ children }: { children: ReactNode }) {
  const { isLoading, isOwner, isVet } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-body text-sm text-muted">Chargement…</p>
      </div>
    )
  }

  if (isVet) return <Navigate to="/mes-patients" replace />
  if (!isOwner) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  return children
}
