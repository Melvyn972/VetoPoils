import type { ReactNode } from 'react'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'

interface MobileShellProps {
  children: ReactNode
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-surface">
      <AppHeader />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</main>

      <AppFooter />

      <button
        type="button"
        aria-label="Aide"
        className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-fg-primary font-body text-lg font-semibold text-surface shadow-md"
      >
        ?
      </button>
    </div>
  )
}
