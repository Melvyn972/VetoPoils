import { supabase } from "@/lib/supabase";
import type { Reminder } from "@/types/database.types";

export async function fetchReminders(animalId?: string) {
  let query = supabase
    .from("reminders")
    .select("*")
    .order("date_echeance", { ascending: true });

  if (animalId) {
    query = query.eq("animal_id", animalId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createReminder(values: Pick<
  Reminder,
  "animal_id" | "type" | "date_echeance" | "titre"
> &
  Partial<Pick<Reminder, "canal" | "notes">>) {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      ...values,
      canal: values.canal ?? "both",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateReminderStatus(
  reminderId: string,
  statut: Reminder["statut"],
) {
  const { data, error } = await supabase
    .from("reminders")
    .update({
      statut,
      notifie_le: statut === "termine" ? new Date().toISOString() : null,
    })
    .eq("id", reminderId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
