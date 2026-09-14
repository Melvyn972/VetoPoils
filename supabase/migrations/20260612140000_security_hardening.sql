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
