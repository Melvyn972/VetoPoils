export type ExpenseCategory =
  | "veterinaire"
  | "alimentation"
  | "accessoires"
  | "pharmacie"
  | "autre";

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  veterinaire: "Vétérinaire",
  alimentation: "Alimentation",
  accessoires: "Accessoires",
  pharmacie: "Pharmacie",
  autre: "Autre",
};

export type ExpenseCsvRow = {
  date_depense: string;
  category: ExpenseCategory;
  montant: number;
  description?: string | null;
  animalNom?: string;
};

export function expensesToCsv(rows: ExpenseCsvRow[]) {
  const header = ["Date", "Catégorie", "Montant (€)", "Description", "Animal"];
  const lines = rows.map((row) =>
    [
      row.date_depense,
      expenseCategoryLabels[row.category] ?? row.category,
      row.montant.toFixed(2).replace(".", ","),
      (row.description ?? "").replaceAll('"', '""'),
      row.animalNom ?? "",
    ]
      .map((cell) => `"${cell}"`)
      .join(";"),
  );
  return [header.map((cell) => `"${cell}"`).join(";"), ...lines].join("\n");
}

export function sumByCategory(rows: Array<{ category: ExpenseCategory; montant: number }>) {
  const totals: Record<ExpenseCategory, number> = {
    veterinaire: 0,
    alimentation: 0,
    accessoires: 0,
    pharmacie: 0,
    autre: 0,
  };
  for (const row of rows) {
    totals[row.category] += Number(row.montant) || 0;
  }
  return totals;
}

export function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    Number(value) || 0,
  );
}

export function expenseCategoryFromDocument(
  category: "ordonnance" | "facture" | "analyse_sanguine" | "vaccination" | "autre" | null | undefined,
): ExpenseCategory {
  if (category === "ordonnance") return "pharmacie";
  if (category === "facture") return "veterinaire";
  return "veterinaire";
}

export const expenseCategoryOptions = (
  Object.entries(expenseCategoryLabels) as Array<[ExpenseCategory, string]>
).map(([value, label]) => ({ value, label }));
