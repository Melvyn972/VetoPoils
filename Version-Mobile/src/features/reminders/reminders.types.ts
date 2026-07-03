import type { ReminderChannel, ReminderType } from "@/types/database.types";

export type ReminderFormValues = {
  type: ReminderType;
  titre: string;
  date_echeance: string;
  canal: ReminderChannel;
  notes?: string;
};
