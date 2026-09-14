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

GRANT EXECUTE ON FUNCTION public.vet_creer_document_metadata(
  text,
  text,
  text,
  text,
  bigint,
  document_category,
  uuid
) TO anon, authenticated, service_role;
