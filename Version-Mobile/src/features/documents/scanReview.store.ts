import type { Document } from "@/types/database.types";
import type { OcrExtraction } from "@/utils/ocr";

export type ScanReviewPayload = {
  animalId: string;
  document: Document;
  extraction: OcrExtraction;
  ocrConfigured: boolean;
  ocrError?: string | null;
};

let pending: ScanReviewPayload | null = null;

export function setPendingScanReview(payload: ScanReviewPayload) {
  pending = payload;
}

export function peekPendingScanReview() {
  return pending;
}

export function takePendingScanReview() {
  const current = pending;
  pending = null;
  return current;
}
