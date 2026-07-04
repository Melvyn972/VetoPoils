import type { PostgrestError } from '@supabase/supabase-js'

function getMessage(error: PostgrestError | Error): string {
  if ('message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Erreur inconnue'
}

export function mapVetRpcError(error: PostgrestError | Error): string {
  const message = getMessage(error)
  const normalized = message.toLowerCase()

  if (
    normalized.includes('déjà utilisé') ||
    normalized.includes('deja utilise') ||
    normalized.includes('already used')
  ) {
    return 'Ce code a déjà servi pour une consultation. Demandez un nouveau QR code au propriétaire.'
  }

  if (normalized.includes('expiré') || normalized.includes('expire')) {
    return 'Ce code a expiré. Demandez au propriétaire d’en générer un nouveau.'
  }

  if (normalized.includes('révoqué') || normalized.includes('revoque')) {
    return 'Ce code a été révoqué par le propriétaire.'
  }

  if (normalized.includes('invalide') || normalized.includes('invalid')) {
    return 'Code d’accès invalide. Vérifiez le code saisi.'
  }

  if (normalized.includes('row-level security') || normalized.includes('policy')) {
    return 'Accès au document refusé. Réessayez ou demandez un nouveau QR code au propriétaire.'
  }

  if (
    normalized.includes('mime') ||
    normalized.includes('content type') ||
    normalized.includes('invalid file')
  ) {
    return 'Format de fichier non accepté. Utilisez un PDF ou une image (JPEG, PNG, WebP).'
  }

  if (normalized.includes('size') || normalized.includes('too large') || normalized.includes('payload')) {
    return 'Fichier trop volumineux (20 Mo maximum).'
  }

  if (normalized.includes('already exists') || normalized.includes('duplicate')) {
    return 'Ce fichier existe déjà. Renommez-le ou réessayez.'
  }

  if (normalized.includes('poids') || normalized.includes('weight')) {
    return 'Le poids indiqué n’est pas valide.'
  }

  // Ne jamais afficher le message brut Postgres/PostgREST à l'utilisateur
  return 'Impossible de finaliser l’opération. Vérifiez le code d’accès et réessayez.'
}

export function toVetError(error: unknown): Error {
  if (error instanceof Error && 'code' in error) {
    return new Error(mapVetRpcError(error as PostgrestError))
  }

  if (error instanceof Error) {
    return new Error(mapVetRpcError(error))
  }

  return new Error(mapVetRpcError(new Error('Erreur inconnue')))
}
