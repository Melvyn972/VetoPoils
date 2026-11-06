-- Site web Vet'OPoil.
-- Compatible Expo : aucune colonne existante n'est renommée ni rendue obligatoire,
-- aucune signature de RPC déjà appelée par l'app n'est modifiée.
-- Le budget n'est plus bloqué par un plan (Stripe hors périmètre), comme le quota animal.

ALTER TABLE public.vet_profiles
  ADD COLUMN IF NOT EXISTS numero_ordre TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS medical_event_id UUID REFERENCES public.medical_events(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.vet_profiles.numero_ordre IS
  'Numéro d''ordre du vétérinaire. Facultatif pour ne pas bloquer les comptes existants.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_full_name TEXT;
BEGIN
  v_account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'owner');
  v_full_name := NULLIF(trim(COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'nom_complet',
    ''
  )), '');

  IF v_account_type = 'veterinarian' THEN
    INSERT INTO public.vet_profiles (id, nom_complet, email, clinique, telephone, numero_ordre)
    VALUES (
      NEW.id,
      COALESCE(v_full_name, split_part(NEW.email, '@', 1)),
      NEW.email,
      NULLIF(trim(NEW.raw_user_meta_data ->> 'clinique'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'telephone'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'numero_ordre'), '')
    )
    ON CONFLICT (id) DO UPDATE SET
      nom_complet = EXCLUDED.nom_complet,
      email = EXCLUDED.email,
      clinique = COALESCE(EXCLUDED.clinique, vet_profiles.clinique),
      numero_ordre = COALESCE(EXCLUDED.numero_ordre, vet_profiles.numero_ordre),
      updated_at = now();
  ELSE
    INSERT INTO public.profiles (id, nom, prenom, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'nom'), ''), split_part(COALESCE(v_full_name, NEW.email), ' ', 1)),
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'prenom'), ''), ''),
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- L'archivage met deleted_at. can_write_animal exige encore deleted_at IS NULL,
-- donc le WITH CHECK de la nouvelle ligne échouait. La lecture des animaux archivés
-- reste bloquée par animaux_select.
DROP POLICY IF EXISTS animaux_update ON public.animaux;
CREATE POLICY animaux_update ON public.animaux
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(id) AND deleted_at IS NULL)
  WITH CHECK (
    public.can_write_animal(id)
    OR (
      deleted_at IS NOT NULL
      AND proprietaire_id = public.get_compte_proprietaire_id()
    )
  );

-- Relecture OCR (web et Expo) : le propriétaire peut corriger la catégorie et le lien médical.
DROP POLICY IF EXISTS documents_update ON public.documents;
CREATE POLICY documents_update ON public.documents
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

-- Les partages lecture / contribution lisent déjà via can_read_animal.
-- Le journal pet-sitter reste sur can_write_daily_log (policies daily_logs existantes).
-- Les fichiers restent dans animal-documents / animal-photos, préfixe {proprietaire_id}/.

CREATE OR REPLACE FUNCTION public.check_expense_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.exporter_mes_donnees()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_owner UUID;
  v_result JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  v_owner := public.get_compte_proprietaire_id(v_uid);

  SELECT jsonb_build_object(
    'exporte_le', now(),
    'utilisateur_id', v_uid,
    'profil', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = v_uid),
    'profil_veterinaire', (SELECT to_jsonb(v) FROM public.vet_profiles v WHERE v.id = v_uid),
    'animaux', COALESCE((
      SELECT jsonb_agg(to_jsonb(a))
      FROM public.animaux a
      WHERE a.proprietaire_id = v_owner OR a.proprietaire_id = v_uid
    ), '[]'::jsonb),
    'evenements', COALESCE((
      SELECT jsonb_agg(to_jsonb(e))
      FROM public.medical_events e
      JOIN public.animaux a ON a.id = e.animal_id
      WHERE a.proprietaire_id = v_owner OR a.proprietaire_id = v_uid
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(to_jsonb(d))
      FROM public.documents d
      JOIN public.animaux a ON a.id = d.animal_id
      WHERE a.proprietaire_id = v_owner OR a.proprietaire_id = v_uid
    ), '[]'::jsonb),
    'rappels', COALESCE((
      SELECT jsonb_agg(to_jsonb(r))
      FROM public.reminders r
      JOIN public.animaux a ON a.id = r.animal_id
      WHERE a.proprietaire_id = v_owner OR a.proprietaire_id = v_uid
    ), '[]'::jsonb),
    'partages', COALESCE((
      SELECT jsonb_agg(to_jsonb(s))
      FROM public.animal_shares s
      WHERE s.invite_par = v_uid
        OR s.user_id = v_uid
        OR lower(s.email_invite) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    ), '[]'::jsonb),
    'journal', COALESCE((
      SELECT jsonb_agg(to_jsonb(l))
      FROM public.daily_logs l
      WHERE l.cree_par = v_uid
    ), '[]'::jsonb),
    'depenses', COALESCE((
      SELECT jsonb_agg(to_jsonb(x))
      FROM public.expenses x
      JOIN public.animaux a ON a.id = x.animal_id
      WHERE a.proprietaire_id = v_owner OR a.proprietaire_id = v_uid
    ), '[]'::jsonb),
    'notifications', COALESCE((
      SELECT jsonb_agg(to_jsonb(n))
      FROM public.notifications n
      WHERE n.user_id = v_uid
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.exporter_mes_donnees() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exporter_mes_donnees() FROM anon;
GRANT EXECUTE ON FUNCTION public.exporter_mes_donnees() TO authenticated;

CREATE OR REPLACE FUNCTION public.supprimer_mon_compte()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id IN ('animal-photos', 'animal-documents')
      AND (storage.foldername(name))[1] = v_uid::text;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.supprimer_mon_compte() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.supprimer_mon_compte() FROM anon;
GRANT EXECUTE ON FUNCTION public.supprimer_mon_compte() TO authenticated;
