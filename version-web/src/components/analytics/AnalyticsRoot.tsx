import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import {
  activateAnalytics,
  applyDeniedMeasurement,
  getStoredConsent,
  identifyUser,
  installConsentDefaults,
  onConsentChange,
  storeConsent,
  trackPage,
  type ConsentChoice,
} from '../../lib/analytics'
import { isClarityConfigured, isGaConfigured } from '../../lib/env'

function measurementTools() {
  const tools = [
    isClarityConfigured() ? 'Microsoft Clarity' : null,
    isGaConfigured() ? 'Google Analytics' : null,
  ].filter((tool): tool is string => Boolean(tool))
  if (tools.length === 2) return `${tools[0]} et ${tools[1]}`
  return tools[0] ?? ''
}

export function AnalyticsRoot() {
  const location = useLocation()
  const { user, role } = useAuth()
  const [consent, setConsent] = useState<ConsentChoice | null>(() =>
    typeof window === 'undefined' ? null : getStoredConsent(),
  )
  const tools = measurementTools()

  useEffect(() => onConsentChange(() => setConsent(getStoredConsent())), [])

  useEffect(() => {
    installConsentDefaults()
  }, [])

  useEffect(() => {
    if (consent === 'granted') activateAnalytics()
    else if (consent === 'denied') applyDeniedMeasurement()
  }, [consent])

  useEffect(() => {
    if (consent !== 'granted') return
    trackPage(`${location.pathname}${location.search}`)
  }, [consent, location.pathname, location.search])

  useEffect(() => {
    if (consent !== 'granted' || !user || !role) return
    void identifyUser(user.id, role)
  }, [consent, role, user])

  if (!tools || consent) return null

  function choose(choice: ConsentChoice) {
    storeConsent(choice)
    setConsent(choice)
  }

  return (
    <div role="region" aria-label="Mesure d’audience" className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
        <p className="font-body text-sm text-ink">
          Vet'OPoil mesure l’usage du site (pages visitées et interactions) avec {tools} uniquement si vous
          l’acceptez. Aucun de ces scripts n’est chargé avant ce choix, et la publicité reste désactivée.{' '}
          <Link to="/confidentialite" className="font-semibold text-primary">
            Confidentialité
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded-2xl border border-line px-4 py-2 font-body text-sm font-semibold text-ink"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded-2xl bg-primary px-4 py-2 font-body text-sm font-semibold text-white"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
