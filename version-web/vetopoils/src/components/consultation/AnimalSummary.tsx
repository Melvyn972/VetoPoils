import { useMemo } from 'react'

import { useVetSession } from '../../context/VetSessionContext'
import type { VetMedicalEvent } from '../../types/vet'

function computeAgeLabel(dateNaissance?: string | null) {
  if (!dateNaissance) return 'Non renseigné'

  const birthDate = new Date(dateNaissance)
  if (Number.isNaN(birthDate.getTime())) return 'Non renseigné'

  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()

  if (today.getDate() < birthDate.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0 && months <= 0) return 'Moins d’un mois'
  if (years <= 0) return `${months} mois`
  if (months <= 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''}`
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getLatestWeight(events: VetMedicalEvent[]) {
  const event = events.find((item) => item.poids_kg)
  return event?.poids_kg ? `${event.poids_kg} kg` : 'Non renseigné'
}

function getLastVetConsultation(events: VetMedicalEvent[]) {
  return events.find((event) => event.vet_token_id) ?? events[0] ?? null
}

export function AnimalSummary() {
  const { dossier } = useVetSession()

  const summary = useMemo(() => {
    if (!dossier) return null

    const animal = dossier.animal
    const lastConsultation = getLastVetConsultation(dossier.medical_events)

    return {
      name: animal.nom,
      species: animal.espece,
      breed: animal.race ?? 'Race non renseignée',
      age: computeAgeLabel(animal.date_naissance),
      weight: getLatestWeight(dossier.medical_events),
      chip: animal.puce ?? 'Non renseignée',
      lastConsultation: lastConsultation
        ? {
            date: formatDate(lastConsultation.date_event),
            diagnosis: lastConsultation.diagnostic ?? lastConsultation.titre ?? 'Consultation',
          }
        : null,
      tokenExpiresAt: formatDate(dossier.token_expire_le),
    }
  }, [dossier])

  if (!summary) return null

  return (
    <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-15 font-title text-2xl font-bold text-primary"
          aria-hidden="true"
        >
          {summary.name.charAt(0)}
        </div>

        <div className="flex flex-col gap-0.5">
          <h2 className="font-title text-xl font-bold text-fg-primary">{summary.name}</h2>
          <p className="font-body text-sm text-fg-secondary">
            {summary.species} · {summary.breed}
          </p>
          <p className="font-body text-sm text-fg-tertiary">
            {summary.age} · {summary.weight}
          </p>
          <p className="font-body text-xs text-fg-tertiary">Puce : {summary.chip}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-fg-tertiary/20 pt-4">
        <div>
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Dernière visite vétérinaire
          </p>
          {summary.lastConsultation ? (
            <>
              <p className="mt-1 font-body text-sm font-medium text-fg-primary">
                {summary.lastConsultation.date}
              </p>
              <p className="font-body text-sm text-fg-secondary">
                {summary.lastConsultation.diagnosis}
              </p>
            </>
          ) : (
            <p className="mt-1 font-body text-sm text-fg-secondary">-</p>
          )}
        </div>

        <div>
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Code valide jusqu’au
          </p>
          <p className="mt-1 font-body text-sm font-medium text-fg-primary">
            {summary.tokenExpiresAt}
          </p>
        </div>
      </div>
    </section>
  )
}
