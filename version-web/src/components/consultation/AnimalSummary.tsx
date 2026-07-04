import { useEffect, useMemo, useState } from 'react'

import { getAnimalPhotoSignedUrl } from '../../lib/documents'
import { useVetSession } from '../../context/VetSessionContext'
import type { VetDossier, VetMedicalEvent } from '../../types/vet'

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

export function AnimalSummary({ dossier: dossierProp }: { dossier?: VetDossier | null }) {
  const { dossier: sessionDossier } = useVetSession()
  const dossier = dossierProp ?? sessionDossier
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const summary = useMemo(() => {
    if (!dossier) return null

    const animal = dossier.animal
    const lastConsultation = getLastVetConsultation(dossier.medical_events)

    return {
      name: animal.nom,
      species: animal.espece,
      breed: animal.race ?? 'Race non renseignée',
      sexe: animal.sexe,
      couleur: animal.couleur ?? 'Non renseignée',
      age: computeAgeLabel(animal.date_naissance),
      weight: getLatestWeight(dossier.medical_events),
      chip: animal.puce ?? 'Non renseignée',
      photoPath: animal.photo_path,
      lastConsultation: lastConsultation
        ? {
            date: formatDate(lastConsultation.date_event),
            diagnosis: lastConsultation.diagnostic ?? lastConsultation.titre ?? 'Consultation',
          }
        : null,
      tokenExpiresAt: dossier.token_expire_le ? formatDate(dossier.token_expire_le) : null,
      documentsCount: dossier.documents.length,
      eventsCount: dossier.medical_events.length,
    }
  }, [dossier])

  useEffect(() => {
    if (!summary?.photoPath) {
      setPhotoUrl(null)
      return
    }

    void getAnimalPhotoSignedUrl(summary.photoPath).then(setPhotoUrl)
  }, [summary?.photoPath])

  if (!summary) return null

  return (
    <section className="flex flex-col gap-5 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
      <div className="flex items-start gap-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={summary.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary-15 lg:h-24 lg:w-24"
          />
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-15 font-title text-2xl font-bold text-primary lg:h-24 lg:w-24 lg:text-3xl"
            aria-hidden="true"
          >
            {summary.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-title text-xl font-bold text-fg-primary lg:text-2xl">{summary.name}</h2>
          <p className="mt-1 font-body text-sm text-fg-secondary">
            {summary.species} · {summary.breed}
          </p>
          <p className="font-body text-sm capitalize text-fg-tertiary">
            {summary.sexe} · {summary.couleur}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Âge', value: summary.age },
          { label: 'Poids', value: summary.weight },
          { label: 'Puce', value: summary.chip },
          { label: 'Documents', value: String(summary.documentsCount) },
        ].map((item) => (
          <div key={item.label} className="rounded-12 bg-surface px-3 py-2.5">
            <p className="font-body text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
              {item.label}
            </p>
            <p className="mt-1 font-body text-sm font-semibold text-fg-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-fg-tertiary/20 pt-4 sm:grid-cols-2">
        <div className="rounded-12 bg-surface px-3 py-3">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Dernière visite vétérinaire
          </p>
          {summary.lastConsultation ? (
            <>
              <p className="mt-1 font-body text-sm font-semibold text-fg-primary">
                {summary.lastConsultation.date}
              </p>
              <p className="font-body text-sm text-fg-secondary">{summary.lastConsultation.diagnosis}</p>
            </>
          ) : (
            <p className="mt-1 font-body text-sm text-fg-secondary">Aucune consultation enregistrée</p>
          )}
        </div>

        {summary.tokenExpiresAt ? (
          <div className="rounded-12 bg-surface px-3 py-3">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
              Code valide jusqu'au
            </p>
            <p className="mt-1 font-body text-sm font-semibold text-fg-primary">{summary.tokenExpiresAt}</p>
            <p className="mt-1 font-body text-xs text-fg-tertiary">
              {summary.eventsCount} événement{summary.eventsCount > 1 ? 's' : ''} dans l'historique
            </p>
          </div>
        ) : (
          <div className="rounded-12 bg-surface px-3 py-3">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
              Historique
            </p>
            <p className="mt-1 font-body text-sm font-semibold text-fg-primary">
              {summary.eventsCount} événement{summary.eventsCount > 1 ? 's' : ''} validé{summary.eventsCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
