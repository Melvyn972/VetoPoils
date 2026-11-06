import { useMemo, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { AnimalAvatar } from '../../components/animal/AnimalAvatar'
import {
  IconBell,
  IconHandshake,
  IconHome,
  IconPaw,
  IconPlus,
  IconQr,
  IconSettings,
  IconShare,
  IconUser,
} from '../../components/icons/Icons'
import { AppShell, RouteTransition, type NavItem } from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import { OwnerDataContext, type OwnerData } from '../../context/ownerData'
import { fetchAnimals, fetchReminders } from '../../features/owner/api'
import { useAsync } from '../../hooks/useAsync'
import { daysUntil, initials } from '../../lib/format'

function transitionKeyFor(pathname: string) {
  const animalMatch = pathname.match(/^\/espace\/animaux\/([0-9a-f-]{36})/)
  return animalMatch ? `/espace/animaux/${animalMatch[1]}` : pathname
}

function SidebarAnimals({ data }: { data: OwnerData }) {
  if (!data.animals || data.animals.length === 0) return null
  return (
    <div className="mt-7">
      <p className="eyebrow px-3 text-[#87918d]">Mes animaux</p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {data.animals.slice(0, 6).map((animal) => (
          <li key={animal.id}>
            <NavLink
              to={`/espace/animaux/${animal.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[12px] px-2.5 py-2 font-body text-sm transition-colors ${
                  isActive ? 'bg-mint-soft font-semibold text-primary-pressed' : 'text-[#3f4744] hover:bg-canvas'
                }`
              }
            >
              <AnimalAvatar animal={animal} size="xs" />
              <span className="min-w-0 flex-1 truncate">{animal.nom}</span>
              {animal.score_sante != null ? (
                <span className="font-body text-xs font-semibold text-muted tabular">{animal.score_sante}</span>
              ) : null}
            </NavLink>
          </li>
        ))}
        <li>
          <Link
            to="/espace/animaux/nouveau"
            className="flex items-center gap-3 rounded-[12px] px-2.5 py-2 font-body text-sm font-medium text-primary hover:bg-mint-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-dashed border-primary/40">
              <IconPlus className="h-4 w-4" />
            </span>
            Ajouter un animal
          </Link>
        </li>
      </ul>
    </div>
  )
}

function SidebarQrCard() {
  return (
    <Link
      to="/espace/code"
      className="group relative overflow-hidden rounded-[18px] bg-forest p-4 text-white transition-transform duration-300 hover:-translate-y-0.5"
    >
      <span aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal/25 blur-xl" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/12 text-[#9fe7d6]">
        <IconQr className="h-[18px] w-[18px]" />
      </span>
      <p className="relative mt-3 font-body text-sm font-semibold">Rendez-vous chez le vétérinaire ?</p>
      <p className="relative mt-1 font-body text-xs leading-relaxed text-white/70">
        Un QR ouvre le dossier pendant 4 heures, puis l’accès se referme seul.
      </p>
    </Link>
  )
}

export function OwnerShell({ children }: { children?: ReactNode }) {
  const { profile, displayName, user, signOut } = useAuth()
  const location = useLocation()
  const animals = useAsync(fetchAnimals)
  const reminders = useAsync(() => fetchReminders())

  const dueReminders = useMemo(
    () =>
      (reminders.data ?? []).filter((reminder) => reminder.statut === 'actif' && daysUntil(reminder.date_echeance) <= 7)
        .length,
    [reminders.data],
  )

  const data: OwnerData = {
    animals: animals.data,
    loading: animals.loading,
    error: animals.error,
    reloadAnimals: animals.reload,
    dueReminders,
    reloadReminders: reminders.reload,
  }

  const name = [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || displayName || 'Mon compte'

  const nav: NavItem[] = [
    { to: '/espace', label: 'Tableau de bord', icon: <IconHome />, end: true },
    { to: '/espace/animaux', label: 'Mes animaux', icon: <IconPaw /> },
    { to: '/espace/rappels', label: 'Rappels', icon: <IconBell />, badge: dueReminders },
    { to: '/espace/partage', label: 'Partage', icon: <IconShare /> },
    { to: '/espace/partenaires', label: 'Partenaires', icon: <IconHandshake /> },
    { to: '/espace/compte', label: 'Paramètres', icon: <IconSettings /> },
  ]

  const mobileNav: NavItem[] = [
    { to: '/espace', label: 'Accueil', icon: <IconHome />, end: true },
    { to: '/espace/animaux', label: 'Animaux', icon: <IconPaw /> },
    { to: '/espace/code', label: 'Code véto', icon: <IconQr className="h-6 w-6" />, featured: true },
    { to: '/espace/rappels', label: 'Rappels', icon: <IconBell />, badge: dueReminders },
    { to: '/espace/compte', label: 'Compte', icon: <IconUser /> },
  ]

  return (
    <OwnerDataContext.Provider value={data}>
      <AppShell
        homeTo="/espace"
        sectionLabel="Espace propriétaire"
        nav={nav}
        mobileNav={mobileNav}
        account={{
          name,
          detail: user?.email ?? '',
          initials: initials(name),
          links: [
            { to: '/espace/compte', label: 'Paramètres du compte', icon: <IconSettings className="h-[18px] w-[18px]" /> },
            { to: '/espace/partage', label: 'Invitations reçues', icon: <IconShare className="h-[18px] w-[18px]" /> },
          ],
          onSignOut: () => void signOut(),
        }}
        sidebarExtra={<SidebarAnimals data={data} />}
        sidebarFooter={<SidebarQrCard />}
      >
        <RouteTransition transitionKey={transitionKeyFor(location.pathname)}>
          {children ?? <Outlet />}
        </RouteTransition>
      </AppShell>
    </OwnerDataContext.Provider>
  )
}
