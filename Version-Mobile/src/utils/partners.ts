import type { Animal, Partner } from "@/types/database.types";

export function normalizeSpecies(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function partnerMatchesAnimal(partner: Partner, animal: Pick<Animal, "espece" | "race">) {
  const cibles = partner.cibles?.length ? partner.cibles : ["tous"];
  if (cibles.some((cible) => cible.toLowerCase() === "tous")) return true;

  const haystack = `${normalizeSpecies(animal.espece)} ${normalizeSpecies(animal.race)}`;
  return cibles.some((cible) => haystack.includes(cible.toLowerCase()));
}
