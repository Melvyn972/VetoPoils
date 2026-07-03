const typeLabels: Record<string, string> = {
  consultation: 'Consultation',
  vaccination: 'Vaccination',
  chirurgie: 'Chirurgie',
  ordonnance: 'Ordonnance',
  analyse: 'Analyse',
  autre: 'Autre',
}

export function getMedicalEventTypeLabel(type: string) {
  return typeLabels[type] ?? type
}

export function formatMedicalEventDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function getMedicalEventSummary(event: {
  titre?: string | null
  type: string
  diagnostic?: string | null
  description?: string | null
  traitement?: string | null
  poids_kg?: number | null
  vet_token_id?: string | null
}) {
  const parts = [
    event.diagnostic?.trim(),
    event.description?.trim(),
    event.traitement?.trim() ? `Traitement : ${event.traitement.trim()}` : null,
    event.poids_kg ? `Poids : ${event.poids_kg} kg` : null,
  ].filter(Boolean)

  return parts.join(' · ') || getMedicalEventTypeLabel(event.type)
}

