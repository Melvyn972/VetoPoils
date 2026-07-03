import type { ImagePickerAsset } from "expo-image-picker";

import { buildAnimalStoragePath } from "@/lib/storagePaths";
import { supabase } from "@/lib/supabase";
import type { Animal } from "@/types/database.types";

function isMissingRpcError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST202"
  );
}

async function getCurrentOwnerId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Utilisateur non authentifié.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, compte_proprietaire_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  return profile?.compte_proprietaire_id ?? user.id;
}

export async function fetchAnimals() {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAnimal(id: string) {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAnimal(
  values: Pick<Animal, "nom" | "espece"> &
    Partial<Pick<Animal, "race" | "date_naissance" | "sexe" | "couleur" | "puce">>,
) {
  const payload = {
    nom: values.nom,
    espece: values.espece,
    race: values.race ?? null,
    date_naissance: values.date_naissance ?? null,
    sexe: values.sexe ?? "inconnu",
    couleur: values.couleur ?? null,
    puce: values.puce ?? null,
  };

  const { data, error } = await supabase.rpc("creer_animal", {
    p_nom: values.nom,
    p_espece: values.espece,
    p_race: values.race ?? null,
    p_date_naissance: values.date_naissance ?? null,
    p_sexe: values.sexe ?? "inconnu",
    p_couleur: values.couleur ?? null,
    p_puce: values.puce ?? null,
  });

  if (error) {
    if (!isMissingRpcError(error)) throw error;

    const ownerId = await getCurrentOwnerId();
    const { data: directData, error: directError } = await supabase
      .from("animaux")
      .insert({
        ...payload,
        proprietaire_id: ownerId,
      })
      .select("*")
      .single();

    if (directError) throw directError;
    return directData as Animal;
  }

  return data as Animal;
}

export async function updateAnimal(id: string, values: Partial<Animal>) {
  const { data, error } = await supabase
    .from("animaux")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Animal;
}

export async function uploadAnimalPhoto(params: {
  ownerId: string;
  animalId: string;
  asset: ImagePickerAsset;
}) {
  const fileName = params.asset.fileName ?? `animal-${Date.now()}.jpg`;
  const path = buildAnimalStoragePath({
    ownerId: params.ownerId,
    animalId: params.animalId,
    fileName,
  });
  const response = await fetch(params.asset.uri);
  const fileBody = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("animal-photos")
    .upload(path, fileBody, {
      contentType: params.asset.mimeType ?? "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  return updateAnimal(params.animalId, { photo_path: path });
}
