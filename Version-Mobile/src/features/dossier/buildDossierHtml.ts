import type { Animal, DailyLog, Document, MedicalEvent, Reminder } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { formatSexe } from "@/utils/formatters";
import { medicalEventTypeLabels } from "@/utils/medicalLabels";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  validated: "Validé",
  rejected: "Refusé",
};

type DossierInput = {
  animal: Animal;
  events: MedicalEvent[];
  documents: Document[];
  reminders?: Reminder[];
  logs?: DailyLog[];
};

function escapeHtml(value?: string | null) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function row(label: string, value?: string | null) {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || "Non renseigné")}</td></tr>`;
}

export function buildDossierHtml(input: DossierInput) {
  const eventsHtml =
    input.events.length === 0
      ? "<p>Aucun événement médical.</p>"
      : input.events
          .map((event) => {
            const title = event.titre || medicalEventTypeLabels[event.type] || event.type;
            return `<article class="item">
              <h3>${escapeHtml(title)}</h3>
              <p class="meta">${escapeHtml(medicalEventTypeLabels[event.type] ?? event.type)} · ${escapeHtml(formatDate(event.date_event))} · ${escapeHtml(STATUS_LABELS[event.status] ?? event.status)}</p>
              ${event.diagnostic ? `<p><strong>Diagnostic :</strong> ${escapeHtml(event.diagnostic)}</p>` : ""}
              ${event.traitement ? `<p><strong>Traitement :</strong> ${escapeHtml(event.traitement)}</p>` : ""}
              ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
              ${event.poids_kg ? `<p>Poids : ${event.poids_kg} kg</p>` : ""}
            </article>`;
          })
          .join("");

  const documentsHtml =
    input.documents.length === 0
      ? "<p>Aucun document.</p>"
      : `<ul>${input.documents
          .map(
            (document) =>
              `<li>${escapeHtml(document.file_name)} · ${escapeHtml(document.category_ocr ?? "non classé")} · ${escapeHtml(formatDate(document.created_at))}</li>`,
          )
          .join("")}</ul>`;

  const remindersHtml = (input.reminders ?? [])
    .filter((reminder) => reminder.statut === "actif")
    .map(
      (reminder) =>
        `<li>${escapeHtml(reminder.titre)} · ${escapeHtml(formatDate(reminder.date_echeance))}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Dossier Vet'OPoil — ${escapeHtml(input.animal.nom)}</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #17211F; margin: 32px; }
      h1, h2 { color: #0F7B6C; }
      .brand { color: #D97706; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #E2DDD2; vertical-align: top; }
      th { width: 34%; color: #68736F; font-weight: 700; }
      .item { border: 1px solid #E2DDD2; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
      .meta { color: #68736F; font-size: 13px; }
      footer { margin-top: 32px; font-size: 12px; color: #68736F; }
    </style>
  </head>
  <body>
    <p class="brand">Vet'OPoil</p>
    <h1>Dossier médical de ${escapeHtml(input.animal.nom)}</h1>
    <p>Généré le ${escapeHtml(formatDate(new Date().toISOString()))}</p>
    <h2>Identité</h2>
    <table>
      ${row("Nom", input.animal.nom)}
      ${row("Espèce", input.animal.espece)}
      ${row("Race", input.animal.race)}
      ${row("Sexe", formatSexe(input.animal.sexe))}
      ${row("Date de naissance", input.animal.date_naissance ? formatDate(input.animal.date_naissance) : null)}
      ${row("Couleur", input.animal.couleur)}
      ${row("Puce", input.animal.puce)}
    </table>
    <h2>Événements médicaux</h2>
    ${eventsHtml}
    <h2>Documents</h2>
    ${documentsHtml}
    <h2>Rappels actifs</h2>
    ${remindersHtml ? `<ul>${remindersHtml}</ul>` : "<p>Aucun rappel actif.</p>"}
    <footer>Document généré par Vet'OPoil — à usage informatif, ne remplace pas un dossier clinique officiel.</footer>
  </body>
</html>`;
}
