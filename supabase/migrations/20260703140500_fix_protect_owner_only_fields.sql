-- Autoriser la modification du plan depuis le SQL Editor (auth.uid() NULL).

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
