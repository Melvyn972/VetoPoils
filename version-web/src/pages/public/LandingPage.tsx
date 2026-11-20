import { useEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { ScrollTrigger } from '../../lib/motion'
import { FinalCta, Faq, LandingFooter } from './landing/Closing'
import { Hero, LandingHeader } from './landing/Hero'
import { useLandingMotion } from './landing/landingMotion'
import { QrShowcase } from './landing/QrShowcase'
import { HowItWorks, Story } from './landing/Story'

export function LandingPage() {
  const [params] = useSearchParams()
  const scope = useRef<HTMLDivElement>(null)
  useLandingMotion(scope)

  useEffect(() => {
    let active = true
    void document.fonts?.ready.then(() => {
      if (active) ScrollTrigger.refresh()
    })
    return () => {
      active = false
    }
  }, [])

  const token = params.get('token')
  if (token) return <Navigate to={`/consultation?token=${encodeURIComponent(token)}`} replace />

  return (
    <div ref={scope} data-theme="light" className="relative bg-canvas text-ink">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <div
        data-progress
        role="presentation"
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-primary via-teal to-logo-orange"
        style={{ transform: 'scaleX(0)' }}
      />
      <LandingHeader />
      <main id="contenu" tabIndex={-1} className="outline-none">
        <Hero />
        <Story />
        <HowItWorks />
        <QrShowcase />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
