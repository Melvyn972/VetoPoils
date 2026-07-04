const GUEST_MODE_KEY = 'vetopoils-guest-mode'

export function isGuestModeStored(): boolean {
  return sessionStorage.getItem(GUEST_MODE_KEY) === 'true'
}

export function setGuestMode(): void {
  sessionStorage.setItem(GUEST_MODE_KEY, 'true')
}

export function clearGuestMode(): void {
  sessionStorage.removeItem(GUEST_MODE_KEY)
}

export function getUserDisplayName(metadata: Record<string, unknown> | undefined, email: string | undefined): string {
  const fullName = metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }

  if (email) {
    return email.split('@')[0]
  }

  return 'Utilisateur'
}

export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect'
  }

  if (normalized.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email'
  }

  if (normalized.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères'
  }

  if (normalized.includes('unable to validate email')) {
    return 'Adresse email invalide'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Veuillez confirmer votre email avant de vous connecter'
  }

  return 'Une erreur est survenue. Réessayez.'
}

const OWNER_ACCOUNT_MESSAGE =
  'Ce compte est un compte propriétaire (app mobile). Créez un compte vétérinaire ou connectez-vous sans compte.'

export function mapVetAccountError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('pas un compte vétérinaire') || normalized.includes('pas un compte veterinaire')) {
    return OWNER_ACCOUNT_MESSAGE
  }

  return mapAuthError(message)
}
