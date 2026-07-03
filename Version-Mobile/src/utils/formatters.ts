export function initials(first?: string | null, last?: string | null) {
  const letters = `${first?.[0] ?? ""}${last?.[0] ?? ""}`;
  return letters.toUpperCase() || "VP";
}

export function formatWeight(weight?: number | null) {
  if (!weight) return "Non renseigné";
  return `${weight.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kg`;
}
