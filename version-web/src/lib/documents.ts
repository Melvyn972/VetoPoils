import { getSupabase } from './supabase'

export async function getAnimalPhotoSignedUrl(photoPath: string) {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from('animal-photos')
    .createSignedUrl(photoPath, 3600)

  if (error) return null
  return data.signedUrl
}

export async function getDocumentSignedUrl(filePath: string) {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from('animal-documents')
    .createSignedUrl(filePath, 3600)

  if (error) return null
  return data.signedUrl
}

export function isImageMimeType(mimeType?: string | null) {
  return !!mimeType?.startsWith('image/')
}

export function isPdfMimeType(mimeType?: string | null) {
  return mimeType === 'application/pdf' || mimeType?.includes('pdf')
}

export function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
