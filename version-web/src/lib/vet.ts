import { getSupabase } from './supabase'
import { getMedicalEventTypeLabel } from './medicalLabels'
import { toVetError } from './vetErrors'
import type {
  VetAnimalDossier,
  VetConsultationInput,
  VetDossier,
  VetPatientSummary,
} from '../types/vet'

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

function buildEventPayload(input: VetConsultationInput) {
  const descriptionParts = [
    input.clinic?.trim() ? `Clinique : ${input.clinic.trim()}` : null,
    input.notes?.trim() ? input.notes.trim() : null,
  ].filter(Boolean)

  return {
    p_type: input.eventType,
    p_titre: `${getMedicalEventTypeLabel(input.eventType)} — ${input.veterinarianName.trim()}`,
    p_diagnostic: input.diagnosis?.trim() || null,
    p_traitement: input.notes?.trim() || null,
    p_poids_kg: input.weightKg ?? null,
    p_description: descriptionParts.join('\n\n') || null,
  }
}

export async function fetchVetDossier(token: string): Promise<VetDossier> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const { data, error } = await supabase.rpc('vet_get_dossier', {
    p_token: normalizeVetAccessCode(token),
  })

  if (error) throw toVetError(error)
  if (!data) throw new Error('Dossier animal introuvable.')

  return data as VetDossier
}

export async function fetchVetPatients(): Promise<VetPatientSummary[]> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase non configuré.')

  const { data, error } = await supabase.rpc('vet_list_my_animals')
  if (error) throw toVetError(error)

  return (data ?? []) as VetPatientSummary[]
}

export async function fetchVetAnimalDossier(animalId: string): Promise<VetAnimalDossier> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase non configuré.')

  const { data, error } = await supabase.rpc('vet_get_animal_dossier', {
    p_animal_id: animalId,
  })

  if (error) throw toVetError(error)
  if (!data) throw new Error('Dossier animal introuvable.')

  return data as VetAnimalDossier
}

export async function submitVetConsultation(input: VetConsultationInput) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  if (!input.token) {
    throw new Error('Code d’accès requis.')
  }

  const { data, error } = await supabase.rpc('vet_create_medical_event', {
    p_token: normalizeVetAccessCode(input.token),
    ...buildEventPayload(input),
  })

  if (error) throw toVetError(error)
  return data
}

export async function submitVetAnimalEvent(input: VetConsultationInput) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  if (!input.animalId) {
    throw new Error('Animal requis.')
  }

  const { data, error } = await supabase.rpc('vet_create_animal_medical_event', {
    p_animal_id: input.animalId,
    ...buildEventPayload(input),
  })

  if (error) throw toVetError(error)
  return data
}

export async function createVetReminder(input: {
  animalId: string
  type: string
  dateEcheance: string
  titre: string
  notes?: string
}) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase non configuré.')

  const { data, error } = await supabase.rpc('vet_create_reminder', {
    p_animal_id: input.animalId,
    p_type: input.type,
    p_date_echeance: input.dateEcheance,
    p_titre: input.titre,
    p_notes: input.notes?.trim() || null,
    p_canal: 'both',
  })

  if (error) throw toVetError(error)
  return data
}

export async function uploadVetDocument(params: {
  token?: string
  animalId?: string
  dossier: VetDossier
  file: File
  medicalEventId?: string
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
    throw toVetError(uploadError)
  }

  if (params.token) {
    const { data, error } = await supabase.rpc('vet_creer_document_metadata', {
      p_token: normalizeVetAccessCode(params.token),
      p_file_path: path,
      p_file_name: params.file.name,
      p_mime_type: params.file.type || 'application/octet-stream',
      p_taille_octets: params.file.size,
      p_category_ocr: null,
      p_medical_event_id: params.medicalEventId ?? null,
    })

    if (error) throw toVetError(error)
    return data
  }

  if (!params.animalId) {
    throw new Error('Animal requis pour l’upload.')
  }

  const { data, error } = await supabase.rpc('vet_creer_document_animal', {
    p_animal_id: params.animalId,
    p_file_path: path,
    p_file_name: params.file.name,
    p_mime_type: params.file.type || 'application/octet-stream',
    p_taille_octets: params.file.size,
    p_category_ocr: null,
    p_medical_event_id: params.medicalEventId ?? null,
  })

  if (error) throw toVetError(error)
  return data
}
