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

`seed.sql` (à la racine de ce dossier) et `version-web/scripts/seed-demo.mjs` décrivent un jeu de données à brancher sur des comptes Auth créés à part.

`supabase/demo/` contient le seed et le reset **de la démo publique isolée** (données fictives). Ces scripts ne sont pas des migrations : ne pas les exécuter sur le projet de production `lmdszelnnibexzvnaubp`.

Ne jamais committer de clé `service_role` ou de fichier `.env`.
