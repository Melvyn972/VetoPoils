import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { AnimalSummary } from '../components/consultation/AnimalSummary'
import { DocumentsPanel } from '../components/consultation/DocumentsPanel'
import { MedicalEventForm } from '../components/consultation/MedicalEventForm'
import { MedicalHistory } from '../components/consultation/MedicalHistory'
import { ReminderForm } from '../components/consultation/ReminderForm'
import { RemindersPanel } from '../components/consultation/RemindersPanel'
import { MobileShell } from '../components/layout/MobileShell'
import {
  AnimalActionHub,
  viewTitle,
  type AnimalHubView,
} from '../components/vet/AnimalActionHub'
import { CarnetSummary } from '../components/vet/AnimalCarnetSummary'
import { FormAlert } from '../components/ui/FormAlert'
import { saveConsultationResult } from '../lib/consultation'
import { mapVetRpcError } from '../lib/vetErrors'
import { fetchVetAnimalDossier } from '../lib/vet'
import type { VetAnimalDossier, VetReminder } from '../types/vet'

const VALID_VIEWS: AnimalHubView[] = [
  'overview',
  'evenement',
  'rappel',
  'historique',
  'documents',
  'rappels',
]

function parseView(value: string | null): AnimalHubView {
  if (value && VALID_VIEWS.includes(value as AnimalHubView)) {
    return value as AnimalHubView
  }
  return 'overview'
}

export function VetAnimalPage() {
  const { animalId } = useParams<{ animalId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseView(searchParams.get('view'))

  const [dossier, setDossier] = useState<VetAnimalDossier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function loadDossier() {
    if (!animalId) return

    setIsLoading(true)
    setError(null)

    try {
      setDossier(await fetchVetAnimalDossier(animalId))
    } catch (loadError) {
      setError(mapVetRpcError(loadError instanceof Error ? loadError : new Error('Erreur inconnue')))
      setDossier(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDossier()
  }, [animalId])

  function setView(nextView: AnimalHubView) {
    if (nextView === 'overview') {
      setSearchParams({})
    } else {
      setSearchParams({ view: nextView })
    }
    setSuccessMessage(null)
  }

  function handleEventSuccess() {
    saveConsultationResult({ animalName: dossier?.animal.nom ?? 'l’animal' })
    setSuccessMessage('Événement enregistré. Le propriétaire doit le valider dans l’app.')
    void loadDossier()
    setView('overview')
  }

  function handleReminderCreated(reminder: VetReminder) {
    setDossier((current) =>
      current ? { ...current, reminders: [...current.reminders, reminder] } : current,
    )
    setSuccessMessage('Rappel programmé pour le propriétaire.')
    setView('rappels')
  }

  if (isLoading) {
    return (
      <MobileShell wide>
        <p className="font-body text-sm text-fg-secondary">Chargement du dossier...</p>
      </MobileShell>
    )
  }

  if (error || !dossier || !animalId) {
    return (
      <MobileShell wide>
        <div className="flex flex-col gap-4 py-4">
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Link to="/mes-patients" className="font-body text-sm text-primary underline">
            Retour à mes patients
          </Link>
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell wide>
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link to="/mes-patients" className="font-body text-sm text-primary underline">
              ← Mes patients
            </Link>
            <h1 className="mt-2 font-title text-2xl font-bold text-fg-primary lg:text-3xl">
              {dossier.animal.nom}
            </h1>
            <p className="font-body text-sm text-fg-secondary">{viewTitle(view)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {view !== 'overview' ? (
              <button
                type="button"
                onClick={() => setView('overview')}
                className="rounded-14 border border-primary/25 bg-primary-15 px-4 py-2.5 font-body text-sm font-semibold text-primary"
              >
                Retour au dossier
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/acces')}
              className="rounded-14 border border-fg-tertiary/25 bg-surface px-4 py-2.5 font-body text-sm font-semibold text-fg-primary"
            >
              Nouveau patient (QR)
            </button>
          </div>
        </div>

        {successMessage ? (
          <div className="rounded-12 border border-accent-green/30 bg-accent-green-15 px-4 py-3 font-body text-sm text-fg-primary">
            {successMessage}
          </div>
        ) : null}

        {view === 'overview' ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <AnimalSummary dossier={dossier} />
              <CarnetSummary dossier={dossier} />
            </div>
            <AnimalActionHub
              eventsCount={dossier.medical_events.length}
              documentsCount={dossier.documents.length}
              remindersCount={dossier.reminders.length}
              onSelect={setView}
            />
          </div>
        ) : null}

        {view === 'evenement' ? (
          <div className="mx-auto w-full max-w-2xl rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-6">
            <MedicalEventForm
              dossier={dossier}
              mode="connected"
              animalId={animalId}
              onSuccess={handleEventSuccess}
              submitLabel="Enregistrer l’événement"
            />
          </div>
        ) : null}

        {view === 'rappel' ? (
          <div className="mx-auto w-full max-w-2xl rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-6">
            <ReminderForm animalId={animalId} onCreated={handleReminderCreated} />
          </div>
        ) : null}

        {view === 'historique' ? (
          <div className="max-w-3xl">
            <MedicalHistory events={dossier.medical_events} />
          </div>
        ) : null}

        {view === 'documents' ? (
          <div className="max-w-3xl">
            <DocumentsPanel documents={dossier.documents} />
          </div>
        ) : null}

        {view === 'rappels' ? (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <RemindersPanel reminders={dossier.reminders} />
            <div className="rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-6">
              <ReminderForm animalId={animalId} onCreated={handleReminderCreated} />
            </div>
          </div>
        ) : null}
      </div>
    </MobileShell>
  )
}
