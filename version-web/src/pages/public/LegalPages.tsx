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
        <h2 className="pt-2 font-title text-lg font-semibold text-ink">Mesure d’audience et cookies</h2>
        <p>
          Aucun script de mesure n’est ajouté à la page tant que vous n’avez pas accepté. Le choix est mémorisé dans
          le navigateur de cet appareil. Vous pouvez l’accepter ou le retirer depuis les paramètres du compte.
        </p>
        <p>
          L’acceptation peut charger Microsoft Clarity et Google Tag Manager pour compter les pages vues et les
          interactions. Avant ce chargement, le mode de consentement Google refuse la mesure d’audience
          (analytics_storage), le stockage publicitaire (ad_storage), les données utilisateur publicitaires
          (ad_user_data) et la personnalisation publicitaire (ad_personalization). Accepter n’ouvre que la mesure
          d’audience. Ces signaux publicitaires restent refusés. Refuser n’injecte pas ces scripts.
        </p>
        <p>
          Après acceptation, ces services peuvent déposer des cookies ou identifiants équivalents liés à la mesure
          d’audience. Le site ne fixe pas ici leur durée de conservation : elle dépend de chaque outil.
        </p>
      </div>
      <Link to="/" className="mt-6 inline-block font-body text-sm font-semibold text-primary">
        Retour à l’accueil
      </Link>
    </AuthFrame>
  )
}
