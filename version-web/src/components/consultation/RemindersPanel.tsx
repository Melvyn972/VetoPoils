import { formatMedicalEventDate, getReminderTypeLabel } from '../../lib/medicalLabels'
import type { VetReminder } from '../../types/vet'

export function RemindersPanel({ reminders }: { reminders: VetReminder[] }) {
  if (reminders.length === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
        <h3 className="font-title text-base font-semibold text-fg-primary">Rappels actifs</h3>
        <p className="font-body text-sm text-fg-secondary">Aucun rappel programmé.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-title text-base font-semibold text-fg-primary">Rappels actifs</h3>
        <span className="rounded-10 bg-accent-green-15 px-2.5 py-1 font-body text-xs font-medium text-accent-green">
          {reminders.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {reminders.map((reminder) => (
          <article
            key={reminder.id}
            className="rounded-12 border border-fg-tertiary/15 bg-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-body text-sm font-semibold text-fg-primary">{reminder.titre}</p>
                <p className="font-body text-xs text-fg-tertiary">
                  {formatMedicalEventDate(reminder.date_echeance)}
                </p>
              </div>
              <span className="rounded-10 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
                {getReminderTypeLabel(reminder.type)}
              </span>
            </div>
            {reminder.notes ? (
              <p className="mt-2 font-body text-sm text-fg-secondary">{reminder.notes}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
