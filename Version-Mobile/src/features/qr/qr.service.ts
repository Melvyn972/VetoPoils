import { supabase } from "@/lib/supabase";
import type { VetAccessToken } from "@/types/database.types";

export async function generateVetToken(animalId: string, hours = 4) {
  const { data, error } = await supabase.rpc("generer_vet_token", {
    p_animal_id: animalId,
    p_duree_heures: hours,
  });

  if (error) throw error;
  return data as VetAccessToken;
}

export async function revokeVetToken(token: string) {
  const { error } = await supabase.rpc("revoquer_vet_token", {
    p_token: token,
  });

  if (error) throw error;
}

export async function fetchActiveVetTokens(animalId: string) {
  const { data, error } = await supabase
    .from("vet_access_tokens")
    .select("*")
    .eq("animal_id", animalId)
    .eq("statut", "actif")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
