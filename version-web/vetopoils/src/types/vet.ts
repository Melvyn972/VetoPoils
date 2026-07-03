export interface VetAnimal {
  id: string
  nom: string
  espece: string
  race: string | null
  date_naissance: string | null
  sexe: string
  couleur: string | null
  puce: string | null
  photo_path: string | null
  proprietaire_id: string
}

export interface VetMedicalEvent {
  id: string
  type: string
  date_event: string
  titre: string | null
  description: string | null
  diagnostic: string | null
  traitement: string | null
  poids_kg: number | null
  status: string
  vet_token_id: string | null
}

export interface VetDocumentSummary {
  id: string
  file_name: string
  category_ocr: string | null
  created_at: string
}

export interface VetDossier {
  animal: VetAnimal
  medical_events: VetMedicalEvent[]
  documents: VetDocumentSummary[]
  token_expire_le: string
}

export interface VetConsultationInput {
  token: string
  veterinarianName: string
  clinic?: string
  diagnosis: string
  notes?: string
  weightKg?: number | null
}
