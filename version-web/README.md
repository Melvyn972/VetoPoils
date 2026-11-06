# Vet'OPoil

Site du carnet de santé animal (Vite + React). Production : https://veto-poils.vercel.app

Le backend est Supabase (`lmdszelnnibexzvnaubp`, région eu-west-3) : Auth, Postgres et Storage. L’application Expo (`Version-Mobile`) utilise le même schéma. Stripe n’est pas dans le périmètre.

## Lancer en local

```bash
cd version-web
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur Vite |
| `npm run lint` | ESLint |
| `npm run build` | `tsc -b` + bundle production |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright (Chromium, Supabase réel) |

## Variables

Voir `.env.example`.

- `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` : projet `lmdszelnnibexzvnaubp`.
- `VITE_OCR_API_URL` / `VITE_OCR_API_KEY` : optionnels. Sans clé, l’analyse propose une catégorie à partir du nom de fichier. Le contrat est `POST { image_base64, mime_type, file_name }` avec `Authorization: Bearer` et `x-api-key`.
- `VITE_CLARITY_PROJECT_ID` : `z9d5jwu6j3` sur Vercel (production, preview, development). Le script n’est chargé qu’après consentement.

Les redirections d’e-mail utilisent l’origine du site : `/auth/callback` pour la confirmation, `/reinitialiser-mot-de-passe` pour la réinitialisation. Ces URL doivent être autorisées dans Supabase Auth pour `https://veto-poils.vercel.app/**` et les aperçus Vercel. Le lien doit être ouvert dans le même navigateur (PKCE).

Ne jamais committer de clé `service_role`.

## Parcours

- Public : `/` , `/inscription`, `/connexion`, `/acces`, `/consultation?token=`
- Propriétaire : `/espace` et fiches `/espace/animaux/:id`
- Vétérinaire : `/mes-patients`, `/animal/:id`, `/compte-veterinaire`

L’impression du dossier passe par une iframe masquée (pas de pop-up). Le partage se fait par invitation e-mail.

## Déploiement

`vercel.json` réécrit les routes vers `index.html`. Racine Vercel : `version-web`. Le service worker et le manifeste sont émis au build.
