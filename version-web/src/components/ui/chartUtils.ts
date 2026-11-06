export function scoreColor(score: number | null | undefined) {
  if (score == null) return '#c9d3cf'
  if (score >= 80) return '#2c6e63'
  if (score >= 60) return '#f29a35'
  return '#e85c4a'
}

export function scoreVerdict(score: number | null | undefined) {
  if (score == null) return 'Pas encore calculé'
  if (score >= 85) return 'Excellent suivi'
  if (score >= 70) return 'Bon suivi'
  if (score >= 50) return 'À surveiller'
  return 'Suivi à reprendre'
}
