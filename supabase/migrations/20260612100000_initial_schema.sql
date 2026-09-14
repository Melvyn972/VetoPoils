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
