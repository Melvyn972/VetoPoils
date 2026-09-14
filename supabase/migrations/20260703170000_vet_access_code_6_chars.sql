-- Vet'OPoil - Code d'accès vétérinaire sur 6 caractères (au lieu d'un UUID)

CREATE OR REPLACE FUNCTION public.generer_code_vet_acces()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code VARCHAR(6);
  v_chars CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::INTEGER, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.vet_access_tokens
      WHERE token = v_code
        AND statut = 'actif'
        AND expire_le > now()
    );

    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RAISE EXCEPTION 'Impossible de générer un code d''accès unique.';
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.generer_code_vet_acces() FROM PUBLIC;

ALTER TABLE public.vet_access_tokens
  ALTER COLUMN token DROP DEFAULT;

DELETE FROM public.vet_access_tokens;

ALTER TABLE public.vet_access_tokens
  ALTER COLUMN token TYPE VARCHAR(6) USING token::VARCHAR(6);

ALTER TABLE public.vet_access_tokens
  ADD CONSTRAINT vet_access_tokens_token_format_chk
  CHECK (token ~ '^[2-9A-HJ-NP-Z]{6}$');

CREATE OR REPLACE FUNCTION public.generer_vet_token(
  p_animal_id UUID,
  p_duree_heures INTEGER DEFAULT 4
)
RETURNS public.vet_access_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token public.vet_access_tokens;
BEGIN
  IF NOT public.can_write_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé : vous ne pouvez pas générer de token pour cet animal.';
  END IF;

  UPDATE public.vet_access_tokens
  SET statut = 'revoque'
  WHERE animal_id = p_animal_id AND statut = 'actif';

  INSERT INTO public.vet_access_tokens (animal_id, token, expire_le, cree_par)
  VALUES (
    p_animal_id,
    public.generer_code_vet_acces(),
    now() + (p_duree_heures || ' hours')::interval,
    auth.uid()
  )
  RETURNING * INTO v_token;

  RETURN v_token;
END;
$$;

DROP FUNCTION IF EXISTS public.valider_vet_token(UUID);

CREATE OR REPLACE FUNCTION public.valider_vet_token(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_statut public.vet_token_status;
  v_expire TIMESTAMPTZ;
  v_code VARCHAR(6);
BEGIN
  v_code := upper(trim(p_token));

  IF v_code !~ '^[2-9A-HJ-NP-Z]{6}$' THEN
    RAISE EXCEPTION 'Code d''accès invalide.';
  END IF;

  SELECT animal_id, statut, expire_le
  INTO v_animal_id, v_statut, v_expire
  FROM public.vet_access_tokens
  WHERE token = v_code;

  IF v_animal_id IS NULL THEN
    RAISE EXCEPTION 'Code d''accès invalide.';
  END IF;

  IF v_statut = 'revoque' THEN
    RAISE EXCEPTION 'Code d''accès révoqué.';
  END IF;

  IF v_expire < now() THEN
    UPDATE public.vet_access_tokens SET statut = 'expire' WHERE token = v_code;
    RAISE EXCEPTION 'Code d''accès expiré.';
  END IF;

  RETURN v_animal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.valider_vet_token(TEXT) FROM PUBLIC;

DROP FUNCTION IF EXISTS public.vet_get_dossier(UUID);

CREATE OR REPLACE FUNCTION public.vet_get_dossier(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_code VARCHAR(6);
  v_result JSONB;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);
  v_code := upper(trim(p_token));

  SELECT jsonb_build_object(
    'animal', to_jsonb(a.*),
    'medical_events', COALESCE((
      SELECT jsonb_agg(to_jsonb(me.*) ORDER BY me.date_event DESC)
      FROM public.medical_events me
      WHERE me.animal_id = v_animal_id AND me.status = 'validated'
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id,
        'file_name', d.file_name,
        'category_ocr', d.category_ocr,
        'created_at', d.created_at
      ) ORDER BY d.created_at DESC)
      FROM public.documents d
      WHERE d.animal_id = v_animal_id
    ), '[]'::jsonb),
    'token_expire_le', (SELECT expire_le FROM public.vet_access_tokens WHERE token = v_code)
  ) INTO v_result
  FROM public.animaux a
  WHERE a.id = v_animal_id AND a.deleted_at IS NULL;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.vet_create_medical_event(
  UUID,
  public.medical_event_type,
  TEXT,
  TEXT,
  NUMERIC,
  TEXT,
  TEXT
);

CREATE OR REPLACE FUNCTION public.vet_create_medical_event(
  p_token TEXT,
  p_type public.medical_event_type,
  p_diagnostic TEXT DEFAULT NULL,
  p_traitement TEXT DEFAULT NULL,
  p_poids_kg NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_titre TEXT DEFAULT NULL
)
RETURNS public.medical_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_token_id UUID;
  v_code VARCHAR(6);
  v_event public.medical_events;
  v_proprietaire_id UUID;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);
  v_code := upper(trim(p_token));

  SELECT id INTO v_token_id FROM public.vet_access_tokens WHERE token = v_code;

  INSERT INTO public.medical_events (
    animal_id, type, diagnostic, traitement, poids_kg,
    description, titre, status, vet_token_id
  ) VALUES (
    v_animal_id, p_type, p_diagnostic, p_traitement, p_poids_kg,
    p_description, p_titre, 'pending', v_token_id
  )
  RETURNING * INTO v_event;

  SELECT proprietaire_id INTO v_proprietaire_id FROM public.animaux WHERE id = v_animal_id;

  INSERT INTO public.notifications (user_id, type, titre, corps, donnees)
  VALUES (
    v_proprietaire_id,
    'vet_event_pending',
    'Nouvelle saisie vétérinaire',
    'Un vétérinaire a ajouté un événement médical en attente de validation.',
    jsonb_build_object(
      'animal_id', v_animal_id,
      'medical_event_id', v_event.id,
      'vet_token_id', v_token_id
    )
  );

  RETURN v_event;
END;
$$;

DROP FUNCTION IF EXISTS public.revoquer_vet_token(UUID);

CREATE OR REPLACE FUNCTION public.revoquer_vet_token(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_code VARCHAR(6);
BEGIN
  v_code := upper(trim(p_token));

  IF v_code !~ '^[2-9A-HJ-NP-Z]{6}$' THEN
    RAISE EXCEPTION 'Code d''accès invalide.';
  END IF;

  SELECT animal_id INTO v_animal_id
  FROM public.vet_access_tokens
  WHERE token = v_code;

  IF NOT public.can_write_animal(v_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  UPDATE public.vet_access_tokens
  SET statut = 'revoque'
  WHERE token = v_code;
END;
$$;

DROP FUNCTION IF EXISTS public.vet_creer_document_metadata(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  BIGINT,
  public.document_category
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

GRANT EXECUTE ON FUNCTION public.generer_vet_token(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vet_get_dossier(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vet_create_medical_event(TEXT, public.medical_event_type, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoquer_vet_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vet_creer_document_metadata(TEXT, TEXT, TEXT, TEXT, BIGINT, public.document_category) TO anon, authenticated, service_role;
