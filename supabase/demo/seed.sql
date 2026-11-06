-- Données FICTIVES pour le projet de démo isolé uniquement.
-- Ne pas exécuter sur la production (lmdszelnnibexzvnaubp / veto-poils).
-- Voir README.md : il faut d'abord SET vetopoil.allow_demo_seed = 'on'.
--
-- Compte véto public de démo : demo.veto@example.com / VetoDemo-2026
-- Ce mot de passe ne protège que des animaux fictifs. Ne pas le réutiliser.

DO $demo_seed_guard$
BEGIN
  IF current_setting('vetopoil.allow_demo_seed', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION
      'Seed démo refusé. Sur le projet isolé seulement : SET vetopoil.allow_demo_seed = ''on'';';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email NOT IN ('demo.proprio@example.com', 'demo.veto@example.com')
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE email <> 'demo.proprio@example.com'
  ) OR EXISTS (
    SELECT 1
    FROM public.vet_profiles
    WHERE email <> 'demo.veto@example.com'
  ) THEN
    RAISE EXCEPTION 'Seed démo refusé : cette base contient d''autres comptes.';
  END IF;
END
$demo_seed_guard$;

DO $demo_seed_users$
DECLARE
  v_owner uuid := 'd0000000-0000-4000-8000-000000000001';
  v_vet uuid := 'd0000000-0000-4000-8000-000000000002';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      v_owner,
      'authenticated',
      'authenticated',
      'demo.proprio@example.com',
      extensions.crypt('<random-not-stored>', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"account_type":"owner","nom":"Martin","prenom":"Camille"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_vet,
      'authenticated',
      'authenticated',
      'demo.veto@example.com',
      extensions.crypt('VetoDemo-2026', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"account_type":"veterinarian","full_name":"Dr Alex Demo","clinique":"Clinique Vétérinaire Démo"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    users.id,
    users.id::text,
    jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  FROM (
    VALUES
      (v_owner, 'demo.proprio@example.com'),
      (v_vet, 'demo.veto@example.com')
  ) AS users(id, email)
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = users.id
      AND i.provider = 'email'
  );
END
$demo_seed_users$;

INSERT INTO public.profiles (id, nom, prenom, email)
VALUES (
  'd0000000-0000-4000-8000-000000000001',
  'Martin',
  'Camille',
  'demo.proprio@example.com'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vet_profiles (id, nom_complet, email, clinique)
VALUES (
  'd0000000-0000-4000-8000-000000000002',
  'Dr Alex Demo',
  'demo.veto@example.com',
  'Clinique Vétérinaire Démo'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.animaux (
  id,
  proprietaire_id,
  nom,
  espece,
  race,
  date_naissance,
  sexe,
  couleur,
  puce,
  score_sante
)
VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'Milo',
    'Chien',
    'Labrador',
    '2021-04-12',
    'male',
    'Sable',
    '250269800000001',
    86
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000001',
    'Luna',
    'Chat',
    'Européen',
    '2022-09-03',
    'femelle',
    'Gris',
    '250269800000002',
    92
  )
ON CONFLICT (id) DO UPDATE
SET
  proprietaire_id = EXCLUDED.proprietaire_id,
  nom = EXCLUDED.nom,
  espece = EXCLUDED.espece,
  race = EXCLUDED.race,
  date_naissance = EXCLUDED.date_naissance,
  sexe = EXCLUDED.sexe,
  couleur = EXCLUDED.couleur,
  puce = EXCLUDED.puce,
  score_sante = EXCLUDED.score_sante,
  deleted_at = NULL;

DELETE FROM public.documents
WHERE animal_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM public.medical_events
WHERE animal_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM public.reminders
WHERE animal_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM public.vet_access_tokens
WHERE animal_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
)
OR token IN ('VETDEM', 'CHATLU');

INSERT INTO public.medical_events (
  id,
  animal_id,
  type,
  titre,
  diagnostic,
  traitement,
  poids_kg,
  status,
  date_event,
  vet_profile_id
)
VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'vaccination',
    'Vaccin annuel',
    'CHPPi + rage',
    'Rappel dans 12 mois',
    31.2,
    'validated',
    now() - interval '40 days',
    'd0000000-0000-4000-8000-000000000002'
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'consultation',
    'Boiterie légère patte avant',
    'Entorse bénigne',
    'Repos 7 jours, anti-inflammatoire',
    31.0,
    'validated',
    now() - interval '120 days',
    'd0000000-0000-4000-8000-000000000002'
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'analyse',
    'Bilan sanguin',
    'Valeurs dans les normes',
    NULL,
    30.8,
    'validated',
    now() - interval '200 days',
    NULL
  ),
  (
    'e0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000002',
    'vaccination',
    'Primo-vaccination typhus/coryza',
    'RAS',
    'Rappel annuel',
    4.1,
    'validated',
    now() - interval '90 days',
    NULL
  ),
  (
    'e0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000002',
    'chirurgie',
    'Stérilisation',
    'Intervention sans complication',
    'Collerette 10 jours',
    3.9,
    'validated',
    now() - interval '300 days',
    NULL
  );

INSERT INTO public.reminders (id, animal_id, type, titre, notes, date_echeance, statut, canal)
VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'antiparasitaire',
    'Pipette antiparasitaire',
    'À poser le soir',
    current_date + 7,
    'actif',
    'both'
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'vaccination',
    'Rappel vaccin chat',
    NULL,
    current_date + 30,
    'actif',
    'both'
  );

INSERT INTO public.vet_access_tokens (id, animal_id, token, expire_le, cree_par)
VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'VETDEM',
    '2099-12-31',
    'd0000000-0000-4000-8000-000000000001'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'CHATLU',
    '2099-12-31',
    'd0000000-0000-4000-8000-000000000001'
  );
