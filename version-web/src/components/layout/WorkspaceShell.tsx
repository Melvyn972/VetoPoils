import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { Logo } from '../brand/Logo'
import { useAuth } from '../../context/AuthContext'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

function itemClass(active: boolean) {
  return [
    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
    active ? 'bg-primary-15 text-primary' : 'text-muted hover:bg-canvas hover:text-ink',
  ].join(' ')
}

export function WorkspaceShell({
  section,
  items,
  mobileItems,
  children,
}: {
  section: string
  items: NavItem[]
  mobileItems?: NavItem[]
  children: ReactNode
}) {
  const { displayName, signOut } = useAuth()
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
          <NavLink to="/" className="px-2">
            <Logo className="h-12 w-auto" />
          </NavLink>
          <p className="mt-6 px-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {section}
          </p>
          <nav className="mt-3 flex flex-col gap-1">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => itemClass(isActive)}>
                <span className="h-5 w-5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-white/80 px-4 py-3 md:hidden">
            <NavLink to="/">
              <Logo className="h-9 w-auto" />
            </NavLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas font-body text-xs font-semibold text-primary"
              aria-label="Compte"
            >
              {initials || 'VP'}
            </button>
          </header>
          <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-10">{children}</main>
        </div>
      </div>

      {mobileItems ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-2 py-2 md:hidden">
          <ul className="mx-auto flex max-w-lg items-stretch justify-between">
            {mobileItems.map((item) => (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`
                  }
                >
                  <span className="h-5 w-5">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const { displayName, signOut } = useAuth()
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-title text-2xl font-semibold text-ink md:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 font-body text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={() => void signOut()}
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-white font-body text-xs font-semibold text-primary shadow-sm md:flex"
          aria-label={`Déconnexion, ${displayName}`}
        >
          {initials || 'VP'}
        </button>
      </div>
    </div>
  )
}
