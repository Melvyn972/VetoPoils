export type DocumentCategory =
  | 'ordonnance'
  | 'facture'
  | 'analyse_sanguine'
  | 'vaccination'
  | 'autre'

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  ordonnance: 'Ordonnance',
  facture: 'Facture',
  analyse_sanguine: 'Analyse',
  vaccination: 'Vaccination',
  autre: 'Autre',
}

const CATEGORY_KEYWORDS: Array<{ category: DocumentCategory; keywords: string[] }> = [
  { category: 'facture', keywords: ['facture', 'invoice', 'recu', 'reçu', 'paiement', 'montant'] },
  {
    category: 'vaccination',
    keywords: ['vaccin', 'vaccination', 'rage', 'chppi', 'rappel vaccin'],
  },
  {
    category: 'analyse_sanguine',
    keywords: ['analyse', 'bilan', 'sang', 'laboratoire', 'labo', 'biologie'],
  },
  {
    category: 'ordonnance',
    keywords: ['ordonnance', 'prescription', 'posologie', 'medicament', 'médicament'],
  },
]

export function suggestDocumentCategory(
  fileName: string,
  mimeType?: string | null,
  extractedText?: string | null,
): DocumentCategory {
  const haystack = `${fileName} ${extractedText ?? ''}`.toLowerCase()
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.category
    }
  }
  if (mimeType === 'application/pdf' && haystack.includes('pdf')) {
    return 'autre'
  }
  return 'autre'
}

export type ExpenseCategory =
  | 'veterinaire'
  | 'alimentation'
  | 'accessoires'
  | 'pharmacie'
  | 'autre'

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  veterinaire: 'Vétérinaire',
  alimentation: 'Alimentation',
  accessoires: 'Accessoires',
  pharmacie: 'Pharmacie',
  autre: 'Autre',
}

export type ExpenseCsvRow = {
  date_depense: string
  category: ExpenseCategory
  montant: number
  description?: string | null
  animalNom?: string
}

export function expensesToCsv(rows: ExpenseCsvRow[]) {
  const header = ['Date', 'Catégorie', 'Montant (€)', 'Description', 'Animal']
  const lines = rows.map((row) =>
    [
      row.date_depense,
      expenseCategoryLabels[row.category] ?? row.category,
      row.montant.toFixed(2).replace('.', ','),
      (row.description ?? '').replaceAll('"', '""'),
      row.animalNom ?? '',
    ]
      .map((cell) => `"${cell}"`)
      .join(';'),
  )
  return [header.map((cell) => `"${cell}"`).join(';'), ...lines].join('\n')
}

export function partnerMatchesAnimal(
  partner: { cibles?: string[] | null },
  animal: { espece?: string | null; race?: string | null },
) {
  const cibles = partner.cibles?.length ? partner.cibles : ['tous']
  if (cibles.some((cible) => cible.toLowerCase() === 'tous')) return true
  const haystack = `${(animal.espece ?? '').toLowerCase()} ${(animal.race ?? '').toLowerCase()}`
  return cibles.some((cible) => haystack.includes(cible.toLowerCase()))
}
