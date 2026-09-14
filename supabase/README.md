# Supabase — Vet'OPoil

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
