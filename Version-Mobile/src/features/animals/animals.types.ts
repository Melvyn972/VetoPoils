import type { Animal } from "@/types/database.types";

export type AnimalFormValues = Pick<
  Animal,
  "nom" | "espece" | "race" | "date_naissance" | "sexe" | "couleur" | "puce"
>;
