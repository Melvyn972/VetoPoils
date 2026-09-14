-- Vet'OPoil - Correctif : modification du plan depuis le SQL Editor Supabase
-- Problème : auth.uid() est NULL dans le SQL Editor, le trigger bloquait toute mise à jour du plan.
-- À exécuter dans Supabase SQL Editor du projet lmdszelnnibexzvnaubp.

CREATE OR REPLACE FUNCTION public.protect_owner_only_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SQL Editor, migrations et service_role : pas de JWT utilisateur
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

-- Exemple : passer un utilisateur en premium
-- UPDATE public.profiles SET plan = 'premium' WHERE email = 'votre@email.com';
