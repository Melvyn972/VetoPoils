export interface ScanRow {
  left: string
  right?: string
  hit?: boolean
  strong?: boolean
}

export interface ScanDoc {
  id: string
  tab: string
  docTitle: string
  date: string
  patient: string
  rows: ScanRow[]
  fields: Array<{ label: string; value: string }>
  toast: string
  summary: string
}

export const SCAN_DOCS: ScanDoc[] = [
  {
    id: 'ordonnance',
    tab: 'Ordonnance',
    docTitle: 'Ordonnance',
    date: '12/03/2026',
    patient: 'Milo · chien · 12,4 kg',
    rows: [
      { left: 'Diagnostic : otite externe droite', hit: true },
      { left: 'Gouttes auriculaires', right: '1 flacon', hit: true, strong: true },
      { left: '5 gouttes matin et soir pendant 7 jours' },
      { left: 'Nettoyant auriculaire', right: '1 flacon', strong: true },
      { left: 'Deux fois par semaine pendant un mois' },
      { left: 'Contrôle conseillé dans 10 jours' },
    ],
    fields: [
      { label: 'Catégorie', value: 'Ordonnance' },
      { label: 'Titre', value: 'Traitement de l’otite' },
      { label: 'Diagnostic', value: 'Otite externe droite' },
      { label: 'Traitement', value: 'Gouttes auriculaires, 7 jours' },
      { label: 'Date', value: '12/03/2026' },
    ],
    toast: 'Classé dans le dossier de Milo',
    summary:
      'Exemple : une ordonnance pour une otite. Smart Scan propose la catégorie, le titre, le diagnostic, le traitement et la date ; vous vérifiez avant d’enregistrer.',
  },
  {
    id: 'facture',
    tab: 'Facture',
    docTitle: 'Facture n° 2026-0412',
    date: '02/02/2026',
    patient: 'Milo · chien',
    rows: [
      { left: 'Consultation', right: '45,00 €' },
      { left: 'Vaccin CHPPiL', right: '38,50 €', hit: true },
      { left: 'Vaccin antirabique', right: '19,00 €', hit: true },
      { left: 'TVA incluse', right: '17,08 €' },
      { left: 'Total TTC', right: '102,50 €', hit: true, strong: true },
    ],
    fields: [
      { label: 'Catégorie', value: 'Vaccination' },
      { label: 'Titre', value: 'Consultation et vaccins' },
      { label: 'Montant', value: '102,50 €' },
      { label: 'Date', value: '02/02/2026' },
    ],
    toast: '102,50 € ajoutés au budget de Milo',
    summary:
      'Exemple : une facture de consultation avec deux vaccins. Smart Scan propose la catégorie, le titre, le montant et la date, et la dépense rejoint le budget.',
  },
  {
    id: 'analyse',
    tab: 'Analyse sanguine',
    docTitle: 'Bilan biochimique',
    date: '18/01/2026',
    patient: 'Milo · chien · 12,3 kg',
    rows: [
      { left: 'Urée', right: '6,1 mmol/L' },
      { left: 'Créatinine', right: '98 µmol/L' },
      { left: 'ALAT', right: '42 UI/L' },
      { left: 'Glucose', right: '5,2 mmol/L' },
      { left: 'Poids le jour du prélèvement', right: '12,3 kg', hit: true },
      { left: 'Valeurs dans les intervalles du laboratoire', hit: true, strong: true },
    ],
    fields: [
      { label: 'Catégorie', value: 'Analyse' },
      { label: 'Titre', value: 'Bilan sanguin annuel' },
      { label: 'Poids', value: '12,3 kg' },
      { label: 'Date', value: '18/01/2026' },
    ],
    toast: 'PDF joint au dossier de Milo',
    summary:
      'Exemple : un bilan sanguin. Smart Scan propose la catégorie, le titre, le poids et la date ; le document est joint au dossier.',
  },
]
