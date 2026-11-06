import { env, isClarityConfigured } from './env'

export const CONSENT_KEY = 'vetopoil-clarity-consent'
const CONSENT_EVENT = 'vetopoil-consent'

export type ConsentChoice = 'granted' | 'denied'

export type AnalyticsEvent =
  | 'page_view'
  | 'signup_owner'
  | 'signup_vet'
  | 'login'
  | 'animal_created'
  | 'ocr_scan_started'
  | 'ocr_scan_completed'
  | 'ocr_scan_failed'
  | 'qr_generated'
  | 'vet_code_access'
  | 'consultation_added'
  | 'pdf_exported'
  | 'csv_exported'
  | 'share_invite_sent'
  | 'reminder_created'

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityFn
  }
}

export function getStoredConsent(): ConsentChoice | null {
  const value = localStorage.getItem(CONSENT_KEY)
  return value === 'granted' || value === 'denied' ? value : null
}

export function storeConsent(choice: ConsentChoice) {
  localStorage.setItem(CONSENT_KEY, choice)
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function onConsentChange(listener: () => void) {
  window.addEventListener(CONSENT_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function loadClarity() {
  if (!isClarityConfigured() || document.getElementById('clarity-script')) return

  window.clarity =
    window.clarity ||
    ((...args: unknown[]) => {
      const clarity = window.clarity as ClarityFn
      clarity.q = clarity.q || []
      clarity.q.push(args)
    })

  const script = document.createElement('script')
  script.id = 'clarity-script'
  script.async = true
  script.src = `https://www.clarity.ms/tag/${env.clarityProjectId}`
  document.head.appendChild(script)
}

export function applyClarityConsent(choice: ConsentChoice) {
  const analytics = choice === 'granted' ? 'granted' : 'denied'
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: analytics,
  })
  window.clarity?.('consent', choice === 'granted')
}

export function activateAnalytics() {
  if (getStoredConsent() !== 'granted' || !isClarityConfigured()) return
  loadClarity()
  applyClarityConsent('granted')
}

export function trackEvent(name: AnalyticsEvent) {
  if (getStoredConsent() !== 'granted') return
  activateAnalytics()
  window.clarity?.('event', name)
}

export function trackPage(path: string) {
  if (getStoredConsent() !== 'granted') return
  activateAnalytics()
  window.clarity?.('set', 'page', path)
  window.clarity?.('event', 'page_view')
}

export async function hashUserId(id: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function identifyUser(userId: string, role: 'owner' | 'veterinarian') {
  if (getStoredConsent() !== 'granted') return
  activateAnalytics()
  const hashed = await hashUserId(userId)
  window.clarity?.('identify', hashed)
  window.clarity?.('set', 'role', role)
  window.clarity?.('set', 'plan', 'none')
}
