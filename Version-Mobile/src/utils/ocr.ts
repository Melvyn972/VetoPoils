import type { DocumentCategory, MedicalEventType } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export type OcrSource = "api" | "heuristic";

export type OcrExtraction = {
  category: DocumentCategory;
  titre: string;
  diagnostic: string;
  traitement: string;
  montant: number | null;
  poidsKg: number | null;
  dateEvent: string | null;
  molecules: string[];
  raw: Record<string, unknown>;
  source: OcrSource;
};

export type OcrQuota = {
  plan: string;
  usage: number;
  limit: number | null;
  remaining: number | null;
};

export type OcrErrorCode =
  | "quota_exceeded"
  | "no_text_found"
  | "unsupported_type"
  | "file_too_large"
  | "ocr_not_configured"
  | "unavailable";

const OCR_ERROR_MESSAGES: Record<OcrErrorCode, string> = {
  quota_exceeded: "Limite atteinte : 2 analyses automatiques par mois en plan gratuit.",
  no_text_found: "Aucun texte lisible détecté sur ce document.",
  unsupported_type: "Format non pris en charge (photo JPEG/PNG/WebP ou PDF).",
  file_too_large: "Fichier trop volumineux pour l’analyse (10 Mo maximum).",
  ocr_not_configured: "L’analyse automatique n’est pas encore activée.",
  unavailable: "L’analyse automatique est momentanément indisponible.",
};

export class OcrError extends Error {
  code: OcrErrorCode;
  constructor(code: OcrErrorCode) {
    super(OCR_ERROR_MESSAGES[code]);
    this.code = code;
  }
}

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  ordonnance: "Ordonnance",
  facture: "Facture",
  analyse_sanguine: "Analyse",
  vaccination: "Vaccination",
  autre: "Autre",
};

const CATEGORY_KEYWORDS: Array<{ category: DocumentCategory; keywords: string[] }> = [
  { category: "facture", keywords: ["facture", "invoice", "recu", "reçu", "paiement", "montant"] },
  {
    category: "vaccination",
    keywords: ["vaccin", "vaccination", "rage", "chppi", "rappel vaccin"],
  },
  {
    category: "analyse_sanguine",
    keywords: ["analyse", "bilan", "sang", "laboratoire", "labo", "biologie"],
  },
  {
    category: "ordonnance",
    keywords: ["ordonnance", "prescription", "posologie", "medicament", "médicament"],
  },
];

export function suggestDocumentCategory(
  fileName: string,
  mimeType?: string | null,
  extractedText?: string | null,
): DocumentCategory {
  const haystack = `${fileName} ${extractedText ?? ""}`.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.category;
    }
  }
  if (mimeType === "application/pdf" && haystack.includes("pdf")) {
    return "autre";
  }
  return "autre";
}

export function categoryToMedicalEventType(category: DocumentCategory): MedicalEventType {
  switch (category) {
    case "vaccination":
      return "vaccination";
    case "ordonnance":
      return "ordonnance";
    case "analyse_sanguine":
      return "analyse";
    case "facture":
      return "consultation";
    default:
      return "autre";
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseOcrApiResponse(payload: unknown, fallback: OcrExtraction): OcrExtraction {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as Record<string, unknown>;
  const nested =
    data.result && typeof data.result === "object" ? (data.result as Record<string, unknown>) : data;

  const categoryRaw = asString(nested.category ?? nested.category_ocr ?? nested.type).toLowerCase();
  const allowed: DocumentCategory[] = [
    "ordonnance",
    "facture",
    "analyse_sanguine",
    "vaccination",
    "autre",
  ];
  const category = allowed.includes(categoryRaw as DocumentCategory)
    ? (categoryRaw as DocumentCategory)
    : suggestDocumentCategory(
        fallback.titre,
        null,
        `${asString(nested.text)} ${asString(nested.titre)}`,
      );

  return {
    category,
    titre: asString(nested.titre ?? nested.title) || fallback.titre,
    diagnostic: asString(nested.diagnostic ?? nested.diagnosis),
    traitement: asString(nested.traitement ?? nested.treatment),
    montant: asNumber(nested.montant ?? nested.amount ?? nested.total),
    poidsKg: asNumber(nested.poids_kg ?? nested.weight ?? nested.poids),
    dateEvent: asString(nested.date_event ?? nested.date) || null,
    molecules: Array.isArray(nested.molecules)
      ? nested.molecules.filter((m): m is string => typeof m === "string")
      : [],
    raw: nested,
    source: "api",
  };
}

export function heuristicExtraction(fileName: string, mimeType?: string | null): OcrExtraction {
  const category = suggestDocumentCategory(fileName, mimeType);
  return {
    category,
    titre: fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    diagnostic: "",
    traitement: "",
    montant: null,
    poidsKg: null,
    dateEvent: null,
    molecules: [],
    raw: { fileName, mimeType, suggested: category },
    source: "heuristic",
  };
}

const KNOWN_CODES: OcrErrorCode[] = [
  "quota_exceeded",
  "no_text_found",
  "unsupported_type",
  "file_too_large",
  "ocr_not_configured",
];

async function errorCodeFrom(error: unknown): Promise<OcrErrorCode> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: string };
      if (body.error && KNOWN_CODES.includes(body.error as OcrErrorCode)) {
        return body.error as OcrErrorCode;
      }
    } catch {
      // corps illisible : erreur générique
    }
  }
  return "unavailable";
}

/** Analyse via l'Edge Function `ocr-extract` (Google Vision côté serveur, quota inclus). */
export async function runOcrRequest(params: {
  imageBase64: string;
  mimeType: string;
  fileName: string;
}): Promise<{ extraction: OcrExtraction; quota: OcrQuota | null }> {
  const { data, error } = await supabase.functions.invoke("ocr-extract", {
    body: {
      image_base64: params.imageBase64,
      mime_type: params.mimeType,
      file_name: params.fileName,
    },
  });
  if (error) throw new OcrError(await errorCodeFrom(error));

  return {
    extraction: parseOcrApiResponse(data, heuristicExtraction(params.fileName, params.mimeType)),
    quota: ((data as { quota?: OcrQuota } | null)?.quota ?? null) as OcrQuota | null,
  };
}
