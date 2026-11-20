// Parseur du texte OCR -> JSON structuré. Pur (aucun import) : utilisable sous Deno
// (Edge Function) et sous Node (tests vitest).

export type DocumentCategory =
  | "ordonnance"
  | "facture"
  | "analyse_sanguine"
  | "vaccination"
  | "autre";

export type OcrResult = {
  category: DocumentCategory;
  titre: string;
  diagnostic: string;
  traitement: string;
  molecules: string[];
  montant: number | null;
  poids_kg: number | null;
  date_event: string | null; // YYYY-MM-DD
  dates: string[]; // toutes les dates trouvées, YYYY-MM-DD
  confidence: number; // 0..1, part des champs clés renseignés
  text_excerpt: string;
};

const MOLECULES: Array<{ label: string; aliases: string[] }> = [
  { label: "Amoxicilline", aliases: ["amoxicilline", "clamoxyl", "synulox"] },
  { label: "Acide clavulanique", aliases: ["acide clavulanique", "clavulanate"] },
  { label: "Méloxicam", aliases: ["meloxicam", "metacam", "loxicom"] },
  { label: "Prednisolone", aliases: ["prednisolone", "solupred", "prednisone"] },
  { label: "Céfovécine", aliases: ["cefovecine", "convenia"] },
  { label: "Doxycycline", aliases: ["doxycycline", "ronaxan"] },
  { label: "Métronidazole", aliases: ["metronidazole", "flagyl"] },
  { label: "Marbofloxacine", aliases: ["marbofloxacine", "marbocyl"] },
  { label: "Enrofloxacine", aliases: ["enrofloxacine", "baytril"] },
  { label: "Clindamycine", aliases: ["clindamycine", "antirobe"] },
  { label: "Tramadol", aliases: ["tramadol"] },
  { label: "Gabapentine", aliases: ["gabapentine"] },
  { label: "Furosémide", aliases: ["furosemide", "dimazon"] },
  { label: "Bénazépril", aliases: ["benazepril", "fortekor"] },
  { label: "Pimobendane", aliases: ["pimobendane", "vetmedin"] },
  { label: "Fipronil", aliases: ["fipronil", "frontline"] },
  { label: "Sélamectine", aliases: ["selamectine", "stronghold"] },
  { label: "Milbémycine", aliases: ["milbemycine", "milbemax"] },
  { label: "Praziquantel", aliases: ["praziquantel", "drontal"] },
  { label: "Afoxolaner", aliases: ["afoxolaner", "nexgard"] },
  { label: "Fluralaner", aliases: ["fluralaner", "bravecto"] },
  { label: "Sarolaner", aliases: ["sarolaner", "simparica"] },
  { label: "Ivermectine", aliases: ["ivermectine"] },
  { label: "Fenbendazole", aliases: ["fenbendazole", "panacur"] },
  { label: "Maropitant", aliases: ["maropitant", "cerenia"] },
  { label: "Oclacitinib", aliases: ["oclacitinib", "apoquel"] },
  { label: "Cétirizine", aliases: ["cetirizine"] },
  { label: "Oméprazole", aliases: ["omeprazole", "gastroprotect", "mopral"] },
  { label: "Pantoprazole", aliases: ["pantoprazole"] },
  { label: "Sucralfate", aliases: ["sucralfate", "ulcar"] },
  { label: "Métoclopramide", aliases: ["metoclopramide", "primperan"] },
  { label: "Ranitidine", aliases: ["ranitidine"] },
  { label: "Probiotique", aliases: ["probiotique", "fortiflora", "proviable", "flora"] },
  { label: "Smectite", aliases: ["smectite", "smecta", "diosmectite"] },
  { label: "Insuline", aliases: ["insuline", "caninsulin", "prozinc"] },
];

const VACCINE_VALENCES: Array<{ label: string; aliases: string[] }> = [
  { label: "Rage", aliases: ["rage", "rabies"] },
  { label: "CHPPi", aliases: ["chppi", "chpp"] },
  { label: "Leptospirose", aliases: ["leptospirose", "lepto"] },
  { label: "Toux de chenil", aliases: ["toux de chenil", "bordetella"] },
  { label: "Typhus", aliases: ["typhus", "panleucopenie"] },
  { label: "Coryza", aliases: ["coryza"] },
  { label: "Leucose", aliases: ["leucose", "felv"] },
];

const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

const CATEGORY_KEYWORDS: Array<{ category: DocumentCategory; keywords: string[] }> = [
  { category: "facture", keywords: ["facture", "total ttc", "montant", "tva", "reglement", "a payer"] },
  { category: "vaccination", keywords: ["vaccin", "carnet de sante", "rappel annuel", "lot n", "chppi"] },
  { category: "analyse_sanguine", keywords: ["analyse", "bilan", "hematologie", "biochimie", "creatinine", "numeration", "laboratoire"] },
  { category: "ordonnance", keywords: ["ordonnance", "prescription", "posologie", "comprime", "mg/kg", "matin et soir"] },
];

/** minuscules + sans accents, pour comparer sans se soucier de l'OCR. */
export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

type FoundDate = { iso: string; index: number };

export function extractDates(text: string): FoundDate[] {
  const norm = normalize(text);
  const found: FoundDate[] = [];

  for (const m of norm.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/g)) {
    let y = Number(m[3]);
    if (m[3].length === 2) y += 2000;
    const iso = isoDate(y, Number(m[2]), Number(m[1]));
    if (iso) found.push({ iso, index: m.index ?? 0 });
  }
  for (const m of norm.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const iso = isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) found.push({ iso, index: m.index ?? 0 });
  }
  for (const m of norm.matchAll(/\b(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})\b/g)) {
    const iso = isoDate(Number(m[3]), MONTHS[m[2]], Number(m[1]));
    if (iso) found.push({ iso, index: m.index ?? 0 });
  }
  return found.sort((a, b) => a.index - b.index);
}

export function extractWeightKg(text: string): number | null {
  const norm = normalize(text);
  const toKg = (raw: string, unit: string): number | null => {
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    const kg = unit === "g" ? n / 1000 : n;
    return kg >= 0.05 && kg <= 120 ? Math.round(kg * 100) / 100 : null;
  };
  // « Poids : 12,4 kg » en priorité (évite « 10 mg/kg » des posologies).
  const labelled = norm.match(/(?:poids|pds|weight)\s*(?:vif|actuel)?\s*[:=]?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(kg|g)\b/);
  if (labelled) return toKg(labelled[1], labelled[2]);
  for (const m of norm.matchAll(/(?<![\/\w])(\d{1,3}(?:[.,]\d{1,2})?)\s*kgs?\b(?!\s*\/)/g)) {
    const before = norm.slice(Math.max(0, (m.index ?? 0) - 6), m.index ?? 0);
    if (/mg\/\s*$|\/\s*$/.test(before)) continue;
    const kg = toKg(m[1], "kg");
    if (kg !== null) return kg;
  }
  return null;
}

export function extractAmount(text: string): number | null {
  const norm = normalize(text);
  const parse = (raw: string) => {
    const n = Number(raw.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 && n < 100000 ? n : null;
  };
  const total = norm.match(/(?:(?<!sous[\s-])\btotal\s*(?:ttc|a payer)?|net a payer|montant\s*(?:ttc|total)?)\s*[:=]?\s*(\d{1,5}(?:[ .]\d{3})*(?:[.,]\d{1,2})?)\s*(?:€|eur)?/);
  if (total) {
    const v = parse(total[1]);
    if (v !== null) return v;
  }
  let max: number | null = null;
  for (const m of norm.matchAll(/(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:€|eur\b)/g)) {
    const v = parse(m[1]);
    if (v !== null && (max === null || v > max)) max = v;
  }
  return max;
}

export function extractMolecules(text: string, includeVaccines: boolean): string[] {
  const norm = normalize(text);
  const out: string[] = [];
  const catalog = includeVaccines ? [...MOLECULES, ...VACCINE_VALENCES] : MOLECULES;
  for (const entry of catalog) {
    const hit = entry.aliases.some((alias) => new RegExp(`(?<![a-z])${alias}(?![a-z])`).test(norm));
    if (hit && !out.includes(entry.label)) out.push(entry.label);
  }
  return out;
}

export function detectCategory(text: string, fileName: string): DocumentCategory {
  const haystack = normalize(`${fileName} ${text}`);
  let best: DocumentCategory = "autre";
  let bestScore = 0;
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    const score = keywords.filter((k) => haystack.includes(k)).length;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

// Intitulés (et pieds de page : signature, ordre des vétérinaires) qui terminent un bloc.
const SECTION_END =
  /^(diagnostic|motif|suspicion|conclusion|indication|affection|traitement|prescription|posologie|poids|date|montant|total|observation|examen|signature|docteur|dr\b|veterinaire|n[°o]?\s*d.?ordre|clinique|patient|fait a|le \d)/;

/** Texte qui suit un intitulé : même ligne + lignes suivantes jusqu'au prochain intitulé. */
function blockAfter(text: string, labels: string[]): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const norm = normalize(lines[i]);
    const label = labels.find((l) => norm.startsWith(l));
    if (!label) continue;
    const parts: string[] = [];
    const inline = lines[i].slice(label.length).replace(/^\s*[:\-–]\s*/, "").trim();
    if (inline) parts.push(inline);
    for (let j = i + 1; j < lines.length && parts.length < 8; j++) {
      const next = normalize(lines[j]);
      if (SECTION_END.test(next)) break;
      parts.push(lines[j]);
    }
    if (parts.length) return parts.join("\n");
  }
  return "";
}

const NOT_EVENT_DATE = /(naissance|ne le|nee le|prochain|rappel|echeance|validite|expire)/;

function pickEventDate(text: string, dates: FoundDate[]): string | null {
  const norm = normalize(text);
  for (const d of dates) {
    const context = norm.slice(Math.max(0, d.index - 30), d.index);
    if (!NOT_EVENT_DATE.test(context)) return d.iso;
  }
  return dates[0]?.iso ?? null;
}

const TITLES: Record<DocumentCategory, string> = {
  ordonnance: "Ordonnance",
  facture: "Facture",
  analyse_sanguine: "Analyse sanguine",
  vaccination: "Vaccination",
  autre: "Document",
};

export function parseOcrText(text: string, fileName = ""): OcrResult {
  const category = detectCategory(text, fileName);
  const dates = extractDates(text);
  const dateEvent = pickEventDate(text, dates);
  const molecules = extractMolecules(text, category === "vaccination");
  const poids = extractWeightKg(text);
  const montant = category === "facture" || /€|eur\b/i.test(text) ? extractAmount(text) : null;

  const diagnostic = blockAfter(text, ["diagnostic", "motif", "suspicion", "conclusion", "indication", "affection"]);
  const traitementLine = blockAfter(text, ["traitement", "prescription", "posologie"]);
  const traitement = traitementLine || molecules.join(", ");

  const titre = dateEvent
    ? `${TITLES[category]} du ${dateEvent.split("-").reverse().join("/")}`
    : TITLES[category];

  // Champs clés attendus selon le type de document.
  const expected: boolean[] = [dateEvent !== null];
  if (category === "ordonnance") expected.push(molecules.length > 0 || !!traitementLine, poids !== null);
  else if (category === "vaccination") expected.push(molecules.length > 0, poids !== null);
  else if (category === "facture") expected.push(montant !== null);
  else expected.push(poids !== null || diagnostic !== "");
  const confidence = expected.filter(Boolean).length / expected.length;

  return {
    category,
    titre,
    diagnostic,
    traitement,
    molecules,
    montant,
    poids_kg: poids,
    date_event: dateEvent,
    dates: [...new Set(dates.map((d) => d.iso))],
    confidence: Math.round(confidence * 100) / 100,
    text_excerpt: text.slice(0, 1500),
  };
}
