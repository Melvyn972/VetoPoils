import { Link } from 'react-router-dom'

import { AuthFrame } from '../../components/layout/AuthFrame'

export function TermsPage() {
  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Conditions d’utilisation</h1>
      <div className="mt-4 space-y-3 font-body text-sm leading-relaxed text-muted">
        <p>
          Vet'OPoil est un carnet de santé animal. Les informations saisies ne remplacent pas un avis vétérinaire.
        </p>
        <p>
          Le propriétaire reste responsable des accès qu’il ouvre : invitations et codes temporaires de 4 heures.
        </p>
        <p>
          Un compte est personnel. Le mot de passe se réinitialise depuis le lien envoyé par e-mail, ouvert dans le
          même navigateur.
        </p>
      </div>
      <Link to="/inscription" className="mt-6 inline-block font-body text-sm font-semibold text-primary">
        Retour à l’inscription
      </Link>
    </AuthFrame>
  )
}

export function PrivacyPage() {
  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Confidentialité</h1>
      <div className="mt-4 space-y-3 font-body text-sm leading-relaxed text-muted">
        <p>
          Les dossiers, documents et journaux sont stockés sur Supabase, avec des règles d’accès par propriétaire,
          vétérinaire et personnes invitées.
        </p>
        <p>
          Vous pouvez exporter une copie de vos données et demander la suppression du compte depuis les paramètres.
        </p>
        <p>
          Microsoft Clarity n’est chargé qu’après un consentement explicite. Le refus est mémorisé sur cet appareil.
        </p>
      </div>
      <Link to="/" className="mt-6 inline-block font-body text-sm font-semibold text-primary">
        Retour à l’accueil
      </Link>
    </AuthFrame>
  )
}
