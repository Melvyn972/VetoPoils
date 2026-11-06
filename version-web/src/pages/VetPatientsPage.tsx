import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { VetWorkspace } from '../components/layout/VetWorkspace'
import { PageHeader } from '../components/layout/AppShell'
import { IconBook, IconBuilding, IconQr, IconStethoscope } from '../components/icons/Icons'
import { ButtonLink } from '../components/ui/Button'
import { ErrorState, ListSkeleton } from '../components/ui/Feedback'
import { useAuth } from '../context/AuthContext'
import { getMedicalEventTypeLabel, formatMedicalEventDate } from '../lib/medicalLabels'
import { getVetErrorMessage } from '../lib/vetErrors'
import { fetchVetPatients } from '../lib/vet'
import type { VetPatientSummary } from '../types/vet'

const steps = [
  {
    icon: <IconQr className="h-5 w-5" />,
    title: 'Le propriétaire prépare l’accès',
    text: 'Depuis la fiche, un accès de 4 heures ouvre le dossier le temps de la consultation.',
  },
  {
    icon: <IconStethoscope className="h-5 w-5" />,
    title: 'Vous ouvrez le dossier',
    text: 'Le code à 6 caractères est à usage unique. Un code expiré ou déjà servi est refusé.',
  },
  {
    icon: <IconBook className="h-5 w-5" />,
    title: 'Le patient reste dans la liste',
    text: 'Après la fermeture de l’accès, l’animal consulté avec ce compte reste visible ici.',
  },
]

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
          isLoading
            ? 'Chargement des dossiers ouverts avec ce compte.'
            : vetProfile?.clinique
              ? `${patients.length} ${patients.length > 1 ? 'dossiers' : 'dossier'} · ${vetProfile.clinique}`
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
        <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-title text-lg font-semibold text-ink">Aucun patient pour le moment</h2>
            <p className="mt-1 max-w-xl font-body text-sm leading-relaxed text-muted">
              Le premier dossier ouvert avec ce compte apparaîtra dans le tableau. Les accès suivants restent liés à la clinique.
            </p>
          </div>
          <ButtonLink to="/acces" fullWidth={false}>Saisir un accès</ButtonLink>
        </section>
      ) : null}
      {!isLoading && patients.length > 0 ? (
        <ul className="flex flex-col gap-3 md:hidden">
          {patients.map((patient) => (
            <li key={patient.animal.id}>
              <Link to={`/animal/${patient.animal.id}`} className="surface block p-4">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-body text-base font-semibold text-ink">{patient.animal.nom}</span>
                  <span className="font-body text-sm font-semibold text-ink tabular">{patient.events_count} visite{patient.events_count > 1 ? 's' : ''}</span>
                </span>
                <span className="mt-1 block font-body text-sm leading-snug text-muted">
                  {patient.animal.espece}
                  {patient.animal.race ? ` · ${patient.animal.race}` : ''}
                </span>
                <span className="mt-2 block font-body text-sm leading-snug text-[#3f4744]">
                  {getMedicalEventTypeLabel(patient.last_event_type)} · {formatMedicalEventDate(patient.last_event_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {!isLoading && patients.length > 0 ? (
        <div className="surface hidden overflow-x-auto md:block">
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

      <section className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Comment un patient arrive dans la liste">
        {steps.map((step, index) => (
          <article key={step.title} className="surface p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-mint text-primary">{step.icon}</span>
              <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-muted">Étape {index + 1}</span>
            </div>
            <h2 className="mt-4 font-title text-base font-semibold text-ink">{step.title}</h2>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-muted">{step.text}</p>
          </article>
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <section className="surface p-5">
          <p className="eyebrow text-muted">Historique</p>
          <h2 className="mt-1 font-title text-lg font-semibold text-ink">Accès récents</h2>
          {!isLoading && patients.length === 0 ? (
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              Aucun dossier n’a encore été ouvert avec ce compte. L’animal, l’espèce et la date du dernier événement s’afficheront ici.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {patients.map((patient) => (
                <li key={patient.animal.id} className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0">
                  <span className="min-w-0">
                    <Link to={`/animal/${patient.animal.id}`} className="block font-body text-sm font-semibold text-ink hover:text-primary">
                      {patient.animal.nom}
                    </Link>
                    <span className="mt-0.5 block font-body text-xs leading-snug text-muted">
                      {patient.animal.espece}
                      {patient.animal.race ? ` · ${patient.animal.race}` : ''}
                      {' · '}
                      {patient.events_count} visite{patient.events_count > 1 ? 's' : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-body text-xs text-muted">
                    {getMedicalEventTypeLabel(patient.last_event_type)}
                    <span className="mt-0.5 block">{formatMedicalEventDate(patient.last_event_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {patients.length > 0 ? (
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              Un dossier ouvert avec ce compte reste dans la liste après la fin des 4 heures.
            </p>
          ) : null}
        </section>

        <section className="surface p-5">
          <p className="eyebrow text-muted">Clinique</p>
          <h2 className="mt-1 font-title text-lg font-semibold text-ink">{vetProfile?.clinique || 'Compte clinique'}</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <ClinicFact label="Vétérinaire" value={vetProfile?.nom_complet} />
            <ClinicFact label="Téléphone" value={vetProfile?.telephone} />
            <ClinicFact label="N° d’ordre" value={vetProfile?.numero_ordre} />
            <ClinicFact label="E-mail" value={vetProfile?.email} />
          </dl>
          <div className="mt-5 flex items-center gap-2 font-body text-xs text-muted">
            <IconBuilding className="h-4 w-4 shrink-0" />
            Les dossiers ouverts restent rattachés à ce compte.
          </div>
          <ButtonLink to="/compte-veterinaire" variant="secondary" className="mt-4" fullWidth={false}>
            Compte clinique
          </ButtonLink>
        </section>
      </div>
    </VetWorkspace>
  )
}

function ClinicFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-body text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-body text-sm font-semibold text-ink">{value?.trim() || 'Non renseigné'}</dd>
    </div>
  )
}
