import type { ReactNode } from 'react'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'

interface MobileShellProps {
  children: ReactNode
  wide?: boolean
}

export function MobileShell({ children, wide = false }: MobileShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-surface">
      <AppHeader wide={wide} />

      <main
        className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 ${
          wide ? 'max-w-6xl' : 'max-w-md'
        }`}
      >
        {children}
      </main>

      <AppFooter wide={wide} />

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
