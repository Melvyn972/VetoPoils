export type HealthScoreFactor = {
  code: string
  label: string
  delta: number
}

export type HealthScoreDetails = {
  factors: HealthScoreFactor[]
  weightTrend: 'hausse' | 'baisse' | 'stable' | 'inconnu'
  lastWeightKg: number | null
  lateReminderCount: number
  pendingEventCount: number
  daysSinceLastConsultation: number | null
  consultsLast12Months: number
}

type ScoreEvent = {
  type: string
  status: string
  date_event: string
  poids_kg?: number | null
}

type ScoreReminder = {
  type: string
  statut: string
  date_echeance: string
}

function pushFactor(factors: HealthScoreFactor[], code: string, label: string, delta: number) {
  if (delta === 0) return
  factors.push({ code, label, delta })
}

export function computeHealthScore(params: {
  animal?: { date_naissance?: string | null; puce?: string | null } | null
  events: ScoreEvent[]
  reminders: ScoreReminder[]
}) {
  if (!params.animal) return null

  const now = Date.now()
  const factors: HealthScoreFactor[] = []
  const validatedEvents = params.events.filter((event) => event.status !== 'rejected')
  const pendingEvents = params.events.filter((event) => event.status === 'pending')
  const activeReminders = params.reminders.filter((reminder) => reminder.statut === 'actif')
  const lateReminders = activeReminders.filter(
    (reminder) => new Date(reminder.date_echeance).getTime() < now,
  )
  const lateVaccines = lateReminders.filter((reminder) => reminder.type === 'vaccination')

  const weights = validatedEvents
    .filter((event) => event.poids_kg && event.poids_kg > 0)
    .map((event) => ({ kg: Number(event.poids_kg), at: new Date(event.date_event).getTime() }))
    .sort((a, b) => a.at - b.at)

  let weightTrend: HealthScoreDetails['weightTrend'] = 'inconnu'
  const lastWeightKg = weights.at(-1)?.kg ?? null
  if (weights.length >= 2) {
    const first = weights[0].kg
    const last = weights[weights.length - 1].kg
    const deltaPct = first > 0 ? (last - first) / first : 0
    if (deltaPct <= -0.1) {
      weightTrend = 'baisse'
      pushFactor(factors, 'poids_baisse', 'Courbe de poids en baisse (> 10 %)', -12)
    } else if (deltaPct >= 0.2) {
      weightTrend = 'hausse'
      pushFactor(factors, 'poids_hausse', 'Prise de poids importante (> 20 %)', -6)
    } else {
      weightTrend = 'stable'
    }
  }

  pushFactor(
    factors,
    'rappels_retard',
    `${lateReminders.length} rappel${lateReminders.length > 1 ? 's' : ''} en retard`,
    -Math.min(30, lateReminders.length * 10),
  )
  pushFactor(factors, 'vaccin_retard', 'Rappel de vaccination en retard', -Math.min(15, lateVaccines.length * 15))
  pushFactor(
    factors,
    'pending',
    `${pendingEvents.length} événement${pendingEvents.length > 1 ? 's' : ''} en attente`,
    -Math.min(16, pendingEvents.length * 8),
  )

  const yearAgo = now - 365 * 86_400_000
  const consultsLast12Months = validatedEvents.filter((event) => {
    if (event.type !== 'consultation') return false
    return new Date(event.date_event).getTime() >= yearAgo
  }).length

  if (consultsLast12Months === 0) {
    pushFactor(factors, 'consult_absente', 'Aucune consultation sur 12 mois', -15)
  } else if (consultsLast12Months === 1) {
    pushFactor(factors, 'consult_rare', 'Une seule consultation sur 12 mois', -5)
  }

  const lastEvent = validatedEvents[0]
  let daysSinceLastConsultation: number | null = null
  if (!lastEvent) {
    pushFactor(factors, 'aucun_event', 'Aucun événement médical enregistré', -20)
  } else {
    daysSinceLastConsultation = Math.floor((now - new Date(lastEvent.date_event).getTime()) / 86_400_000)
    if (daysSinceLastConsultation > 365) {
      pushFactor(factors, 'anciennete', 'Dernier événement il y a plus d’un an', -12)
    } else if (daysSinceLastConsultation > 180) {
      pushFactor(factors, 'anciennete', 'Dernier événement il y a plus de 6 mois', -6)
    }
  }

  if (!params.animal.date_naissance) {
    pushFactor(factors, 'naissance', 'Date de naissance manquante', -4)
  }
  if (!params.animal.puce) {
    pushFactor(factors, 'puce', 'Numéro de puce non renseigné', -3)
  }

  const score = Math.max(0, Math.min(100, Math.round(100 + factors.reduce((sum, factor) => sum + factor.delta, 0))))

  return {
    score,
    details: {
      factors: factors.filter((factor) => factor.delta !== 0),
      weightTrend,
      lastWeightKg,
      lateReminderCount: lateReminders.length,
      pendingEventCount: pendingEvents.length,
      daysSinceLastConsultation,
      consultsLast12Months,
    } satisfies HealthScoreDetails,
  }
}
