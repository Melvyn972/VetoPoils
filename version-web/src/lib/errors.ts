export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue. Réessayez.') {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''

  const message = raw.trim()
  if (!message) return fallback

  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (normalized.includes('email not confirmed')) return 'Confirmez votre e-mail avant de vous connecter.'
  if (normalized.includes('user already registered')) return 'Un compte existe déjà avec cet e-mail.'
  if (normalized.includes('password')) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) {
    return 'Action non autorisée sur ce dossier.'
  }
  if (normalized.includes('jwt')) return 'Session expirée. Reconnectez-vous.'
  return message
}

export function isMissingRpc(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST202'
  )
}
