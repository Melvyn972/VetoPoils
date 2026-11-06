import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { VetWorkspace } from '../components/layout/VetWorkspace'
import { PageHeader } from '../components/layout/AppShell'
import { IconQr } from '../components/icons/Icons'
import { ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ui/Feedback'
import { useAuth } from '../context/AuthContext'
import { getMedicalEventTypeLabel, formatMedicalEventDate } from '../lib/medicalLabels'
import { getVetErrorMessage } from '../lib/vetErrors'
import { fetchVetPatients } from '../lib/vet'
import type { VetPatientSummary } from '../types/vet'

export function VetPatientsPage() {
  const { vetProfile } = useAuth()
  const [patients, setPatients] = useState<VetPatientSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void fetchVetPatients()
      .then(setPatients)
      .catch((loadError) => setError(getVetErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <VetWorkspace>
      <PageHeader
        eyebrow="Espace vétérinaire"
        title="Mes patients"
        description={
          vetProfile?.clinique
            ? `${patients.length} dossier${patients.length > 1 ? 's' : ''} · ${vetProfile.clinique}`
            : 'Les animaux consultés avec votre compte clinique.'
        }
        actions={
          <ButtonLink to="/acces" fullWidth={false} icon={<IconQr className="h-4 w-4" />}>
            Accès code
          </ButtonLink>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <ListSkeleton rows={5} label="Chargement de vos patients…" /> : null}
      {!isLoading && patients.length === 0 ? (
        <EmptyState
          icon={<IconQr className="h-6 w-6" />}
          title="Aucun patient pour le moment"
          description="Ouvrez un dossier avec le code du propriétaire, connecté à ce compte : l’animal reviendra dans cette liste."
          action={<ButtonLink to="/acces">Saisir un code d’accès</ButtonLink>}
        />
      ) : null}
      {!isLoading && patients.length > 0 ? (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-soft font-body text-[13px] text-muted">
                <th className="px-5 py-3 font-medium">Animal</th>
                <th className="px-4 py-3 font-medium">Espèce</th>
                <th className="px-4 py-3 font-medium">Dernier événement</th>
                <th className="px-5 py-3 text-right font-medium">Visites</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.animal.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-5 py-3.5">
                    <Link to={`/animal/${patient.animal.id}`} className="font-body text-sm font-semibold text-ink hover:text-primary">
                      {patient.animal.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-body text-sm text-[#4d5652]">
                    {patient.animal.espece}
                    {patient.animal.race ? ` · ${patient.animal.race}` : ''}
                  </td>
                  <td className="px-4 py-3.5 font-body text-sm text-[#4d5652]">
                    {getMedicalEventTypeLabel(patient.last_event_type)} · {formatMedicalEventDate(patient.last_event_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-body text-sm font-semibold text-ink tabular">{patient.events_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </VetWorkspace>
  )
}
