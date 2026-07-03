const CONSULTATION_RESULT_KEY = 'vetopoils-consultation-result'

export interface ConsultationResult {
  animalName: string
}

export function saveConsultationResult(result: ConsultationResult): void {
  sessionStorage.setItem(CONSULTATION_RESULT_KEY, JSON.stringify(result))
}

export function getConsultationResult(): ConsultationResult | null {
  const raw = sessionStorage.getItem(CONSULTATION_RESULT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as ConsultationResult
  } catch {
    return null
  }
}

export function clearConsultationResult(): void {
  sessionStorage.removeItem(CONSULTATION_RESULT_KEY)
}

export function getTodayDateInputValue(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
