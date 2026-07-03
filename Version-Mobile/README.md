# Vet'OPoil Mobile

Application mobile React Native avec Expo SDK 54, centrée sur l'espace utilisateur propriétaire.

## Périmètre

- Inclus : inscription/connexion, dashboard, multi-animaux, fiche animal, timeline médicale, documents, Smart Scan préparé, QR/code unique, rappels, partage et synchronisation des événements en attente.
- Exclu : espace vétérinaire, écran public `/vet/:token`, formulaire de consultation vétérinaire et toute fonctionnalité destinée aux praticiens.

## Supabase

Le projet utilise :

```env
NEXT_PUBLIC_SUPABASE_URL=https://lmdszelnnibexzvnaubp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wxfo-oDHdAFee8uSYP9Uxg_g41pInti
```

Ces valeurs sont aussi présentes en fallback dans `app.config.ts`.

## Lancer le projet

```bash
cd Version-Mobile
npm install
npm run start
```

Puis ouvrir avec Expo Go sur iOS/Android ou lancer :

```bash
npm run android
npm run ios
```

## Vérification

```bash
npm run typecheck
```

## Structure

- `app/` : routes Expo Router.
- `src/components/` : composants UI et métier réutilisables.
- `src/features/` : services Supabase par domaine.
- `src/lib/` : client Supabase, env, realtime, storage paths.
- `src/theme/` : tokens visuels inspirés des maquettes `exemple`.
- `src/types/` : types Supabase nécessaires au mobile.
