# Vet'OPoil

Carnet de santé animal — monorepo.

| Dossier | Rôle |
| --- | --- |
| `Version-Mobile/` | App propriétaire Expo (iOS/Android) |
| `version-web/` | Portail vétérinaire Vite, déployé sur [veto-poils.vercel.app](https://veto-poils.vercel.app) |
| `supabase/` | Migrations SQL incrémentales + consignes de seed |

Backend : projet Supabase `lmdszelnnibexzvnaubp`. Pas de Symfony. Stripe Checkout hors périmètre.

## Démarrage rapide

```bash
# Portail véto
cd version-web && npm install && npm run dev

# App propriétaire (autre terminal)
cd Version-Mobile && npm install && npm run start
```

Détails, variables d’environnement et parcours de démo : README de chaque application.
