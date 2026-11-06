import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '../brand/Logo'

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-4 py-8 md:px-16 md:py-14 xl:px-24">
      <Link to="/" className="inline-flex">
        <Logo className="h-12 w-auto md:h-14" />
      </Link>
      <div className="mt-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-sm md:p-8">{children}</div>
    </div>
  )
}
