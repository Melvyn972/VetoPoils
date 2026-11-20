-- Smart Scan : rétablit la limite de 2 analyses OCR / mois en plan gratuit
-- (retirée par 20260914140000_cdc_ocr_budget_partners). Le plan premium reste illimité.

CREATE OR REPLACE FUNCTION public.check_ocr_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_proprietaire_id UUID;
  v_plan public.plan_type;
  v_usage INTEGER;
  v_limit INTEGER;
BEGIN
  v_proprietaire_id := public.get_compte_proprietaire_id(auth.uid());
  IF v_proprietaire_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  PERFORM public.reset_ocr_usage_if_needed(auth.uid());

  SELECT plan, ocr_usage INTO v_plan, v_usage
  FROM public.profiles
  WHERE id = v_proprietaire_id;

  v_limit := CASE WHEN v_plan = 'free' THEN 2 ELSE NULL END;

  RETURN jsonb_build_object(
    'plan', v_plan,
    'usage', v_usage,
    'limit', v_limit,
    'remaining', CASE WHEN v_limit IS NULL THEN NULL ELSE GREATEST(v_limit - v_usage, 0) END,
    'allowed', v_limit IS NULL OR v_usage < v_limit
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.check_ocr_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ocr_quota() TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_ocr_usage(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_proprietaire_id UUID;
  v_plan public.plan_type;
  v_usage INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Non autorisé.';
  END IF;

  v_proprietaire_id := public.get_compte_proprietaire_id(p_user_id);
  IF v_proprietaire_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

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
$function$;

GRANT EXECUTE ON FUNCTION public.increment_ocr_usage(uuid) TO authenticated;
