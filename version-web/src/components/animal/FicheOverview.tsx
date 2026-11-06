import { Link } from 'react-router-dom'

import { EventStatusBadge } from '../ui/Badge'
import { WeightChart } from '../ui/Charts'
import { ErrorState, ListSkeleton } from '../ui/Feedback'
import {
  fetchDocuments,
  fetchMedicalEvents,
  fetchReminders,
  fetchVetTokens,
} from '../../features/owner/api'
import { useAsync, useCountdown } from '../../hooks/useAsync'
import { documentCategoryLabels, type DocumentCategory } from '../../lib/cdc'
import { daysUntil, formatShortDate } from '../../lib/format'
import { getMedicalEventTypeLabel } from '../../lib/medicalLabels'
import type { VetAccessTokenRow } from '../../types/owner'

const categories: DocumentCategory[] = ['ordonnance', 'facture', 'analyse_sanguine', 'vaccination', 'autre']

export function FicheOverview({ animalId }: { animalId: string }) {
  const overview = useAsync(async () => {
    const [events, reminders, documents, tokens] = await Promise.all([
      fetchMedicalEvents(animalId),
      fetchReminders(animalId),
      fetchDocuments(animalId),
      fetchVetTokens(animalId),
    ])
    return { events, reminders, documents, tokens }
  }, [animalId])

  if (overview.loading) return <ListSkeleton rows={2} label="Chargement de l’aperçu…" />
  if (overview.error || !overview.data) return <ErrorState message={overview.error ?? 'Aperçu indisponible.'} onRetry={overview.retry} />

  const { events, reminders, documents, tokens } = overview.data
  const weights = events
    .filter((event) => event.poids_kg != null && event.status !== 'rejected')
    .slice()
    .sort((a, b) => a.date_event.localeCompare(b.date_event))
    .map((event) => ({
      date: event.date_event,
      label: formatShortDate(event.date_event),
      kg: Number(event.poids_kg),
    }))
  const latestWeight = weights.at(-1)
  const nextReminders = reminders.filter((reminder) => reminder.statut === 'actif').slice(0, 3)
  const recent = events.slice(0, 3)
  const counts = new Map<string, number>()
  for (const document of documents) {
    const key = document.category_ocr ?? 'autre'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <section className="surface p-5 lg:col-span-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-muted">Poids</p>
            <h2 className="mt-1 font-title text-lg font-semibold text-ink">Évolution</h2>
          </div>
          {latestWeight ? (
            <p className="font-title text-2xl font-semibold tracking-[-0.03em] text-ink tabular">
              {latestWeight.kg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg
              <span className="ml-2 font-body text-xs font-medium text-muted">{latestWeight.label}</span>
            </p>
          ) : null}
        </div>
        {weights.length > 0 ? (
          <>
            <div className="mt-3">
              <WeightChart points={weights} />
            </div>
            <p className="mt-1 flex justify-between font-body text-[11px] text-muted">
              <span>{weights[0].label}</span>
              <span>{weights.length} pesée{weights.length > 1 ? 's' : ''}</span>
              <span>{weights.at(-1)?.label}</span>
            </p>
          </>
        ) : (
          <p className="mt-4 font-body text-sm leading-relaxed text-muted">
            Aucune pesée pour le moment. Le poids se note sur un événement de l’historique.
          </p>
        )}
      </section>

      <AccessCard animalId={animalId} tokens={tokens} />

      <section className="surface flex flex-col p-5 lg:col-span-2">
        <p className="eyebrow text-muted">À venir</p>
        <h2 className="mt-1 font-title text-lg font-semibold text-ink">Prochains rappels</h2>
        {nextReminders.length === 0 ? (
          <p className="mt-4 font-body text-sm leading-relaxed text-muted">Aucun rappel actif sur cette fiche.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {nextReminders.map((reminder) => {
              const days = daysUntil(reminder.date_echeance)
              const late = days < 0
              return (
                <li key={reminder.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-body text-sm font-semibold leading-snug text-ink">{reminder.titre}</span>
                    <span className="mt-0.5 block font-body text-xs text-muted">{formatShortDate(reminder.date_echeance)}</span>
                  </span>
                  <span className={`shrink-0 font-body text-xs font-semibold ${late ? 'text-error' : 'text-primary'}`}>
                    {late ? 'En retard' : days === 0 ? 'Aujourd’hui' : `Dans ${days} j`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <Link to={`/espace/animaux/${animalId}/rappels`} className="mt-auto pt-4 font-body text-sm font-semibold text-primary">
          Tous les rappels
        </Link>
      </section>

      <section className="surface flex flex-col p-5 lg:col-span-2">
        <p className="eyebrow text-muted">Carnet</p>
        <h2 className="mt-1 font-title text-lg font-semibold text-ink">Derniers événements</h2>
        {recent.length === 0 ? (
          <p className="mt-4 font-body text-sm leading-relaxed text-muted">L’historique est encore vide.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recent.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-body text-sm font-semibold leading-snug text-ink">
                    {event.titre || getMedicalEventTypeLabel(event.type)}
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-muted">{formatShortDate(event.date_event)}</span>
                </span>
                <EventStatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        )}
        <Link to={`/espace/animaux/${animalId}/historique`} className="mt-auto pt-4 font-body text-sm font-semibold text-primary">
          Ouvrir l’historique
        </Link>
      </section>

      <section className="surface flex flex-col p-5 lg:col-span-2">
        <p className="eyebrow text-muted">Dossier</p>
        <h2 className="mt-1 font-title text-lg font-semibold text-ink">Documents</h2>
        <p className="mt-1 font-body text-xs text-muted">{documents.length} fichier{documents.length > 1 ? 's' : ''}</p>
        <ul className="mt-3 flex flex-col">
          {categories.map((category) => (
            <li key={category} className="flex items-center justify-between border-b border-line-soft py-2 last:border-b-0">
              <span className="font-body text-sm text-[#3f4744]">{documentCategoryLabels[category]}</span>
              <span className="font-body text-sm font-semibold text-ink tabular">{counts.get(category) ?? 0}</span>
            </li>
          ))}
        </ul>
        <Link to={`/espace/animaux/${animalId}/documents`} className="mt-auto pt-4 font-body text-sm font-semibold text-primary">
          Voir les fichiers
        </Link>
      </section>
    </div>
  )
}

function AccessCard({ animalId, tokens }: { animalId: string; tokens: VetAccessTokenRow[] }) {
  const active = tokens.find((token) => token.statut === 'actif')
  const remaining = useCountdown(active?.expire_le ?? null)
  const open = Boolean(active && remaining != null && remaining > 0)
  const previous = tokens.find((token) => token.id !== active?.id)

  return (
    <section className="surface flex flex-col p-5 lg:col-span-2">
      <p className="eyebrow text-muted">Vétérinaire</p>
      <h2 className="mt-1 font-title text-lg font-semibold text-ink">Accès au dossier</h2>
      {open && remaining != null ? (
        <>
          <p className="mt-4 font-title text-3xl font-semibold tracking-[-0.04em] text-primary tabular">{formatClock(remaining)}</p>
          <p className="mt-1 font-body text-sm text-[#3f4744]">Accès ouvert. Il se referme seul au bout de 4 heures.</p>
        </>
      ) : (
        <>
          <p className="mt-4 font-body text-sm font-semibold text-ink">Aucun accès en cours</p>
          <p className="mt-1 font-body text-sm leading-relaxed text-muted">
            {previous
              ? `Le précédent s’est refermé le ${formatShortDate(previous.utilise_le ?? previous.expire_le)}.`
              : 'Un accès dure 4 heures, le temps de la consultation.'}
          </p>
        </>
      )}
      <Link to={`/espace/animaux/${animalId}/code`} className="mt-auto pt-4 font-body text-sm font-semibold text-primary">
        Gérer l’accès
      </Link>
    </section>
  )
}

function formatClock(ms: number) {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
