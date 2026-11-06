import { trackEvent } from '../../lib/analytics'
import { getErrorMessage, isMissingRpc } from '../../lib/errors'
import { requireSupabase } from '../../lib/supabase'
import type {
  Animal,
  AnimalAccess,
  AnimalDocument,
  AnimalShare,
  DailyLog,
  Expense,
  ExpenseCategory,
  MedicalEvent,
  MedicalEventType,
  OwnerProfile,
  PartageRole,
  Reminder,
  ReminderChannel,
  ReminderStatus,
  VetAccessTokenRow,
} from '../../types/owner'

function ownerIdFromProfile(profile: Pick<OwnerProfile, 'id' | 'compte_proprietaire_id'> | null, userId: string) {
  return profile?.compte_proprietaire_id ?? profile?.id ?? userId
}

export async function fetchOwnerProfile(userId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return (data as OwnerProfile | null) ?? null
}

export async function ensureOwnerProfile() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('ensure_owner_profile')
  if (error) throw error
  return data as OwnerProfile
}

export async function updateOwnerProfile(userId: string, values: { nom: string; prenom: string }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .update({ nom: values.nom.trim(), prenom: values.prenom.trim() })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as OwnerProfile
}

export async function fetchAnimals() {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('animaux')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Animal[]
}

export async function fetchAnimal(id: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('animaux')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  return (data as Animal | null) ?? null
}

export async function createAnimal(values: {
  nom: string
  espece: string
  race?: string | null
  date_naissance?: string | null
  sexe?: Animal['sexe']
  couleur?: string | null
  puce?: string | null
  poidsKg?: number | null
}) {
  const supabase = requireSupabase()
  const payload = {
    nom: values.nom.trim(),
    espece: values.espece.trim(),
    race: values.race?.trim() || null,
    date_naissance: values.date_naissance || null,
    sexe: values.sexe ?? 'inconnu',
    couleur: values.couleur?.trim() || null,
    puce: values.puce?.trim() || null,
  }

  const { data, error } = await supabase.rpc('creer_animal', {
    p_nom: payload.nom,
    p_espece: payload.espece,
    p_race: payload.race,
    p_date_naissance: payload.date_naissance,
    p_sexe: payload.sexe,
    p_couleur: payload.couleur,
    p_puce: payload.puce,
  })

  let animal: Animal
  if (error) {
    if (!isMissingRpc(error)) throw error
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié.')
    const profile = await fetchOwnerProfile(user.id)
    const { data: direct, error: directError } = await supabase
      .from('animaux')
      .insert({ ...payload, proprietaire_id: ownerIdFromProfile(profile, user.id) })
      .select('*')
      .single()
    if (directError) throw directError
    animal = direct as Animal
  } else {
    animal = data as Animal
  }

  if (values.poidsKg && values.poidsKg > 0) {
    await createMedicalEvent({
      animal_id: animal.id,
      type: 'autre',
      titre: 'Pesée',
      poids_kg: values.poidsKg,
      status: 'validated',
    }).catch(() => undefined)
  }

  trackEvent('animal_created')
  return animal
}

export async function updateAnimal(id: string, values: Partial<Animal>) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('animaux').update(values).eq('id', id).select('*').single()
  if (error) throw error
  return data as Animal
}

export async function softDeleteAnimal(id: string) {
  const supabase = requireSupabase()
  const { data: tokens, error: tokensError } = await supabase
    .from('vet_access_tokens')
    .select('token')
    .eq('animal_id', id)
    .eq('statut', 'actif')
  if (tokensError) throw tokensError
  for (const row of tokens ?? []) {
    const { error } = await supabase.rpc('revoquer_vet_token', { p_token: row.token })
    if (error) throw error
  }
  const { error } = await supabase
    .from('animaux')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function uploadAnimalPhoto(params: {
  ownerId: string
  animalId: string
  file: File
}) {
  const supabase = requireSupabase()
  const extension = params.file.name.split('.').pop() || 'jpg'
  const path = `${params.ownerId}/${params.animalId}/${Date.now()}.${extension}`
  const { error } = await supabase.storage.from('animal-photos').upload(path, params.file, {
    contentType: params.file.type || 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  return updateAnimal(params.animalId, { photo_path: path })
}

export async function fetchMedicalEvents(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('medical_events')
    .select('*')
    .eq('animal_id', animalId)
    .order('date_event', { ascending: false })
  if (error) throw error
  return (data ?? []) as MedicalEvent[]
}

export async function fetchRecentEvents(limit = 8) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('medical_events')
    .select('*, animaux(nom)')
    .order('date_event', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Array<MedicalEvent & { animaux?: { nom?: string } | null }>
}

export async function createMedicalEvent(values: {
  animal_id: string
  type: MedicalEventType
  titre?: string
  description?: string
  diagnostic?: string
  traitement?: string
  poids_kg?: number
  date_event?: string
  status?: MedicalEvent['status']
}) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('medical_events')
    .insert({
      animal_id: values.animal_id,
      type: values.type,
      titre: values.titre || null,
      description: values.description || null,
      diagnostic: values.diagnostic || null,
      traitement: values.traitement || null,
      poids_kg: values.poids_kg ?? null,
      date_event: values.date_event ?? new Date().toISOString(),
      status: values.status ?? 'validated',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as MedicalEvent
}

export async function validateMedicalEvent(eventId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('valider_medical_event', { p_event_id: eventId })
  if (error) throw error
  return data as MedicalEvent
}

export async function rejectMedicalEvent(eventId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('refuser_medical_event', { p_event_id: eventId })
  if (error) throw error
  return data as MedicalEvent
}

export async function fetchDocuments(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('animal_id', animalId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AnimalDocument[]
}

export async function uploadOwnerDocument(params: {
  ownerId: string
  animalId: string
  file: File
  category: AnimalDocument['category_ocr']
  raw: Record<string, unknown> | null
  medicalEventId?: string | null
  userId?: string | null
}) {
  const supabase = requireSupabase()
  const extension = params.file.name.split('.').pop() || 'bin'
  const path = `${params.ownerId}/${params.animalId}/${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('animal-documents').upload(path, params.file, {
    contentType: params.file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('documents')
    .insert({
      animal_id: params.animalId,
      file_path: path,
      file_name: params.file.name,
      mime_type: params.file.type || 'application/octet-stream',
      taille_octets: params.file.size || 1,
      category_ocr: params.category,
      raw_ocr_json: params.raw,
      medical_event_id: params.medicalEventId ?? null,
      uploade_par: params.userId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as AnimalDocument
}

export async function incrementOcrUsage() {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('increment_ocr_usage', {})
  if (error && !isMissingRpc(error)) throw error
}

export async function fetchReminders(animalId?: string) {
  const supabase = requireSupabase()
  let query = supabase.from('reminders').select('*').order('date_echeance', { ascending: true })
  if (animalId) query = query.eq('animal_id', animalId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Reminder[]
}

export async function createReminder(values: {
  animal_id: string
  type: Reminder['type']
  date_echeance: string
  titre: string
  notes?: string
  canal?: ReminderChannel
}) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      animal_id: values.animal_id,
      type: values.type,
      date_echeance: values.date_echeance,
      titre: values.titre.trim(),
      notes: values.notes?.trim() || null,
      canal: values.canal ?? 'both',
    })
    .select('*')
    .single()
  if (error) throw error
  trackEvent('reminder_created')
  return data as Reminder
}

export async function updateReminderStatus(id: string, statut: ReminderStatus) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reminders').update({ statut }).eq('id', id)
  if (error) throw error
}

export async function postponeReminder(reminder: Reminder, days = 7) {
  const supabase = requireSupabase()
  const next = new Date(`${reminder.date_echeance}T12:00:00`)
  next.setDate(next.getDate() + days)
  const { error } = await supabase
    .from('reminders')
    .update({ date_echeance: next.toISOString().slice(0, 10), statut: 'actif' })
    .eq('id', reminder.id)
  if (error) throw error
}

export async function fetchShares(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('animal_shares')
    .select('*')
    .eq('animal_id', animalId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AnimalShare[]
}

export async function inviteShare(animalId: string, email: string, role: PartageRole) {
  const supabase = requireSupabase()
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase.rpc('inviter_partage_animal', {
    p_animal_id: animalId,
    p_email_invite: normalized,
    p_role: role,
  })
  if (error) {
    if (!isMissingRpc(error)) throw error
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié.')
    const { data: inserted, error: insertError } = await supabase
      .from('animal_shares')
      .insert({
        animal_id: animalId,
        email_invite: normalized,
        role,
        invite_par: user.id,
        statut: 'en_attente',
      })
      .select('*')
      .single()
    if (insertError) throw insertError
    trackEvent('share_invite_sent')
    return inserted as AnimalShare
  }
  trackEvent('share_invite_sent')
  return data as AnimalShare
}

export async function acceptShare(shareId: string) {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('accepter_invitation_partage', { p_share_id: shareId })
  if (error) throw error
}

export async function refuseShare(shareId: string) {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('refuser_invitation_partage', { p_share_id: shareId })
  if (error) {
    if (!isMissingRpc(error)) throw error
    const { error: deleteError } = await supabase.from('animal_shares').delete().eq('id', shareId)
    if (deleteError) throw deleteError
  }
}

export async function revokeShare(shareId: string) {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('revoquer_partage', { p_share_id: shareId })
  if (error) throw error
}

export async function fetchPendingInvitations() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('mes_invitations_partage')
  if (!error && Array.isArray(data)) return data as Array<Record<string, unknown>>
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return []
  const { data: rows, error: rowsError } = await supabase
    .from('animal_shares')
    .select('*')
    .eq('statut', 'en_attente')
    .ilike('email_invite', user.email)
  if (rowsError) throw error && !isMissingRpc(error) ? error : rowsError
  return (rows ?? []) as AnimalShare[]
}

export async function fetchAnimalAccess(animalId: string, userId: string): Promise<AnimalAccess> {
  const supabase = requireSupabase()
  const [{ data: animal, error: animalError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from('animaux').select('proprietaire_id').eq('id', animalId).maybeSingle(),
    supabase.from('profiles').select('id, compte_proprietaire_id').eq('id', userId).maybeSingle(),
  ])
  if (animalError) throw animalError
  if (profileError) throw profileError
  const ownerAccountId = profile?.compte_proprietaire_id ?? userId
  if (animal?.proprietaire_id === userId || animal?.proprietaire_id === ownerAccountId) {
    return { level: 'owner', isOwner: true, canWrite: true, canWriteDailyLog: true, canManageShares: true }
  }
  const { data: share, error: shareError } = await supabase
    .from('animal_shares')
    .select('role')
    .eq('animal_id', animalId)
    .eq('user_id', userId)
    .eq('statut', 'acceptee')
    .maybeSingle()
  if (shareError) throw shareError
  if (share?.role === 'contributor') {
    return { level: 'contributor', isOwner: false, canWrite: false, canWriteDailyLog: true, canManageShares: false }
  }
  return { level: 'read_only', isOwner: false, canWrite: false, canWriteDailyLog: false, canManageShares: false }
}

export async function fetchDailyLogs(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('animal_id', animalId)
    .order('date_journal', { ascending: false })
  if (error) throw error
  return (data ?? []) as DailyLog[]
}

export async function createDailyLog(values: {
  animal_id: string
  cree_par: string
  date_journal?: string
  repas?: string
  sortie?: string
  comportement?: string
  notes?: string
}) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      animal_id: values.animal_id,
      cree_par: values.cree_par,
      date_journal: values.date_journal ?? new Date().toISOString().slice(0, 10),
      repas: values.repas?.trim() || null,
      sortie: values.sortie?.trim() || null,
      comportement: values.comportement?.trim() || null,
      notes: values.notes?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as DailyLog
}

export async function fetchExpenses(animalId?: string) {
  const supabase = requireSupabase()
  let query = supabase.from('expenses').select('*').order('date_depense', { ascending: false })
  if (animalId) query = query.eq('animal_id', animalId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function createExpense(values: {
  animal_id: string
  category: ExpenseCategory
  montant: number
  cree_par: string
  description?: string
  date_depense?: string
  medical_event_id?: string | null
}) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      animal_id: values.animal_id,
      category: values.category,
      montant: values.montant,
      cree_par: values.cree_par,
      description: values.description?.trim() || null,
      date_depense: values.date_depense ?? new Date().toISOString().slice(0, 10),
      medical_event_id: values.medical_event_id ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function generateVetToken(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('generer_vet_token', {
    p_animal_id: animalId,
    p_duree_heures: 4,
  })
  if (error) throw error
  trackEvent('qr_generated')
  return data as VetAccessTokenRow
}

export async function revokeVetToken(token: string) {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('revoquer_vet_token', { p_token: token })
  if (error) throw error
}

export async function fetchVetTokens(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('vet_access_tokens')
    .select('*')
    .eq('animal_id', animalId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as VetAccessTokenRow[]
}

export async function exportAccountData() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('exporter_mes_donnees')
  if (!error && data) return data

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilisateur non authentifié.')
  const [profile, animals, events, documents, reminders, shares, logs, expenses] = await Promise.all([
    fetchOwnerProfile(user.id),
    fetchAnimals(),
    supabase.from('medical_events').select('*').then((result) => result.data ?? []),
    supabase.from('documents').select('*').then((result) => result.data ?? []),
    fetchReminders(),
    supabase.from('animal_shares').select('*').then((result) => result.data ?? []),
    supabase.from('daily_logs').select('*').then((result) => result.data ?? []),
    fetchExpenses(),
  ])
  if (error && !isMissingRpc(error)) {
    return {
      exporte_le: new Date().toISOString(),
      profil: profile,
      animaux: animals,
      evenements: events,
      documents,
      rappels: reminders,
      partages: shares,
      journal: logs,
      depenses: expenses,
      avertissement: getErrorMessage(error),
    }
  }
  return {
    exporte_le: new Date().toISOString(),
    profil: profile,
    animaux: animals,
    evenements: events,
    documents,
    rappels: reminders,
    partages: shares,
    journal: logs,
    depenses: expenses,
  }
}

export async function deleteAccount() {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('supprimer_mon_compte')
  if (!error) {
    await supabase.auth.signOut()
    return { deletedAuth: true as const }
  }
  if (!isMissingRpc(error)) throw error
  const animals = await fetchAnimals()
  for (const animal of animals) {
    await softDeleteAnimal(animal.id)
  }
  await supabase.auth.signOut()
  return { deletedAuth: false as const }
}

export async function fetchHealthHistory(animalId: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('health_score_history')
    .select('*')
    .eq('animal_id', animalId)
    .order('calcule_le', { ascending: false })
    .limit(12)
  if (error) throw error
  return data ?? []
}

export async function persistHealthScore(
  animalId: string,
  score: number,
  details: Record<string, unknown>,
) {
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('enregistrer_health_score', {
    p_animal_id: animalId,
    p_score: score,
    p_details: details,
  })
  if (!error) return
  if (!isMissingRpc(error)) throw error
  await supabase.from('animaux').update({ score_sante: score }).eq('id', animalId)
  await supabase.from('health_score_history').insert({
    animal_id: animalId,
    score,
    details,
  })
}
