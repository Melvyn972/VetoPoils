import type { VetMedicalEvent } from '../../types/vet'
import { formatMedicalEventDate, getMedicalEventSummary, getMedicalEventTypeLabel } from '../../lib/medicalLabels'

export function MedicalHistory({ events }: { events: VetMedicalEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
        <h3 className="font-title text-base font-semibold text-fg-primary">Historique médical</h3>
        <p className="font-body text-sm text-fg-secondary">Aucun événement validé pour le moment.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-title text-base font-semibold text-fg-primary">Historique médical</h3>
        <span className="rounded-10 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
          {events.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {events.map((event, index) => (
          <article
            key={event.id}
            className="relative flex gap-4 rounded-12 border border-fg-tertiary/15 bg-surface p-4"
          >
            <div className="hidden shrink-0 flex-col items-center sm:flex">
              <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
              {index < events.length - 1 ? <div className="mt-1 w-0.5 flex-1 bg-fg-tertiary/20" /> : null}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-body text-sm font-semibold text-fg-primary">
                    {event.titre ?? getMedicalEventTypeLabel(event.type)}
                  </p>
                  <p className="font-body text-xs font-medium text-fg-tertiary">
                    {formatMedicalEventDate(event.date_event)}
                    {event.vet_token_id ? ' · Saisi par un vétérinaire' : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-10 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
                  {getMedicalEventTypeLabel(event.type)}
                </span>
              </div>

              {event.diagnostic ? (
                <p className="font-body text-sm text-fg-primary">
                  <span className="font-semibold">Diagnostic :</span> {event.diagnostic}
                </p>
              ) : null}
              {event.description ? (
                <p className="font-body text-sm leading-relaxed text-fg-secondary">{event.description}</p>
              ) : null}
              {event.traitement ? (
                <p className="font-body text-sm text-fg-secondary">
                  <span className="font-semibold">Traitement :</span> {event.traitement}
                </p>
              ) : null}
              {event.poids_kg ? (
                <p className="inline-flex rounded-10 bg-accent-green-15 px-2.5 py-1 font-body text-xs font-medium text-accent-green">
                  Poids : {event.poids_kg} kg
                </p>
              ) : null}
              {!event.diagnostic && !event.description && !event.traitement && !event.poids_kg ? (
                <p className="font-body text-sm text-fg-secondary">{getMedicalEventSummary(event)}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
