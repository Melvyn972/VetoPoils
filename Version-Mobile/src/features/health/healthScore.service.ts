import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database.types";
import type { HealthScoreResult } from "@/utils/healthScore";

export async function persistHealthScore(animalId: string, result: HealthScoreResult) {
  const { error: animalError } = await supabase
    .from("animaux")
    .update({ score_sante: result.score })
    .eq("id", animalId);

  if (animalError) throw animalError;

  const latest = await fetchLatestHealthScore(animalId);
  if (latest && Number(latest.score) === result.score) {
    return latest;
  }

  const { data, error: historyError } = await supabase
    .from("health_score_history")
    .insert({
      animal_id: animalId,
      score: result.score,
      details: result.details as unknown as Json,
    })
    .select("*")
    .single();

  if (historyError) throw historyError;
  return data;
}

export async function fetchLatestHealthScore(animalId: string) {
  const { data, error } = await supabase
    .from("health_score_history")
    .select("*")
    .eq("animal_id", animalId)
    .order("calcule_le", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
