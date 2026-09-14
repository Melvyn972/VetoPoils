-- Fix Vet'OPoil: avoid recursive RLS on public.profiles.
-- The old profiles_select_own policy queried public.profiles from inside
-- a policy on public.profiles, which triggers Postgres error 42P17.

CREATE OR REPLACE FUNCTION public.can_read_profile(
  p_profile_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH requester AS (
    SELECT id, role, compte_proprietaire_id
    FROM public.profiles
    WHERE id = p_user_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM requester r
    WHERE
      p_profile_id = r.id
      OR (
        r.role = 'owner'
        AND EXISTS (
          SELECT 1
          FROM public.profiles target
          WHERE target.id = p_profile_id
            AND target.compte_proprietaire_id = r.id
        )
      )
      OR (
        r.role = 'co_owner'
        AND p_profile_id = r.compte_proprietaire_id
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_profile(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_profile(UUID, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_read_profile(id));
