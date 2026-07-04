export const MEDICAL_EVENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'chirurgie', label: 'Chirurgie' },
  { value: 'ordonnance', label: 'Ordonnance' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'autre', label: 'Autre' },
] as const

export type MedicalEventTypeValue = (typeof MEDICAL_EVENT_TYPES)[number]['value']

export const REMINDER_TYPES = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'antiparasitaire', label: 'Antiparasitaire' },
  { value: 'rdv', label: 'Rendez-vous' },
  { value: 'autre', label: 'Autre' },
] as const

export type ReminderTypeValue = (typeof REMINDER_TYPES)[number]['value']

const typeLabels: Record<string, string> = Object.fromEntries(
  MEDICAL_EVENT_TYPES.map((item) => [item.value, item.label]),
)

export function getMedicalEventTypeLabel(type: string) {
  return typeLabels[type] ?? type
}

export function getReminderTypeLabel(type: string) {
  return REMINDER_TYPES.find((item) => item.value === type)?.label ?? type
}

export function requiresDiagnosis(type: MedicalEventTypeValue) {
  return ['consultation', 'analyse', 'chirurgie', 'ordonnance'].includes(type)
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

