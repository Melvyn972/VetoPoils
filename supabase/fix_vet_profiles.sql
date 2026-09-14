-- Vet'OPoil - Comptes vétérinaires (séparés des propriétaires)
-- Projet : lmdszelnnibexzvnaubp

CREATE TABLE IF NOT EXISTS public.vet_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  clinique TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER vet_profiles_updated_at
  BEFORE UPDATE ON public.vet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vet_profiles_select_own ON public.vet_profiles;
CREATE POLICY vet_profiles_select_own ON public.vet_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS vet_profiles_update_own ON public.vet_profiles;
CREATE POLICY vet_profiles_update_own ON public.vet_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_veterinarian(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vet_profiles WHERE id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_veterinarian(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_veterinarian(UUID) TO authenticated, service_role;

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
    INSERT INTO public.vet_profiles (id, nom_complet, email, clinique, telephone)
    VALUES (
      NEW.id,
      COALESCE(v_full_name, split_part(NEW.email, '@', 1)),
      NEW.email,
      NULLIF(trim(NEW.raw_user_meta_data ->> 'clinique'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'telephone'), '')
    );
  ELSE
    INSERT INTO public.profiles (id, nom, prenom, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'nom'), ''), split_part(COALESCE(v_full_name, NEW.email), ' ', 1)),
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'prenom'), ''), ''),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;

GRANT SELECT, UPDATE ON public.vet_profiles TO authenticated;
