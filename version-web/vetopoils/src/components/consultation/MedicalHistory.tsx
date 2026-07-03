import type { VetMedicalEvent } from '../../types/vet'
import { formatMedicalEventDate, getMedicalEventSummary, getMedicalEventTypeLabel } from '../../lib/medicalLabels'

export function MedicalHistory({ events }: { events: VetMedicalEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
        <h3 className="font-title text-base font-semibold text-fg-primary">Historique médical</h3>
        <p className="font-body text-sm text-fg-secondary">Aucun événement validé pour le moment.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
      <h3 className="font-title text-base font-semibold text-fg-primary">Historique médical</h3>
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="flex flex-col gap-1 border-b border-fg-tertiary/15 pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-body text-sm font-semibold text-fg-primary">
                {event.titre ?? getMedicalEventTypeLabel(event.type)}
              </p>
              <span className="shrink-0 rounded-10 bg-primary-15 px-2 py-0.5 font-body text-xs font-medium text-primary">
                {getMedicalEventTypeLabel(event.type)}
              </span>
            </div>
            <p className="font-body text-xs font-medium text-fg-tertiary">
              {formatMedicalEventDate(event.date_event)}
              {event.vet_token_id ? ' · Saisi par un vétérinaire' : ''}
            </p>
            {event.diagnostic ? (
              <p className="font-body text-sm text-fg-primary">
                <span className="font-medium">Diagnostic :</span> {event.diagnostic}
              </p>
            ) : null}
            {event.description ? (
              <p className="font-body text-sm text-fg-secondary">{event.description}</p>
            ) : null}
            {event.traitement ? (
              <p className="font-body text-sm text-fg-secondary">
                <span className="font-medium">Traitement :</span> {event.traitement}
              </p>
            ) : null}
            {event.poids_kg ? (
              <p className="font-body text-sm text-fg-secondary">Poids : {event.poids_kg} kg</p>
            ) : null}
            {!event.diagnostic && !event.description && !event.traitement && !event.poids_kg ? (
              <p className="font-body text-sm text-fg-secondary">{getMedicalEventSummary(event)}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
