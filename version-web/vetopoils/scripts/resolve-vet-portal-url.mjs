/** Résout l'URL publique du portail — utilisé au build Vercel et en local. */
export function resolveVetPortalUrl() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) {
    return normalizeOrigin(production)
  }

  const deployment = process.env.VERCEL_URL?.trim()
  if (deployment) {
    return normalizeOrigin(deployment)
  }

  const configured =
    process.env.VITE_VET_WEB_URL?.trim() ?? process.env.NEXT_PUBLIC_VET_WEB_URL?.trim()
  if (configured) {
    return normalizeOrigin(configured)
  }

  return 'http://localhost:5173'
}

function normalizeOrigin(value) {
  const trimmed = value.replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}
