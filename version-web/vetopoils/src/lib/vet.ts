import { getSupabase } from './supabase'
import type { VetConsultationInput, VetDossier } from '../types/vet'

const VET_TOKEN_STORAGE_KEY = 'vetopoils-vet-token'

export function saveVetToken(token: string) {
  sessionStorage.setItem(VET_TOKEN_STORAGE_KEY, token)
}

export function getStoredVetToken(): string | null {
  return sessionStorage.getItem(VET_TOKEN_STORAGE_KEY)
}

export function clearVetToken() {
  sessionStorage.removeItem(VET_TOKEN_STORAGE_KEY)
}

const VET_ACCESS_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{6}$/

export function normalizeVetAccessCode(value: string) {
  return value.trim().toUpperCase()
}

export function isVetAccessCode(value: string) {
  return VET_ACCESS_CODE_PATTERN.test(normalizeVetAccessCode(value))
}

export async function fetchVetDossier(token: string): Promise<VetDossier> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const { data, error } = await supabase.rpc('vet_get_dossier', {
    p_token: normalizeVetAccessCode(token),
  })

  if (error) throw error
  if (!data) throw new Error('Dossier animal introuvable.')

  return data as VetDossier
}

export async function submitVetConsultation(input: VetConsultationInput) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const descriptionParts = [
    input.clinic?.trim() ? `Clinique : ${input.clinic.trim()}` : null,
    input.notes?.trim() ? input.notes.trim() : null,
  ].filter(Boolean)

  const { data, error } = await supabase.rpc('vet_create_medical_event', {
    p_token: normalizeVetAccessCode(input.token),
    p_type: 'consultation',
    p_titre: `Consultation — ${input.veterinarianName.trim()}`,
    p_diagnostic: input.diagnosis.trim(),
    p_traitement: input.notes?.trim() || null,
    p_poids_kg: input.weightKg ?? null,
    p_description: descriptionParts.join('\n\n') || null,
  })

  if (error) throw error
  return data
}

export async function uploadVetDocument(params: {
  token: string
  dossier: VetDossier
  file: File
}) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const extension = params.file.name.split('.').pop() ?? 'bin'
  const path = `${params.dossier.animal.proprietaire_id}/${params.dossier.animal.id}/${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('animal-documents')
    .upload(path, params.file, {
      contentType: params.file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    const message = uploadError.message.toLowerCase()
    if (message.includes('row-level security') || message.includes('policy')) {
      throw new Error(
        "Upload refusé par Supabase. Exécutez supabase/fix_vet_document_upload.sql dans le SQL Editor.",
      )
    }
    throw uploadError
  }

  const { data, error } = await supabase.rpc('vet_creer_document_metadata', {
    p_token: normalizeVetAccessCode(params.token),
    p_file_path: path,
    p_file_name: params.file.name,
    p_mime_type: params.file.type || 'application/octet-stream',
    p_taille_octets: params.file.size,
    p_category_ocr: null,
  })

  if (error) throw error
  return data
}
