import { supabase } from "@/lib/supabase";
import type { PartageRole } from "@/types/database.types";

export async function fetchShares(animalId: string) {
  const { data, error } = await supabase
    .from("animal_shares")
    .select("*")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function inviteShare(values: {
  animal_id: string;
  email_invite: string;
  role: PartageRole;
  invite_par: string;
}) {
  const { data, error } = await supabase
    .from("animal_shares")
    .insert(values)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function acceptShare(shareId: string) {
  const { data, error } = await supabase.rpc("accepter_invitation_partage", {
    p_share_id: shareId,
  });

  if (error) throw error;
  return data;
}

export async function revokeShare(shareId: string) {
  const { data, error } = await supabase.rpc("revoquer_partage", {
    p_share_id: shareId,
  });

  if (error) throw error;
  return data;
}

export async function fetchPendingInvitations(email: string) {
  const { data, error } = await supabase
    .from("animal_shares")
    .select("*, animaux(nom, espece)")
    .ilike("email_invite", email.trim())
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
