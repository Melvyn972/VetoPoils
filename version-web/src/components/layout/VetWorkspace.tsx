import { useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { IconQr, IconSettings, IconStethoscope } from '../icons/Icons'
import { initials } from '../../lib/format'
import { AppShell, RouteTransition, type NavItem } from './AppShell'
import type { ReactNode } from 'react'

const nav: NavItem[] = [
  { to: '/mes-patients', label: 'Mes patients', icon: <IconStethoscope />, end: true },
  { to: '/acces', label: 'Accès par code', icon: <IconQr /> },
  { to: '/compte-veterinaire', label: 'Compte clinique', icon: <IconSettings /> },
]

export function VetWorkspace({ children }: { children: ReactNode }) {
  const { displayName, user, vetProfile, signOut } = useAuth()
  const location = useLocation()
  const name = vetProfile?.nom_complet || displayName || 'Compte clinique'

  return (
    <AppShell
      homeTo="/mes-patients"
      sectionLabel="Espace vétérinaire"
      nav={nav}
      mobileNav={[
        { to: '/mes-patients', label: 'Patients', icon: <IconStethoscope />, end: true },
        { to: '/acces', label: 'Code', icon: <IconQr /> },
        { to: '/compte-veterinaire', label: 'Compte', icon: <IconSettings /> },
      ]}
      account={{
        name,
        detail: vetProfile?.clinique || user?.email || '',
        initials: initials(name),
        links: [{ to: '/compte-veterinaire', label: 'Compte clinique', icon: <IconSettings className="h-[18px] w-[18px]" /> }],
        onSignOut: () => void signOut(),
      }}
    >
      <RouteTransition transitionKey={location.pathname}>{children}</RouteTransition>
    </AppShell>
  )
}
