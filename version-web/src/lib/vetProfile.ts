import { getSupabase } from './supabase'
import type { VetProfile } from '../types/vetProfile'

export async function fetchVetProfile(userId: string): Promise<VetProfile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('vet_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data as VetProfile | null
}

export async function ensureVetProfile(): Promise<VetProfile> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const { data, error } = await supabase.rpc('ensure_vet_profile')

  if (error) throw error
  return data as VetProfile
}

export async function updateVetProfile(
  userId: string,
  input: Pick<VetProfile, 'nom_complet' | 'clinique' | 'telephone'> & { numero_ordre?: string | null },
) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase non configuré.')

  const payload = {
    nom_complet: input.nom_complet.trim(),
    clinique: input.clinique?.trim() || null,
    telephone: input.telephone?.trim() || null,
    numero_ordre: input.numero_ordre?.trim() || null,
  }

  const { data, error } = await supabase.from('vet_profiles').update(payload).eq('id', userId).select('*').single()

  if (error) {
    const message = error.message.toLowerCase()
    if (!message.includes('numero_ordre')) throw error
    const { data: fallback, error: fallbackError } = await supabase
      .from('vet_profiles')
      .update({
        nom_complet: payload.nom_complet,
        clinique: payload.clinique,
        telephone: payload.telephone,
      })
      .eq('id', userId)
      .select('*')
      .single()
    if (fallbackError) throw fallbackError
    await supabase.auth.updateUser({ data: { numero_ordre: payload.numero_ordre ?? '' } })
    return { ...(fallback as VetProfile), numero_ordre: payload.numero_ordre }
  }

  return data as VetProfile
}
