<p align="center">
  <img src="version-web/src/assets/logo-full.svg" alt="Vet'OPoil" width="430" height="225" />
</p>

<p align="center">
  Carnet de santé numérique de l’animal.<br />
  Le propriétaire garde l’historique. Le vétérinaire ouvre le dossier le temps de la consultation.
</p>

<p align="center">
  <a href="https://veto-poils.vercel.app">veto-poils.vercel.app</a>
</p>

## Le produit

Vet'OPoil relie le propriétaire et la clinique autour d’un seul dossier : identité de l’animal, événements médicaux, documents, rappels, budget et partage. Le propriétaire reste maître des données. Chaque ajout fait depuis un accès vétérinaire attend sa validation.

Le site public présente le concept. L’espace propriétaire et le portail clinique sont la même application, une PWA React servie par Vite. Elle s’utilise sur grand écran comme sur téléphone. Les données sont sur Supabase.

## Équipe PIE

| Personne | Rôle |
| --- | --- |
| Taylor et Mariama | Gestion de projet, RGPD |
| Melvyn | Full-stack |
| Lucas | Design |
| Fiona | Authentification, front |

Les pages `/cgu` et `/confidentialite` décrivent le cadre du service. Elles ne remplacent pas une relecture juridique : le traitement des données de santé animale et des comptes reste à valider avec Taylor et Mariama.

## Fonctions

- **Smart Scan.** Import d’une photo ou d’un PDF, proposition de catégorie, lecture optionnelle du document, création d’un événement ou d’une dépense.
- **Accès vétérinaire.** Code à 6 caractères et QR, valable 4 heures, à usage limité, révocable. Le dossier se referme ensuite.
- **Health Score.** Score de 0 à 100, enregistré sur l’animal et dans un historique.
- **Rappels.** Vaccin, antiparasitaire, rendez-vous, avec une préférence dans le compte.
- **Partage.** Invitation par e-mail en lecture seule ou en contribution (journal de pet-sitting).
- **Journal.** Repas, sorties, comportement, notes.
- **Budget.** Dépenses par catégorie, graphiques, export CSV.
- **PDF.** Dossier imprimable ou partageable.
- **Partenaires.** Suggestions selon l’espèce et la race, suivi des clics.
- **RGPD.** Export des données du compte et suppression du compte.
- **Portail vétérinaire.** Accès par code, patients déjà consultés, saisie d’un événement, compte clinique (nom, clinique, téléphone, numéro d’ordre).
- **PWA.** Manifeste, icônes et service worker émis au build du site.

Stripe, les abonnements et la téléconsultation ne font pas partie du produit.

## Architecture

```mermaid
flowchart LR
  web[PWA React et Vite]

  subgraph supabase [Supabase]
    auth[Auth]
    db[Postgres et RLS]
    storage[Storage]
    rpc[RPC]
  end

  web --> auth
  web --> db
  web --> storage
  web --> rpc
  web --> vercel[Vercel]
  web --> clarity[Clarity après consentement]
```

Le site est servi par Vercel. L’authentification, les données, les fichiers et les fonctions SQL sont sur Supabase, projet `lmdszelnnibexzvnaubp` (région `eu-west-3`). Il n’y a pas de backend Symfony.

## Dépôt

```text
.
├── version-web/             PWA : site, espace propriétaire, portail clinique
├── supabase/
│   ├── migrations/          schéma incrémental, dans l’ordre des horodatages
│   ├── bootstrap_all.sql    photographie historique du schéma
│   ├── seed.sql             données d’exemple
│   └── README.md
└── README.md
```

Les correctifs SQL historiques (`supabase/fix_*.sql`) sont repris dans `migrations/`. La source à appliquer est `supabase/migrations/`.

## Pile

Versions déclarées dans les `package.json`. Le caret ou le tilde est celui du fichier.

### Application — `version-web`

| Outil | Version déclarée |
| --- | --- |
| React | ^19.2.7 |
| React DOM | ^19.2.7 |
| React Router | ^7.18.1 |
| Vite | ^8.1.1 |
| @vitejs/plugin-react | ^6.0.3 |
| Tailwind CSS | ^4.3.2 |
| @tailwindcss/vite | ^4.3.2 |
| GSAP | ^3.15.1 |
| @gsap/react | ^2.1.2 |
| @supabase/supabase-js | ^2.110.0 |
| qrcode | ^1.5.4 |
| TypeScript | ~6.0.2 |
| ESLint | ^10.6.0 |
| typescript-eslint | ^8.62.0 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.3 |
| Vitest | ^3.2.4 |
| Playwright | ^1.65.0 |

### Backend et hébergement

| Brique | Rôle |
| --- | --- |
| Supabase Auth | Comptes propriétaire et vétérinaire, liens e-mail, PKCE |
| Postgres | Données du dossier, politiques RLS |
| Storage | Buckets privés `animal-photos` et `animal-documents` |
| Vercel | Build et hébergement de `version-web` |

## Bibliothèques

| Bibliothèque | Usage |
| --- | --- |
| React et React DOM | Interface |
| React Router | Routes |
| Vite | Dev, build et PWA |
| Tailwind CSS | Styles |
| GSAP et @gsap/react | Animations. Elles respectent `prefers-reduced-motion` |
| @supabase/supabase-js | Auth, requêtes, fichiers et RPC |
| qrcode | QR du code vétérinaire |
| Vitest | Tests unitaires |
| Playwright | Parcours navigateur du site |
| ESLint et TypeScript | Contrôle statique |

## Modèle de données

Tables principales :

| Table | Contenu |
| --- | --- |
| `profiles` | Compte propriétaire |
| `vet_profiles` | Compte clinique, téléphone, numéro d’ordre |
| `animaux` | Fiche, score, archivage (`deleted_at`) |
| `medical_events` | Consultation, vaccin, chirurgie, ordonnance, analyse. Statuts validé, en attente, refusé |
| `documents` | Fichier, catégorie, lien éventuel vers un événement |
| `vet_access_tokens` | Code à 6 caractères, expiration, révocation |
| `animal_shares` | Invitation, lecture seule ou contribution |
| `reminders` | Échéances |
| `daily_logs` | Journal |
| `expenses` | Dépenses |
| `health_score_history` | Historique du score |
| `notifications` | Messages in-app, dont une saisie vétérinaire à valider |
| `partners`, `partner_clicks` | Annuaire et clics |

RPC principales :

| Fonction | Rôle |
| --- | --- |
| `ensure_owner_profile`, `handle_new_user` | Création du profil à l’inscription |
| `creer_animal`, `modifier_animal`, `archiver_animal` | Cycle de vie de la fiche |
| `generer_vet_token`, `valider_vet_token`, `revoquer_vet_token` | Accès de 4 heures |
| `vet_get_dossier`, `vet_create_medical_event` | Lecture et saisie avec le code |
| `vet_create_animal_medical_event` | Saisie ultérieure sur un animal déjà consulté |
| `valider_medical_event`, `refuser_medical_event` | Décision du propriétaire |
| `enregistrer_health_score` | Persistance du score |
| `inviter_partage_animal`, `accepter_invitation_partage`, `refuser_invitation_partage`, `revoquer_partage` | Partage |
| `increment_ocr_usage` | Compteur Smart Scan |
| `exporter_mes_donnees`, `supprimer_mon_compte` | Export et suppression |

## Sécurité

Postgres applique le RLS sur les tables du dossier. Les politiques s’appuient sur le rôle de l’utilisateur connecté.

- **Propriétaire.** Lit et écrit ses animaux, documents, dépenses, rappels et partages.
- **Contributeur.** Tient le journal. Il ne gère pas le partage ni la fiche médicale complète.
- **Lecture seule.** Consulte le dossier partagé.
- **Vétérinaire.** Profil distinct (`vet_profiles`). Le code ouvre un dossier limité dans le temps. Une saisie faite avec ce code reste en attente de validation. Un animal déjà consulté peut être rouvert depuis le compte clinique.
- **Anonyme.** Peut présenter un code encore valable. Sans code, pas d’accès au dossier.

Les fonctions sensibles sont `SECURITY DEFINER` et vérifient `auth.uid()` ou le code. Les buckets sont privés : le chemin de fichier est préfixé par le propriétaire. Le site n’utilise que la clé publique. La clé `service_role` ne va ni dans le dépôt, ni dans une variable `VITE_`.

Les liens d’e-mail (`/auth/callback`, `/reinitialiser-mot-de-passe`) doivent être autorisés dans Auth pour `https://veto-poils.vercel.app/**` et les aperçus `https://*.vercel.app/**`. Le lien se termine dans le même navigateur (PKCE).

## Variables d’environnement

Noms seulement. Les exemples sont dans `version-web/.env.example`. Ne jamais committer de secret.

| Nom | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet |
| `VITE_SUPABASE_ANON_KEY` | Clé publique |
| `VITE_OCR_API_URL` | Point d’entrée Smart Scan, optionnel |
| `VITE_OCR_API_KEY` | Clé de cet appel, optionnelle |
| `VITE_CLARITY_PROJECT_ID` | Mesure d’audience, optionnelle |
| `VITE_GA_MEASUREMENT_ID` | Balise Google Analytics, optionnelle |

Le site accepte aussi les alias `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sans URL ni clé OCR, l’import reste possible et la catégorie est proposée à partir du nom de fichier. Le contrat d’appel est un `POST` JSON `{ image_base64, mime_type, file_name }`.

## Installation

Prérequis : Node.js, npm, et un projet Supabase dont les migrations ont été appliquées.

Site :

```bash
cd version-web
cp .env.example .env.local
npm install
npm run dev
```

Le site écoute sur `http://localhost:5173`.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Vite |
| `npm run lint` | ESLint |
| `npm run build` | `tsc -b` puis build de production |
| `npm run preview` | Sert le build |
| `npm test` | Vitest, une fois |
| `npm run test:watch` | Vitest en veille |
| `npm run test:e2e` | Playwright |
| `npm run seed` | Jeu de données d’exemple, hors des secrets du dépôt |

## Tests

- **Unitaires.** `version-web` : `npm test` (Vitest).
- **Parcours.** `version-web` : `npm run test:e2e`. Playwright ouvre Chromium sur `http://127.0.0.1:4173` (le script de config réutilise un serveur déjà lancé, sinon il démarre Vite). Le parcours couvre la page d’accueil, l’inscription, la connexion, une fiche et un code vétérinaire, contre le projet Supabase réel. Un second parcours vérifie que la balise Google Analytics n’est chargée qu’après acceptation des cookies.

## Déploiement

Le projet Vercel pointe sur le dossier `version-web`. `vercel.json` lance `npm run build`, publie `dist/` et renvoie les routes de l’application vers `index.html`. Un fichier statique qui porte une extension (`robots.txt`, `sitemap.xml`, le fichier de vérification Search Console, les assets) est servi tel quel. Le manifeste et le service worker sont produits au build.

Les migrations s’appliquent dans l’ordre des noms de fichiers de `supabase/migrations/`, via l’éditeur SQL du projet. Un fichier déjà passé est en général réentrant (`IF NOT EXISTS`, `CREATE OR REPLACE`). `ALTER TYPE ... ADD VALUE` reste seul dans sa migration : la valeur nouvelle ne s’utilise pas dans la même transaction.

## Mesure d’audience

Microsoft Clarity et Google Analytics ne sont chargés que si leur variable est définie **et** que la personne a accepté la mesure. Le refus n’injecte pas ces scripts. Avant tout chargement, le mode de consentement Google refuse `analytics_storage`, `ad_storage`, `ad_user_data` et `ad_personalization`. L’acceptation n’autorise que la mesure d’audience. Le choix est mémorisé dans le navigateur et peut être repris dans le compte. La page `/confidentialite` décrit ce fonctionnement ; le texte reste à valider avec Taylor et Mariama.

## Suite

Le paiement, Stripe et les quotas liés à un abonnement sont hors périmètre. Le contrôle de quota animal ne bloque plus la création de fiche.

## Licence et crédits

Aucun fichier `LICENSE` n’accompagne le dépôt : rien n’est placé sous une licence ouverte. Les dépendances restent sous la licence de leurs auteurs.

Marque et logo Vet'OPoil (chien et chat) : fichiers `version-web/src/assets/logo-full.svg` et `version-web/src/assets/logo-mark.svg`.

Projet mené par l’équipe PIE : Taylor, Mariama, Melvyn, Lucas et Fiona.
