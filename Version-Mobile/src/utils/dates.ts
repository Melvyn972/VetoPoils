export function formatDate(value?: string | null) {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeDueDate(value: string) {
  const today = new Date();
  const due = new Date(value);
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

  if (diff < 0) return `En retard de ${Math.abs(diff)} j`;
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `Dans ${diff} j`;
}

export function formatDateForDatabase(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function formatLongDate(date: Date | null) {
  if (!date) return "Sélectionner une date";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortVisitDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export function computeAgeLabel(value?: string | Date | null) {
  if (!value) return "Non renseigné";

  const birthDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(birthDate.getTime())) return "Non renseigné";

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) return "Moins d'un mois";
  if (years <= 0) return `${months} mois`;
  if (months <= 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
}
