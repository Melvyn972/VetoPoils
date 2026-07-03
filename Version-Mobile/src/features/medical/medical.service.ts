import { supabase } from "@/lib/supabase";
import type { MedicalEvent, MedicalEventType } from "@/types/database.types";

export async function fetchMedicalEvents(animalId: string) {
  const { data, error } = await supabase
    .from("medical_events")
    .select("*")
    .eq("animal_id", animalId)
    .order("date_event", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createMedicalEvent(values: {
  animal_id: string;
  type: MedicalEventType;
  titre?: string;
  description?: string;
  poids_kg?: number;
}) {
  const { data, error } = await supabase
    .from("medical_events")
    .insert(values)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function validateMedicalEvent(eventId: string) {
  const { data, error } = await supabase.rpc("valider_medical_event", {
    p_event_id: eventId,
  });

  if (error) throw error;
  return data as MedicalEvent;
}
