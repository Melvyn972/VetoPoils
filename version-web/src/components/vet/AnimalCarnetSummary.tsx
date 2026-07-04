import { useMemo } from 'react'

import {
  formatMedicalEventDate,
  getMedicalEventSummary,
  getMedicalEventTypeLabel,
  getReminderTypeLabel,
} from '../../lib/medicalLabels'
import type { VetAnimalDossier } from '../../types/vet'

export function CarnetSummary({ dossier }: { dossier: VetAnimalDossier }) {
  const snapshot = useMemo(() => {
    const events = dossier.medical_events
    const reminders = dossier.reminders
    const latestEvents = events.slice(0, 3)
    const nextReminder = [...reminders].sort(
      (a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime(),
    )[0]

    const lastEvent = events[0] ?? null

    return {
      eventsCount: events.length,
      documentsCount: dossier.documents.length,
      remindersCount: reminders.length,
      latestEvents,
      nextReminder,
      lastEvent,
    }
  }, [dossier])

  return (
    <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
      <div>
        <h3 className="font-title text-base font-semibold text-fg-primary">Résumé du carnet</h3>
        <p className="mt-1 font-body text-sm text-fg-secondary">
          Vue d’ensemble de l’historique médical validé par le propriétaire.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Événements', value: snapshot.eventsCount },
          { label: 'Documents', value: snapshot.documentsCount },
          { label: 'Rappels actifs', value: snapshot.remindersCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-12 bg-surface px-3 py-3 text-center">
            <p className="font-title text-xl font-bold text-primary">{stat.value}</p>
            <p className="mt-1 font-body text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {snapshot.lastEvent ? (
        <div className="rounded-12 border border-primary/15 bg-primary-15/40 px-4 py-3">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-primary">
            Dernier événement
          </p>
          <p className="mt-1 font-body text-sm font-semibold text-fg-primary">
            {snapshot.lastEvent.titre ?? getMedicalEventTypeLabel(snapshot.lastEvent.type)}
          </p>
          <p className="font-body text-xs text-fg-secondary">
            {getMedicalEventTypeLabel(snapshot.lastEvent.type)} ·{' '}
            {formatMedicalEventDate(snapshot.lastEvent.date_event)}
          </p>
          {snapshot.lastEvent.diagnostic ? (
            <p className="mt-2 font-body text-sm text-fg-secondary">{snapshot.lastEvent.diagnostic}</p>
          ) : (
            <p className="mt-2 font-body text-sm text-fg-secondary">
              {getMedicalEventSummary(snapshot.lastEvent)}
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-12 bg-surface px-4 py-3 font-body text-sm text-fg-secondary">
          Aucun événement validé dans le carnet pour le moment.
        </p>
      )}

      {snapshot.nextReminder ? (
        <div className="rounded-12 border border-accent-green/20 bg-accent-green-15/50 px-4 py-3">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-accent-green">
            Prochain rappel
          </p>
          <p className="mt-1 font-body text-sm font-semibold text-fg-primary">{snapshot.nextReminder.titre}</p>
          <p className="font-body text-xs text-fg-secondary">
            {getReminderTypeLabel(snapshot.nextReminder.type)} ·{' '}
            {formatMedicalEventDate(snapshot.nextReminder.date_echeance)}
          </p>
        </div>
      ) : null}

      {snapshot.latestEvents.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Événements récents
          </p>
          {snapshot.latestEvents.slice(1).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-10 bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-fg-primary">
                  {event.titre ?? getMedicalEventTypeLabel(event.type)}
                </p>
                <p className="font-body text-xs text-fg-tertiary">
                  {formatMedicalEventDate(event.date_event)}
                </p>
              </div>
              <span className="shrink-0 rounded-8 bg-primary-15 px-2 py-0.5 font-body text-[11px] font-medium text-primary">
                {getMedicalEventTypeLabel(event.type)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
