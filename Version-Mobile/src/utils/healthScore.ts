import type { Animal, MedicalEvent, Reminder } from "@/types/database.types";

export function computeHealthScore(params: {
  animal?: Animal | null;
  events: MedicalEvent[];
  reminders: Reminder[];
}) {
  if (!params.animal) return null;

  let score = 100;
  const now = Date.now();
  const activeReminders = params.reminders.filter((reminder) => reminder.statut === "actif");
  const lateReminders = activeReminders.filter(
    (reminder) => new Date(reminder.date_echeance).getTime() < now,
  );
  const pendingEvents = params.events.filter((event) => event.status === "pending");
  const lastEvent = params.events[0];

  score -= lateReminders.length * 15;
  score -= pendingEvents.length * 10;

  if (!lastEvent) {
    score -= 20;
  } else {
    const daysSinceLastEvent = Math.floor(
      (now - new Date(lastEvent.date_event).getTime()) / 86_400_000,
    );
    if (daysSinceLastEvent > 365) score -= 12;
    else if (daysSinceLastEvent > 180) score -= 6;
  }

  if (!params.animal.date_naissance) score -= 4;
  if (!params.animal.puce) score -= 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}
