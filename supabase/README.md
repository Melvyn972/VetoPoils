# Supabase - Vet'OPoil

Projet : `lmdszelnnibexzvnaubp`  
URL : `https://lmdszelnnibexzvnaubp.supabase.co`

Les migrations de ce dossier sont la source de vérité **incrémentale** (à partir de septembre 2026). Le schéma de base (tables, RLS, RPCs historiques) a déjà été appliqué sur le projet distant.

## Appliquer une migration

1. Ouvrir le SQL Editor du dashboard Supabase.
2. Coller le contenu du fichier `migrations/*.sql` **dans l’ordre des timestamps**.
3. Exécuter.

Les migrations MVP (`rejected` enum, RPCs, suppression de la surcharge `vet_creer_document_metadata`) ont déjà été appliquées sur le projet `lmdszelnnibexzvnaubp`. Relancer un fichier déjà appliqué est en général idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP FUNCTION IF EXISTS`).

### Point d’attention Postgres

`ALTER TYPE ... ADD VALUE` doit rester dans sa propre migration. La valeur `rejected` ne peut pas être utilisée dans la même transaction que l’ajout d’enum.

## Buckets Storage

Doivent exister (privés) :

- `animal-photos`
- `animal-documents`

## Données de démo

Voir `seed.sql` et `version-web/scripts/seed-demo.mjs`.  
Ne jamais committer de mot de passe, clé `service_role` ou fichier `.env`.

## Smart Scan OCR (Edge Function `ocr-extract`)

Photo/PDF → Google Cloud Vision (`DOCUMENT_TEXT_DETECTION`) → JSON structuré
(`category`, `poids_kg`, `molecules`, `date_event`, `dates`, `montant`, `diagnostic`, `traitement`, `confidence`).
La clé Vision reste côté serveur ; les apps appellent `supabase.functions.invoke('ocr-extract')`.

Quota : 2 analyses/mois en plan gratuit (`check_ocr_quota` avant, `increment_ocr_usage` après une lecture réussie ;
un document illisible ou une panne Vision ne consomme pas de quota). Premium : illimité.

Déploiement :

```bash
supabase db push                                   # migration 20261120100000_ocr_quota_plan_gratuit
supabase secrets set GOOGLE_VISION_API_KEY=...     # clé API Cloud Vision (API activée sur le projet GCP)
supabase functions deploy ocr-extract
```

Le parseur (`functions/ocr-extract/parse.ts`) est testé par `version-web/src/lib/ocrParse.test.ts` (`npm test`).
