-- Compatibilité portail vétérinaire (version-web).
-- Objets utilisés par le portail et absents des migrations précédentes :
-- vet_profiles, colonnes vet_profile_id / documents.medical_event_id,
-- et RPC de dossier, rappels et documents.
--
-- Idempotent. Les fonctions SECURITY DEFINER ont un search_path fixe.
-- Les grants suivent le rôle appelant : authenticated pour le compte véto,
-- anon uniquement pour l'upload par code d'accès (jeton vérifié dans la fonction).

-- ============================================================================
-- Profils vétérinaires
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vet_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  clinique TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS vet_profiles_updated_at ON public.vet_profiles;
CREATE TRIGGER vet_profiles_updated_at
  BEFORE UPDATE ON public.vet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS vet_profiles_select_own ON public.vet_profiles;
CREATE POLICY vet_profiles_select_own ON public.vet_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS vet_profiles_update_own ON public.vet_profiles;
CREATE POLICY vet_profiles_update_own ON public.vet_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

REVOKE ALL ON TABLE public.vet_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.vet_profiles TO authenticated;
GRANT UPDATE (nom_complet, clinique, telephone) ON TABLE public.vet_profiles TO authenticated;

-- Le type de compte est recopié une seule fois dans app_metadata, que le
-- client ne peut pas modifier. user_metadata reste éditable et ne décide plus
-- des droits après l'inscription.
CREATE OR REPLACE FUNCTION public.stamp_auth_account_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_account_type text;
BEGIN
  v_account_type := NULLIF(NEW.raw_app_meta_data ->> 'account_type', '');

  IF v_account_type IS NULL OR v_account_type NOT IN ('owner', 'veterinarian') THEN
    v_account_type := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'account_type', ''), 'owner');
  END IF;

  IF v_account_type NOT IN ('owner', 'veterinarian') THEN
    v_account_type := 'owner';
  END IF;

  NEW.raw_app_meta_data :=
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('account_type', v_account_type);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.stamp_auth_account_type() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS stamp_auth_account_type ON auth.users;
CREATE TRIGGER stamp_auth_account_type
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.stamp_auth_account_type();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_full_name text;
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'account_type', 'owner') = 'veterinarian' THEN
    v_full_name := NULLIF(btrim(COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nom_complet',
      ''
    )), '');

    INSERT INTO public.vet_profiles (id, nom_complet, email, clinique, telephone)
    VALUES (
      NEW.id,
      COALESCE(v_full_name, split_part(COALESCE(NEW.email, ''), '@', 1)),
      NEW.email,
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'clinique'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'telephone'), '')
    );
  ELSE
    INSERT INTO public.profiles (id, nom, prenom, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Comptes déjà créés : figer le type sans promouvoir un propriétaire
-- qui aurait modifié son user_metadata.
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'account_type',
    CASE
      WHEN COALESCE(u.raw_user_meta_data ->> 'account_type', '') = 'veterinarian'
        AND NOT EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = u.id
            AND length(btrim(p.nom)) > 0
        )
        THEN 'veterinarian'
      ELSE 'owner'
    END
  )
WHERE COALESCE(u.raw_app_meta_data ->> 'account_type', '') NOT IN ('owner', 'veterinarian');

INSERT INTO public.vet_profiles (id, nom_complet, email, clinique, telephone)
SELECT
  u.id,
  COALESCE(
    NULLIF(btrim(COALESCE(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'nom_complet',
      ''
    )), ''),
    split_part(u.email, '@', 1)
  ),
  u.email,
  NULLIF(btrim(u.raw_user_meta_data ->> 'clinique'), ''),
  NULLIF(btrim(u.raw_user_meta_data ->> 'telephone'), '')
FROM auth.users u
WHERE u.raw_app_meta_data ->> 'account_type' = 'veterinarian'
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Colonnes manquantes
-- ============================================================================

ALTER TABLE public.medical_events
  ADD COLUMN IF NOT EXISTS vet_profile_id UUID;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS medical_event_id UUID;

DO $fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.medical_events'::regclass
      AND c.contype = 'f'
      AND a.attname = 'vet_profile_id'
  ) THEN
    ALTER TABLE public.medical_events
      ADD CONSTRAINT medical_events_vet_profile_id_fkey
      FOREIGN KEY (vet_profile_id)
      REFERENCES public.vet_profiles(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.documents'::regclass
      AND c.contype = 'f'
      AND a.attname = 'medical_event_id'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_medical_event_id_fkey
      FOREIGN KEY (medical_event_id)
      REFERENCES public.medical_events(id)
      ON DELETE SET NULL;
  END IF;
END
$fk$;

CREATE INDEX IF NOT EXISTS idx_medical_events_vet_profile
  ON public.medical_events (vet_profile_id, animal_id)
  WHERE vet_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_medical_event
  ON public.documents (medical_event_id)
  WHERE medical_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_veterinarian(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.vet_profiles
    WHERE id = p_user_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.is_veterinarian(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_veterinarian(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.vet_has_consulted_animal(p_animal_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.medical_events me
    JOIN public.animaux a ON a.id = me.animal_id
    WHERE me.animal_id = p_animal_id
      AND me.vet_profile_id = auth.uid()
      AND a.deleted_at IS NULL
  );
$function$;

REVOKE ALL ON FUNCTION public.vet_has_consulted_animal(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_has_consulted_animal(UUID) TO authenticated, service_role;

-- Un propriétaire ne peut pas attribuer une consultation à un autre compte.
CREATE OR REPLACE FUNCTION public.protect_medical_event_vet_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.vet_profile_id IS NOT NULL AND (
      NEW.vet_profile_id IS DISTINCT FROM auth.uid()
      OR NOT public.is_veterinarian(auth.uid())
    ) THEN
      RAISE EXCEPTION 'vet_profile_id invalide.';
    END IF;
  ELSIF NEW.vet_profile_id IS DISTINCT FROM OLD.vet_profile_id THEN
    IF NOT (
      public.is_veterinarian(auth.uid())
      AND NEW.vet_profile_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'vet_profile_id ne peut pas être modifié.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.protect_medical_event_vet_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_medical_event_vet_profile() TO authenticated, service_role;

DROP TRIGGER IF EXISTS medical_events_protect_vet_profile ON public.medical_events;
CREATE TRIGGER medical_events_protect_vet_profile
  BEFORE INSERT OR UPDATE OF vet_profile_id ON public.medical_events
  FOR EACH ROW EXECUTE FUNCTION public.protect_medical_event_vet_profile();

CREATE OR REPLACE FUNCTION public.enforce_document_medical_event_animal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NEW.medical_event_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.medical_events me
    WHERE me.id = NEW.medical_event_id
      AND me.animal_id = NEW.animal_id
  ) THEN
    RAISE EXCEPTION 'Événement médical invalide pour cet animal.';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_document_medical_event_animal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_document_medical_event_animal() TO authenticated, service_role;

DROP TRIGGER IF EXISTS documents_medical_event_same_animal ON public.documents;
CREATE TRIGGER documents_medical_event_same_animal
  BEFORE INSERT OR UPDATE OF medical_event_id, animal_id ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_medical_event_animal();

-- ============================================================================
-- RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_vet_profile()
RETURNS public.vet_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.vet_profiles%ROWTYPE;
  v_full_name text;
BEGIN
  SELECT * INTO v_user
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  SELECT * INTO v_profile
  FROM public.vet_profiles
  WHERE id = auth.uid();

  IF FOUND THEN
    RETURN v_profile;
  END IF;

  IF COALESCE(v_user.raw_app_meta_data ->> 'account_type', 'owner') <> 'veterinarian' THEN
    RAISE EXCEPTION 'Ce compte n''est pas un compte vétérinaire.';
  END IF;

  v_full_name := NULLIF(btrim(COALESCE(
    v_user.raw_user_meta_data ->> 'full_name',
    v_user.raw_user_meta_data ->> 'nom_complet',
    ''
  )), '');

  INSERT INTO public.vet_profiles (id, nom_complet, email, clinique, telephone)
  VALUES (
    v_user.id,
    COALESCE(v_full_name, split_part(COALESCE(v_user.email, ''), '@', 1)),
    v_user.email,
    NULLIF(btrim(v_user.raw_user_meta_data ->> 'clinique'), ''),
    NULLIF(btrim(v_user.raw_user_meta_data ->> 'telephone'), '')
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_vet_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_vet_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.vet_animal_json(p_animal public.animaux)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $function$
  SELECT jsonb_build_object(
    'id', p_animal.id,
    'nom', p_animal.nom,
    'espece', p_animal.espece,
    'race', p_animal.race,
    'date_naissance', p_animal.date_naissance,
    'sexe', p_animal.sexe,
    'couleur', p_animal.couleur,
    'puce', p_animal.puce,
    'photo_path', p_animal.photo_path,
    'proprietaire_id', p_animal.proprietaire_id
  );
$function$;

REVOKE ALL ON FUNCTION public.vet_animal_json(public.animaux) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.vet_list_my_animals()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NOT public.is_veterinarian() THEN
    RAISE EXCEPTION 'Compte vétérinaire requis.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY (row_data ->> 'last_event_at') DESC)
    FROM (
      SELECT jsonb_build_object(
        'animal', jsonb_build_object(
          'id', a.id,
          'nom', a.nom,
          'espece', a.espece,
          'race', a.race,
          'date_naissance', a.date_naissance,
          'sexe', a.sexe,
          'couleur', a.couleur,
          'puce', a.puce,
          'photo_path', a.photo_path,
          'proprietaire_id', a.proprietaire_id
        ),
        'last_event_at', max(me.date_event),
        'last_event_type', (array_agg(me.type ORDER BY me.date_event DESC))[1],
        'events_count', count(me.id)
      ) AS row_data
      FROM public.animaux a
      JOIN public.medical_events me
        ON me.animal_id = a.id
       AND me.vet_profile_id = auth.uid()
      WHERE a.deleted_at IS NULL
      GROUP BY a.id, a.nom, a.espece, a.race, a.date_naissance, a.sexe, a.couleur, a.puce, a.photo_path, a.proprietaire_id
    ) listed
  ), '[]'::jsonb);
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_list_my_animals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_list_my_animals() TO authenticated;

CREATE OR REPLACE FUNCTION public.vet_get_animal_dossier(p_animal_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_veterinarian() THEN
    RAISE EXCEPTION 'Compte vétérinaire requis.';
  END IF;

  IF NOT public.vet_has_consulted_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé. Consultez d''abord l''animal via un QR code.';
  END IF;

  SELECT jsonb_build_object(
    'animal', public.vet_animal_json(a),
    'medical_events', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', me.id,
          'type', me.type,
          'date_event', me.date_event,
          'titre', me.titre,
          'description', me.description,
          'diagnostic', me.diagnostic,
          'traitement', me.traitement,
          'poids_kg', me.poids_kg,
          'status', me.status,
          'vet_token_id', me.vet_token_id
        )
        ORDER BY me.date_event DESC
      )
      FROM public.medical_events me
      WHERE me.animal_id = a.id
        AND (me.status = 'validated' OR me.vet_profile_id = auth.uid())
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'file_name', d.file_name,
          'file_path', d.file_path,
          'mime_type', d.mime_type,
          'category_ocr', d.category_ocr,
          'medical_event_id', d.medical_event_id,
          'created_at', d.created_at
        )
        ORDER BY d.created_at DESC
      )
      FROM public.documents d
      WHERE d.animal_id = a.id
        AND position('..' IN d.file_path) = 0
        AND d.file_path LIKE a.proprietaire_id::text || '/' || a.id::text || '/%'
    ), '[]'::jsonb),
    'reminders', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'animal_id', r.animal_id,
          'type', r.type,
          'date_echeance', r.date_echeance,
          'titre', r.titre,
          'notes', r.notes,
          'canal', r.canal,
          'statut', r.statut
        )
        ORDER BY r.date_echeance
      )
      FROM public.reminders r
      WHERE r.animal_id = a.id
        AND r.statut = 'actif'
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.animaux a
  WHERE a.id = p_animal_id
    AND a.deleted_at IS NULL;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_get_animal_dossier(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_get_animal_dossier(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.vet_create_reminder(
  p_animal_id UUID,
  p_type TEXT,
  p_date_echeance DATE,
  p_titre TEXT,
  p_notes TEXT DEFAULT NULL,
  p_canal TEXT DEFAULT 'both'
)
RETURNS public.reminders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_reminder public.reminders;
BEGIN
  IF NOT public.is_veterinarian() THEN
    RAISE EXCEPTION 'Compte vétérinaire requis.';
  END IF;

  IF NOT public.vet_has_consulted_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('vaccination', 'antiparasitaire', 'rdv', 'autre') THEN
    RAISE EXCEPTION 'Type de rappel invalide.';
  END IF;

  IF p_canal IS NOT NULL AND p_canal NOT IN ('email', 'push', 'both') THEN
    RAISE EXCEPTION 'Canal de rappel invalide.';
  END IF;

  IF p_titre IS NULL OR char_length(btrim(p_titre)) = 0 OR char_length(p_titre) > 200 THEN
    RAISE EXCEPTION 'Titre de rappel invalide.';
  END IF;

  IF p_notes IS NOT NULL AND char_length(p_notes) > 2000 THEN
    RAISE EXCEPTION 'Notes de rappel trop longues.';
  END IF;

  IF p_date_echeance IS NULL
     OR p_date_echeance < DATE '2000-01-01'
     OR p_date_echeance > DATE '2100-01-01' THEN
    RAISE EXCEPTION 'Date d''échéance invalide.';
  END IF;

  INSERT INTO public.reminders (animal_id, type, date_echeance, titre, notes, canal, statut)
  VALUES (
    p_animal_id,
    p_type::public.reminder_type,
    p_date_echeance,
    btrim(p_titre),
    NULLIF(btrim(COALESCE(p_notes, '')), ''),
    COALESCE(p_canal, 'both')::public.reminder_channel,
    'actif'
  )
  RETURNING * INTO v_reminder;

  RETURN v_reminder;
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_create_reminder(UUID, TEXT, DATE, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_create_reminder(UUID, TEXT, DATE, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.vet_assert_document_upload(
  p_animal_id UUID,
  p_file_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_taille_octets BIGINT,
  p_medical_event_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_owner UUID;
  v_parts text[];
BEGIN
  SELECT a.proprietaire_id
  INTO v_owner
  FROM public.animaux a
  WHERE a.id = p_animal_id
    AND a.deleted_at IS NULL;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Animal introuvable.';
  END IF;

  IF p_file_name IS NULL
     OR btrim(p_file_name) = ''
     OR char_length(p_file_name) > 255
     OR p_file_name ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Nom de fichier invalide.';
  END IF;

  IF p_mime_type NOT IN (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'application/pdf'
  ) THEN
    RAISE EXCEPTION 'Type de fichier non autorisé.';
  END IF;

  IF p_taille_octets IS NULL OR p_taille_octets <= 0 OR p_taille_octets > 20971520 THEN
    RAISE EXCEPTION 'Taille de fichier invalide.';
  END IF;

  IF p_file_path IS NULL
     OR char_length(p_file_path) > 512
     OR position('..' IN p_file_path) > 0
     OR position(chr(92) IN p_file_path) > 0
     OR left(p_file_path, 1) = '/'
     OR position('://' IN p_file_path) > 0 THEN
    RAISE EXCEPTION 'Chemin de fichier invalide.';
  END IF;

  v_parts := string_to_array(p_file_path, '/');

  IF cardinality(v_parts) <> 3
     OR lower(v_parts[1]) IS DISTINCT FROM lower(v_owner::text)
     OR lower(v_parts[2]) IS DISTINCT FROM lower(p_animal_id::text)
     OR v_parts[3] !~ '^[0-9]{10,16}\.[A-Za-z0-9]{1,10}$' THEN
    RAISE EXCEPTION 'Chemin de fichier invalide.';
  END IF;

  IF p_medical_event_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.medical_events me
    WHERE me.id = p_medical_event_id
      AND me.animal_id = p_animal_id
  ) THEN
    RAISE EXCEPTION 'Événement médical invalide pour cet animal.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects o
    WHERE o.bucket_id = 'animal-documents'
      AND o.name = p_file_path
  ) THEN
    RAISE EXCEPTION 'Fichier introuvable.';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_assert_document_upload(UUID, TEXT, TEXT, TEXT, BIGINT, UUID)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.vet_creer_document_animal(
  p_animal_id UUID,
  p_file_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_taille_octets BIGINT,
  p_category_ocr public.document_category DEFAULT NULL,
  p_medical_event_id UUID DEFAULT NULL
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_document public.documents;
BEGIN
  IF NOT public.is_veterinarian() THEN
    RAISE EXCEPTION 'Compte vétérinaire requis.';
  END IF;

  IF NOT public.vet_has_consulted_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  PERFORM public.vet_assert_document_upload(
    p_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_medical_event_id
  );

  INSERT INTO public.documents (
    animal_id,
    file_path,
    file_name,
    mime_type,
    taille_octets,
    category_ocr,
    uploade_par,
    medical_event_id
  )
  VALUES (
    p_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_category_ocr,
    NULL,
    p_medical_event_id
  )
  RETURNING * INTO v_document;

  RETURN v_document;
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_creer_document_animal(UUID, TEXT, TEXT, TEXT, BIGINT, public.document_category, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_creer_document_animal(UUID, TEXT, TEXT, TEXT, BIGINT, public.document_category, UUID)
  TO authenticated;

DROP FUNCTION IF EXISTS public.vet_creer_document_metadata(
  text,
  text,
  text,
  text,
  bigint,
  public.document_category
);

CREATE OR REPLACE FUNCTION public.vet_creer_document_metadata(
  p_token TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_taille_octets BIGINT,
  p_category_ocr public.document_category DEFAULT NULL,
  p_medical_event_id UUID DEFAULT NULL
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_animal_id UUID;
  v_document public.documents;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);

  PERFORM public.vet_assert_document_upload(
    v_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_medical_event_id
  );

  INSERT INTO public.documents (
    animal_id,
    file_path,
    file_name,
    mime_type,
    taille_octets,
    category_ocr,
    uploade_par,
    medical_event_id
  )
  VALUES (
    v_animal_id,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_taille_octets,
    p_category_ocr,
    NULL,
    p_medical_event_id
  )
  RETURNING * INTO v_document;

  RETURN v_document;
END;
$function$;

REVOKE ALL ON FUNCTION public.vet_creer_document_metadata(TEXT, TEXT, TEXT, TEXT, BIGINT, public.document_category, UUID)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vet_creer_document_metadata(TEXT, TEXT, TEXT, TEXT, BIGINT, public.document_category, UUID)
  TO anon, authenticated, service_role;

-- Lecture storage limitée aux animaux déjà consultés par le vétérinaire connecté.
DROP POLICY IF EXISTS animal_documents_vet_select ON storage.objects;
CREATE POLICY animal_documents_vet_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-documents'
    AND public.vet_has_consulted_animal(public.storage_animal_id_from_path(name))
  );

DROP POLICY IF EXISTS animal_photos_vet_select ON storage.objects;
CREATE POLICY animal_photos_vet_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.vet_has_consulted_animal(public.storage_animal_id_from_path(name))
  );
