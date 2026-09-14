import { supabase } from "@/lib/supabase";
import type { DailyLog } from "@/types/database.types";

export async function fetchDailyLogs(animalId: string) {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("animal_id", animalId)
    .order("date_journal", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createDailyLog(
  values: Pick<DailyLog, "animal_id" | "cree_par"> &
    Partial<Pick<DailyLog, "date_journal" | "repas" | "sortie" | "comportement" | "notes">>,
) {
  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      animal_id: values.animal_id,
      cree_par: values.cree_par,
      date_journal: values.date_journal ?? new Date().toISOString().slice(0, 10),
      repas: values.repas?.trim() || null,
      sortie: values.sortie?.trim() || null,
      comportement: values.comportement?.trim() || null,
      notes: values.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDailyLog(id: string) {
  const { error } = await supabase.from("daily_logs").delete().eq("id", id);
  if (error) throw error;
}
