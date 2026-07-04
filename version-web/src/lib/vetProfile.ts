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
  input: Pick<VetProfile, 'nom_complet' | 'clinique' | 'telephone'>,
) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase non configuré.')

  const { data, error } = await supabase
    .from('vet_profiles')
    .update({
      nom_complet: input.nom_complet.trim(),
      clinique: input.clinique?.trim() || null,
      telephone: input.telephone?.trim() || null,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as VetProfile
}
