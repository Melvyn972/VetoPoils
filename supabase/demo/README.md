# Démo publique — données fictives

Ces scripts servent uniquement au projet Supabase **isolé** de la démo publique. Ils ne sont pas des migrations et ne sont pas appliqués par le déploiement.

Ne pas les exécuter sur la production `lmdszelnnibexzvnaubp` (veto-poils). Ils refusent de démarrer sans un réglage explicite, et le seed s’arrête aussi si la base contient déjà d’autres comptes.

Aucun secret de production, aucune donnée réelle. Les adresses sont en `@example.com`. Le mot de passe du vétérinaire est un mot de passe de démo public : ne pas le réutiliser ailleurs.

Appliquer d’abord les fichiers de `supabase/migrations`, dans l’ordre. Le reset a besoin de l’extension `pg_cron` (activable sur le projet démo).

## Seed

Dans le SQL Editor du projet démo :

```sql
SET vetopoil.allow_demo_seed = 'on';
```

Puis exécuter `seed.sql`.

Comptes fictifs :

- Vétérinaire : `demo.veto@example.com` / `VetoDemo-2026`
- Propriétaire : `demo.proprio@example.com` (mot de passe non publié, sert seulement à rattacher les animaux)
- Codes d’accès : `VETDEM` (Milo), `CHATLU` (Luna)

Relancer le seed réinitialise le dossier clinique de ces deux animaux.

## Reset

```sql
SET vetopoil.allow_demo_reset = 'on';
```

Puis exécuter `reset.sql`. Cela crée `public.demo_reset()` et planifie `vetopoil-demo-reset` toutes les 30 minutes.

La fonction n’est pas appelable par `anon`, `authenticated` ni `service_role`. Elle ne fait rien si les deux comptes fictifs ne sont pas exactement ceux du seed. Elle ne supprime que :

- les documents des deux animaux fictifs
- les événements médicaux de démo ajoutés après le seed (saisie véto, jeton, autre vétérinaire)
- les rappels créés plus de 5 minutes après les rappels fictifs
- les notifications du propriétaire fictif, ou celles qui citent ces animaux
- puis elle réactive les codes `VETDEM` et `CHATLU`

Les autres comptes éventuellement créés sur la démo ne sont pas effacés.
