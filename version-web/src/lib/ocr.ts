import { suggestDocumentCategory, type DocumentCategory } from './cdc'
import { env, isOcrConfigured } from './env'
import type { MedicalEventType } from '../types/owner'

export type OcrSource = 'api' | 'heuristic'

export type OcrExtraction = {
  category: DocumentCategory
  titre: string
  diagnostic: string
  traitement: string
  montant: number | null
  poidsKg: number | null
  dateEvent: string | null
  raw: Record<string, unknown>
  source: OcrSource
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function categoryToMedicalEventType(category: DocumentCategory): MedicalEventType {
  switch (category) {
    case 'vaccination':
      return 'vaccination'
    case 'ordonnance':
      return 'ordonnance'
    case 'analyse_sanguine':
      return 'analyse'
    case 'facture':
      return 'consultation'
    default:
      return 'autre'
  }
}

export function expenseCategoryFromDocument(category: DocumentCategory) {
  if (category === 'ordonnance') return 'pharmacie' as const
  return 'veterinaire' as const
}

export function heuristicExtraction(fileName: string, mimeType?: string | null): OcrExtraction {
  const category = suggestDocumentCategory(fileName, mimeType)
  return {
    category,
    titre: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    diagnostic: '',
    traitement: '',
    montant: null,
    poidsKg: null,
    dateEvent: null,
    raw: { fileName, mimeType, suggested: category },
    source: 'heuristic',
  }
}

export function parseOcrApiResponse(payload: unknown, fallback: OcrExtraction): OcrExtraction {
  if (!payload || typeof payload !== 'object') return fallback
  const data = payload as Record<string, unknown>
  const nested =
    data.result && typeof data.result === 'object' ? (data.result as Record<string, unknown>) : data
  const allowed: DocumentCategory[] = [
    'ordonnance',
    'facture',
    'analyse_sanguine',
    'vaccination',
    'autre',
  ]
  const categoryRaw = asString(nested.category ?? nested.category_ocr ?? nested.type).toLowerCase()
  const category = allowed.includes(categoryRaw as DocumentCategory)
    ? (categoryRaw as DocumentCategory)
    : suggestDocumentCategory(fallback.titre, null, `${asString(nested.text)} ${asString(nested.titre)}`)

  return {
    category,
    titre: asString(nested.titre ?? nested.title) || fallback.titre,
    diagnostic: asString(nested.diagnostic ?? nested.diagnosis),
    traitement: asString(nested.traitement ?? nested.treatment),
    montant: asNumber(nested.montant ?? nested.amount ?? nested.total),
    poidsKg: asNumber(nested.poids_kg ?? nested.weight ?? nested.poids),
    dateEvent: asString(nested.date_event ?? nested.date) || null,
    raw: nested,
    source: 'api',
  }
}

export async function runOcrRequest(params: {
  imageBase64: string
  mimeType: string
  fileName: string
}): Promise<OcrExtraction | null> {
  if (!isOcrConfigured()) return null

  const response = await fetch(env.ocrApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ocrApiKey}`,
      'x-api-key': env.ocrApiKey,
    },
    body: JSON.stringify({
      image_base64: params.imageBase64,
      mime_type: params.mimeType,
      file_name: params.fileName,
    }),
  })

  if (!response.ok) {
    throw new Error(`OCR indisponible (${response.status}).`)
  }

  const payload = await response.json()
  return parseOcrApiResponse(payload, heuristicExtraction(params.fileName, params.mimeType))
}
