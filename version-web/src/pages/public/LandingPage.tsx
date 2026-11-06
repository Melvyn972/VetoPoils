import { useEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { ScrollTrigger } from '../../lib/motion'
import { FinalCta, Faq, LandingFooter, Trust } from './landing/Closing'
import { Audiences, DailyLife } from './landing/Everyday'
import { Hero, LandingHeader, Marquee } from './landing/Hero'
import { useLandingMotion } from './landing/landingMotion'
import { QrShowcase, ScanShowcase, ScoreShowcase } from './landing/Showcases'
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
    <div ref={scope} className="relative bg-canvas text-ink">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <div
        data-progress
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-primary via-teal to-logo-orange"
        style={{ transform: 'scaleX(0)' }}
      />
      <div
        data-cursor
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-primary/60 opacity-0 pointer-fine:block motion-reduce:!hidden"
      />
      <div
        data-cursor-dot
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 pointer-fine:block motion-reduce:!hidden"
      />
      <LandingHeader />
      <main id="contenu" tabIndex={-1} className="outline-none">
        <Hero />
        <Marquee />
        <Story />
        <HowItWorks />
        <ScanShowcase />
        <QrShowcase />
        <ScoreShowcase />
        <DailyLife />
        <Audiences />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
