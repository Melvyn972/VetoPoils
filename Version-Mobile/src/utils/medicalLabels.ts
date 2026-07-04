import type { MedicalEvent, MedicalEventType } from "@/types/database.types";

export const medicalEventTypeLabels: Record<MedicalEventType, string> = {
  consultation: "Consultation",
  vaccination: "Vaccination",
  chirurgie: "Chirurgie",
  ordonnance: "Ordonnance",
  analyse: "Analyse",
  autre: "Autre",
};

export function getMedicalEventTypeLabel(type: MedicalEventType | string) {
  return medicalEventTypeLabels[type as MedicalEventType] ?? type;
}

export function getMedicalEventSummary(event: MedicalEvent) {
  const parts = [
    event.diagnostic?.trim(),
    event.description?.trim(),
    event.traitement?.trim() ? `Traitement : ${event.traitement.trim()}` : null,
    event.poids_kg != null ? `Poids : ${event.poids_kg} kg` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
