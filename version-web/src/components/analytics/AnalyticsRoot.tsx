import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import {
  activateAnalytics,
  applyClarityConsent,
  getStoredConsent,
  identifyUser,
  loadClarity,
  onConsentChange,
  storeConsent,
  trackPage,
  type ConsentChoice,
} from '../../lib/analytics'
import { isClarityConfigured } from '../../lib/env'

export function AnalyticsRoot() {
  const location = useLocation()
  const { user, role } = useAuth()
  const [consent, setConsent] = useState<ConsentChoice | null>(() =>
    typeof window === 'undefined' ? null : getStoredConsent(),
  )

  useEffect(() => onConsentChange(() => setConsent(getStoredConsent())), [])

  useEffect(() => {
    if (consent !== 'granted') return
    activateAnalytics()
  }, [consent])

  useEffect(() => {
    if (consent !== 'granted') return
    trackPage(`${location.pathname}${location.search}`)
  }, [consent, location.pathname, location.search])

  useEffect(() => {
    if (consent !== 'granted' || !user || !role) return
    void identifyUser(user.id, role)
  }, [consent, role, user])

  if (!isClarityConfigured() || consent) return null

  function choose(choice: ConsentChoice) {
    storeConsent(choice)
    setConsent(choice)
    if (choice === 'granted') {
      loadClarity()
      applyClarityConsent('granted')
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
        <p className="font-body text-sm text-ink">
          Vet'OPoil mesure l’usage du site avec Microsoft Clarity (pages visitées et interactions)
          uniquement si vous l’acceptez. Aucun suivi n’est lancé avant ce choix.
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
