# Vet'OPoil Mobile

Application propriétaire — Expo SDK 54 / Expo Router. Le portail vétérinaire est dans `version-web`.

## Périmètre

- Inscription / connexion / restauration de session (Supabase Auth + profil)
- Multi-animaux (création, édition, archivage — tokens véto révoqués)
- Timeline médicale (filtre, validation / refus des événements vétérinaires en attente)
- Documents + Smart Scan : photo/PDF, suggestion de catégorie, OCR optionnel, événement / dépense
- Budget vétérinaire (CRUD, graphiques, export CSV)
- Score santé 0–100 persisté (`animaux.score_sante` + historique)
- PDF du dossier (partage / e-mail mailto)
- Suggestions partenaires (espèce/race) + `partner_clicks`
- QR / code 6 caractères (4 h, compte à rebours, révocation, restauration du code actif)
- Rappels + préférence push locale
- Partage email lecture seule / contributeur + invitations accepter / refuser
- Journal quotidien pour le contributeur (pet-sitting)

Hors scope : paiements Stripe, téléconsultation vidéo, certificats APNs/FCM de production.

## Lancer le projet

```bash
cd Version-Mobile
cp .env.example .env
npm install
npm run typecheck
npm run start
```

Expo Go (iOS/Android) ou `npm run android` / `npm run ios`.

## Variables d’environnement

Voir `.env.example`.

| Variable | Rôle |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | URL projet |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable (jamais `service_role`) |
| `EXPO_PUBLIC_VET_WEB_URL` | Base URL encodée dans les QR (`https://veto-poils.vercel.app`) |
| `EXPO_PUBLIC_OCR_API_URL` / `EXPO_PUBLIC_OCR_API_KEY` | Optionnel. Absents = pas d’OCR, upload manuel OK |

Les valeurs publishable sont aussi en fallback dans `app.config.ts` pour un démarrage démo.

## Parcours de démo

1. Créer un compte propriétaire → dashboard.
2. Ajouter 1–2 animaux.
3. Générer un QR (onglet QR) → ouvrir le portail véto avec le code.
4. Valider ou refuser la consultation dans Historique.
5. Inviter un second compte (partage) ; le contributeur remplit le Journal quotidien.

## Vérification

```bash
npm run typecheck
```

Les notifications push distantes (token Expo) ne fonctionnent pas dans Expo Go ; les rappels locaux restent planifiés à 9 h le jour J si la préférence est activée.
