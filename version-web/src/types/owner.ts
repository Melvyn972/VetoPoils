export type AnimalSexe = 'male' | 'femelle' | 'inconnu'
export type MedicalEventType =
  | 'consultation'
  | 'vaccination'
  | 'chirurgie'
  | 'ordonnance'
  | 'analyse'
  | 'autre'
export type MedicalEventStatus = 'pending' | 'validated' | 'rejected'
export type DocumentCategory =
  | 'ordonnance'
  | 'facture'
  | 'analyse_sanguine'
  | 'vaccination'
  | 'autre'
export type ReminderType = 'vaccination' | 'antiparasitaire' | 'rdv' | 'autre'
export type ReminderChannel = 'email' | 'push' | 'both'
export type ReminderStatus = 'actif' | 'termine' | 'annule' | 'reporte'
export type PartageRole = 'read_only' | 'contributor'
export type InvitationStatus = 'en_attente' | 'acceptee' | 'revoquee'
export type ExpenseCategory = 'veterinaire' | 'alimentation' | 'accessoires' | 'pharmacie' | 'autre'

export interface OwnerProfile {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  compte_proprietaire_id: string | null
  plan: string
  ocr_usage: number
  notifications_push_enabled: boolean
}

export interface Animal {
  id: string
  proprietaire_id: string
  nom: string
  espece: string
  race: string | null
  date_naissance: string | null
  sexe: AnimalSexe
  couleur: string | null
  puce: string | null
  photo_path: string | null
  score_sante: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MedicalEvent {
  id: string
  animal_id: string
  type: MedicalEventType
  date_event: string
  titre: string | null
  description: string | null
  poids_kg: number | null
  diagnostic: string | null
  traitement: string | null
  status: MedicalEventStatus
  cree_par: string | null
  vet_token_id: string | null
  created_at: string
}

export interface AnimalDocument {
  id: string
  animal_id: string
  medical_event_id: string | null
  file_path: string
  file_name: string
  mime_type: string
  taille_octets: number
  category_ocr: DocumentCategory | null
  raw_ocr_json: Record<string, unknown> | null
  uploade_par: string | null
  created_at: string
}

export interface Reminder {
  id: string
  animal_id: string
  type: ReminderType
  date_echeance: string
  canal: ReminderChannel
  statut: ReminderStatus
  titre: string
  notes: string | null
  created_at: string
}

export interface AnimalShare {
  id: string
  animal_id: string
  user_id: string | null
  email_invite: string
  role: PartageRole
  statut: InvitationStatus
  invite_par: string
  created_at: string
  accepte_le: string | null
}

export interface DailyLog {
  id: string
  animal_id: string
  date_journal: string
  repas: string | null
  sortie: string | null
  comportement: string | null
  notes: string | null
  cree_par: string
  created_at: string
}

export interface Expense {
  id: string
  animal_id: string
  category: ExpenseCategory
  montant: number
  description: string | null
  date_depense: string
  cree_par: string
  created_at: string
}

export interface VetAccessTokenRow {
  id: string
  animal_id: string
  token: string
  expire_le: string
  utilise_le: string | null
  statut: string
  created_at: string
}

export interface AnimalAccess {
  level: 'owner' | 'contributor' | 'read_only'
  isOwner: boolean
  canWrite: boolean
  canWriteDailyLog: boolean
  canManageShares: boolean
}

export interface AccountRoleResult {
  role: 'owner' | 'veterinarian'
}
