-- Vet'OPoil - Correctifs persistance photo animal et documents.

CREATE OR REPLACE FUNCTION public.modifier_animal(
  p_animal_id UUID,
  p_nom TEXT DEFAULT NULL,
  p_espece TEXT DEFAULT NULL,
  p_race TEXT DEFAULT NULL,
  p_date_naissance DATE DEFAULT NULL,
  p_sexe public.animal_sexe DEFAULT NULL,
  p_couleur TEXT DEFAULT NULL,
  p_puce TEXT DEFAULT NULL,
  p_photo_path TEXT DEFAULT NULL
)
RETURNS public.animaux
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal public.animaux;
BEGIN
  IF NOT public.can_write_animal(p_animal_id, auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  UPDATE public.animaux
  SET
    nom = COALESCE(NULLIF(p_nom, ''), nom),
    espece = COALESCE(NULLIF(p_espece, ''), espece),
    race = COALESCE(NULLIF(p_race, ''), race),
    date_naissance = COALESCE(p_date_naissance, date_naissance),
    sexe = COALESCE(p_sexe, sexe),
    couleur = COALESCE(NULLIF(p_couleur, ''), couleur),
    puce = COALESCE(NULLIF(p_puce, ''), puce),
    photo_path = COALESCE(NULLIF(p_photo_path, ''), photo_path)
  WHERE id = p_animal_id
  RETURNING * INTO v_animal;

  RETURN v_animal;
END;
$$;

REVOKE ALL ON FUNCTION public.modifier_animal(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  DATE,
  public.animal_sexe,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.modifier_animal(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  DATE,
  public.animal_sexe,
  TEXT,
  TEXT,
  TEXT
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.creer_document_metadata(
  p_animal_id UUID,
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
  v_document public.documents;
BEGIN
  IF NOT public.can_write_animal(p_animal_id, auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

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
    p_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_category_ocr,
    auth.uid()
  )
  RETURNING * INTO v_document;

  RETURN v_document;
END;
$$;

REVOKE ALL ON FUNCTION public.creer_document_metadata(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  BIGINT,
  public.document_category
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.creer_document_metadata(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  BIGINT,
  public.document_category
) TO authenticated, service_role;
