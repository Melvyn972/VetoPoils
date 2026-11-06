import type { AnimalSexe } from "@/types/database.types";

export function initials(first?: string | null, last?: string | null) {
  const letters = `${first?.[0] ?? ""}${last?.[0] ?? ""}`;
  return letters.toUpperCase() || "VP";
}

export function formatWeight(weight?: number | null) {
  if (!weight) return "Non renseigné";
  return `${weight.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kg`;
}

export function formatSexe(value?: AnimalSexe | string | null) {
  switch (value) {
    case "male":
      return "Mâle";
    case "femelle":
      return "Femelle";
    case "inconnu":
      return "Non renseigné";
    default:
      return value?.trim() || "Non renseigné";
  }
}
