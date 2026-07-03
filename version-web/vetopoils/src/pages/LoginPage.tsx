import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/consultation'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type AuthView = 'login' | 'signup'

interface FormErrors {
  fullName?: string
  clinic?: string
  email?: string
  password?: string
  form?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isLoading, isConnected, isSupabaseReady, signIn, signUp } = useAuth()

  const [view, setView] = useState<AuthView>('login')
  const [fullName, setFullName] = useState('')
  const [clinic, setClinic] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="font-body text-sm text-fg-secondary">Chargement...</p>
        </div>
      </MobileShell>
    )
  }

  if (isConnected) {
    return <Navigate to="/consultation" replace />
  }

  function switchView(nextView: AuthView) {
    setView(nextView)
    setErrors({})
    setInfoMessage(null)
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {}

    if (view === 'signup' && !fullName.trim()) {
      nextErrors.fullName = 'Le nom complet est requis'
    }

    if (!email.trim()) {
      nextErrors.email = "L'email est requis"
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Email invalide'
    }

    if (!password) {
      nextErrors.password = 'Le mot de passe est requis'
    } else if (password.length < 6) {
      nextErrors.password = '6 caractères minimum'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInfoMessage(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!isSupabaseReady) {
      setErrors({ form: 'Supabase n’est pas configuré. Vérifiez le fichier .env.local' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    if (view === 'login') {
      const { error } = await signIn(email, password)

      if (error) {
        setErrors({ form: error })
        setIsSubmitting(false)
        return
      }

      navigate('/consultation')
      return
    }

    const { error, needsEmailConfirmation } = await signUp(fullName, email, password, clinic)

    if (error) {
      setErrors({ form: error })
      setIsSubmitting(false)
      return
    }

    if (needsEmailConfirmation) {
      setInfoMessage('Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.')
      setIsSubmitting(false)
      switchView('login')
      return
    }

    navigate('/consultation')
  }

  return (
    <MobileShell>
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-title text-2xl font-bold text-fg-primary">
            {view === 'login' ? 'Connexion vétérinaire' : 'Créer un compte vétérinaire'}
          </h1>
          <p className="font-body text-sm text-fg-secondary">
            {view === 'login'
              ? 'Connectez-vous pour préremplir vos consultations.'
              : 'Compte réservé aux vétérinaires — distinct des comptes propriétaires.'}
          </p>
        </div>

        <div className="flex rounded-12 bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => switchView('login')}
            className={[
              'flex-1 rounded-12 py-2 font-body text-sm font-semibold transition-colors',
              view === 'login'
                ? 'bg-surface text-fg-primary shadow-sm'
                : 'text-fg-secondary',
            ].join(' ')}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchView('signup')}
            className={[
              'flex-1 rounded-12 py-2 font-body text-sm font-semibold transition-colors',
              view === 'signup'
                ? 'bg-surface text-fg-primary shadow-sm'
                : 'text-fg-secondary',
            ].join(' ')}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {view === 'signup' && (
            <>
              <Input
                label="Nom complet"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Dr. Martin"
                error={errors.fullName}
              />
              <Input
                label="Clinique"
                value={clinic}
                onChange={(event) => setClinic(event.target.value)}
                placeholder="Clinique du Parc"
                error={errors.clinic}
              />
            </>
          )}

          <Input
            label="Email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@clinique.fr"
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            error={errors.password}
          />

          {errors.form && <p className="font-body text-sm text-error">{errors.form}</p>}
          {infoMessage && <p className="font-body text-sm text-success">{infoMessage}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {view === 'login' ? 'Se connecter' : 'Créer mon compte vétérinaire'}
          </Button>
        </form>

        <Link to="/" className="text-center font-body text-sm text-fg-secondary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </MobileShell>
  )
}
