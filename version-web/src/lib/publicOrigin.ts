/** URL publique du portail — sur Vercel = domaine courant, sans variable manuelle. */
export function getVetPortalPublicUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  const production = import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL as string | undefined
  if (production) {
    return normalizeOrigin(production)
  }

  const deployment = import.meta.env.VITE_VERCEL_URL as string | undefined
  if (deployment) {
    return normalizeOrigin(deployment)
  }

  const configured = import.meta.env.VITE_VET_WEB_URL as string | undefined
  if (configured) {
    return normalizeOrigin(configured)
  }

  return 'http://localhost:5173'
}

function normalizeOrigin(value: string) {
  const trimmed = value.replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}
