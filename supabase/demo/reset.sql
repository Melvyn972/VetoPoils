-- Reset FICTIF de la démo publique, toutes les 30 minutes.
-- Ne pas exécuter sur la production (lmdszelnnibexzvnaubp / veto-poils).
-- Voir README.md : SET vetopoil.allow_demo_reset = 'on' avant ce script.
--
-- Le nettoyage ne touche que les deux animaux de démo et les notifications
-- qui les concernent. Il s'arrête si les comptes fictifs ne sont pas ceux
-- attendus.

DO $demo_reset_guard$
BEGIN
  IF current_setting('vetopoil.allow_demo_reset', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION
      'Reset démo refusé. Sur le projet isolé seulement : SET vetopoil.allow_demo_reset = ''on'';';
  END IF;
END
$demo_reset_guard$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.demo_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = 'd0000000-0000-4000-8000-000000000001'
      AND email = 'demo.proprio@example.com'
  ) OR NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = 'd0000000-0000-4000-8000-000000000002'
      AND email = 'demo.veto@example.com'
  ) THEN
    RAISE EXCEPTION 'demo_reset refusé : comptes de démo absents ou différents.';
  END IF;

  DELETE FROM public.documents
  WHERE animal_id IN (
    'a0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002'
  );

  DELETE FROM public.medical_events
  WHERE animal_id IN (
    'a0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002'
  )
  AND (
    status <> 'validated'
    OR vet_token_id IS NOT NULL
    OR (
      vet_profile_id IS NOT NULL
      AND vet_profile_id <> 'd0000000-0000-4000-8000-000000000002'
    )
  );

  DELETE FROM public.reminders
  WHERE animal_id IN (
    'a0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002'
  )
  AND created_at > (
    SELECT min(created_at) + interval '5 minutes'
    FROM public.reminders
    WHERE animal_id IN (
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002'
    )
  );

  DELETE FROM public.notifications
  WHERE user_id = 'd0000000-0000-4000-8000-000000000001'
     OR donnees ->> 'animal_id' IN (
       'a0000000-0000-4000-8000-000000000001',
       'a0000000-0000-4000-8000-000000000002'
     );

  UPDATE public.vet_access_tokens
  SET statut = 'actif',
      utilise_le = NULL,
      expire_le = '2099-12-31'
  WHERE token IN ('VETDEM', 'CHATLU')
    AND animal_id IN (
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002'
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.demo_reset() FROM PUBLIC, anon, authenticated, service_role;

DO $demo_reset_schedule$
BEGIN
  PERFORM cron.unschedule(job.jobid)
  FROM cron.job AS job
  WHERE job.jobname = 'vetopoil-demo-reset';

  PERFORM cron.schedule(
    'vetopoil-demo-reset',
    '*/30 * * * *',
    'SELECT public.demo_reset()'
  );
END
$demo_reset_schedule$;
