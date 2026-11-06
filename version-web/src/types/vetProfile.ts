export interface VetProfile {
  id: string
  nom_complet: string
  email: string
  clinique: string | null
  telephone: string | null
  numero_ordre?: string | null
  created_at: string
  updated_at: string
}
