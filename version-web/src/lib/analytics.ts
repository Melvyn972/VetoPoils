import { env, isClarityConfigured, isGtmConfigured } from './env'

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
type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    clarity?: ClarityFn
    dataLayer?: unknown[]
    gtag?: GtagFn
  }
}

const CONSENT_DENIED = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
} as const

let consentDefaultInstalled = false

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

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (window.gtag) return
  window.gtag = function gtag() {
    // GTM lit l'objet Arguments, pas un tableau issu d'un paramètre rest.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  } as GtagFn
}

export function installConsentDefaults() {
  if (!isGtmConfigured() || consentDefaultInstalled) return
  ensureGtag()
  window.gtag?.('consent', 'default', { ...CONSENT_DENIED })
  consentDefaultInstalled = true
}

export function applyGtmConsent(choice: ConsentChoice) {
  if (!isGtmConfigured()) return
  installConsentDefaults()
  if (choice === 'granted') {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    return
  }
  window.gtag?.('consent', 'update', { ...CONSENT_DENIED })
}

export function loadGtm() {
  if (!isGtmConfigured() || getStoredConsent() !== 'granted') return
  installConsentDefaults()
  applyGtmConsent('granted')
  if (document.getElementById('gtm-script')) return

  window.gtag?.('js', new Date())
  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${env.gtmId}`
  document.head.appendChild(script)
}

export function loadClarity() {
  if (!isClarityConfigured() || getStoredConsent() !== 'granted' || document.getElementById('clarity-script')) return

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
  if (getStoredConsent() !== 'granted') return
  loadClarity()
  applyClarityConsent('granted')
  loadGtm()
}

export function applyDeniedMeasurement() {
  applyClarityConsent('denied')
  applyGtmConsent('denied')
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
  if (!isGtmConfigured()) return
  ensureGtag()
  window.dataLayer?.push({
    event: 'page_view',
    page_path: path,
    page_title: document.title,
    page_location: new URL(path, window.location.origin).href,
  })
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
