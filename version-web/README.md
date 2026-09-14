# Vet'OPoil - Portail vétérinaire

Application Vite + React (espace praticien). Production : https://veto-poils.vercel.app

Le backend est **Supabase** (`lmdszelnnibexzvnaubp`), pas Symfony. Stripe n’est pas dans le périmètre.

## Lancer en local

```bash
cd version-web
cp .env.example .env.local   # déjà renseigné avec l’URL et la clé publishable
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
| `npm run test` | Vitest (helpers codes / dates / erreurs RPC) |

## Variables d’environnement

Voir `.env.example`. Vite lit `VITE_*` ; les alias `NEXT_PUBLIC_*` sont aussi acceptés (Vercel).

Ne jamais committer de `service_role` ni de mot de passe.

OCR : aucune clé n’est requise pour le portail. L’upload PDF/image passe par Storage `animal-documents` ; une catégorie est suggérée d’après le nom de fichier. Le dossier s’imprime / s’enregistre en PDF depuis la consultation.

## Parcours de démo

1. **Accès QR / code** : sur l’app propriétaire, générer un code 6 caractères → ouvrir `/consultation?token=XXXXXX` ou saisir le code sur `/acces`.
2. **Consultation anonyme** : remplir le formulaire (date de visite, diagnostic, document optionnel) → événement `pending` + notification propriétaire.
3. **Compte vétérinaire** : `/login` (inscription `account_type=veterinarian`) → `/mes-patients` puis dossier `/animal/:id`.
4. Codes expirés, révoqués ou déjà utilisés : messages d’erreur en français, retour `/acces`.

## Déploiement

`vercel.json` réécrit toutes les routes vers `index.html` (SPA). Le dossier de build est `dist`. Sur Vercel, la racine du projet doit rester `version-web`.

## Données de démo

```bash
# Clé service_role UNIQUEMENT en local, jamais commitée
SUPABASE_URL=https://lmdszelnnibexzvnaubp.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
DEMO_OWNER_EMAIL=demo.proprio@example.com \
DEMO_OWNER_PASSWORD='MotDePasseLocal!' \
npm run seed
```

Le script est branché via `npm run seed`. Alternative SQL commentée : `../supabase/seed.sql`.
