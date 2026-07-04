import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { FormAlert } from '../components/ui/FormAlert'
import { getMedicalEventTypeLabel, formatMedicalEventDate } from '../lib/medicalLabels'
import { mapVetRpcError } from '../lib/vetErrors'
import { fetchVetPatients } from '../lib/vet'
import type { VetPatientSummary } from '../types/vet'

function PatientCard({ patient }: { patient: VetPatientSummary }) {
  const initial = patient.animal.nom.charAt(0).toUpperCase()

  return (
    <Link
      to={`/animal/${patient.animal.id}`}
      className="group flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-5 transition-all hover:border-primary/35 hover:bg-surface hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-15 font-title text-xl font-bold text-primary"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-title text-lg font-semibold text-fg-primary group-hover:text-primary">
                {patient.animal.nom}
              </p>
              <p className="font-body text-sm text-fg-secondary">
                {patient.animal.espece}
                {patient.animal.race ? ` · ${patient.animal.race}` : ''}
              </p>
              {patient.animal.puce ? (
                <p className="mt-1 font-body text-xs text-fg-tertiary">
                  Puce : {patient.animal.puce}
                </p>
              ) : null}
            </div>
            <span className="rounded-10 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
              {patient.events_count} visite{patient.events_count > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-12 bg-surface px-3 py-2.5">
        <p className="font-body text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
          Dernier événement
        </p>
        <p className="mt-1 font-body text-sm font-medium text-fg-primary">
          {getMedicalEventTypeLabel(patient.last_event_type)}
        </p>
        <p className="font-body text-xs text-fg-secondary">
          {formatMedicalEventDate(patient.last_event_at)}
        </p>
      </div>

      <p className="font-body text-sm font-semibold text-primary">Ouvrir le dossier →</p>
    </Link>
  )
}

export function VetPatientsPage() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const [patients, setPatients] = useState<VetPatientSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void fetchVetPatients()
      .then(setPatients)
      .catch((loadError) => {
        setError(mapVetRpcError(loadError instanceof Error ? loadError : new Error('Erreur inconnue')))
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <MobileShell wide>
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-title text-2xl font-bold text-fg-primary lg:text-3xl">Mes patients</h1>
            <p className="font-body text-sm text-fg-secondary">
              Bonjour {displayName} — sélectionnez un animal pour voir son carnet et choisir une action.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/acces')}
            className="rounded-14 border border-fg-tertiary/25 bg-surface px-4 py-2.5 font-body text-sm font-semibold text-fg-primary transition-colors hover:bg-surface-secondary"
          >
            Nouveau QR code
          </button>
        </div>

        {error ? <FormAlert>{error}</FormAlert> : null}

        {isLoading ? (
          <p className="font-body text-sm text-fg-secondary">Chargement de vos patients...</p>
        ) : patients.length === 0 ? (
          <div className="rounded-14 border border-dashed border-fg-tertiary/30 bg-surface-secondary p-6 text-center">
            <p className="font-body text-sm text-fg-secondary">
              Aucun patient enregistré pour le moment. Consultez un animal via un QR code en étant
              connecté pour le retrouver ici ensuite.
            </p>
            <Button type="button" className="mt-4" onClick={() => navigate('/acces')}>
              Saisir un code d’accès
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {patients.map((patient) => (
              <PatientCard key={patient.animal.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  )
}
