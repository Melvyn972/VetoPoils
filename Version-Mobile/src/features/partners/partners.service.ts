import { Linking } from "react-native";

import { supabase } from "@/lib/supabase";
import type { Animal, Partner } from "@/types/database.types";
import { partnerMatchesAnimal } from "@/utils/partners";

export async function fetchPartners() {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("actif", true)
    .order("nom", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Partner[];
}

export async function fetchSuggestedPartners(animal: Pick<Animal, "espece" | "race">) {
  const partners = await fetchPartners();
  return partners.filter((partner) => partnerMatchesAnimal(partner, animal)).slice(0, 3);
}

export async function trackPartnerClick(params: {
  userId: string;
  partnerId: string;
  contexte?: string;
}) {
  await supabase.from("partner_clicks").insert({
    user_id: params.userId,
    partner_id: params.partnerId,
    contexte: params.contexte ?? null,
  });
}

export async function openPartner(params: {
  partner: Partner;
  userId?: string | null;
  contexte?: string;
}) {
  if (params.userId) {
    await trackPartnerClick({
      userId: params.userId,
      partnerId: params.partner.id,
      contexte: params.contexte,
    }).catch(() => undefined);
  }
  await Linking.openURL(params.partner.url);
}
