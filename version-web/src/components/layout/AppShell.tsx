import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { gsap, MOTION_OK, useGSAP } from '../../lib/motion'
import { Logo } from '../brand/Logo'
import { IconArrowLeft, IconChevronDown, IconLogout } from '../icons/Icons'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
  featured?: boolean
}

export interface AccountInfo {
  name: string
  detail: string
  initials: string
  links: Array<{ to: string; label: string; icon: ReactNode }>
  onSignOut: () => void
}

function sideItemClass(isActive: boolean) {
  return [
    'group relative flex h-11 items-center gap-3 rounded-[12px] px-3 font-body text-[14px] transition-colors',
    isActive ? 'bg-mint-soft font-semibold text-primary-pressed' : 'font-medium text-[#56605c] hover:bg-canvas hover:text-ink',
  ].join(' ')
}

function NavBadge({ value }: { value?: number }) {
  if (!value) return null
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-logo-orange px-1.5 font-body text-[11px] font-bold text-[#3d2300] tabular">
      {value > 9 ? '9+' : value}
    </span>
  )
}

export function AccountMenu({ account, variant }: { account: AccountInfo; variant: 'sidebar' | 'compact' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const menu = open ? (
    <div
      className={`absolute z-50 w-60 rounded-[16px] border border-line-soft bg-white p-1.5 shadow-pop ${
        variant === 'sidebar' ? 'bottom-[calc(100%+8px)] left-0' : 'right-0 top-[calc(100%+8px)]'
      }`}
    >
      <div className="border-b border-line-soft px-3 pb-2.5 pt-2">
        <p className="truncate font-body text-sm font-semibold text-ink">{account.name}</p>
        <p className="truncate font-body text-xs text-muted">{account.detail}</p>
      </div>
      <div className="py-1">
        {account.links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-body text-sm text-ink hover:bg-canvas"
          >
            <span className="text-muted">{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            account.onSignOut()
          }}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-body text-sm text-red-ink hover:bg-red-soft"
        >
          <IconLogout className="h-[18px] w-[18px]" />
          Se déconnecter
        </button>
      </div>
    </div>
  ) : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={variant === 'compact' ? `Compte, ${account.name}` : undefined}
        onClick={() => setOpen((current) => !current)}
        className={
          variant === 'sidebar'
            ? 'press flex w-full items-center gap-3 rounded-[14px] p-2 text-left hover:bg-canvas'
            : 'press flex h-10 w-10 items-center justify-center rounded-full bg-mint font-body text-[13px] font-semibold text-primary-pressed'
        }
      >
        {variant === 'sidebar' ? (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint font-body text-[13px] font-semibold text-primary-pressed">
              {account.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-sm font-semibold text-ink">{account.name}</span>
              <span className="block truncate font-body text-xs text-muted">{account.detail}</span>
            </span>
            <IconChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        ) : (
          account.initials
        )}
      </button>
      {menu}
    </div>
  )
}

export function AppShell({
  homeTo,
  sectionLabel,
  nav,
  mobileNav,
  account,
  sidebarExtra,
  sidebarFooter,
  children,
}: {
  homeTo: string
  sectionLabel: string
  nav: NavItem[]
  mobileNav: NavItem[]
  account: AccountInfo
  sidebarExtra?: ReactNode
  sidebarFooter?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-line-soft bg-white lg:flex">
          <div className="px-6 pb-2 pt-6">
            <Link to={homeTo} className="inline-block rounded-[12px]" aria-label="Vet'OPoil, accueil de l’espace">
              <Logo className="h-12 w-auto" />
            </Link>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
            <p className="eyebrow mt-6 px-3 text-[#87918d]">{sectionLabel}</p>
            <nav aria-label="Navigation principale" className="mt-2 flex flex-col gap-0.5">
              {nav.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => sideItemClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <span className={isActive ? 'text-primary' : 'text-[#7d8783] group-hover:text-ink'}>{item.icon}</span>
                      {item.label}
                      <NavBadge value={item.badge} />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            {sidebarExtra}
          </div>
          <div className="flex flex-col gap-3 border-t border-line-soft p-4">
            {sidebarFooter}
            <AccountMenu account={account} variant="sidebar" />
          </div>
        </aside>

        <aside className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col items-center border-r border-line-soft bg-white py-5 md:flex lg:hidden">
          <Link to={homeTo} aria-label="Vet'OPoil, accueil de l’espace" className="rounded-[12px]">
            <Logo variant="mark" className="h-10 w-auto" />
          </Link>
          <nav aria-label="Navigation principale" className="mt-8 flex flex-col items-center gap-1.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                title={item.label}
                className={({ isActive }) =>
                  `press relative flex h-12 w-12 items-center justify-center rounded-[14px] transition-colors ${
                    isActive ? 'bg-mint text-primary-pressed' : 'text-[#6b7470] hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                {item.icon}
                {item.badge ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-logo-orange ring-2 ring-white" />
                ) : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto">
            <AccountMenu account={account} variant="compact" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line-soft bg-white/85 px-4 backdrop-blur-md md:hidden">
            <Link to={homeTo} aria-label="Vet'OPoil, accueil de l’espace" className="rounded-[10px]">
              <Logo className="h-10 w-auto" />
            </Link>
            <AccountMenu account={account} variant="compact" />
          </header>
          <main id="contenu" className="flex-1 px-4 pb-32 pt-6 sm:px-6 md:px-8 md:pb-14 md:pt-8 xl:px-12">
            <div className="mx-auto w-full max-w-[1180px]">{children}</div>
          </main>
        </div>
      </div>

      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-white/92 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-end justify-between">
          {mobileNav.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  item.featured
                    ? 'press mx-auto -mt-6 flex w-fit flex-col items-center gap-1 font-body text-[11px] font-semibold text-primary-pressed'
                    : `press relative flex flex-col items-center gap-1 rounded-[12px] py-1.5 font-body text-[11px] font-medium ${
                        isActive ? 'text-primary-pressed' : 'text-[#727b77]'
                      }`
                }
              >
                {({ isActive }) =>
                  item.featured ? (
                    <>
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_24px_-10px_rgb(44_110_99/0.9)] ring-4 ring-white">
                        {item.icon}
                      </span>
                      {item.label}
                    </>
                  ) : (
                    <>
                      <span className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-mint' : ''}`}>
                        {item.icon}
                        {item.badge ? (
                          <span className="absolute right-2 top-0.5 h-2 w-2 rounded-full bg-logo-orange ring-2 ring-white" />
                        ) : null}
                      </span>
                      {item.label}
                    </>
                  )
                }
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 md:mb-9 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            to={back.to}
            className="mb-4 inline-flex items-center gap-1.5 rounded-[8px] font-body text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <IconArrowLeft className="h-4 w-4" />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="eyebrow text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1.5 font-title text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink md:text-[36px]">
          {title}
        </h1>
        {description ? <p className="mt-2.5 max-w-2xl font-body text-[15px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function RouteTransition({ transitionKey, children }: { transitionKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [transitionKey])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,visibility,transform' },
        )
      })
      return () => mm.revert()
    },
    { dependencies: [transitionKey], revertOnUpdate: true },
  )

  return (
    <div ref={ref} key={transitionKey}>
      {children}
    </div>
  )
}
