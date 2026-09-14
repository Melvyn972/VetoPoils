-- CDC restant : OCR sans paywall, cibles partenaires, seed affiliation.

CREATE OR REPLACE FUNCTION public.increment_ocr_usage(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_proprietaire_id UUID;
  v_usage INTEGER;
BEGIN
  v_proprietaire_id := public.get_compte_proprietaire_id(p_user_id);
  IF v_proprietaire_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  PERFORM public.reset_ocr_usage_if_needed(p_user_id);

  UPDATE public.profiles
  SET ocr_usage = ocr_usage + 1
  WHERE id = v_proprietaire_id
  RETURNING ocr_usage INTO v_usage;

  RETURN v_usage;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.increment_ocr_usage(uuid) TO authenticated;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS cibles text[] NOT NULL DEFAULT ARRAY['tous']::text[];

INSERT INTO public.partners (nom, categorie, url, description, actif, cibles)
SELECT *
FROM (
  VALUES
    (
      'Royal Canin',
      'alimentation',
      'https://www.royalcanin.com/fr',
      'Nutrition vétérinaire adaptée à l’espèce, la race et l’âge.',
      true,
      ARRAY['chien', 'chat']::text[]
    ),
    (
      'Hill''s Pet Nutrition',
      'alimentation',
      'https://www.hillspet.fr',
      'Gammes diététiques et prescrites par les vétérinaires.',
      true,
      ARRAY['chien', 'chat']::text[]
    ),
    (
      'SantéVet',
      'assurance',
      'https://www.santevet.com',
      'Assurance santé animale - comparer sans engagement.',
      true,
      ARRAY['chien', 'chat']::text[]
    ),
    (
      'Wamiz',
      'conseil',
      'https://wamiz.com',
      'Guides d’éducation, santé et vie quotidienne.',
      true,
      ARRAY['tous']::text[]
    ),
    (
      'Feliway / Adaptil',
      'bien-etre',
      'https://www.feliway.com/fr',
      'Solutions phéromones pour le stress du chat et du chien.',
      true,
      ARRAY['chien', 'chat']::text[]
    )
) AS seed(nom, categorie, url, description, actif, cibles)
WHERE NOT EXISTS (SELECT 1 FROM public.partners LIMIT 1);
