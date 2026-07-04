import type { MedicalEventType } from "@/types/database.types";

export type MedicalEventFilter = "all" | MedicalEventType | "pending";
