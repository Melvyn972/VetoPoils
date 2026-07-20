import { supabase } from "@/lib/supabase";
import type { AnimalShare, PartageRole } from "@/types/database.types";

export type PendingInvitation = AnimalShare & {
  animal_nom?: string | null;
  animal_espece?: string | null;
  animaux?: { nom?: string; espece?: string } | null;
};

type MesInvitationRow = {
  share_id: string;
  share_animal_id: string;
  share_user_id: string | null;
  share_email_invite: string;
  share_role: PartageRole;
  share_statut: AnimalShare["statut"];
  share_invite_par: string;
  share_created_at: string;
  share_accepte_le: string | null;
  animal_nom: string | null;
  animal_espece: string | null;
};

function isMissingRpcError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST202"
  );
}

function mapInvitationRow(row: MesInvitationRow): PendingInvitation {
  return {
    id: row.share_id,
    animal_id: row.share_animal_id,
    user_id: row.share_user_id,
    email_invite: row.share_email_invite,
    role: row.share_role,
    statut: row.share_statut,
    invite_par: row.share_invite_par,
    created_at: row.share_created_at,
    accepte_le: row.share_accepte_le,
    animal_nom: row.animal_nom,
    animal_espece: row.animal_espece,
    animaux: {
      nom: row.animal_nom ?? undefined,
      espece: row.animal_espece ?? undefined,
    },
  };
}

export async function fetchShares(animalId: string) {
  const { data, error } = await supabase
    .from("animal_shares")
    .select("*")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Vérifie qu'un compte Vet'OPoil existe pour cet email. */
export async function accountExistsForEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const { data, error } = await supabase.rpc("compte_existe_par_email", {
    p_email: normalized,
  });

  if (!error) return Boolean(data);

  if (!isMissingRpcError(error)) throw error;

  // Fallback si RPC absente : lecture profiles (selon RLS)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profileError) throw profileError;
  return Boolean(profile?.id);
}

export async function inviteShare(values: {
  animal_id: string;
  email_invite: string;
  role: PartageRole;
  invite_par: string;
}) {
  const email = values.email_invite.trim().toLowerCase();

  const { data: rpcData, error: rpcError } = await supabase.rpc("inviter_partage_animal", {
    p_animal_id: values.animal_id,
    p_email_invite: email,
    p_role: values.role,
  });

  if (!rpcError) return rpcData as AnimalShare;

  if (!isMissingRpcError(rpcError)) throw rpcError;

  // Fallback : vérifier le compte puis insérer
  const exists = await accountExistsForEmail(email);
  if (!exists) {
    throw new Error(
      `Aucun compte Vet'OPoil trouvé pour ${email}. La personne doit d'abord créer un compte avec cet email.`,
    );
  }

  const { data, error } = await supabase
    .from("animal_shares")
    .insert({
      animal_id: values.animal_id,
      email_invite: email,
      role: values.role,
      invite_par: values.invite_par,
      statut: "en_attente",
    })
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

export async function refuseShare(shareId: string) {
  const { error: rpcError } = await supabase.rpc("refuser_invitation_partage", {
    p_share_id: shareId,
  });

  if (!rpcError) return;

  if (!isMissingRpcError(rpcError)) throw rpcError;

  const { error } = await supabase.from("animal_shares").delete().eq("id", shareId);
  if (error) throw error;
}

export async function revokeShare(share: Pick<AnimalShare, "id" | "statut" | "user_id">) {
  const { data: rpcData, error: rpcError } = await supabase.rpc("revoquer_partage", {
    p_share_id: share.id,
  });

  if (!rpcError) return rpcData as AnimalShare | null;

  if (!isMissingRpcError(rpcError)) throw rpcError;

  if (share.statut === "en_attente" || !share.user_id) {
    const { error } = await supabase.from("animal_shares").delete().eq("id", share.id);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("animal_shares")
    .update({ statut: "revoquee" })
    .eq("id", share.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPendingInvitations(email: string): Promise<PendingInvitation[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("mes_invitations_partage");

  if (!rpcError && Array.isArray(rpcData)) {
    return (rpcData as MesInvitationRow[]).map(mapInvitationRow);
  }

  // Toujours retomber sur le SELECT simple si la RPC échoue (ex. id ambigu)
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const { data, error } = await supabase
    .from("animal_shares")
    .select("*")
    .eq("statut", "en_attente")
    .ilike("email_invite", normalized)
    .order("created_at", { ascending: false });

  if (error) {
    // Si la RPC a une erreur différente, la remonter seulement si le fallback échoue aussi
    throw rpcError && !isMissingRpcError(rpcError) ? rpcError : error;
  }

  return data ?? [];
}

export async function countPendingInvitations(email: string) {
  try {
    const invites = await fetchPendingInvitations(email);
    return invites.length;
  } catch {
    return 0;
  }
}
