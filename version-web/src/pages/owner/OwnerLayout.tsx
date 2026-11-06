import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { IconBell, IconHome, IconPaw, IconQr, IconShare, IconUser } from '../../components/icons/Icons'
import { WorkspaceShell, type NavItem } from '../../components/layout/WorkspaceShell'
import { rememberedAnimal } from '../../lib/routes'

const items: NavItem[] = [
  { to: '/espace', label: 'Tableau de bord', icon: <IconHome />, end: true },
  { to: '/espace/animaux', label: 'Mes animaux', icon: <IconPaw /> },
  { to: '/espace/rappels', label: 'Rappels', icon: <IconBell /> },
  { to: '/espace/partage', label: 'Partage', icon: <IconShare /> },
  { to: '/espace/compte', label: 'Paramètres', icon: <IconUser /> },
]

export function OwnerLayout({ children }: { children: ReactNode }) {
  const mobile: NavItem[] = [
    { to: '/espace', label: 'Accueil', icon: <IconHome />, end: true },
    { to: '/espace/animaux', label: 'Animaux', icon: <IconPaw /> },
    { to: '/espace/code', label: 'QR', icon: <IconQr /> },
    { to: '/espace/rappels', label: 'Rappels', icon: <IconBell /> },
    { to: '/espace/compte', label: 'Compte', icon: <IconUser /> },
  ]

  return (
    <WorkspaceShell section="Espace propriétaire" items={items} mobileItems={mobile}>
      {children}
    </WorkspaceShell>
  )
}

export function QrShortcut() {
  const id = rememberedAnimal()
  return <Navigate to={id ? `/espace/animaux/${id}/code` : '/espace/animaux'} replace />
}
