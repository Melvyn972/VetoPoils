-- Finitions MVP :
-- - plus de quota « 1 animal » (Stripe retiré de la roadmap)
-- - profil propriétaire en filet de sécurité
-- - refus d'un événement vétérinaire en attente
-- - date de visite transmise par le portail véto

DROP TRIGGER IF EXISTS animaux_quota_check ON public.animaux;

CREATE OR REPLACE FUNCTION public.check_animal_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_owner_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_full_name TEXT;
BEGIN
  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  IF COALESCE(v_user.raw_user_meta_data ->> 'account_type', 'owner') = 'veterinarian' THEN
    RAISE EXCEPTION 'Ce compte est un compte vétérinaire.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  v_full_name := NULLIF(trim(COALESCE(v_user.raw_user_meta_data ->> 'full_name', v_user.raw_user_meta_data ->> 'nom_complet', '')), '');

  INSERT INTO public.profiles (id, nom, prenom, email)
  VALUES (
    v_user.id,
    COALESCE(NULLIF(trim(v_user.raw_user_meta_data ->> 'nom'), ''), split_part(COALESCE(v_full_name, v_user.email), ' ', 1)),
    COALESCE(NULLIF(trim(v_user.raw_user_meta_data ->> 'prenom'), ''), ''),
    v_user.email
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.ensure_owner_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.refuser_medical_event(p_event_id uuid)
RETURNS public.medical_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event public.medical_events;
BEGIN
  SELECT * INTO v_event FROM public.medical_events WHERE id = p_event_id;

  IF v_event.id IS NULL THEN
    RAISE EXCEPTION 'Événement médical introuvable.';
  END IF;

  IF NOT public.can_write_animal(v_event.animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  IF v_event.status != 'pending' THEN
    RAISE EXCEPTION 'Cet événement n''est pas en attente de validation.';
  END IF;

  UPDATE public.medical_events
  SET status = 'rejected'
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.refuser_medical_event(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.vet_create_medical_event(text, medical_event_type, text, text, numeric, text, text);

CREATE OR REPLACE FUNCTION public.vet_create_medical_event(
  p_token text,
  p_type medical_event_type,
  p_diagnostic text DEFAULT NULL,
  p_traitement text DEFAULT NULL,
  p_poids_kg numeric DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_titre text DEFAULT NULL,
  p_date_event timestamptz DEFAULT NULL
)
RETURNS public.medical_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_animal_id UUID;
  v_token_id UUID;
  v_code VARCHAR(6);
  v_statut public.vet_token_status;
  v_event public.medical_events;
  v_proprietaire_id UUID;
  v_vet_id UUID;
BEGIN
  v_code := upper(trim(p_token));
  v_vet_id := CASE WHEN public.is_veterinarian() THEN auth.uid() ELSE NULL END;

  SELECT id, animal_id, statut
  INTO v_token_id, v_animal_id, v_statut
  FROM public.vet_access_tokens
  WHERE token = v_code;

  IF v_animal_id IS NULL THEN
    RAISE EXCEPTION 'Code d''accès invalide.';
  END IF;

  SELECT me.* INTO v_event
  FROM public.medical_events me
  WHERE me.vet_token_id = v_token_id AND me.status = 'pending'
  ORDER BY me.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_event;
  END IF;

  IF v_statut != 'actif' THEN
    RAISE EXCEPTION 'Code d''accès déjà utilisé. Demandez un nouveau QR code au propriétaire.';
  END IF;

  v_animal_id := public.valider_vet_token(p_token);

  INSERT INTO public.medical_events (
    animal_id, type, diagnostic, traitement, poids_kg, description, titre, status, vet_token_id, vet_profile_id, date_event
  )
  VALUES (
    v_animal_id, p_type, p_diagnostic, p_traitement, p_poids_kg, p_description, p_titre, 'pending', v_token_id, v_vet_id, COALESCE(p_date_event, now())
  )
  RETURNING * INTO v_event;

  UPDATE public.vet_access_tokens
  SET statut = 'utilise', utilise_le = now()
  WHERE id = v_token_id;

  SELECT proprietaire_id INTO v_proprietaire_id FROM public.animaux WHERE id = v_animal_id;

  INSERT INTO public.notifications (user_id, type, titre, corps, donnees)
  VALUES (
    v_proprietaire_id,
    'nouvelle_consultation',
    'Nouvel événement médical',
    coalesce(p_titre, 'Un vétérinaire a rédigé un événement à valider.'),
    jsonb_build_object('animal_id', v_animal_id, 'medical_event_id', v_event.id, 'vet_token_id', v_token_id, 'event_type', p_type)
  );

  RETURN v_event;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.vet_create_medical_event(text, medical_event_type, text, text, numeric, text, text, timestamptz) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.vet_create_animal_medical_event(uuid, medical_event_type, text, text, numeric, text, text);

CREATE OR REPLACE FUNCTION public.vet_create_animal_medical_event(
  p_animal_id uuid,
  p_type medical_event_type,
  p_diagnostic text DEFAULT NULL,
  p_traitement text DEFAULT NULL,
  p_poids_kg numeric DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_titre text DEFAULT NULL,
  p_date_event timestamptz DEFAULT NULL
)
RETURNS public.medical_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event public.medical_events;
  v_proprietaire_id UUID;
BEGIN
  IF NOT public.is_veterinarian() THEN
    RAISE EXCEPTION 'Compte vétérinaire requis.';
  END IF;

  IF NOT public.vet_has_consulted_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé. Consultez d''abord l''animal via un QR code.';
  END IF;

  INSERT INTO public.medical_events (
    animal_id, type, diagnostic, traitement, poids_kg, description, titre, status, vet_profile_id, date_event
  )
  VALUES (
    p_animal_id, p_type, p_diagnostic, p_traitement, p_poids_kg, p_description, p_titre, 'pending', auth.uid(), COALESCE(p_date_event, now())
  )
  RETURNING * INTO v_event;

  SELECT proprietaire_id INTO v_proprietaire_id FROM public.animaux WHERE id = p_animal_id;

  INSERT INTO public.notifications (user_id, type, titre, corps, donnees)
  VALUES (
    v_proprietaire_id,
    'nouvelle_consultation',
    'Nouvel événement médical',
    coalesce(p_titre, 'Votre vétérinaire a rédigé un événement à valider.'),
    jsonb_build_object('animal_id', p_animal_id, 'medical_event_id', v_event.id, 'event_type', p_type)
  );

  RETURN v_event;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.vet_create_animal_medical_event(uuid, medical_event_type, text, text, numeric, text, text, timestamptz) TO authenticated, service_role;
