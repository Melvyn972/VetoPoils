import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

interface RequireAccessProps {
  children: ReactNode
}

export function RequireAccess({ children }: RequireAccessProps) {
  const { isLoading, isConnected, isGuest } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-body text-sm text-fg-secondary">Chargement...</p>
      </div>
    )
  }

  if (!isConnected && !isGuest) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}
