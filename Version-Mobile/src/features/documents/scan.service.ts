import * as FileSystem from "expo-file-system/legacy";

import { isOcrConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { buildAnimalStoragePath } from "@/lib/storagePaths";
import type { Document } from "@/types/database.types";
import {
  heuristicExtraction,
  runOcrRequest,
  type OcrExtraction,
} from "@/utils/ocr";

import { createDocumentMetadata, incrementOcrUsage } from "./documents.service";

async function readBase64(uri: string, provided?: string | null) {
  if (provided) return provided;
  if (uri.startsWith("data:")) {
    return uri.split(",")[1] ?? null;
  }

  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

export async function analyzeDocument(params: {
  uri: string;
  fileName: string;
  mimeType: string;
  base64?: string | null;
}): Promise<{ extraction: OcrExtraction; ocrError: string | null }> {
  const fallback = heuristicExtraction(params.fileName, params.mimeType);

  if (!isOcrConfigured()) {
    return { extraction: fallback, ocrError: null };
  }

  const imageBase64 = await readBase64(params.uri, params.base64);
  if (!imageBase64) {
    return {
      extraction: fallback,
      ocrError: "Le fichier n’a pas pu être lu pour l’analyse automatique.",
    };
  }

  try {
    const extraction = await runOcrRequest({
      imageBase64,
      mimeType: params.mimeType,
      fileName: params.fileName,
    });
    if (!extraction) {
      return { extraction: fallback, ocrError: null };
    }
    await incrementOcrUsage().catch(() => undefined);
    return { extraction, ocrError: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analyse automatique indisponible.";
    return { extraction: fallback, ocrError: message };
  }
}

export async function uploadAndAnalyzeDocument(params: {
  animalId: string;
  ownerId: string;
  userId?: string | null;
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
  base64?: string | null;
}): Promise<{ document: Document; extraction: OcrExtraction; ocrError: string | null }> {
  const { extraction, ocrError } = await analyzeDocument({
    uri: params.uri,
    fileName: params.fileName,
    mimeType: params.mimeType,
    base64: params.base64,
  });

  const path = buildAnimalStoragePath({
    ownerId: params.ownerId,
    animalId: params.animalId,
    fileName: params.fileName,
  });
  const response = await fetch(params.uri);
  const fileBody = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from("animal-documents").upload(path, fileBody, {
    contentType: params.mimeType || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const document = await createDocumentMetadata({
    animal_id: params.animalId,
    file_path: path,
    file_name: params.fileName,
    mime_type: params.mimeType || "application/octet-stream",
    taille_octets: params.size || 1,
    category_ocr: extraction.category,
    raw_ocr_json: {
      ...extraction.raw,
      source: extraction.source,
      ocr_error: ocrError,
    },
    uploade_par: params.userId ?? null,
  });

  return { document, extraction, ocrError };
}
