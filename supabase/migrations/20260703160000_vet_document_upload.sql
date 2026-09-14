-- Vet'OPoil - Upload documents par token vétérinaire (portail web anon)

CREATE OR REPLACE FUNCTION public.has_active_vet_token_for_animal(p_animal_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vet_access_tokens
    WHERE animal_id = p_animal_id
      AND statut = 'actif'
      AND expire_le > now()
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_vet_token_for_animal(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_vet_token_for_animal(UUID) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.storage_animal_id_from_path(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_animal_id_from_path(TEXT) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS animal_documents_vet_insert ON storage.objects;

CREATE POLICY animal_documents_vet_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'animal-documents'
    AND public.has_active_vet_token_for_animal(public.storage_animal_id_from_path(name))
  );

CREATE OR REPLACE FUNCTION public.vet_creer_document_metadata(
  p_token TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_taille_octets BIGINT,
  p_category_ocr public.document_category DEFAULT NULL
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_document public.documents;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);

  INSERT INTO public.documents (
    animal_id,
    file_path,
    file_name,
    mime_type,
    taille_octets,
    category_ocr,
    uploade_par
  )
  VALUES (
    v_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_category_ocr,
    NULL
  )
  RETURNING * INTO v_document;

  RETURN v_document;
END;
$$;

REVOKE ALL ON FUNCTION public.vet_creer_document_metadata(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BIGINT,
  public.document_category
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.vet_creer_document_metadata(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BIGINT,
  public.document_category
) TO anon, authenticated, service_role;
