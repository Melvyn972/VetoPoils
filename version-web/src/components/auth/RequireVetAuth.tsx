import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

interface RequireVetAuthProps {
  children: ReactNode
}

export function RequireVetAuth({ children }: RequireVetAuthProps) {
  const { isLoading, isConnected } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-body text-sm text-fg-secondary">Chargement...</p>
      </div>
    )
  }

  if (!isConnected) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
