-- Vet'OPoil - Fonctions métier, triggers et helpers d'autorisation

-- ============================================================================
-- UTILITAIRES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER animaux_updated_at
  BEFORE UPDATE ON public.animaux
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER medical_events_updated_at
  BEFORE UPDATE ON public.medical_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Création automatique du profil à l'inscription (F01)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HELPERS D'AUTORISATION (utilisés par RLS)
-- ============================================================================

-- ID du propriétaire de compte effectif (owner ou son co_owner)
CREATE OR REPLACE FUNCTION public.get_compte_proprietaire_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.role = 'owner' THEN p.id
    ELSE p.compte_proprietaire_id
  END
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID DEFAULT auth.uid())
RETURNS public.plan_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT plan
      FROM public.profiles
      WHERE id = public.get_compte_proprietaire_id(p_user_id)
    ),
    'free'::public.plan_type
  );
$$;

-- Propriétaire ou co-propriétaire du compte
CREATE OR REPLACE FUNCTION public.is_compte_membre(p_animal_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.animaux a
  JOIN public.profiles p ON p.id = p_user_id
    WHERE a.id = p_animal_id
      AND a.deleted_at IS NULL
      AND (
        a.proprietaire_id = p_user_id
        OR (
          p.role = 'co_owner'
          AND p.compte_proprietaire_id = a.proprietaire_id
        )
      )
  );
$$;

-- Rôle de partage sur un animal
CREATE OR REPLACE FUNCTION public.get_partage_role(p_animal_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS public.partage_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.role
  FROM public.animal_shares s
  WHERE s.animal_id = p_animal_id
    AND s.user_id = p_user_id
    AND s.statut = 'acceptee'
  LIMIT 1;
$$;

-- Lecture autorisée : membre compte OU partage accepté
CREATE OR REPLACE FUNCTION public.can_read_animal(p_animal_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_compte_membre(p_animal_id, p_user_id)
    OR public.get_partage_role(p_animal_id, p_user_id) IS NOT NULL;
$$;

-- Écriture complète : owner ou co_owner uniquement
CREATE OR REPLACE FUNCTION public.can_write_animal(p_animal_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_compte_membre(p_animal_id, p_user_id);
$$;

-- Journal quotidien : contributor ou membre compte
CREATE OR REPLACE FUNCTION public.can_write_daily_log(p_animal_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_compte_membre(p_animal_id, p_user_id)
    OR public.get_partage_role(p_animal_id, p_user_id) = 'contributor';
$$;

-- Seul le owner peut gérer abonnement et supprimer le compte
CREATE OR REPLACE FUNCTION public.is_account_owner(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'owner'
  );
$$;

-- Seul le owner peut modifier plan / Stripe (F10)
CREATE OR REPLACE FUNCTION public.protect_owner_only_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_account_owner() THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
      RAISE EXCEPTION 'Seul le propriétaire du compte peut modifier l''abonnement.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_subscription
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_only_fields();

-- ============================================================================
-- QUOTAS PLAN GRATUIT (F09, F05)
-- ============================================================================

-- Limite : 1 animal en plan free
CREATE OR REPLACE FUNCTION public.check_animal_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.plan_type;
  v_count INTEGER;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_plan := public.get_user_plan(NEW.proprietaire_id);

  IF v_plan = 'premium' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.animaux
  WHERE proprietaire_id = NEW.proprietaire_id
    AND deleted_at IS NULL
    AND (TG_OP = 'INSERT' OR id != NEW.id);

  IF v_count >= 1 THEN
    RAISE EXCEPTION 'Quota animal atteint : le plan gratuit autorise 1 animal. Passez au plan premium.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER animaux_quota_check
  BEFORE INSERT ON public.animaux
  FOR EACH ROW EXECUTE FUNCTION public.check_animal_quota();

-- Réinitialisation mensuelle du compteur OCR
CREATE OR REPLACE FUNCTION public.reset_ocr_usage_if_needed(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proprietaire_id UUID;
  v_current_month DATE;
BEGIN
  v_proprietaire_id := public.get_compte_proprietaire_id(p_user_id);
  v_current_month := date_trunc('month', now())::date;

  UPDATE public.profiles
  SET ocr_usage = 0, ocr_usage_mois = v_current_month
  WHERE id = v_proprietaire_id
    AND ocr_usage_mois < v_current_month;
END;
$$;

-- Incrément OCR avec quota (2/mois gratuit - F05)
CREATE OR REPLACE FUNCTION public.increment_ocr_usage(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proprietaire_id UUID;
  v_plan public.plan_type;
  v_usage INTEGER;
BEGIN
  v_proprietaire_id := public.get_compte_proprietaire_id(p_user_id);
  PERFORM public.reset_ocr_usage_if_needed(p_user_id);

  SELECT plan, ocr_usage INTO v_plan, v_usage
  FROM public.profiles
  WHERE id = v_proprietaire_id
  FOR UPDATE;

  IF v_plan = 'free' AND v_usage >= 2 THEN
    RAISE EXCEPTION 'Quota OCR atteint : 2 scans/mois en plan gratuit. Passez au plan premium.';
  END IF;

  UPDATE public.profiles
  SET ocr_usage = ocr_usage + 1
  WHERE id = v_proprietaire_id
  RETURNING ocr_usage INTO v_usage;

  RETURN v_usage;
END;
$$;

-- Budget réservé premium (F13)
CREATE OR REPLACE FUNCTION public.check_expense_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proprietaire_id UUID;
BEGIN
  SELECT proprietaire_id INTO v_proprietaire_id
  FROM public.animaux WHERE id = NEW.animal_id;

  IF public.get_user_plan(v_proprietaire_id) != 'premium' THEN
    RAISE EXCEPTION 'Le budget vétérinaire est réservé au plan premium.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_premium_check
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.check_expense_premium();

-- ============================================================================
-- TOKENS VÉTÉRINAIRE (F06, F07)
-- ============================================================================

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

  -- Révoquer les tokens actifs existants pour cet animal
  UPDATE public.vet_access_tokens
  SET statut = 'revoque'
  WHERE animal_id = p_animal_id AND statut = 'actif';

  INSERT INTO public.vet_access_tokens (animal_id, expire_le, cree_par)
  VALUES (p_animal_id, now() + (p_duree_heures || ' hours')::interval, auth.uid())
  RETURNING * INTO v_token;

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.valider_vet_token(p_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_statut public.vet_token_status;
  v_expire TIMESTAMPTZ;
BEGIN
  SELECT animal_id, statut, expire_le
  INTO v_animal_id, v_statut, v_expire
  FROM public.vet_access_tokens
  WHERE token = p_token;

  IF v_animal_id IS NULL THEN
    RAISE EXCEPTION 'Token vétérinaire invalide.';
  END IF;

  IF v_statut = 'revoque' THEN
    RAISE EXCEPTION 'Token vétérinaire révoqué.';
  END IF;

  IF v_expire < now() THEN
    UPDATE public.vet_access_tokens SET statut = 'expire' WHERE token = p_token;
    RAISE EXCEPTION 'Token vétérinaire expiré.';
  END IF;

  RETURN v_animal_id;
END;
$$;

-- Lecture dossier complet via token vétérinaire (sans auth)
CREATE OR REPLACE FUNCTION public.vet_get_dossier(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
  v_result JSONB;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);

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
    'token_expire_le', (SELECT expire_le FROM public.vet_access_tokens WHERE token = p_token)
  ) INTO v_result
  FROM public.animaux a
  WHERE a.id = v_animal_id AND a.deleted_at IS NULL;

  RETURN v_result;
END;
$$;

-- Saisie vétérinaire rapide → MedicalEvent pending (F07, F18)
CREATE OR REPLACE FUNCTION public.vet_create_medical_event(
  p_token UUID,
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
  v_event public.medical_events;
  v_proprietaire_id UUID;
BEGIN
  v_animal_id := public.valider_vet_token(p_token);

  SELECT id INTO v_token_id FROM public.vet_access_tokens WHERE token = p_token;

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

-- Validation événement pending par le propriétaire
CREATE OR REPLACE FUNCTION public.valider_medical_event(p_event_id UUID)
RETURNS public.medical_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SET status = 'validated', cree_par = auth.uid()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$$;

-- Révoquer token vétérinaire
CREATE OR REPLACE FUNCTION public.revoquer_vet_token(p_token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_animal_id UUID;
BEGIN
  SELECT animal_id INTO v_animal_id
  FROM public.vet_access_tokens WHERE token = p_token;

  IF NOT public.can_write_animal(v_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  UPDATE public.vet_access_tokens
  SET statut = 'revoque'
  WHERE token = p_token;
END;
$$;

-- Expiration automatique des tokens (à appeler via pg_cron ou edge function)
CREATE OR REPLACE FUNCTION public.expirer_vet_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.vet_access_tokens
  SET statut = 'expire'
  WHERE statut = 'actif' AND expire_le < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Score de santé - stockage (calcul IA côté app/edge function)
CREATE OR REPLACE FUNCTION public.enregistrer_health_score(
  p_animal_id UUID,
  p_score NUMERIC,
  p_details JSONB DEFAULT '{}'
)
RETURNS public.health_score_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.health_score_history;
BEGIN
  IF NOT public.can_write_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  INSERT INTO public.health_score_history (animal_id, score, details)
  VALUES (p_animal_id, p_score, p_details)
  RETURNING * INTO v_record;

  UPDATE public.animaux SET score_sante = p_score WHERE id = p_animal_id;

  RETURN v_record;
END;
$$;

-- Export données RGPD (F08.3 portabilité)
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proprietaire_id UUID;
  v_result JSONB;
BEGIN
  IF p_user_id != auth.uid() AND NOT public.is_account_owner() THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  v_proprietaire_id := public.get_compte_proprietaire_id(p_user_id);

  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = v_proprietaire_id),
    'animaux', COALESCE((
      SELECT jsonb_agg(to_jsonb(a.*))
      FROM public.animaux a WHERE a.proprietaire_id = v_proprietaire_id
    ), '[]'::jsonb),
    'exported_at', now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Acceptation invitation partage
CREATE OR REPLACE FUNCTION public.accepter_invitation_partage(p_share_id UUID)
RETURNS public.animal_shares
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.animal_shares;
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_share FROM public.animal_shares WHERE id = p_share_id;

  IF v_share.id IS NULL OR v_share.statut != 'en_attente' THEN
    RAISE EXCEPTION 'Invitation invalide ou déjà traitée.';
  END IF;

  IF lower(v_share.email_invite) != lower(v_email) THEN
    RAISE EXCEPTION 'Cette invitation ne correspond pas à votre email.';
  END IF;

  UPDATE public.animal_shares
  SET statut = 'acceptee', user_id = auth.uid(), accepte_le = now()
  WHERE id = p_share_id
  RETURNING * INTO v_share;

  RETURN v_share;
END;
$$;

-- Grants sur fonctions RPC
GRANT EXECUTE ON FUNCTION public.generer_vet_token(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vet_get_dossier(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vet_create_medical_event(UUID, public.medical_event_type, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.valider_medical_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoquer_vet_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ocr_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enregistrer_health_score(UUID, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accepter_invitation_partage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expirer_vet_tokens() TO service_role;
