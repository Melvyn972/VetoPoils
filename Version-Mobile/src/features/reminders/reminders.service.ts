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

export async function fetchReminder(id: string) {
  const { data, error } = await supabase.from("reminders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateReminder(
  reminderId: string,
  values: Partial<Pick<Reminder, "titre" | "type" | "date_echeance" | "notes" | "canal" | "statut">>,
) {
  const { data, error } = await supabase
    .from("reminders")
    .update(values)
    .eq("id", reminderId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function postponeReminder(reminderId: string, days = 7) {
  const reminder = await fetchReminder(reminderId);
  if (!reminder) throw new Error("Rappel introuvable.");

  const nextDate = new Date(`${reminder.date_echeance}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + days);

  return updateReminder(reminderId, {
    date_echeance: nextDate.toISOString().slice(0, 10),
    statut: "actif",
  });
}

export async function deleteReminder(reminderId: string) {
  const { error } = await supabase.from("reminders").delete().eq("id", reminderId);
  if (error) throw error;
}
