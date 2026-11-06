import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { rememberedAnimal } from '../../lib/routes'
import { OwnerShell } from './OwnerShell'

export function OwnerLayout({ children }: { children: ReactNode }) {
  return <OwnerShell>{children}</OwnerShell>
}

export function QrShortcut() {
  const id = rememberedAnimal()
  return <Navigate to={id ? `/espace/animaux/${id}/code` : '/espace/animaux'} replace />
}
