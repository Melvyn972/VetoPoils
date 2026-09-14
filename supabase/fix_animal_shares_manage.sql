-- Vet'OPoil - Gestion des partages animaux
-- À ré-exécuter dans le SQL Editor Supabase (remplace les versions précédentes).

-- ---------------------------------------------------------------------------
-- 1) Contrainte : permettre "revoquee" même sans user_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.animal_shares
  DROP CONSTRAINT IF EXISTS animal_shares_user_or_pending;

ALTER TABLE public.animal_shares
  ADD CONSTRAINT animal_shares_user_or_pending CHECK (
    statut = 'en_attente'
    OR statut = 'revoquee'
    OR user_id IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- 2) Vérifier qu'un compte existe pour un email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compte_existe_par_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(coalesce(p_email, '')));
BEGIN
  IF v_email = '' OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE lower(p.email) = v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.compte_existe_par_email(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Révoquer / annuler un partage (propriétaire)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoquer_partage(p_share_id UUID)
RETURNS public.animal_shares
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.animal_shares;
BEGIN
  SELECT * INTO v_share FROM public.animal_shares WHERE animal_shares.id = p_share_id;

  IF v_share.id IS NULL THEN
    RAISE EXCEPTION 'Partage introuvable.';
  END IF;

  IF NOT public.can_write_animal(v_share.animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  IF v_share.statut = 'revoquee' THEN
    RETURN v_share;
  END IF;

  IF v_share.statut = 'en_attente' AND v_share.user_id IS NULL THEN
    DELETE FROM public.animal_shares WHERE animal_shares.id = p_share_id;
    RETURN v_share;
  END IF;

  UPDATE public.animal_shares
  SET statut = 'revoquee'
  WHERE animal_shares.id = p_share_id
  RETURNING * INTO v_share;

  RETURN v_share;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoquer_partage(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Refuser une invitation (invité)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refuser_invitation_partage(p_share_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.animal_shares;
  v_email TEXT;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  SELECT * INTO v_share
  FROM public.animal_shares
  WHERE animal_shares.id = p_share_id;

  IF v_share.id IS NULL OR v_share.statut != 'en_attente' THEN
    RAISE EXCEPTION 'Invitation invalide ou déjà traitée.';
  END IF;

  IF lower(v_share.email_invite) != lower(coalesce(v_email, '')) THEN
    RAISE EXCEPTION 'Cette invitation ne correspond pas à votre email.';
  END IF;

  DELETE FROM public.animal_shares WHERE animal_shares.id = p_share_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refuser_invitation_partage(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Liste des invitations - noms de colonnes sans ambiguïté PL/pgSQL
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.mes_invitations_partage();

CREATE OR REPLACE FUNCTION public.mes_invitations_partage()
RETURNS TABLE (
  share_id UUID,
  share_animal_id UUID,
  share_user_id UUID,
  share_email_invite TEXT,
  share_role public.partage_role,
  share_statut public.invitation_status,
  share_invite_par UUID,
  share_created_at TIMESTAMPTZ,
  share_accepte_le TIMESTAMPTZ,
  animal_nom TEXT,
  animal_espece TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.animal_id,
    s.user_id,
    s.email_invite,
    s.role,
    s.statut,
    s.invite_par,
    s.created_at,
    s.accepte_le,
    a.nom,
    a.espece
  FROM public.animal_shares s
  JOIN public.animaux a ON a.id = s.animal_id
  WHERE s.statut = 'en_attente'
    AND lower(s.email_invite) = lower(v_email)
  ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mes_invitations_partage() TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) Invitation - le compte destinataire DOIT exister + notification in-app
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inviter_partage_animal(
  p_animal_id UUID,
  p_email_invite TEXT,
  p_role public.partage_role DEFAULT 'read_only'
)
RETURNS public.animal_shares
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.animal_shares;
  v_email TEXT := lower(trim(p_email_invite));
  v_invitee_id UUID;
  v_animal_nom TEXT;
  v_caller_email TEXT;
BEGIN
  IF NOT public.can_write_animal(p_animal_id) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  IF v_email IS NULL OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email invalide.';
  END IF;

  SELECT u.email INTO v_caller_email FROM auth.users u WHERE u.id = auth.uid();
  IF lower(coalesce(v_caller_email, '')) = v_email THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
  END IF;

  -- Vérifier d'abord que le compte existe
  SELECT p.id INTO v_invitee_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_invitee_id IS NULL THEN
    RAISE EXCEPTION
      'Aucun compte Vet''OPoil trouvé pour %. La personne doit d''abord créer un compte avec cet email.',
      v_email;
  END IF;

  SELECT a.nom INTO v_animal_nom FROM public.animaux a WHERE a.id = p_animal_id;

  -- Éviter les doublons en attente
  IF EXISTS (
    SELECT 1
    FROM public.animal_shares s
    WHERE s.animal_id = p_animal_id
      AND lower(s.email_invite) = v_email
      AND s.statut = 'en_attente'
  ) THEN
    RAISE EXCEPTION 'Une invitation est déjà en attente pour %.', v_email;
  END IF;

  INSERT INTO public.animal_shares (animal_id, email_invite, role, invite_par, statut)
  VALUES (p_animal_id, v_email, p_role, auth.uid(), 'en_attente')
  RETURNING * INTO v_share;

  INSERT INTO public.notifications (user_id, type, titre, corps, donnees)
  VALUES (
    v_invitee_id,
    'partage',
    'Invitation de partage',
    format(
      'On vous invite à accéder au dossier de %s. Ouvrez Compte → Invitations pour accepter ou refuser.',
      coalesce(v_animal_nom, 'un animal')
    ),
    jsonb_build_object(
      'share_id', v_share.id,
      'animal_id', p_animal_id,
      'role', p_role::text
    )
  );

  RETURN v_share;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inviter_partage_animal(UUID, TEXT, public.partage_role) TO authenticated;
