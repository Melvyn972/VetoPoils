-- Archivage d'un animal (web et Expo).
-- Un UPDATE filtré sur animaux impose aussi animaux_select à la nouvelle ligne.
-- Cette policy exige deleted_at IS NULL : l'UPDATE qui renseigne deleted_at est donc
-- toujours rejeté, même avec le WITH CHECK élargi de la migration précédente.
-- La policy de lecture reste inchangée (elle masque les archives) ;
-- l'archivage passe par une fonction réservée au compte propriétaire de l'animal.

CREATE OR REPLACE FUNCTION public.archiver_animal(p_animal_id UUID)
RETURNS VOID
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

  UPDATE public.animaux
  SET deleted_at = now()
  WHERE id = p_animal_id
    AND deleted_at IS NULL
    AND proprietaire_id = public.get_compte_proprietaire_id(v_uid);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal introuvable ou archivage réservé au propriétaire.';
  END IF;

  UPDATE public.vet_access_tokens
  SET statut = 'revoque'
  WHERE animal_id = p_animal_id
    AND statut = 'actif';
END;
$$;

REVOKE ALL ON FUNCTION public.archiver_animal(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archiver_animal(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.archiver_animal(UUID) TO authenticated;
