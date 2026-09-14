-- Vet'OPoil - Création animal via RPC sécurisée
-- À exécuter dans Supabase SQL Editor du projet lmdszelnnibexzvnaubp.
-- Objectif : éviter le blocage RLS direct sur INSERT public.animaux.

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
