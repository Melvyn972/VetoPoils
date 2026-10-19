-- PostgREST ne peut pas choisir entre deux signatures de
-- vet_creer_document_metadata (avec / sans p_medical_event_id).
-- On ne conserve que la version 7 arguments, qui accepte un token
-- déjà utilisé pour lier le document à l'événement tout juste créé.

DROP FUNCTION IF EXISTS public.vet_creer_document_metadata(
  text,
  text,
  text,
  text,
  bigint,
  document_category
);

-- La signature à 7 arguments est créée par la migration de compatibilité
-- du portail (après celle-ci). Sur une base déjà migrée à la main, le GRANT
-- reste appliqué ; sur un rejeu complet, il attend que la fonction existe.
DO $grant_vet_document$
BEGIN
  IF to_regprocedure(
    'public.vet_creer_document_metadata(text,text,text,text,bigint,public.document_category,uuid)'
  ) IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.vet_creer_document_metadata(
      text,
      text,
      text,
      text,
      bigint,
      public.document_category,
      uuid
    ) TO anon, authenticated, service_role;
  END IF;
END
$grant_vet_document$;
