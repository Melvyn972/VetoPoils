import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthFrame } from '../../components/layout/AuthFrame'
import { Button } from '../../components/ui/Button'
import { FormAlert } from '../../components/ui/FormAlert'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail } from '../../lib/consultation'
import { homePath } from '../../lib/routes'

function LoadingNote() {
  return <p className="font-body text-sm text-muted">Chargement…</p>
}

export function RoleChoicePage() {
  const { isLoading, role } = useAuth()
  if (isLoading) return <AuthFrame><LoadingNote /></AuthFrame>
  if (role) return <Navigate to={homePath(role)} replace />

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-2 font-body text-sm text-muted">Choisissez votre porte d’entrée. Le rôle ne se mélange pas ensuite.</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link to="/inscription/proprietaire" className="rounded-2xl bg-primary px-4 py-4 font-body text-sm font-semibold text-white">
          Je suis propriétaire
          <span className="mt-1 block font-normal text-white/80">Carnet, animaux, partages et rappels.</span>
        </Link>
        <Link to="/inscription/veterinaire" className="rounded-2xl border border-line px-4 py-4 font-body text-sm font-semibold text-ink">
          Je suis vétérinaire
          <span className="mt-1 block font-normal text-muted">Clinique, patients et accès par code.</span>
        </Link>
      </div>
      <p className="mt-6 font-body text-sm text-muted">
        Déjà un compte ? <Link to="/connexion" className="font-semibold text-primary">Se connecter</Link>
      </p>
    </AuthFrame>
  )
}

export function OwnerSignupPage() {
  const navigate = useNavigate()
  const { isLoading, role, signUpOwner } = useAuth()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) return <AuthFrame><LoadingNote /></AuthFrame>
  if (role) return <Navigate to={homePath(role)} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!prenom.trim() || !nom.trim()) return setError('Le prénom et le nom sont requis.')
    if (!isValidEmail(email)) return setError('Adresse e-mail invalide.')
    if (password.length < 6) return setError('6 caractères minimum.')
    if (!accepted) return setError('Cochez les conditions pour continuer.')
    setIsSubmitting(true)
    setError(null)
    const result = await signUpOwner({ prenom, nom, email, password })
    setIsSubmitting(false)
    if (result.error) return setError(result.error)
    if (result.needsEmailConfirmation) setPendingEmail(email.trim())
    else navigate('/espace', { replace: true })
  }

  if (pendingEmail) return <EmailPendingPage email={pendingEmail} />

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Compte propriétaire</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Prénom" value={prenom} onChange={(event) => setPrenom(event.target.value)} required />
        <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
        <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label className="flex items-start gap-2 font-body text-sm text-muted">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
          <span>
            J’accepte les <Link to="/cgu" className="text-primary">conditions</Link> et la{' '}
            <Link to="/confidentialite" className="text-primary">politique de confidentialité</Link>.
          </span>
        </label>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Création…' : 'Créer mon compte'}</Button>
      </form>
    </AuthFrame>
  )
}

export function VetSignupPage() {
  const navigate = useNavigate()
  const { isLoading, role, signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [clinic, setClinic] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) return <AuthFrame><LoadingNote /></AuthFrame>
  if (role) return <Navigate to={homePath(role)} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!fullName.trim()) return setError('Le nom complet est requis.')
    if (!clinic.trim()) return setError('Le nom de la clinique est requis.')
    if (!isValidEmail(email)) return setError('Adresse e-mail invalide.')
    if (password.length < 6) return setError('6 caractères minimum.')
    if (!accepted) return setError('Cochez les conditions pour continuer.')
    setIsSubmitting(true)
    setError(null)
    const result = await signUp(fullName, email, password, clinic, {
      telephone: phone,
      numeroOrdre: orderNumber,
    })
    setIsSubmitting(false)
    if (result.error) return setError(result.error)
    if (result.needsEmailConfirmation) setPendingEmail(email.trim())
    else navigate('/mes-patients', { replace: true })
  }

  if (pendingEmail) return <EmailPendingPage email={pendingEmail} />

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Compte vétérinaire</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Nom complet" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Clinique" value={clinic} onChange={(event) => setClinic(event.target.value)} required />
        <Input label="Numéro d’ordre" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
        <Input label="Téléphone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Input label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label className="flex items-start gap-2 font-body text-sm text-muted">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
          <span>
            J’accepte les <Link to="/cgu" className="text-primary">conditions</Link>.
          </span>
        </label>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Création…' : 'Créer le compte clinique'}</Button>
      </form>
    </AuthFrame>
  )
}

export function EmailPendingPage({ email }: { email: string }) {
  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Vérifiez votre e-mail</h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-muted">
        Un lien de confirmation a été envoyé à {email}. Ouvrez-le dans ce même navigateur : la session est liée à
        cet appareil. S’il n’arrive pas, vérifiez les courriers indésirables ou recommencez l’inscription.
      </p>
      <Link to="/connexion" className="mt-6 inline-block font-body text-sm font-semibold text-primary">
        Aller à la connexion
      </Link>
    </AuthFrame>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isLoading, role, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) return <AuthFrame><LoadingNote /></AuthFrame>
  if (role) return <Navigate to={homePath(role)} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEmail(email)) return setError('Adresse e-mail invalide.')
    if (!password) return setError('Le mot de passe est requis.')
    setIsSubmitting(true)
    const result = await signIn(email, password)
    setIsSubmitting(false)
    if (result.error || !result.role) return setError(result.error ?? 'Connexion impossible.')
    navigate(homePath(result.role), { replace: true })
  }

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Connexion</h1>
      <p className="mt-2 font-body text-sm text-muted">Une seule porte. Vous arrivez dans l’espace qui correspond à votre compte.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Connexion…' : 'Se connecter'}</Button>
      </form>
      <div className="mt-4 flex flex-col gap-2 font-body text-sm">
        <Link to="/mot-de-passe-oublie" className="text-primary">Mot de passe oublié</Link>
        <Link to="/inscription" className="text-muted">Créer un compte</Link>
      </div>
    </AuthFrame>
  )
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEmail(email)) return setError('Adresse e-mail invalide.')
    setIsSubmitting(true)
    const result = await requestPasswordReset(email)
    setIsSubmitting(false)
    if (result.error) return setError(result.error)
    setSent(true)
  }

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Mot de passe oublié</h1>
      {sent ? (
        <p className="mt-3 font-body text-sm text-muted">
          Si un compte existe pour {email}, un lien a été envoyé. Ouvrez-le dans ce même navigateur.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Envoi…' : 'Envoyer le lien'}</Button>
        </form>
      )}
    </AuthFrame>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, role } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 6) return setError('6 caractères minimum.')
    setIsSubmitting(true)
    const result = await updatePassword(password)
    setIsSubmitting(false)
    if (result.error) return setError(result.error)
    navigate(homePath(role), { replace: true })
  }

  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Nouveau mot de passe</h1>
      <p className="mt-2 font-body text-sm text-muted">
        Le lien doit être ouvert dans le navigateur qui a demandé la réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Nouveau mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </form>
    </AuthFrame>
  )
}

export function AuthCallbackPage() {
  const { isLoading, role } = useAuth()
  if (isLoading) {
    return (
      <AuthFrame>
        <h1 className="font-title text-2xl font-semibold">Confirmation</h1>
        <p className="mt-3 font-body text-sm text-muted">Vérification du lien…</p>
      </AuthFrame>
    )
  }
  if (role) return <Navigate to={homePath(role)} replace />
  return (
    <AuthFrame>
      <h1 className="font-title text-2xl font-semibold">Vérifiez votre e-mail</h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-muted">
        Si le lien ne vous connecte pas, ouvrez-le dans le même navigateur que celui utilisé pour l’inscription.
        Ensuite, connectez-vous.
      </p>
      <Link to="/connexion" className="mt-6 inline-block font-body text-sm font-semibold text-primary">
        Se connecter
      </Link>
    </AuthFrame>
  )
}
