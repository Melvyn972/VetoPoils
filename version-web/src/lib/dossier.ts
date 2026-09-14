import { formatMedicalEventDate, getMedicalEventTypeLabel } from './medicalLabels'
import type { VetDossier, VetMedicalEvent } from '../types/vet'

function escapeHtml(value?: string | null) {
  return (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function formatSexe(value?: string | null) {
  switch (value) {
    case 'male':
      return 'Mâle'
    case 'femelle':
      return 'Femelle'
    case 'inconnu':
      return 'Non renseigné'
    default:
      return value?.trim() || 'Non renseigné'
  }
}

export function buildVetDossierHtml(dossier: VetDossier) {
  const animal = dossier.animal
  const eventsHtml =
    dossier.medical_events.length === 0
      ? '<p>Aucun événement médical.</p>'
      : dossier.medical_events.map((event) => eventArticle(event)).join('')

  const documentsHtml =
    dossier.documents.length === 0
      ? '<p>Aucun document.</p>'
      : `<ul>${dossier.documents
          .map(
            (document) =>
              `<li>${escapeHtml(document.file_name)} · ${escapeHtml(document.category_ocr ?? 'non classé')}</li>`,
          )
          .join('')}</ul>`

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Dossier Vet'OPoil — ${escapeHtml(animal.nom)}</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; color: #1a1a1a; margin: 32px; }
      h1, h2 { color: #2c6e63; }
      .brand { color: #d97706; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
      th { width: 32%; color: #6b7280; }
      .item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
      .meta { color: #6b7280; font-size: 13px; }
    </style>
  </head>
  <body>
    <p class="brand">Vet'OPoil</p>
    <h1>Dossier médical de ${escapeHtml(animal.nom)}</h1>
    <table>
      <tr><th>Espèce</th><td>${escapeHtml(animal.espece)}</td></tr>
      <tr><th>Race</th><td>${escapeHtml(animal.race)}</td></tr>
      <tr><th>Sexe</th><td>${escapeHtml(formatSexe(animal.sexe))}</td></tr>
      <tr><th>Puce</th><td>${escapeHtml(animal.puce)}</td></tr>
    </table>
    <h2>Événements médicaux</h2>
    ${eventsHtml}
    <h2>Documents</h2>
    ${documentsHtml}
    <footer>Document généré par Vet'OPoil — usage informatif.</footer>
  </body>
</html>`
}

function eventArticle(event: VetMedicalEvent) {
  const title = event.titre || getMedicalEventTypeLabel(event.type)
  return `<article class="item">
    <h3>${escapeHtml(title)}</h3>
    <p class="meta">${escapeHtml(getMedicalEventTypeLabel(event.type))} · ${escapeHtml(formatMedicalEventDate(event.date_event))}</p>
    ${event.diagnostic ? `<p><strong>Diagnostic :</strong> ${escapeHtml(event.diagnostic)}</p>` : ''}
    ${event.traitement ? `<p><strong>Traitement :</strong> ${escapeHtml(event.traitement)}</p>` : ''}
    ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}
  </article>`
}

export function printVetDossier(dossier: VetDossier) {
  const html = buildVetDossierHtml(dossier)
  const popup = window.open('', '_blank', 'noopener,noreferrer')
  if (!popup) {
    throw new Error('Autorisez les fenêtres pop-up pour imprimer ou télécharger le dossier.')
  }
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

export function mailtoDossierFallback(animalName: string) {
  const subject = encodeURIComponent(`Dossier médical Vet'OPoil — ${animalName}`)
  const body = encodeURIComponent(
    `Bonjour,\n\nLe dossier de ${animalName} peut être imprimé depuis le portail Vet'OPoil (bouton Imprimer le dossier), puis joint à cet e-mail.\n`,
  )
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
