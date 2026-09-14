-- Vet'OPoil - Schéma initial (CdC v1.0)
-- Référence: CDC-Vet'OPoil-2025-v1.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE public.compte_role AS ENUM ('owner', 'co_owner');

CREATE TYPE public.plan_type AS ENUM ('free', 'premium');

CREATE TYPE public.partage_role AS ENUM ('read_only', 'contributor');

CREATE TYPE public.medical_event_status AS ENUM ('pending', 'validated');

CREATE TYPE public.medical_event_type AS ENUM (
  'consultation',
  'vaccination',
  'chirurgie',
  'ordonnance',
  'analyse',
  'autre'
);

CREATE TYPE public.document_category AS ENUM (
  'ordonnance',
  'facture',
  'analyse_sanguine',
  'vaccination',
  'autre'
);

CREATE TYPE public.reminder_type AS ENUM (
  'vaccination',
  'antiparasitaire',
  'rdv',
  'autre'
);

CREATE TYPE public.reminder_channel AS ENUM ('email', 'push', 'both');

CREATE TYPE public.reminder_status AS ENUM (
  'actif',
  'termine',
  'annule',
  'reporte'
);

CREATE TYPE public.expense_category AS ENUM (
  'veterinaire',
  'alimentation',
  'accessoires',
  'pharmacie',
  'autre'
);

CREATE TYPE public.vet_token_status AS ENUM (
  'actif',
  'utilise',
  'expire',
  'revoque'
);

CREATE TYPE public.invitation_status AS ENUM (
  'en_attente',
  'acceptee',
  'revoquee'
);

CREATE TYPE public.animal_sexe AS ENUM ('male', 'femelle', 'inconnu');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profil utilisateur (extension de auth.users - F01)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.compte_role NOT NULL DEFAULT 'owner',
  compte_proprietaire_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan public.plan_type NOT NULL DEFAULT 'free',
  ocr_usage INTEGER NOT NULL DEFAULT 0 CHECK (ocr_usage >= 0),
  ocr_usage_mois DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT co_owner_requires_proprietaire CHECK (
    (role = 'owner' AND compte_proprietaire_id IS NULL)
    OR (role = 'co_owner' AND compte_proprietaire_id IS NOT NULL)
  )
);

CREATE INDEX idx_profiles_compte_proprietaire ON public.profiles(compte_proprietaire_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Animaux (F02, F09)
CREATE TABLE public.animaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  espece TEXT NOT NULL,
  race TEXT,
  date_naissance DATE,
  sexe public.animal_sexe NOT NULL DEFAULT 'inconnu',
  couleur TEXT,
  puce TEXT,
  photo_path TEXT,
  score_sante NUMERIC(5, 2) CHECK (score_sante IS NULL OR (score_sante >= 0 AND score_sante <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_animaux_proprietaire ON public.animaux(proprietaire_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_animaux_puce ON public.animaux(puce) WHERE puce IS NOT NULL;

-- Événements médicaux (F03)
CREATE TABLE public.medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  type public.medical_event_type NOT NULL,
  date_event TIMESTAMPTZ NOT NULL DEFAULT now(),
  titre TEXT,
  description TEXT,
  poids_kg NUMERIC(6, 3) CHECK (poids_kg IS NULL OR poids_kg > 0),
  diagnostic TEXT,
  traitement TEXT,
  status public.medical_event_status NOT NULL DEFAULT 'validated',
  cree_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vet_token_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_events_animal_date ON public.medical_events(animal_id, date_event DESC);
CREATE INDEX idx_medical_events_status ON public.medical_events(animal_id, status);

-- Documents médicaux (F04, F05, F15)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  taille_octets BIGINT NOT NULL CHECK (taille_octets > 0),
  category_ocr public.document_category,
  raw_ocr_json JSONB,
  uploade_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_animal ON public.documents(animal_id, created_at DESC);
CREATE INDEX idx_documents_category ON public.documents(animal_id, category_ocr);

-- Tokens d'accès vétérinaire (F06, F07)
CREATE TABLE public.vet_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expire_le TIMESTAMPTZ NOT NULL,
  utilise_le TIMESTAMPTZ,
  statut public.vet_token_status NOT NULL DEFAULT 'actif',
  cree_par UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vet_tokens_token ON public.vet_access_tokens(token) WHERE statut = 'actif';
CREATE INDEX idx_vet_tokens_animal ON public.vet_access_tokens(animal_id, created_at DESC);

ALTER TABLE public.medical_events
  ADD CONSTRAINT medical_events_vet_token_fk
  FOREIGN KEY (vet_token_id) REFERENCES public.vet_access_tokens(id) ON DELETE SET NULL;

-- Partage collaboratif (F11)
CREATE TABLE public.animal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_invite TEXT NOT NULL,
  role public.partage_role NOT NULL,
  statut public.invitation_status NOT NULL DEFAULT 'en_attente',
  invite_par UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepte_le TIMESTAMPTZ,
  CONSTRAINT animal_shares_user_or_pending CHECK (
    statut = 'en_attente' OR user_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX idx_animal_shares_unique_user
  ON public.animal_shares(animal_id, user_id)
  WHERE user_id IS NOT NULL AND statut != 'revoquee';

CREATE UNIQUE INDEX idx_animal_shares_unique_email_pending
  ON public.animal_shares(animal_id, lower(email_invite))
  WHERE statut = 'en_attente';

CREATE INDEX idx_animal_shares_user ON public.animal_shares(user_id) WHERE statut = 'acceptee';

-- Rappels automatiques (F08)
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  type public.reminder_type NOT NULL,
  date_echeance DATE NOT NULL,
  canal public.reminder_channel NOT NULL DEFAULT 'both',
  statut public.reminder_status NOT NULL DEFAULT 'actif',
  titre TEXT NOT NULL,
  notes TEXT,
  notifie_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_echeance ON public.reminders(date_echeance, statut)
  WHERE statut = 'actif';
CREATE INDEX idx_reminders_animal ON public.reminders(animal_id);

-- Journal quotidien pet-sitter (F12)
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  date_journal DATE NOT NULL DEFAULT CURRENT_DATE,
  repas TEXT,
  sortie TEXT,
  comportement TEXT,
  notes TEXT,
  cree_par UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (animal_id, date_journal, cree_par)
);

CREATE INDEX idx_daily_logs_animal_date ON public.daily_logs(animal_id, date_journal DESC);

-- Budget vétérinaire (F13) - premium uniquement
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  category public.expense_category NOT NULL,
  montant NUMERIC(10, 2) NOT NULL CHECK (montant >= 0),
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  medical_event_id UUID REFERENCES public.medical_events(id) ON DELETE SET NULL,
  cree_par UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_animal_date ON public.expenses(animal_id, date_depense DESC);
CREATE INDEX idx_expenses_category ON public.expenses(animal_id, category);

-- Historique score de santé IA (F14)
CREATE TABLE public.health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  details JSONB NOT NULL DEFAULT '{}',
  calcule_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_score_animal ON public.health_score_history(animal_id, calcule_le DESC);

-- Notifications propriétaire (F18 - sync vétérinaire)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  corps TEXT NOT NULL,
  donnees JSONB NOT NULL DEFAULT '{}',
  lu_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC)
  WHERE lu_le IS NULL;

-- Affiliation B2B partenaires (F17)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.partner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  contexte TEXT,
  clique_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_clicks_user ON public.partner_clicks(user_id, clique_le DESC);


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
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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


-- Vet'OPoil - Row Level Security (toutes les tables)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR compte_proprietaire_id = auth.uid()
    OR id = (SELECT compte_proprietaire_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ANIMAUX
-- ============================================================================

CREATE POLICY animaux_select ON public.animaux
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND public.can_read_animal(id)
  );

CREATE POLICY animaux_insert ON public.animaux
  FOR INSERT TO authenticated
  WITH CHECK (proprietaire_id = public.get_compte_proprietaire_id());

CREATE POLICY animaux_update ON public.animaux
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(id) AND deleted_at IS NULL)
  WITH CHECK (public.can_write_animal(id));

CREATE POLICY animaux_delete ON public.animaux
  FOR DELETE TO authenticated
  USING (public.can_write_animal(id));

-- ============================================================================
-- MEDICAL EVENTS
-- ============================================================================

CREATE POLICY medical_events_select ON public.medical_events
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY medical_events_insert ON public.medical_events
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY medical_events_update ON public.medical_events
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY medical_events_delete ON public.medical_events
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- VET ACCESS TOKENS
-- ============================================================================

CREATE POLICY vet_tokens_select ON public.vet_access_tokens
  FOR SELECT TO authenticated
  USING (public.can_write_animal(animal_id));

CREATE POLICY vet_tokens_insert ON public.vet_access_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND cree_par = auth.uid());

CREATE POLICY vet_tokens_update ON public.vet_access_tokens
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- ANIMAL SHARES (F11)
-- ============================================================================

CREATE POLICY animal_shares_select ON public.animal_shares
  FOR SELECT TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR user_id = auth.uid()
    OR lower(email_invite) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY animal_shares_insert ON public.animal_shares
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND invite_par = auth.uid());

CREATE POLICY animal_shares_update ON public.animal_shares
  FOR UPDATE TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR (user_id = auth.uid() AND statut = 'en_attente')
  );

CREATE POLICY animal_shares_delete ON public.animal_shares
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- REMINDERS (F08)
-- ============================================================================

CREATE POLICY reminders_select ON public.reminders
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY reminders_insert ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY reminders_update ON public.reminders
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY reminders_delete ON public.reminders
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- DAILY LOGS (F12)
-- ============================================================================

CREATE POLICY daily_logs_select ON public.daily_logs
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY daily_logs_insert ON public.daily_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_write_daily_log(animal_id)
    AND cree_par = auth.uid()
  );

CREATE POLICY daily_logs_update ON public.daily_logs
  FOR UPDATE TO authenticated
  USING (cree_par = auth.uid() AND public.can_write_daily_log(animal_id))
  WITH CHECK (cree_par = auth.uid());

CREATE POLICY daily_logs_delete ON public.daily_logs
  FOR DELETE TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR (cree_par = auth.uid() AND public.can_write_daily_log(animal_id))
  );

-- ============================================================================
-- EXPENSES (F13 - premium enforced by trigger)
-- ============================================================================

CREATE POLICY expenses_select ON public.expenses
  FOR SELECT TO authenticated
  USING (public.can_write_animal(animal_id));

CREATE POLICY expenses_insert ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND cree_par = auth.uid());

CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY expenses_delete ON public.expenses
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- HEALTH SCORE (F14)
-- ============================================================================

CREATE POLICY health_score_select ON public.health_score_history
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY health_score_insert ON public.health_score_history
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

-- ============================================================================
-- NOTIFICATIONS (F18)
-- ============================================================================

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PARTNERS B2B (F17)
-- ============================================================================

CREATE POLICY partners_select ON public.partners
  FOR SELECT TO authenticated, anon
  USING (actif = true);

CREATE POLICY partner_clicks_insert ON public.partner_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY partner_clicks_select ON public.partner_clicks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- Vet'OPoil - Storage buckets et policies (F04)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'animal-photos',
    'animal-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'animal-documents',
    'animal-documents',
    false,
    20971520,
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'image/tiff'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Chemin storage : {proprietaire_id}/{animal_id}/{uuid}.{ext}

CREATE OR REPLACE FUNCTION public.storage_animal_id_from_path(p_path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(p_path, '/', 2), '')::uuid;
$$;

CREATE POLICY animal_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_read_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
    AND (storage.foldername(name))[1] = public.get_compte_proprietaire_id()::text
  );

CREATE POLICY animal_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-documents'
    AND public.can_read_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'animal-documents'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
    AND (storage.foldername(name))[1] = public.get_compte_proprietaire_id()::text
  );

CREATE POLICY animal_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'animal-documents'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );


-- Durcissement sécurité : révoquer EXECUTE anon sur fonctions internes

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_compte_proprietaire_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_plan(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_compte_membre(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_partage_role(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_animal(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_animal(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_daily_log(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_account_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_owner_only_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_animal_quota() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_ocr_usage_if_needed(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_expense_premium() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.valider_vet_token(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.storage_animal_id_from_path(TEXT) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.expirer_vet_tokens() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expirer_vet_tokens() TO service_role;

-- Helpers : usage interne RLS uniquement (postgres via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.get_compte_proprietaire_id(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_animal(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_animal(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_daily_log(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.storage_animal_id_from_path(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_animal_id_from_path(p_path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(split_part(p_path, '/', 2), '')::uuid;
$$;


-- Fix Vet'OPoil: avoid recursive RLS on public.profiles.
-- The old profiles_select_own policy queried public.profiles from inside
-- a policy on public.profiles, which triggers Postgres error 42P17.

CREATE OR REPLACE FUNCTION public.can_read_profile(
  p_profile_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH requester AS (
    SELECT id, role, compte_proprietaire_id
    FROM public.profiles
    WHERE id = p_user_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM requester r
    WHERE
      p_profile_id = r.id
      OR (
        r.role = 'owner'
        AND EXISTS (
          SELECT 1
          FROM public.profiles target
          WHERE target.id = p_profile_id
            AND target.compte_proprietaire_id = r.id
        )
      )
      OR (
        r.role = 'co_owner'
        AND p_profile_id = r.compte_proprietaire_id
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_profile(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_profile(UUID, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_read_profile(id));


-- Fix Vet'OPoil: make animal creation robust for authenticated owners.

DROP POLICY IF EXISTS animaux_insert ON public.animaux;

CREATE POLICY animaux_insert ON public.animaux
  FOR INSERT TO authenticated
  WITH CHECK (
    proprietaire_id = auth.uid()
    OR proprietaire_id = public.get_compte_proprietaire_id(auth.uid())
  );


-- Fix Vet'OPoil: create animals through a secure RPC.

CREATE OR REPLACE FUNCTION public.creer_animal(
  p_nom TEXT,
  p_espece TEXT,
  p_race TEXT DEFAULT NULL,
  p_date_naissance DATE DEFAULT NULL,
  p_sexe public.animal_sexe DEFAULT 'inconnu',
  p_couleur TEXT DEFAULT NULL,
  p_puce TEXT DEFAULT NULL
)
RETURNS public.animaux
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_animal public.animaux;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié.';
  END IF;

  v_owner_id := COALESCE(public.get_compte_proprietaire_id(auth.uid()), auth.uid());

  INSERT INTO public.animaux (
    proprietaire_id,
    nom,
    espece,
    race,
    date_naissance,
    sexe,
    couleur,
    puce
  )
  VALUES (
    v_owner_id,
    p_nom,
    p_espece,
    NULLIF(p_race, ''),
    p_date_naissance,
    COALESCE(p_sexe, 'inconnu'),
    NULLIF(p_couleur, ''),
    NULLIF(p_puce, '')
  )
  RETURNING * INTO v_animal;

  RETURN v_animal;
END;
$$;

REVOKE ALL ON FUNCTION public.creer_animal(
  TEXT,
  TEXT,
  TEXT,
  DATE,
  public.animal_sexe,
  TEXT,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.creer_animal(
  TEXT,
  TEXT,
  TEXT,
  DATE,
  public.animal_sexe,
  TEXT,
  TEXT
) TO authenticated, service_role;


-- Données initiales Vet'OPoil (F17 - partenaires B2B)
INSERT INTO public.partners (nom, categorie, url, description) VALUES
  ('AssurAnimal', 'assurance', 'https://example.com/assurance', 'Assurance santé animale partenaire'),
  ('PharmaVet', 'pharmacie', 'https://example.com/pharmacie', 'Pharmacie vétérinaire en ligne'),
  ('NutriPet', 'alimentation', 'https://example.com/alimentation', 'Alimentation premium pour animaux')
ON CONFLICT DO NOTHING;
